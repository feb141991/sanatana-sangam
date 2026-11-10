-- engagement-cadence-v3: one other nudge a day, with Shloka and the learning slot protected.
--
-- WRITTEN, NOT APPLIED. Founder decisions 2026-11-08: reminders are chosen, not defaulted
-- (separate migrations); at most ONE other nudge a day; Shloka protected; one learning slot a
-- day shared by quiz and dharm_veer; 7 is an outer safety ceiling, not a target.
--
-- What changes
--   Old: every non-exempt type shared ONE allowance of five rows per user per local day, so a
--        busy day starved Shloka (83% of Shloka candidates were suppressed in the 14 days before
--        2026-11-07).
--   New: each non-exempt row belongs to exactly one class and is admitted only while its class has room:
--          shloka    1 per local day, never crowded out by other nudges
--          learning  1 per local day, shared by quiz + dharm_veer (the 10:00 learning slot)
--          other     1 per local day, shared by every remaining non-exempt type
--        plus an outer ceiling of 7 across the three classes (a backstop that normal operation
--        does not reach: the class limits already allow at most 3).
--   Exempt (never counted, never suppressed here) is unchanged for the types the old list covered
--   (security, explicit user reminders, ritual windows, observances, family milestones), PLUS nine
--   person-initiated or receipt rows the Mandali triggers write (connection_*, post_reaction,
--   comment_reaction, mandali_comment, user_blocked, content_reported). Those are another person's
--   action, not a Shoonaya nudge, and they do not carry a local_date, so the resolver could never
--   see them while this database counted them: that disagreement would abort resolver batches.
--
-- ROC pre-flight (AGENTS.md section 4)
--   1. Function overload trap (PGRST203): the three redefined functions keep their EXACT signatures
--      (enforce_notification_schedule_cadence(), validate_notification_schedule_cadence_statement(),
--      persist_notification_candidate_resolution_internal(jsonb, jsonb, jsonb) with the same
--      defaults), so CREATE OR REPLACE replaces them in place and no overload is created. The four
--      new helpers are new names. A self-check at the end counts one definition per name.
--   2. Caller contract: no signature, return shape or grant changes. The resolver and the
--      notification_schedule trigger callers are unchanged. What does change is behaviour: rows the
--      old rule admitted are now refused (reason in notification_cadence_events). The TypeScript
--      resolver (src/lib/notification-resolver.ts) is changed in the same commit and must be
--      deployed WITH or BEFORE this migration is applied, never after: until it is, the resolver
--      still accepts up to five and every surplus makes persist_notification_candidate_resolution
--      raise, which requeues the WHOLE claimed batch (all users) every ten minutes.
--   3. User data / opt-outs: this migration updates no rows and changes no column default.
--   4. Locks: function replacement only; no table DDL, no index build, no data scan.
--   5. Rollback: supabase/rollbacks/20261110100000_one_nudge_a_day_cadence_rollback.sql restores the
--      three original bodies and drops the four helpers.
--
-- Transition: rows already admitted today under the old rule stay (they are never deleted). A user who
-- already has two "other" rows today simply gets no third; the class check looks only at the class
-- being added, so such history cannot block Shloka or the learning slot.

CREATE OR REPLACE FUNCTION public.notification_cadence_policy_version()
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT 'engagement-cadence-v3'::TEXT;
$$;

