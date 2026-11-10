-- Rollback for 20261110140000_one_nudge_a_day_cadence.sql.
-- Restores the three original function bodies (five shared budgeted rows per user per local day,
-- policy version engagement-cadence-v2) and drops the four helpers. Run the original bodies FIRST:
-- they do not reference the helpers, so nothing dangles. Rows already refused or admitted stay as they
-- are; notification_cadence_events rows written as v3 are kept (harmless history). Deploy the previous
-- TypeScript resolver (limit 5) before or with this rollback, or the resolver will accept fewer rows than
-- this database now allows (safe direction: it only suppresses more).
-- The Mandali types that v3 stopped counting are counted again after rollback, as before.

CREATE OR REPLACE FUNCTION public.enforce_notification_schedule_cadence()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profile_timezone TEXT;
  v_timezone TEXT;
  v_quiet_start INTEGER;
  v_quiet_end INTEGER;
  v_local_date DATE;
  v_existing_budgeted INTEGER := 0;
  v_requested_at TIMESTAMPTZ;
  v_slot TIMESTAMPTZ;
  v_conflict_at TIMESTAMPTZ;
  v_local TIMESTAMP;
  v_local_minute INTEGER;
  v_attempt INTEGER;
  v_found_slot BOOLEAN := FALSE;
  v_shift_reason TEXT;
