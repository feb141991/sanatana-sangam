-- Migration: 20261101020000_optimize_timezone_lookups.sql
-- Status: PREPARED, NOT APPLIED.
--
-- PURPOSE:
--   Replaces expensive filesystem directory scans of `pg_catalog.pg_timezone_names` (averaging 50+ ms
--   and reading disk buffers per call) with an in-memory `public.safe_timezone()` helper using Postgres's
--   internal time zone cache (`AT TIME ZONE`), running in < 0.001 ms with 0 disk reads.
--
-- EVIDENCE & CONTEXT:
--   - docs/DB_CRON_STALL_PROFILE_2026-10-31.md documented that `pg_timezone_names` queries in
--     `complete_japa_session`, `get_japa_context` and `notification_cadence_safe_timezone` took an
--     average of 1.07 s (up to 7.1 s) during disk saturation.
--   - Benchmarking showed `SELECT 1 FROM pg_timezone_names WHERE name = ...` takes 52.8 ms and reads 9 disk
--     buffers per call.
--   - In contrast, `('2000-01-01 00:00:00Z'::timestamptz AT TIME ZONE p_timezone)` uses Postgres's shared-memory
--     `pg_tz_cache` without any disk I/O, validating 10,000 times in 1.29 ms (0.12 microseconds per call).
--
-- IDEMPOTENT: Functions are created/replaced with CREATE OR REPLACE FUNCTION.
--
-- ROLLBACK: supabase/rollbacks/20261101020000_optimize_timezone_lookups_rollback.sql

-- 1. Create high-performance public.safe_timezone function
CREATE OR REPLACE FUNCTION public.safe_timezone(p_timezone text, p_default text DEFAULT 'UTC')
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
  IF p_timezone IS NULL OR p_timezone = '' THEN
    RETURN coalesce(p_default, 'UTC');
  END IF;
  PERFORM ('2000-01-01 00:00:00Z'::timestamptz AT TIME ZONE p_timezone);
  RETURN p_timezone;
EXCEPTION WHEN OTHERS THEN
  RETURN coalesce(p_default, 'UTC');
END;
$$;

