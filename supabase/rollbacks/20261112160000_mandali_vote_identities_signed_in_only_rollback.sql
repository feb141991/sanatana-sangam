-- Rollback for 20261112160000_mandali_vote_identities_signed_in_only.sql: restores the public SELECT policies (USING true, role public).
begin;
set local lock_timeout = '5s';
drop policy if exists post_upvotes_select on public.post_upvotes;
create policy post_upvotes_select on public.post_upvotes for select to public using (true);
drop policy if exists comment_upvotes_select on public.comment_upvotes;
create policy comment_upvotes_select on public.comment_upvotes for select to public using (true);
drop policy if exists event_rsvps_select on public.event_rsvps;
create policy event_rsvps_select on public.event_rsvps for select to public using (true);
commit;
