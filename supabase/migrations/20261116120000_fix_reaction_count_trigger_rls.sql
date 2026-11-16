-- Fixes post and comment reaction counts never incrementing for a reaction on someone else's content.
-- Origin: 2026-11-16, founder report ("mandali reacts, never seen by other viewer"). Root cause: sync_post_upvote_count()
-- and sync_comment_upvote_count() are SECURITY INVOKER (the default), so their internal
-- `UPDATE posts/post_comments SET upvotes = ...` runs under RLS as the REACTING user, not a privileged role. The only
-- UPDATE policy on posts and post_comments is "author can update own row" (auth.uid() = author_id). Reacting to your
-- own content satisfies that predicate and the count updates; reacting to anyone else's content -- the overwhelmingly
-- common case -- silently matches zero rows (RLS filters it, no error) and the count never moves. The post_upvotes/
-- comment_upvotes row itself is written correctly (its own INSERT policy is user-scoped, not author-scoped), and its
-- SELECT policy is open, so the reaction is real and readable -- it is only the aggregate count column, which Native
-- gates its detailed reaction fetch on (postsWithUpvotes = posts.filter(p => p.upvotes > 0) in app/(tabs)/mandali.tsx),
-- that stays wrong. A viewer live in the app at the moment of the reaction sees a transient client-side bump via the
-- realtime handler; reloading the feed re-reads posts.upvotes from the database and the reaction disappears again.
-- Reproduced live on 2026-11-10 against a post created that day (2 reactions from 2 different non-author accounts,
-- posts.upvotes stayed 0); confirmed again on 2026-11-16 before writing this migration: 7 drifted posts, 1 drifted
-- comment, all with reactions_from_non_authors > 0.
--
-- ROC pre-flight (AGENTS.md section 4):
--  1. Function overload trap (PGRST203): neither function's name, argument list or return type changes. ALTER FUNCTION
--     ... SECURITY DEFINER changes only the function's privilege context, not its signature -- no overload is created,
--     so no DROP FUNCTION is needed.
--  2. Caller contract: both functions are trigger-attached only (AFTER INSERT/DELETE on post_upvotes/comment_upvotes);
--     no client, route or RPC calls them directly. Native's read path (lib/mandali.ts, lib/mandaliReactions.ts) reads
--     posts.upvotes and post_upvotes/comment_upvotes directly under RLS, unaffected by this change -- it will simply
--     start seeing correct counts.
--  3. User data and opt-out safety: the backfill below is a targeted UPDATE scoped by a correlated-subquery equality
--     check (p.upvotes != actual reaction count), touching only the rows already proven drifted, not a blanket
--     WHERE-false-or-null rewrite. It recomputes a reaction counter, not a consent or preference column.
--  4. Locks: posts has 47 rows, post_comments has 3 -- both tiny. ALTER FUNCTION is a catalog-only metadata change (no
--     table lock). The backfill UPDATE touches at most a handful of known-drifted rows. lock_timeout 5s fails fast.
--  5. Rollback: supabase/rollbacks/20261116120000_fix_reaction_count_trigger_rls_rollback.sql reverts both functions to
--     SECURITY INVOKER. It does NOT revert the backfilled counts -- rewinding a now-correct count back to its earlier
--     wrong value would only reintroduce the symptom this migration fixes, and the correct value is independently
--     recomputable (count(*) of the reaction table) at any time, so there is nothing to preserve by reverting it.

begin;
set local lock_timeout = '5s';

alter function public.sync_post_upvote_count() security definer;
alter function public.sync_comment_upvote_count() security definer;

update public.posts p
set upvotes = (select count(*) from public.post_upvotes pu where pu.post_id = p.id)
where p.upvotes != (select count(*) from public.post_upvotes pu where pu.post_id = p.id);

update public.post_comments c
set upvotes = (select count(*) from public.comment_upvotes cu where cu.comment_id = c.id)
where c.upvotes != (select count(*) from public.comment_upvotes cu where cu.comment_id = c.id);

do $verify$
begin
  assert (select prosecdef from pg_proc where proname = 'sync_post_upvote_count') = true,
    'sync_post_upvote_count must be SECURITY DEFINER';
  assert (select prosecdef from pg_proc where proname = 'sync_comment_upvote_count') = true,
    'sync_comment_upvote_count must be SECURITY DEFINER';
  assert not exists (
    select 1 from public.posts p
    where p.upvotes != (select count(*) from public.post_upvotes pu where pu.post_id = p.id)
  ), 'every post.upvotes must equal its actual reaction count after backfill';
  assert not exists (
    select 1 from public.post_comments c
    where c.upvotes != (select count(*) from public.comment_upvotes cu where cu.comment_id = c.id)
  ), 'every post_comments.upvotes must equal its actual reaction count after backfill';
end
$verify$;

commit;