BEGIN
  IF public.notification_is_budget_exempt(NEW.notification_type, NEW.notification_key) THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS NULL OR nullif(btrim(NEW.notification_key), '') IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'notification_cadence_key_required';
  END IF;

  SELECT profile.timezone,
         profile.notification_quiet_hours_start,
         profile.notification_quiet_hours_end
  INTO v_profile_timezone, v_quiet_start, v_quiet_end
  FROM public.profiles AS profile
  WHERE profile.id = NEW.user_id;

  v_timezone := public.notification_cadence_safe_timezone(
    coalesce(nullif(NEW.metadata ->> 'timezone', ''), v_profile_timezone, 'UTC')
  );
  v_local_date := public.try_parse_notification_date(NEW.metadata ->> 'local_date');
  v_requested_at := NEW.send_at;

  IF v_local_date IS NULL THEN
    v_local_date := (v_requested_at AT TIME ZONE v_timezone)::DATE;
  END IF;

  IF v_local_date IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'notification_cadence_local_date_required';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(NEW.user_id::TEXT || ':' || v_local_date::TEXT, 74321)
  );

  -- Check idempotency after acquiring the shared user/day lock so a retry
  -- waiting behind a concurrent insert observes the committed key.
  IF EXISTS (
    SELECT 1 FROM public.notification_schedule AS existing_schedule
    WHERE existing_schedule.user_id = NEW.user_id
      AND existing_schedule.notification_key = NEW.notification_key
  ) OR EXISTS (
    SELECT 1 FROM public.notifications AS existing_notification
    WHERE existing_notification.user_id = NEW.user_id
      AND existing_notification.notification_key = NEW.notification_key
  ) THEN
    INSERT INTO public.notification_cadence_events (
      user_id, notification_type, canonical_type, notification_key,
      local_date, decision, reason, requested_at
    ) VALUES (
      NEW.user_id, NEW.notification_type,
      public.canonical_notification_budget_type(NEW.notification_type, NEW.notification_key),
      NEW.notification_key, v_local_date,
      'duplicate', 'idempotency_key_already_admitted', v_requested_at
    ) ON CONFLICT (user_id, notification_key, decision, policy_version) DO NOTHING;
    RETURN NULL;
  END IF;

  WITH schedule_history AS (
    SELECT
      coalesce(
        public.try_parse_notification_date(ns.metadata ->> 'local_date'),
        public.try_parse_notification_date(substring(ns.notification_key FROM '([0-9]{4}-[0-9]{2}-[0-9]{2})')),
        (ns.send_at AT TIME ZONE public.notification_cadence_safe_timezone(
          coalesce(nullif(ns.metadata ->> 'timezone', ''), nullif(profile.timezone, ''), 'UTC')
        ))::DATE
      ) AS local_date,
      coalesce(ns.notification_key, 'schedule:' || ns.id::TEXT) AS dedupe_key,
      ns.notification_type AS event_type,
      ns.notification_key
    FROM public.notification_schedule AS ns
    LEFT JOIN public.profiles AS profile ON profile.id = ns.user_id
    WHERE ns.user_id = NEW.user_id
      AND ns.status IN ('pending', 'sending', 'sent')
  ),
  notification_history AS (
    SELECT
      coalesce(
        public.try_parse_notification_date(to_jsonb(n) ->> 'local_date'),
        public.try_parse_notification_date(substring(to_jsonb(n) ->> 'notification_key' FROM '([0-9]{4}-[0-9]{2}-[0-9]{2})')),
        (n.created_at AT TIME ZONE public.notification_cadence_safe_timezone(
          coalesce(nullif(n.sent_timezone, ''), nullif(profile.timezone, ''), 'UTC')
        ))::DATE
      ) AS local_date,
      coalesce(to_jsonb(n) ->> 'notification_key', 'notification:' || n.id::TEXT) AS dedupe_key,
      n.type AS event_type,
      to_jsonb(n) ->> 'notification_key' AS notification_key
    FROM public.notifications AS n
    LEFT JOIN public.profiles AS profile ON profile.id = n.user_id
    WHERE n.user_id = NEW.user_id
  ),
  history AS (
    SELECT * FROM schedule_history
    UNION ALL
    SELECT * FROM notification_history
  )
  SELECT count(DISTINCT history.dedupe_key)::INTEGER
  INTO v_existing_budgeted
  FROM history
  WHERE history.local_date = v_local_date
    AND NOT public.notification_is_budget_exempt(history.event_type, history.notification_key);

  IF v_existing_budgeted >= 5 THEN
    INSERT INTO public.notification_cadence_events (
      user_id, notification_type, canonical_type, notification_key,
      local_date, decision, reason, requested_at
    ) VALUES (
      NEW.user_id, NEW.notification_type,
      public.canonical_notification_budget_type(NEW.notification_type, NEW.notification_key),
      NEW.notification_key, v_local_date, 'suppressed', 'daily_budget_full', NEW.send_at
    ) ON CONFLICT (user_id, notification_key, decision, policy_version) DO NOTHING;
    RETURN NULL;
  END IF;

  -- Search by 15-minute increments. Fixed-time exempt reminders do not spend
  -- budget, but their scheduled instant still acts as a spacing blocker.
  v_slot := greatest(v_requested_at, clock_timestamp());
  IF v_slot > v_requested_at THEN
    v_shift_reason := 'producer_arrived_after_requested_time';
  END IF;
  FOR v_attempt IN 0..96 LOOP
    v_local := v_slot AT TIME ZONE v_timezone;
    IF v_local::DATE <> v_local_date THEN
      EXIT;
    END IF;

    v_local_minute := extract(hour FROM v_local)::INTEGER * 60
      + extract(minute FROM v_local)::INTEGER;

    IF v_local_minute < 420 THEN
      v_shift_reason := coalesce(v_shift_reason, 'daytime_window');
      v_slot := v_slot + interval '15 minutes';
      CONTINUE;
    END IF;
    IF v_local_minute >= 1260 THEN
      EXIT;
    END IF;

    IF v_quiet_start IS NOT NULL AND v_quiet_end IS NOT NULL
      AND v_quiet_start <> v_quiet_end
      AND (
        (v_quiet_start < v_quiet_end AND extract(hour FROM v_local)::INTEGER >= v_quiet_start
          AND extract(hour FROM v_local)::INTEGER < v_quiet_end)
        OR
        (v_quiet_start > v_quiet_end AND (extract(hour FROM v_local)::INTEGER >= v_quiet_start
          OR extract(hour FROM v_local)::INTEGER < v_quiet_end))
      ) THEN
      v_shift_reason := coalesce(v_shift_reason, 'quiet_hours');
      v_slot := v_slot + interval '15 minutes';
      CONTINUE;
    END IF;

    WITH schedule_history AS (
      SELECT
        coalesce(
          public.try_parse_notification_date(ns.metadata ->> 'local_date'),
          public.try_parse_notification_date(substring(ns.notification_key FROM '([0-9]{4}-[0-9]{2}-[0-9]{2})')),
          (ns.send_at AT TIME ZONE public.notification_cadence_safe_timezone(
            coalesce(nullif(ns.metadata ->> 'timezone', ''), nullif(profile.timezone, ''), 'UTC')
          ))::DATE
        ) AS local_date,
        ns.send_at AS delivery_at,
        coalesce(ns.notification_key, 'schedule:' || ns.id::TEXT) AS dedupe_key
      FROM public.notification_schedule AS ns
      LEFT JOIN public.profiles AS profile ON profile.id = ns.user_id
      WHERE ns.user_id = NEW.user_id
        AND ns.status IN ('pending', 'sending', 'sent')
    ),
    notification_history AS (
      SELECT
        coalesce(
          public.try_parse_notification_date(to_jsonb(n) ->> 'local_date'),
          public.try_parse_notification_date(substring(to_jsonb(n) ->> 'notification_key' FROM '([0-9]{4}-[0-9]{2}-[0-9]{2})')),
          (n.created_at AT TIME ZONE public.notification_cadence_safe_timezone(
            coalesce(nullif(n.sent_timezone, ''), nullif(profile.timezone, ''), 'UTC')
          ))::DATE
        ) AS local_date,
        n.created_at AS delivery_at,
        coalesce(to_jsonb(n) ->> 'notification_key', 'notification:' || n.id::TEXT) AS dedupe_key
      FROM public.notifications AS n
      LEFT JOIN public.profiles AS profile ON profile.id = n.user_id
      WHERE n.user_id = NEW.user_id
        AND NOT EXISTS (
          SELECT 1 FROM public.notification_schedule AS paired_schedule
          WHERE paired_schedule.user_id = n.user_id
            AND paired_schedule.notification_key = (to_jsonb(n) ->> 'notification_key')
            AND paired_schedule.status IN ('pending', 'sending', 'sent')
        )
    ),
    history AS (
      SELECT * FROM schedule_history
      UNION ALL
      SELECT * FROM notification_history
    )
    SELECT max(history.delivery_at)
    INTO v_conflict_at
    FROM history
    WHERE history.local_date = v_local_date
      AND history.dedupe_key <> NEW.notification_key
      AND abs(extract(epoch FROM (history.delivery_at - v_slot))) < 10800;

    IF v_conflict_at IS NULL THEN
      v_found_slot := TRUE;
      EXIT;
    END IF;

    v_shift_reason := coalesce(v_shift_reason, 'three_hour_spacing');

    v_slot := date_bin(
      interval '15 minutes',
      v_conflict_at + interval '3 hours' + interval '14 minutes 59.999999 seconds',
      timestamptz '2000-01-01 00:00:00+00'
    );
  END LOOP;

  IF NOT v_found_slot THEN
    INSERT INTO public.notification_cadence_events (
      user_id, notification_type, canonical_type, notification_key,
      local_date, decision, reason, requested_at
    ) VALUES (
      NEW.user_id, NEW.notification_type,
      public.canonical_notification_budget_type(NEW.notification_type, NEW.notification_key),
      NEW.notification_key, v_local_date, 'suppressed', 'no_safe_same_day_slot', NEW.send_at
    ) ON CONFLICT (user_id, notification_key, decision, policy_version) DO NOTHING;
    RETURN NULL;
  END IF;

  NEW.send_at := v_slot;
  NEW.metadata := coalesce(NEW.metadata, '{}'::JSONB)
    || jsonb_build_object('timezone', v_timezone, 'local_date', v_local_date::TEXT);
  IF v_slot > v_requested_at THEN
    NEW.metadata := NEW.metadata || jsonb_build_object(
      'cadence_policy_version', 'engagement-cadence-v2',
      'cadence_delay_minutes', greatest(0, round(extract(epoch FROM (v_slot - v_requested_at)) / 60)::INTEGER)
    );
  END IF;

  INSERT INTO public.notification_cadence_events (
    user_id, notification_type, canonical_type, notification_key,
    local_date, decision, reason, requested_at, scheduled_at, metadata
  ) VALUES (
    NEW.user_id, NEW.notification_type,
    public.canonical_notification_budget_type(NEW.notification_type, NEW.notification_key),
    NEW.notification_key, v_local_date,
    CASE WHEN v_slot > v_requested_at THEN 'shifted' ELSE 'scheduled' END,
    CASE WHEN v_slot > v_requested_at THEN v_shift_reason ELSE NULL END,
    v_requested_at, v_slot,
    jsonb_build_object(
      'timezone', v_timezone,
      'delay_minutes', greatest(0, round(extract(epoch FROM (v_slot - v_requested_at)) / 60)::INTEGER)
    )
  ) ON CONFLICT (user_id, notification_key, decision, policy_version) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_notification_schedule_cadence_statement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_group RECORD;
  v_budgeted_count INTEGER := 0;
