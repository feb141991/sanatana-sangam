-- Rollback: 20261101020000_optimize_timezone_lookups_rollback.sql
-- Restores pg_timezone_names scans in Japa completion, context, and notification cadence.

CREATE OR REPLACE FUNCTION public.notification_cadence_safe_timezone(p_timezone TEXT)
RETURNS TEXT
LANGUAGE SQL
STABLE
SET search_path = ''
AS $$
  SELECT coalesce(
    (SELECT timezone_entry.name
     FROM pg_catalog.pg_timezone_names AS timezone_entry
     WHERE timezone_entry.name = nullif(p_timezone, '')
     LIMIT 1),
    'UTC'
  );
$$;

DROP FUNCTION IF EXISTS public.safe_timezone(text, text);

-- Note: get_japa_context and complete_japa_session fall back to checking pg_timezone_names
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
    case when exists (select 1 from pg_timezone_names where name = p.timezone)
      then p.timezone else 'UTC' end,
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

