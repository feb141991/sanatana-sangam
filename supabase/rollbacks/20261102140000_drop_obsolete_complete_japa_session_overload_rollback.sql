-- Rollback for 20261102140000_drop_obsolete_complete_japa_session_overload.sql
-- Restores the pre-20261101 definition from 20260905232420_repair_japa_completion_contract_drift.sql

CREATE OR REPLACE FUNCTION public.complete_japa_session(
  p_client_completion_id uuid,
  p_mantra text,
  p_count integer,
  p_rounds integer,
  p_duration_seconds integer,
  p_tradition text DEFAULT 'universal',
  p_practice_type text DEFAULT 'mala',
  p_active_symbol_id text DEFAULT 'om'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_timezone text;
  v_last_freeze_used date;
  v_streak_freeze_count integer;
  v_karma_points integer;
  v_session_id uuid;
  v_existing_session_id uuid;
  v_today date;
  v_yesterday date;
  v_today_row record;
  v_yesterday_row record;
  v_carried_streak integer := 0;
  v_new_streak integer;
  v_karma_gain integer := 0;
  v_context jsonb;
  v_latest_streak integer;
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
    p.timezone,
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

  v_today := ((now() AT TIME ZONE coalesce(v_timezone, 'UTC')) - interval '4 hours')::date;
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
    CASE WHEN p_rounds > 0 THEN 'target_completed' ELSE 'ended_manually' END,
    nullif(p_rounds, 0), p_rounds, p_count,
    CASE
      WHEN extract(hour FROM now() AT TIME ZONE coalesce(v_timezone, 'UTC')) BETWEEN 3 AND 5 THEN 'brahma_muhurta'
      WHEN extract(hour FROM now() AT TIME ZONE coalesce(v_timezone, 'UTC')) BETWEEN 6 AND 10 THEN 'morning'
      WHEN extract(hour FROM now() AT TIME ZONE coalesce(v_timezone, 'UTC')) BETWEEN 11 AND 15 THEN 'midday'
      WHEN extract(hour FROM now() AT TIME ZONE coalesce(v_timezone, 'UTC')) BETWEEN 16 AND 19 THEN 'sandhya'
      ELSE 'night'
    END,
    v_today, coalesce(v_timezone, 'UTC'), true, '/japa'
  ) RETURNING id INTO v_session_id;

  SELECT * INTO v_today_row FROM public.daily_sadhana
  WHERE user_id = v_user_id AND date = v_today;
  SELECT * INTO v_yesterday_row FROM public.daily_sadhana
  WHERE user_id = v_user_id AND date = v_yesterday;
  SELECT coalesce(streak_count, 0) INTO v_latest_streak
  FROM public.daily_sadhana
  WHERE user_id = v_user_id AND date < v_today AND streak_count IS NOT NULL
  ORDER BY date DESC LIMIT 1;

  IF coalesce(v_yesterday_row.japa_done, false) THEN
    v_carried_streak := coalesce(v_yesterday_row.streak_count, 0);
  ELSIF v_last_freeze_used = v_today THEN
    v_carried_streak := greatest(coalesce(v_yesterday_row.streak_count, 0), coalesce(v_latest_streak, 0));
  END IF;

  v_new_streak := CASE
    WHEN coalesce(v_today_row.japa_done, false) THEN coalesce(v_today_row.streak_count, 1)
    WHEN v_carried_streak > 0 THEN v_carried_streak + 1
    ELSE 1
  END;

  INSERT INTO public.daily_sadhana (user_id, date, japa_done, streak_count)
  VALUES (v_user_id, v_today, true, v_new_streak)
  ON CONFLICT (user_id, date) DO UPDATE
    SET japa_done = true, streak_count = excluded.streak_count;

  IF NOT coalesce(v_today_row.japa_done, false)
     AND v_new_streak % 7 = 0 AND v_streak_freeze_count < 3 THEN
    UPDATE public.profiles
    SET streak_freeze_count = least(3, coalesce(streak_freeze_count, 0) + 1)
    WHERE id = v_user_id;
  END IF;

  IF p_rounds > 0 THEN
    v_karma_gain := least(p_rounds * 5, 540);
    UPDATE public.profiles
    SET karma_points = coalesce(karma_points, 0) + v_karma_gain
    WHERE id = v_user_id
    RETURNING karma_points INTO v_karma_points;

    INSERT INTO public.karma_ledger
      (user_id, amount, reason, source_route, metadata, earned_date)
    VALUES
      (v_user_id, v_karma_gain, 'japa_completion', '/api/japa/complete',
       jsonb_build_object('clientCompletionId', p_client_completion_id, 'sessionId', v_session_id), v_today);
  END IF;

  v_context := public.get_japa_context();
  RETURN v_context || jsonb_build_object(
    'success', true,
    'idempotentReplay', false,
    'sessionId', v_session_id,
    'karmaPoints', v_karma_points,
    'karmaAwarded', v_karma_gain
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.complete_japa_session(uuid, text, integer, integer, integer, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_japa_session(uuid, text, integer, integer, integer, text, text, text) TO authenticated, service_role;
