-- Who upvoted and who RSVP'd is readable by signed-in users only. NOT applied to any database by this commit.
-- Origin: the 2026-11-12 privacy audit. post_upvotes, comment_upvotes and event_rsvps had SELECT policies `USING (true)` for every role, so the
-- app's public key could list which account upvoted which post or RSVP'd to which event, with no sign-in (7 post upvotes and 1 comment upvote were
-- readable on 2026-11-12). Founder decision the same day: a signed-out person may READ posts (they get them from /api/mandali/public-feed, which
-- shows counts, never who), and anything they would DO needs an account. Posts and comments keep their public SELECT; only these identities close.
--
-- ROC pre-flight (AGENTS.md section 4):
--  1. Function overload trap (PGRST203): no function is created, replaced or dropped.
--  2. Caller contract: the Native app reads these tables as a signed-in user (lib/mandali.ts, lib/mandaliReactions.ts, app/(tabs)/mandali.tsx) and
--     the server routes use the service role, so neither is affected. A signed-out caller now gets zero rows (not an error). The retired web
--     client reads them as a signed-in user too. Realtime on these tables is subscribed only after sign-in.
--  3. User data and opt-out safety: no data changes; policies only.
--  4. Locks: DROP/CREATE POLICY take a brief lock on three small tables; lock_timeout 5s fails fast.
--  5. Rollback: supabase/rollbacks/20261112160000_mandali_vote_identities_signed_in_only_rollback.sql restores the three public SELECT policies.

begin;
set local lock_timeout = '5s';

drop policy if exists post_upvotes_select on public.post_upvotes;
create policy post_upvotes_select on public.post_upvotes for select to authenticated using (true);

drop policy if exists comment_upvotes_select on public.comment_upvotes;
create policy comment_upvotes_select on public.comment_upvotes for select to authenticated using (true);

drop policy if exists event_rsvps_select on public.event_rsvps;
create policy event_rsvps_select on public.event_rsvps for select to authenticated using (true);

do $verify$
begin
  assert not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename in ('post_upvotes', 'comment_upvotes', 'event_rsvps') and cmd = 'SELECT'
      and (roles::text like '%anon%' or roles::text = '{public}')
  ), 'no public SELECT policy remains on the identity tables';
  assert (select count(*) from pg_policies where schemaname = 'public' and tablename in ('post_upvotes', 'comment_upvotes', 'event_rsvps') and cmd = 'SELECT' and roles::text = '{authenticated}') = 3, 'three signed-in SELECT policies';
end
$verify$;

commit;