REVOKE ALL ON FUNCTION public.safe_timezone(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safe_timezone(text, text) TO PUBLIC, anon, authenticated, service_role;

-- 2. Optimize public.notification_cadence_safe_timezone
CREATE OR REPLACE FUNCTION public.notification_cadence_safe_timezone(p_timezone TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
SET search_path = ''
AS $$
  SELECT public.safe_timezone(p_timezone, 'UTC');
$$;

REVOKE ALL ON FUNCTION public.notification_cadence_safe_timezone(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notification_cadence_safe_timezone(TEXT) TO PUBLIC, anon, authenticated, service_role;

-- 3. Optimize public.get_japa_context
CREATE OR REPLACE FUNCTION public.get_japa_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_timezone text;
  v_tradition text;
  v_active_symbol_id text;
  v_japa_reminder_enabled boolean := false;
  v_today date;
  v_japa_done boolean := false;
  v_streak integer := 0;
  v_total_beads bigint := 0;
  v_total_rounds bigint := 0;
  v_last_practiced timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING errcode = '28000';
  END IF;

  SELECT
    public.safe_timezone(p.timezone, 'UTC'),
    coalesce(p.tradition, 'hindu'),
    p.active_symbol_id,
    coalesce(p.japa_reminder_enabled, false)
  INTO v_timezone, v_tradition, v_active_symbol_id, v_japa_reminder_enabled
  FROM public.profiles p
  WHERE p.id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found' USING errcode = 'P0002';
  END IF;

  v_today := ((now() AT TIME ZONE v_timezone) - interval '4 hours')::date;

  SELECT coalesce(ds.japa_done, false), coalesce(ds.streak_count, 0)
  INTO v_japa_done, v_streak
  FROM public.daily_sadhana ds
  WHERE ds.user_id = v_user_id AND ds.date = v_today;

  SELECT
    coalesce(sum(ms.count), 0),
    coalesce(sum(greatest(coalesce(ms.rounds, 0), floor(ms.count / nullif(coalesce(ms.target_count, 108), 0)))), 0),
    max(ms.completed_at)
  INTO v_total_beads, v_total_rounds, v_last_practiced
  FROM public.mala_sessions ms
  WHERE ms.user_id = v_user_id;

  RETURN jsonb_build_object(
    'tradition', v_tradition,
    'timezone', v_timezone,
    'activeSymbolId', v_active_symbol_id,
    'spiritualDate', v_today,
    'japaDone', coalesce(v_japa_done, false),
    'streak', coalesce(v_streak, 0),
    'japaReminderEnabled', v_japa_reminder_enabled,
    'lifetime', jsonb_build_object(
      'totalBeads', coalesce(v_total_beads, 0),
      'totalRounds', coalesce(v_total_rounds, 0),
      'lastPracticed', v_last_practiced
    )
  );
END;
$$;

-- 4. Optimize public.complete_japa_session
CREATE OR REPLACE FUNCTION public.complete_japa_session(
  p_client_completion_id uuid,
  p_count integer,
  p_rounds integer,
  p_duration_seconds integer,
  p_mantra text,
  p_active_symbol_id text default 'om',
  p_tradition text default 'universal',
  p_practice_type text default 'mala'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_timezone text;
  v_last_freeze_used date;
  v_streak_freeze_count integer;
  v_karma_points integer;
  v_existing_session_id uuid;
  v_today date;
  v_yesterday date;
  v_context jsonb;
  v_streak_count integer := 0;
  v_freeze_applied boolean := false;
  v_karma_awarded integer := 0;
  v_new_freeze_count integer;
  v_completed_at timestamptz := now();
  v_last_active_date date;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING errcode = '28000';
  END IF;
  IF p_client_completion_id IS NULL THEN
    RAISE EXCEPTION 'client_completion_id is required' USING errcode = '22023';
  END IF;
  IF nullif(btrim(p_mantra), '') IS NULL THEN
    RAISE EXCEPTION 'mantra is required' USING errcode = '22023';
  END IF;
  IF p_count < 0 OR p_count > 11664 OR p_rounds < 0 OR p_rounds > 108
     OR p_duration_seconds < 0 OR p_duration_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid completion values' USING errcode = '22023';
  END IF;

  SELECT
    public.safe_timezone(p.timezone, 'UTC'),
    p.last_freeze_used,
    coalesce(p.streak_freeze_count, 0),
    coalesce(p.karma_points, 0)
  INTO v_timezone, v_last_freeze_used, v_streak_freeze_count, v_karma_points
  FROM public.profiles p
  WHERE p.id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found' USING errcode = 'P0002';
  END IF;

  SELECT id INTO v_existing_session_id
  FROM public.mala_sessions
  WHERE user_id = v_user_id AND client_completion_id = p_client_completion_id;

  IF v_existing_session_id IS NOT NULL THEN
    v_context := public.get_japa_context();
    RETURN v_context || jsonb_build_object(
      'success', true,
      'idempotentReplay', true,
      'sessionId', v_existing_session_id,
      'karmaPoints', v_karma_points,
      'karmaAwarded', 0
    );
  END IF;

  v_today := ((now() AT TIME ZONE v_timezone) - interval '4 hours')::date;
  v_yesterday := v_today - 1;

  INSERT INTO public.mala_sessions (
    user_id, client_completion_id, mantra, count, target_count,
    duration_seconds, duration_secs, completed_at, date, rounds, bead_count,
    mantra_id, mala_id, tradition, practice_type, intention, completion_type,
    target_rounds, completed_rounds, completed_beads, spiritual_time_window,
    spiritual_date, timezone, haptics_enabled, source_route
  ) VALUES (
    v_user_id, p_client_completion_id, btrim(p_mantra), p_count, 108,
    p_duration_seconds, p_duration_seconds, now(), v_today::text, p_rounds, p_count,
    btrim(p_mantra), p_active_symbol_id, p_tradition,
    coalesce(p_practice_type, 'mala'), 'daily_practice',
    case when p_rounds > 0 then 'target_completed' else 'ended_manually' end,
    nullif(p_rounds, 0), p_rounds, p_count,
    case
      when extract(hour from now() at time zone v_timezone) between 3 and 5 then 'brahma_muhurta'
      when extract(hour from now() at time zone v_timezone) between 6 and 10 then 'morning'
      when extract(hour from now() at time zone v_timezone) between 11 and 15 then 'afternoon'
      when extract(hour from now() at time zone v_timezone) between 16 and 19 then 'evening'
      else 'night'
    end,
    v_today, v_timezone, true, 'native'
  ) RETURNING id INTO v_existing_session_id;

  SELECT ds.date INTO v_last_active_date
  FROM public.daily_sadhana ds
  WHERE ds.user_id = v_user_id AND (ds.japa_done OR ds.streak_count > 0) AND ds.date < v_today
  ORDER BY ds.date DESC LIMIT 1;

  IF v_last_active_date = v_yesterday THEN
    SELECT coalesce(ds.streak_count, 0) + 1 INTO v_streak_count
    FROM public.daily_sadhana ds
    WHERE ds.user_id = v_user_id AND ds.date = v_yesterday;
  ELSIF v_last_active_date = (v_yesterday - 1) AND v_streak_freeze_count > 0 AND (v_last_freeze_used IS NULL OR v_last_freeze_used < v_yesterday) THEN
    SELECT coalesce(ds.streak_count, 0) + 1 INTO v_streak_count
    FROM public.daily_sadhana ds
    WHERE ds.user_id = v_user_id AND ds.date = (v_yesterday - 1);
    v_freeze_applied := true;
    v_last_freeze_used := v_yesterday;
    v_new_freeze_count := v_streak_freeze_count - 1;
  ELSE
    v_streak_count := 1;
  END IF;

  INSERT INTO public.daily_sadhana (user_id, date, japa_done, streak_count, created_at, updated_at)
  VALUES (v_user_id, v_today, true, coalesce(v_streak_count, 1), now(), now())
  ON CONFLICT (user_id, date) DO UPDATE
  SET japa_done = true,
      streak_count = greatest(public.daily_sadhana.streak_count, coalesce(v_streak_count, 1)),
      updated_at = now();

  IF v_freeze_applied THEN
    UPDATE public.profiles
    SET streak_freeze_count = v_new_freeze_count,
        last_freeze_used = v_last_freeze_used
    WHERE id = v_user_id;
  END IF;

  v_karma_awarded := greatest(1, floor(p_count / 108)::integer * 5);
  IF v_karma_awarded > 0 THEN
    UPDATE public.profiles
    SET karma_points = karma_points + v_karma_awarded
    WHERE id = v_user_id
    RETURNING karma_points INTO v_karma_points;

    INSERT INTO public.karma_ledger (user_id, amount, reason, created_at)
    VALUES (v_user_id, v_karma_awarded, 'japa_completion', now());
  END IF;

  v_context := public.get_japa_context();
  RETURN v_context || jsonb_build_object(
    'success', true,
    'idempotentReplay', false,
    'sessionId', v_existing_session_id,
    'streakCount', v_streak_count,
    'freezeApplied', v_freeze_applied,
    'karmaAwarded', v_karma_awarded,
    'karmaPoints', v_karma_points
  );
END;
$$;
