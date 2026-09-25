-- Adds the missing RLS UPDATE policy on post_upvotes.
--
-- Found while investigating why other users can't see post reaction
-- breakdowns (a separate, unrelated feature gap): post_upvotes has INSERT,
-- SELECT and DELETE policies but no UPDATE policy, while the sibling table
-- comment_upvotes has all four (see comment_upvotes_update, migration
-- 20260828120000_mandali_comment_edit_delete_and_reactions.sql). Both
-- tables have PRIMARY KEY (post_id/comment_id, user_id), and both are
-- written the same way by Native: lib/mandali.ts's setPostReaction()/
-- setCommentReaction() both call .upsert(..., { onConflict: '...,user_id' })
-- so a user switching their reaction (not adding a first one) hits the
-- UPDATE branch of the upsert. Postgres RLS requires an applicable UPDATE
-- policy for that branch to succeed -- with none present, switching an
-- existing post reaction has been failing RLS (silently caught by
-- setPostReaction's `if (error) throw error` and surfaced through the
-- existing reaction outbox's `failed`/retry UI, not a hard crash, but the
-- switch itself never lands). Confirmed via pg_policies: post_upvotes has
-- no UPDATE-command policy; comment_upvotes does.
--
-- Fix: add the identical policy shape comment_upvotes already uses.
--
-- Rollback guidance: dropping this policy returns to the current (broken)
-- state -- reaction switches on posts would again fail RLS. No data is
-- affected either way; this is a permission-only change.
--
-- Privilege review: narrower than a blanket policy -- USING and WITH CHECK
-- both require user_id = auth.uid(), identical to the existing INSERT/
-- DELETE policies on this same table. No new access is granted beyond
-- "a user may update their own reaction row," which INSERT+DELETE already
-- implied was intended.

begin;

create policy "post_upvotes_update"
  on public.post_upvotes
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

commit;
