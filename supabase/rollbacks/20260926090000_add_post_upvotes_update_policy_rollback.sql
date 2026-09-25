-- Rollback for 20260926090000_add_post_upvotes_update_policy.sql
-- Drops the policy, returning to the prior (broken) state where a post
-- reaction switch fails RLS. No data affected.

begin;

drop policy if exists "post_upvotes_update" on public.post_upvotes;

commit;
