-- Rollback for 20261016090000_revoke_anonymous_execute_on_internal_functions.sql.
-- Restores the grants production had on 2026-10-16: PUBLIC (which includes anon) on all three, and explicit
-- grants to anon and authenticated on handle_post_upvote_activity. Re-opening these is not recommended.

begin;

grant execute on function public.get_challenge_leaderboard(uuid, text) to public, authenticated, service_role;
grant execute on function public.kul_member_limit(uuid) to public, authenticated, service_role;
grant execute on function public.handle_post_upvote_activity() to public, anon, authenticated, service_role;

commit;
