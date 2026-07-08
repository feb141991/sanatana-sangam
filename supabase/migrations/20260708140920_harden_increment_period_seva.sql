-- Harden public.increment_period_seva(uuid, integer)
--
-- Flagged in external review while extending native to call this RPC for
-- the new Shloka streak feature (app/shloka.tsx). Reading the function as
-- it stood (supabase/public_schema.sql:473, originally introduced by
-- supabase/migrations/20260525160000_leaderboard_periods.sql):
--
--   CREATE FUNCTION public.increment_period_seva(p_user_id uuid, p_points integer)
--   RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
--   BEGIN
--     UPDATE public.profiles SET seva_score = ..., weekly_seva = ..., monthly_seva = ...
--     WHERE id = p_user_id;
--   END; $$;
--   GRANT ALL ... TO anon, authenticated, service_role;
--
-- Two real problems, both pre-existing (already reachable from every web
-- caller — HeroSection.tsx, JapaClient.tsx, /api/sadhana/perfect-day —
-- not introduced by native):
--
--   1. No ownership check. SECURITY DEFINER means this runs as the
--      function owner, bypassing profiles' RLS entirely. Any authenticated
--      (or, per the anon grant, even unauthenticated) client can call
--      `increment_period_seva(<anyone's uuid>, 999999)` and inflate an
--      arbitrary other user's seva score. This is the house pattern for
--      every OTHER security-definer RPC in this schema (create_kul,
--      join_kul, export_user_data, auth_kul_id, ...) — they all resolve
--      `v_user_id := auth.uid()` internally and never trust a caller-
--      supplied user id for a self-scoped mutation. This function was the
--      odd one out.
--   2. Granted to `anon`. Every other points/karma-bearing RPC in the
--      migrations history (award_karma, increment_karma, increment_streak_freeze)
--      is `GRANT EXECUTE ... TO authenticated` only; anon is reserved here
--      for genuinely pre-auth lookups like resolve_invite_code. There's no
--      legitimate reason an unauthenticated caller should be able to move
--      seva points at all.
--
-- Fix: ignore the caller-supplied p_user_id for authorization purposes —
-- resolve the acting user from auth.uid() instead, matching this schema's
-- own established convention. Callers keep passing p_user_id (avoids an
-- app-wide call-site migration across HeroSection.tsx, JapaClient.tsx,
-- perfect-day/route.ts, and native's new shloka.tsx) but the function now
-- raises if it doesn't match the authenticated session, and a mismatch is
-- never silently ignored or silently redirected to the caller's own row —
-- an unexpected mismatch is a bug worth surfacing, not swallowing.
--
-- Also clamps p_points to a sane, generous range (1-500) so a compromised
-- or tampered client can't self-inflate an arbitrary score even for their
-- own account. Every known legitimate call site awards small fixed amounts
-- (shloka: 5, perfect-day bonus: 15, japa: 10 per completed round, so a
-- very heavy multi-mala session might reach the low hundreds) — 500 covers
-- all of them with headroom and still bounds abuse.
CREATE OR REPLACE FUNCTION public.increment_period_seva(p_user_id uuid, p_points integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_user_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'Cannot award seva to another user';
  END IF;

  IF p_points IS NULL OR p_points < 1 OR p_points > 500 THEN
    RAISE EXCEPTION 'p_points out of allowed range (1-500)';
  END IF;

  UPDATE public.profiles
  SET seva_score   = COALESCE(seva_score, 0) + p_points,
      weekly_seva  = COALESCE(weekly_seva, 0) + p_points,
      monthly_seva = COALESCE(monthly_seva, 0) + p_points
  WHERE id = v_user_id;
END;
$$;

ALTER FUNCTION public.increment_period_seva(p_user_id uuid, p_points integer) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.increment_period_seva(p_user_id uuid, p_points integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.increment_period_seva(p_user_id uuid, p_points integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_period_seva(p_user_id uuid, p_points integer) TO service_role;
