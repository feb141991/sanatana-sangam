-- Closes three findings from the Supabase security advisor (anon / signed-in users can run SECURITY DEFINER
-- functions that no client needs). Checked against production on 2026-10-16:
--
--   * get_challenge_leaderboard(uuid, text) returns the top ten participants' name, username, avatar and score.
--     Its only caller is the signed-in API route /api/challenge/current (it answers 401 without a user), so
--     "anyone with the public key can list who is on the leaderboard" was never intended. PUBLIC and anon lose
--     EXECUTE; signed-in users and the service role keep it.
--   * kul_member_limit(uuid) returns a constant (6). Only join_kul calls it, and join_kul is itself SECURITY
--     DEFINER, so it runs with its owner's rights and does not need the caller to hold EXECUTE. No client,
--     policy or trigger calls it directly. PUBLIC, anon and authenticated lose EXECUTE.
--   * handle_post_upvote_activity() is a trigger function that no trigger uses any more. A trigger function is
--     never checked against the firing user's EXECUTE right, so nothing depends on the grants. PUBLIC, anon and
--     authenticated lose EXECUTE.
--
-- The service role and the owner keep EXECUTE on all three. Reversal: supabase/rollbacks/
-- 20261016090000_revoke_anonymous_execute_on_internal_functions_rollback.sql.
--
-- Not changed here, on purpose: the other advisor entries for signed-in users are real RPCs the apps call
-- (create_kul, join_kul, complete_japa_session, record_native_product_analytics, ...); each checks auth.uid()
-- inside. Changing the default for future functions is a separate decision.

begin;

revoke execute on function public.get_challenge_leaderboard(uuid, text) from public, anon;
grant execute on function public.get_challenge_leaderboard(uuid, text) to authenticated, service_role;

revoke execute on function public.kul_member_limit(uuid) from public, anon, authenticated;
grant execute on function public.kul_member_limit(uuid) to service_role;

revoke execute on function public.handle_post_upvote_activity() from public, anon, authenticated;
grant execute on function public.handle_post_upvote_activity() to service_role;

commit;