-- The ONLY place the daily limits live in the database. Unknown scopes return 0 so a typo fails closed.
-- src/lib/notification-cadence-policy.ts mirrors these numbers; the parity test fails if they differ.
CREATE OR REPLACE FUNCTION public.notification_cadence_limit(p_scope TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE p_scope
    WHEN 'ceiling' THEN 7
    WHEN 'shloka' THEN 1
    WHEN 'learning' THEN 1
    WHEN 'other' THEN 1
    ELSE 0
  END;
$$;

-- 'exempt' | 'shloka' | 'learning' | 'other'.
CREATE OR REPLACE FUNCTION public.notification_cadence_class(
  p_event_type TEXT,
  p_notification_key TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN public.notification_is_budget_exempt(p_event_type, p_notification_key) THEN 'exempt'
    WHEN canonical.event_type = ANY(ARRAY[
      'connection_request', 'connection_accepted', 'connection_rejected', 'connection_cancelled',
      'post_reaction', 'comment_reaction', 'mandali_comment', 'user_blocked', 'content_reported'
    ]::TEXT[]) THEN 'exempt'
    WHEN canonical.event_type = 'shloka' THEN 'shloka'
    WHEN canonical.event_type = ANY(ARRAY['quiz', 'dharm_veer']::TEXT[]) THEN 'learning'
    ELSE 'other'
  END
  FROM (
    SELECT public.canonical_notification_budget_type(p_event_type, p_notification_key) AS event_type
  ) AS canonical;
$$;

REVOKE ALL ON FUNCTION public.notification_cadence_policy_version() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notification_cadence_limit(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notification_cadence_class(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notification_cadence_policy_version() TO service_role;
GRANT EXECUTE ON FUNCTION public.notification_cadence_limit(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.notification_cadence_class(TEXT, TEXT) TO service_role;

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
  v_existing_same_class INTEGER := 0;
  v_cadence_class TEXT;
  v_block_reason TEXT;
  v_requested_at TIMESTAMPTZ;
  v_slot TIMESTAMPTZ;
  v_conflict_at TIMESTAMPTZ;
  v_local TIMESTAMP;
  v_local_minute INTEGER;
  v_attempt INTEGER;
  v_found_slot BOOLEAN := FALSE;
  v_shift_reason TEXT;
BEGIN
  v_cadence_class := public.notification_cadence_class(NEW.notification_type, NEW.notification_key);
  IF v_cadence_class = 'exempt' THEN
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
      local_date, decision, reason, requested_at, policy_version
    ) VALUES (
      NEW.user_id, NEW.notification_type,
      public.canonical_notification_budget_type(NEW.notification_type, NEW.notification_key),
      NEW.notification_key, v_local_date,
      'duplicate', 'idempotency_key_already_admitted', v_requested_at,
      public.notification_cadence_policy_version()
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
  -- engagement-cadence-v3. The old rule was one shared allowance of five.
  -- Now a row is admitted only if its own class still has room, and the
  -- outer ceiling (see notification_cadence_limit) has not been reached:
  --   shloka   one per local day, never crowded out by other nudges;
  --   learning one per local day, shared by quiz and dharm_veer;
  --   other    one per local day, shared by every remaining non-exempt type.
  -- Exempt classes (explicit user reminders, ritual windows, observances,
  -- security, person-initiated Mandali rows) never reach this point.
  SELECT count(DISTINCT counted.dedupe_key)::INTEGER,
         count(DISTINCT counted.dedupe_key) FILTER (
           WHERE counted.cadence_class = v_cadence_class
         )::INTEGER
  INTO v_existing_budgeted, v_existing_same_class
  FROM (
    SELECT history.dedupe_key,
           public.notification_cadence_class(history.event_type, history.notification_key) AS cadence_class
    FROM history
    WHERE history.local_date = v_local_date
  ) AS counted
  WHERE counted.cadence_class <> 'exempt';

  v_block_reason := CASE
    WHEN v_existing_budgeted >= public.notification_cadence_limit('ceiling')
      THEN 'daily_ceiling_reached'
    WHEN v_existing_same_class >= public.notification_cadence_limit(v_cadence_class)
      THEN CASE v_cadence_class
        WHEN 'shloka' THEN 'shloka_slot_reached'
        WHEN 'learning' THEN 'learning_slot_reached'
        ELSE 'other_nudge_reached'
      END
    ELSE NULL
  END;

  IF v_block_reason IS NOT NULL THEN
    INSERT INTO public.notification_cadence_events (
      user_id, notification_type, canonical_type, notification_key,
      local_date, decision, reason, requested_at, policy_version
    ) VALUES (
      NEW.user_id, NEW.notification_type,
      public.canonical_notification_budget_type(NEW.notification_type, NEW.notification_key),
      NEW.notification_key, v_local_date, 'suppressed', v_block_reason, NEW.send_at,
      public.notification_cadence_policy_version()
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
      local_date, decision, reason, requested_at, policy_version
    ) VALUES (
      NEW.user_id, NEW.notification_type,
      public.canonical_notification_budget_type(NEW.notification_type, NEW.notification_key),
      NEW.notification_key, v_local_date, 'suppressed', 'no_safe_same_day_slot', NEW.send_at,
      public.notification_cadence_policy_version()
    ) ON CONFLICT (user_id, notification_key, decision, policy_version) DO NOTHING;
    RETURN NULL;
  END IF;

  NEW.send_at := v_slot;
  NEW.metadata := coalesce(NEW.metadata, '{}'::JSONB)
    || jsonb_build_object('timezone', v_timezone, 'local_date', v_local_date::TEXT);
  IF v_slot > v_requested_at THEN
    NEW.metadata := NEW.metadata || jsonb_build_object(
      'cadence_policy_version', public.notification_cadence_policy_version(),
      'cadence_delay_minutes', greatest(0, round(extract(epoch FROM (v_slot - v_requested_at)) / 60)::INTEGER)
    );
  END IF;

  INSERT INTO public.notification_cadence_events (
    user_id, notification_type, canonical_type, notification_key,
    local_date, decision, reason, requested_at, scheduled_at, metadata, policy_version
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
    ),
    public.notification_cadence_policy_version()
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
  v_same_class_count INTEGER := 0;
BEGIN
  FOR v_group IN
    SELECT DISTINCT inserted.user_id,
      public.try_parse_notification_date(inserted.metadata ->> 'local_date') AS local_date,
      public.notification_cadence_class(inserted.notification_type, inserted.notification_key) AS cadence_class
    FROM inserted_rows AS inserted
    WHERE public.notification_cadence_class(inserted.notification_type, inserted.notification_key) <> 'exempt'
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
    -- Only the class this statement inserted into is held to its limit, so
    -- rows admitted under the old five-per-day rule cannot make an unrelated
    -- insert fail while they are still in today's history.
    SELECT count(DISTINCT counted.dedupe_key)::INTEGER,
           count(DISTINCT counted.dedupe_key) FILTER (
             WHERE counted.cadence_class = v_group.cadence_class
           )::INTEGER
    INTO v_budgeted_count, v_same_class_count
    FROM (
      SELECT history.dedupe_key,
             public.notification_cadence_class(history.event_type, history.notification_key) AS cadence_class
      FROM history
      WHERE history.local_date = v_group.local_date
    ) AS counted
    WHERE counted.cadence_class <> 'exempt';

    IF v_budgeted_count > public.notification_cadence_limit('ceiling')
      OR v_same_class_count > public.notification_cadence_limit(v_group.cadence_class) THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = 'notification_cadence_conflict',
        DETAIL = format(
          'user_id=%s local_date=%s class=%s class_total=%s total=%s',
          v_group.user_id, v_group.local_date, v_group.cadence_class,
          v_same_class_count, v_budgeted_count
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
        AND public.notification_cadence_class(inserted.notification_type, inserted.notification_key) <> 'exempt'
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
  v_existing_shloka INTEGER := 0;
  v_existing_learning INTEGER := 0;
  v_existing_other INTEGER := 0;
  v_new_shloka INTEGER := 0;
  v_new_learning INTEGER := 0;
  v_new_other INTEGER := 0;
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
    WHERE public.notification_cadence_class(r.notification_type, r.notification_key) <> 'exempt'
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
    WHERE public.notification_cadence_class(r.notification_type, r.notification_key) <> 'exempt'
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
    SELECT count(DISTINCT counted.dedupe_key)::INTEGER,
           count(DISTINCT counted.dedupe_key) FILTER (WHERE counted.cadence_class = 'shloka')::INTEGER,
           count(DISTINCT counted.dedupe_key) FILTER (WHERE counted.cadence_class = 'learning')::INTEGER,
           count(DISTINCT counted.dedupe_key) FILTER (WHERE counted.cadence_class = 'other')::INTEGER
    INTO v_existing_budgeted, v_existing_shloka, v_existing_learning, v_existing_other
    FROM (
      SELECT history.dedupe_key,
             public.notification_cadence_class(history.event_type, history.notification_key) AS cadence_class
      FROM history
      WHERE history.local_date = v_candidate_date
    ) AS counted
    WHERE counted.cadence_class <> 'exempt';

    SELECT count(DISTINCT r.notification_key)::INTEGER,
           count(DISTINCT r.notification_key) FILTER (
             WHERE public.notification_cadence_class(r.notification_type, r.notification_key) = 'shloka'
           )::INTEGER,
           count(DISTINCT r.notification_key) FILTER (
             WHERE public.notification_cadence_class(r.notification_type, r.notification_key) = 'learning'
           )::INTEGER,
           count(DISTINCT r.notification_key) FILTER (
             WHERE public.notification_cadence_class(r.notification_type, r.notification_key) = 'other'
           )::INTEGER
    INTO v_new_budgeted, v_new_shloka, v_new_learning, v_new_other
    FROM jsonb_to_recordset(p_schedule_rows) AS r(
      user_id UUID, notification_type TEXT, title TEXT, body TEXT,
      send_at TIMESTAMPTZ, notification_key TEXT, metadata JSONB
    )
    WHERE r.user_id = v_group.user_id
      AND public.try_parse_notification_date(r.metadata ->> 'local_date') = v_candidate_date
      AND public.notification_cadence_class(r.notification_type, r.notification_key) <> 'exempt'
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

    -- A class is checked only when this batch adds to it, so legacy rows from
    -- before engagement-cadence-v3 cannot stall an unrelated candidate.
    IF v_existing_budgeted + v_new_budgeted > public.notification_cadence_limit('ceiling')
      OR (v_new_shloka > 0
          AND v_existing_shloka + v_new_shloka > public.notification_cadence_limit('shloka'))
      OR (v_new_learning > 0
          AND v_existing_learning + v_new_learning > public.notification_cadence_limit('learning'))
      OR (v_new_other > 0
          AND v_existing_other + v_new_other > public.notification_cadence_limit('other')) THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = 'notification_cadence_conflict',
        DETAIL = format(
          'user_id=%s local_date=%s existing=%s/%s/%s/%s requested=%s/%s/%s/%s (total/shloka/learning/other)',
          v_group.user_id, v_candidate_date,
          v_existing_budgeted, v_existing_shloka, v_existing_learning, v_existing_other,
          v_new_budgeted, v_new_shloka, v_new_learning, v_new_other
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

-- Self-check: exactly one definition of each redefined or new function (no overload), and the
-- classifier answers the cases this change exists for. Any failure rolls the migration back.
DO $check$
DECLARE
  v_name TEXT;
  v_count INTEGER;
BEGIN
  FOREACH v_name IN ARRAY ARRAY[
    'enforce_notification_schedule_cadence',
    'validate_notification_schedule_cadence_statement',
    'persist_notification_candidate_resolution_internal',
    'notification_cadence_class',
    'notification_cadence_limit',
    'notification_cadence_policy_version'
  ] LOOP
    SELECT count(*) INTO v_count
    FROM pg_proc AS p JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = v_name;
    IF v_count <> 1 THEN
      RAISE EXCEPTION 'cadence v3 self-check: % has % definitions, expected 1', v_name, v_count;
    END IF;
  END LOOP;

  IF public.notification_cadence_class('shloka', NULL) <> 'shloka'
    OR public.notification_cadence_class('streak', NULL) <> 'shloka'
    OR public.notification_cadence_class('quiz', NULL) <> 'learning'
    OR public.notification_cadence_class('dharm_veer', NULL) <> 'learning'
    OR public.notification_cadence_class('mood', NULL) <> 'other'
    OR public.notification_cadence_class('daily_digest', NULL) <> 'other'
    OR public.notification_cadence_class('japa', NULL) <> 'exempt'
    OR public.notification_cadence_class('festival', NULL) <> 'exempt'
    OR public.notification_cadence_class('post_reaction', NULL) <> 'exempt'
    OR public.notification_cadence_class('general', 'mandali_comment:1') <> 'exempt'
    OR public.notification_cadence_class('general', 'mood-evening:2026-11-10') <> 'other' THEN
    RAISE EXCEPTION 'cadence v3 self-check: classifier answered an unexpected class';
  END IF;

  IF public.notification_cadence_limit('ceiling') <> 7
    OR public.notification_cadence_limit('shloka') <> 1
    OR public.notification_cadence_limit('learning') <> 1
    OR public.notification_cadence_limit('other') <> 1
    OR public.notification_cadence_limit('typo') <> 0 THEN
    RAISE EXCEPTION 'cadence v3 self-check: limits are not 7/1/1/1 with a fail-closed default';
  END IF;
END
$check$;
