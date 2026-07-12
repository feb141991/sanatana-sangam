-- Atomic mark_shloka_read(text) RPC.
--
-- Root-caused a native bug report: "mark as read" on app/shloka.tsx would
-- often appear to fail entirely (error alert, UI reverts) even though the
-- streak sometimes did persist. Cause: POST /api/native/shloka/read did two
-- independent, non-atomic writes — profiles.update({shloka_streak,
-- last_shloka_date}) first, then a separate increment_period_seva(...) RPC
-- call for +5 seva. Those are two separate HTTP round trips to PostgREST,
-- not one transaction. If the second call fails for any reason (and
-- increment_period_seva was hardened to RAISE on any ownership mismatch as
-- of 20260708140920_harden_increment_period_seva.sql — added the very same
-- day native's shloka screen was built), the route returns 500 and the
-- native client rolls back its optimistic UI state even though the first
-- write may have already committed. The PWA's HeroSection.tsx hits the same
-- RPC and papers over exactly this failure mode with a client-side
-- read-then-add fallback (itself a race-prone patch, not a real fix).
--
-- Fix: do both writes — and the "already read today" idempotency check —
-- inside one SECURITY DEFINER function, in one transaction, with the row
-- locked for the duration. No caller-supplied user id (unlike
-- increment_period_seva, which keeps one for backward call-site
-- compatibility) — this is a brand new RPC, so it resolves auth.uid()
-- directly and takes only a timezone hint. No caller-supplied points either
-- — the +5 award is fixed server-side, removing an entire class of client-
-- tamper surface that increment_period_seva's p_points arg has to clamp
-- defensively.
--
-- Timezone handling mirrors src/lib/sacred-time.ts's localSpiritualDate()
-- (brahma muhurta boundary at local hour 4, i.e. the "spiritual day" rolls
-- over at 4am, not midnight) so this function, the web route, and native
-- never compute three independently-drifting notions of "today". An
-- invalid/unrecognized timezone string falls back to UTC rather than
-- raising, matching sacred-time.ts's resolveTimeZone() fallback behavior.
CREATE OR REPLACE FUNCTION public.mark_shloka_read(p_timezone text DEFAULT 'UTC')
RETURNS TABLE(
  streak integer,
  read_date date,
  already_read boolean,
  seva_awarded integer,
  milestone boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_tz text := COALESCE(NULLIF(p_timezone, ''), 'UTC');
  v_local timestamp;
  v_hour integer;
  v_today date;
  v_yesterday date;
  v_prev_streak integer;
  v_prev_date date;
  v_new_streak integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  BEGIN
    v_local := now() AT TIME ZONE v_tz;
  EXCEPTION WHEN OTHERS THEN
    v_tz := 'UTC';
    v_local := now() AT TIME ZONE 'UTC';
  END;

  v_hour := EXTRACT(HOUR FROM v_local);
  v_today := v_local::date;
  IF v_hour < 4 THEN
    v_today := (v_today - INTERVAL '1 day')::date;
  END IF;

  -- Lock the row for the duration of this check-then-write so two rapid
  -- taps (or a retry racing the original request) can't both read
  -- "not read yet" and both increment the streak.
  SELECT shloka_streak, last_shloka_date
    INTO v_prev_streak, v_prev_date
    FROM public.profiles
   WHERE id = v_user_id
   FOR UPDATE;

  IF v_prev_date = v_today THEN
    RETURN QUERY SELECT COALESCE(v_prev_streak, 0), v_today, true, 0, false;
    RETURN;
  END IF;

  v_yesterday := (v_today - INTERVAL '1 day')::date;
  IF v_prev_date = v_yesterday THEN
    v_new_streak := COALESCE(v_prev_streak, 0) + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  UPDATE public.profiles
     SET shloka_streak    = v_new_streak,
         last_shloka_date = v_today,
         seva_score       = COALESCE(seva_score, 0) + 5,
         weekly_seva      = COALESCE(weekly_seva, 0) + 5,
         monthly_seva     = COALESCE(monthly_seva, 0) + 5
   WHERE id = v_user_id;

  RETURN QUERY SELECT v_new_streak, v_today, false, 5, (v_new_streak % 7 = 0);
END;
$$;

ALTER FUNCTION public.mark_shloka_read(text) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.mark_shloka_read(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_shloka_read(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.mark_shloka_read(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_shloka_read(text) TO service_role;