BEGIN
  FOR v_group IN
    SELECT DISTINCT inserted.user_id,
      public.try_parse_notification_date(inserted.metadata ->> 'local_date') AS local_date
    FROM inserted_rows AS inserted
    WHERE NOT public.notification_is_budget_exempt(inserted.notification_type, inserted.notification_key)
  LOOP
    WITH schedule_history AS (
      SELECT
        ns.user_id,
        coalesce(
          public.try_parse_notification_date(ns.metadata ->> 'local_date'),
          public.try_parse_notification_date(substring(ns.notification_key FROM '([0-9]{4}-[0-9]{2}-[0-9]{2})')),
          (ns.send_at AT TIME ZONE public.notification_cadence_safe_timezone(
            coalesce(nullif(ns.metadata ->> 'timezone', ''), nullif(profile.timezone, ''), 'UTC')
          ))::DATE
        ) AS local_date,
        ns.notification_type AS event_type,
        ns.notification_key,
        coalesce(ns.notification_key, 'schedule:' || ns.id::TEXT) AS dedupe_key,
        ns.send_at AS delivery_at
      FROM public.notification_schedule AS ns
      LEFT JOIN public.profiles AS profile ON profile.id = ns.user_id
      WHERE ns.user_id = v_group.user_id
        AND ns.status IN ('pending', 'sending', 'sent')
    ),
    notification_history AS (
      SELECT
        n.user_id,
        coalesce(
          public.try_parse_notification_date(to_jsonb(n) ->> 'local_date'),
          public.try_parse_notification_date(substring(to_jsonb(n) ->> 'notification_key' FROM '([0-9]{4}-[0-9]{2}-[0-9]{2})')),
          (n.created_at AT TIME ZONE public.notification_cadence_safe_timezone(
            coalesce(nullif(n.sent_timezone, ''), nullif(profile.timezone, ''), 'UTC')
          ))::DATE
        ) AS local_date,
        n.type AS event_type,
        to_jsonb(n) ->> 'notification_key' AS notification_key,
        coalesce(to_jsonb(n) ->> 'notification_key', 'notification:' || n.id::TEXT) AS dedupe_key,
        n.created_at AS delivery_at
      FROM public.notifications AS n
      LEFT JOIN public.profiles AS profile ON profile.id = n.user_id
      WHERE n.user_id = v_group.user_id
        AND NOT EXISTS (
          SELECT 1 FROM public.notification_schedule AS paired_schedule
          WHERE paired_schedule.user_id = n.user_id
            AND paired_schedule.notification_key = (to_jsonb(n) ->> 'notification_key')
            AND paired_schedule.status IN ('pending', 'sending', 'sent')
        )
    ),
    history AS (
      SELECT * FROM schedule_history
      UNION ALL
      SELECT * FROM notification_history
    )
    SELECT count(DISTINCT history.dedupe_key)::INTEGER
    INTO v_budgeted_count
    FROM history
    WHERE history.local_date = v_group.local_date
      AND NOT public.notification_is_budget_exempt(history.event_type, history.notification_key);

    IF v_budgeted_count > 5 THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = 'notification_cadence_conflict',
        DETAIL = format(
          'user_id=%s local_date=%s total=%s limit=5',
          v_group.user_id, v_group.local_date, v_budgeted_count
        );
    END IF;

    IF EXISTS (
      WITH schedule_history AS (
        SELECT
          ns.user_id,
          coalesce(
            public.try_parse_notification_date(ns.metadata ->> 'local_date'),
            public.try_parse_notification_date(substring(ns.notification_key FROM '([0-9]{4}-[0-9]{2}-[0-9]{2})')),
            (ns.send_at AT TIME ZONE public.notification_cadence_safe_timezone(
              coalesce(nullif(ns.metadata ->> 'timezone', ''), nullif(profile.timezone, ''), 'UTC')
            ))::DATE
          ) AS local_date,
          ns.notification_type AS event_type,
          ns.notification_key,
          coalesce(ns.notification_key, 'schedule:' || ns.id::TEXT) AS dedupe_key,
          ns.send_at AS delivery_at
        FROM public.notification_schedule AS ns
        LEFT JOIN public.profiles AS profile ON profile.id = ns.user_id
        WHERE ns.user_id = v_group.user_id
          AND ns.status IN ('pending', 'sending', 'sent')
      ),
      notification_history AS (
        SELECT
          n.user_id,
          coalesce(
            public.try_parse_notification_date(to_jsonb(n) ->> 'local_date'),
            public.try_parse_notification_date(substring(to_jsonb(n) ->> 'notification_key' FROM '([0-9]{4}-[0-9]{2}-[0-9]{2})')),
            (n.created_at AT TIME ZONE public.notification_cadence_safe_timezone(
              coalesce(nullif(n.sent_timezone, ''), nullif(profile.timezone, ''), 'UTC')
            ))::DATE
          ) AS local_date,
          n.type AS event_type,
          to_jsonb(n) ->> 'notification_key' AS notification_key,
          coalesce(to_jsonb(n) ->> 'notification_key', 'notification:' || n.id::TEXT) AS dedupe_key,
          n.created_at AS delivery_at
        FROM public.notifications AS n
        LEFT JOIN public.profiles AS profile ON profile.id = n.user_id
        WHERE n.user_id = v_group.user_id
          AND NOT EXISTS (
            SELECT 1 FROM public.notification_schedule AS paired_schedule
            WHERE paired_schedule.user_id = n.user_id
              AND paired_schedule.notification_key = (to_jsonb(n) ->> 'notification_key')
              AND paired_schedule.status IN ('pending', 'sending', 'sent')
          )
      ),
      history AS (
        SELECT * FROM schedule_history
        UNION ALL
        SELECT * FROM notification_history
      )
      SELECT 1
      FROM inserted_rows AS inserted
      JOIN history
        ON history.user_id = inserted.user_id
       AND history.local_date = v_group.local_date
       AND history.dedupe_key <> inserted.notification_key
       AND abs(extract(epoch FROM (history.delivery_at - inserted.send_at))) < 10800
      WHERE inserted.user_id = v_group.user_id
        AND public.try_parse_notification_date(inserted.metadata ->> 'local_date') = v_group.local_date
        AND NOT public.notification_is_budget_exempt(inserted.notification_type, inserted.notification_key)
      LIMIT 1
    ) THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = 'notification_cadence_spacing_conflict',
        DETAIL = format('user_id=%s local_date=%s', v_group.user_id, v_group.local_date);
    END IF;
  END LOOP;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.persist_notification_candidate_resolution_internal(
  p_schedule_rows JSONB DEFAULT '[]'::JSONB,
  p_candidate_updates JSONB DEFAULT '[]'::JSONB,
  p_audit_events JSONB DEFAULT '[]'::JSONB
)
RETURNS TABLE(promoted_count INTEGER, candidate_count INTEGER, audit_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_promoted INTEGER := 0;
  v_candidates INTEGER := 0;
  v_audits INTEGER := 0;
  v_group RECORD;
  v_schedule_row RECORD;
  v_rows INTEGER := 0;
  v_existing_budgeted INTEGER := 0;
  v_new_budgeted INTEGER := 0;
  v_candidate_date DATE;
BEGIN
  IF coalesce(jsonb_typeof(p_schedule_rows), 'null') <> 'array'
    OR coalesce(jsonb_typeof(p_candidate_updates), 'null') <> 'array'
    OR coalesce(jsonb_typeof(p_audit_events), 'null') <> 'array' THEN
    RAISE EXCEPTION 'resolution payloads must be JSON arrays';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_schedule_rows) AS r(
      user_id UUID, notification_type TEXT, title TEXT, body TEXT,
      send_at TIMESTAMPTZ, notification_key TEXT, metadata JSONB
    )
    WHERE NOT public.notification_is_budget_exempt(r.notification_type, r.notification_key)
      AND (
        public.try_parse_notification_date(r.metadata ->> 'local_date') IS NULL
        OR nullif(btrim(r.notification_key), '') IS NULL
      )
  ) THEN
    RAISE EXCEPTION 'budgeted candidate schedule rows require a valid local_date and notification_key';
  END IF;

  FOR v_group IN
    SELECT DISTINCT r.user_id,
      public.try_parse_notification_date(r.metadata ->> 'local_date') AS local_date
    FROM jsonb_to_recordset(p_schedule_rows) AS r(
      user_id UUID, notification_type TEXT, title TEXT, body TEXT,
      send_at TIMESTAMPTZ, notification_key TEXT, metadata JSONB
    )
    WHERE NOT public.notification_is_budget_exempt(r.notification_type, r.notification_key)
    ORDER BY r.user_id, local_date
  LOOP
    v_candidate_date := v_group.local_date;

    PERFORM pg_advisory_xact_lock(
      hashtextextended(v_group.user_id::TEXT || ':' || v_candidate_date::TEXT, 74321)
    );

    WITH schedule_history AS (
      SELECT
        ns.user_id,
        coalesce(
          public.try_parse_notification_date(ns.metadata ->> 'local_date'),
          public.try_parse_notification_date(substring(ns.notification_key FROM '([0-9]{4}-[0-9]{2}-[0-9]{2})')),
          (ns.send_at AT TIME ZONE public.notification_cadence_safe_timezone(
            coalesce(nullif(ns.metadata ->> 'timezone', ''), nullif(profile.timezone, ''), 'UTC')
          ))::DATE
        ) AS local_date,
        ns.notification_type AS event_type,
        ns.notification_key,
        coalesce(ns.notification_key, 'schedule:' || ns.id::TEXT) AS dedupe_key
      FROM public.notification_schedule AS ns
      LEFT JOIN public.profiles AS profile ON profile.id = ns.user_id
      WHERE ns.user_id = v_group.user_id
        AND ns.status IN ('pending', 'sending', 'sent')
    ),
    notification_history AS (
      SELECT
        n.user_id,
        coalesce(
          public.try_parse_notification_date(to_jsonb(n) ->> 'local_date'),
          public.try_parse_notification_date(substring(to_jsonb(n) ->> 'notification_key' FROM '([0-9]{4}-[0-9]{2}-[0-9]{2})')),
          (n.created_at AT TIME ZONE public.notification_cadence_safe_timezone(
            coalesce(nullif(n.sent_timezone, ''), nullif(profile.timezone, ''), 'UTC')
          ))::DATE
        ) AS local_date,
        n.type AS event_type,
        n.notification_key,
        coalesce(n.notification_key, 'notification:' || n.id::TEXT) AS dedupe_key
      FROM public.notifications AS n
      LEFT JOIN public.profiles AS profile ON profile.id = n.user_id
      WHERE n.user_id = v_group.user_id
    ),
    history AS (
      SELECT * FROM schedule_history
      UNION ALL
      SELECT * FROM notification_history
    )
    SELECT count(DISTINCT history.dedupe_key)::INTEGER
    INTO v_existing_budgeted
    FROM history
    WHERE history.local_date = v_candidate_date
      AND NOT public.notification_is_budget_exempt(history.event_type, history.notification_key);

    SELECT count(DISTINCT r.notification_key)::INTEGER
    INTO v_new_budgeted
    FROM jsonb_to_recordset(p_schedule_rows) AS r(
      user_id UUID, notification_type TEXT, title TEXT, body TEXT,
      send_at TIMESTAMPTZ, notification_key TEXT, metadata JSONB
    )
    WHERE r.user_id = v_group.user_id
      AND public.try_parse_notification_date(r.metadata ->> 'local_date') = v_candidate_date
      AND NOT public.notification_is_budget_exempt(r.notification_type, r.notification_key)
      AND NOT EXISTS (
        SELECT 1
        FROM public.notification_schedule AS existing_schedule
        WHERE existing_schedule.user_id = r.user_id
          AND existing_schedule.notification_key = r.notification_key
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.notifications AS existing_notification
        WHERE existing_notification.user_id = r.user_id
          AND existing_notification.notification_key = r.notification_key
      );

    IF v_existing_budgeted + v_new_budgeted > 5 THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = 'notification_cadence_conflict',
        DETAIL = format(
          'user_id=%s local_date=%s existing=%s requested=%s limit=5',
          v_group.user_id, v_candidate_date, v_existing_budgeted, v_new_budgeted
        );
    END IF;
  END LOOP;

  -- Insert one row per statement, in deterministic order. The BEFORE INSERT
  -- cadence trigger must see the previous row from this same transaction so
  -- it can shift the next delivery instead of rejecting a valid multi-message
  -- resolver batch at the statement-level safety check.
  FOR v_schedule_row IN
    SELECT r.user_id, r.notification_type, r.title, r.body, r.send_at,
           r.notification_key, r.metadata
    FROM jsonb_to_recordset(p_schedule_rows) AS r(
      user_id UUID,
      notification_type TEXT,
      title TEXT,
      body TEXT,
      send_at TIMESTAMPTZ,
      notification_key TEXT,
      metadata JSONB
    )
    ORDER BY r.user_id,
      public.try_parse_notification_date(r.metadata ->> 'local_date') NULLS FIRST,
      r.send_at,
      r.notification_key
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM public.notifications AS existing_notification
      WHERE existing_notification.user_id = v_schedule_row.user_id
        AND existing_notification.notification_key = v_schedule_row.notification_key
    ) THEN
      INSERT INTO public.notification_schedule (
        user_id, notification_type, title, body, send_at, status,
        notification_key, metadata
      ) VALUES (
        v_schedule_row.user_id,
        v_schedule_row.notification_type,
        v_schedule_row.title,
        v_schedule_row.body,
        v_schedule_row.send_at,
        'pending',
        v_schedule_row.notification_key,
        COALESCE(v_schedule_row.metadata, '{}'::JSONB)
      )
      ON CONFLICT (user_id, notification_key) DO NOTHING;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
    ELSE
      v_rows := 0;
    END IF;
    v_promoted := v_promoted + v_rows;
  END LOOP;

  UPDATE public.notification_candidates AS candidate
  SET status = update_row.status,
      decision_reason = update_row.reason,
      resolved_at = update_row.resolved_at,
      claimed_at = NULL,
      updated_at = now()
  FROM jsonb_to_recordset(p_candidate_updates) AS update_row(
    candidate_id UUID,
    status TEXT,
    reason TEXT,
    resolved_at TIMESTAMPTZ
  )
  WHERE candidate.id = update_row.candidate_id
    AND candidate.status = 'resolving';
  GET DIAGNOSTICS v_candidates = ROW_COUNT;
  IF v_candidates <> jsonb_array_length(p_candidate_updates) THEN
    RAISE EXCEPTION 'resolved % of % claimed candidates; rolling back promotion',
      v_candidates, jsonb_array_length(p_candidate_updates);
  END IF;

  INSERT INTO public.notification_resolver_events (
    candidate_id, user_id, event_type, decision, reason,
    winning_candidate_id, policy_version, metadata, resolved_at
  )
  SELECT event_row.candidate_id, event_row.user_id, event_row.event_type,
         event_row.decision, event_row.reason, event_row.winning_candidate_id,
         event_row.policy_version, COALESCE(event_row.metadata, '{}'::JSONB),
         event_row.resolved_at
  FROM jsonb_to_recordset(p_audit_events) AS event_row(
    candidate_id UUID,
    user_id UUID,
    event_type TEXT,
    decision TEXT,
    reason TEXT,
    winning_candidate_id UUID,
    policy_version TEXT,
    metadata JSONB,
    resolved_at TIMESTAMPTZ
  );
  GET DIAGNOSTICS v_audits = ROW_COUNT;
  IF v_audits <> jsonb_array_length(p_audit_events) THEN
    RAISE EXCEPTION 'recorded % of % resolver events; rolling back promotion',
      v_audits, jsonb_array_length(p_audit_events);
  END IF;

  RETURN QUERY SELECT v_promoted, v_candidates, v_audits;
END;
$$;


DROP FUNCTION IF EXISTS public.notification_cadence_class(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.notification_cadence_limit(TEXT);
DROP FUNCTION IF EXISTS public.notification_cadence_policy_version();

DO $check$
DECLARE v_count INTEGER;
BEGIN
  SELECT count(*) INTO v_count FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname IN ('notification_cadence_class', 'notification_cadence_limit', 'notification_cadence_policy_version');
  IF v_count <> 0 THEN RAISE EXCEPTION 'rollback left % cadence v3 helpers behind', v_count; END IF;
  IF pg_get_functiondef('public.enforce_notification_schedule_cadence()'::regprocedure) NOT LIKE '%>= 5%' THEN
    RAISE EXCEPTION 'rollback did not restore the five-per-day trigger';
  END IF;
END
$check$;
