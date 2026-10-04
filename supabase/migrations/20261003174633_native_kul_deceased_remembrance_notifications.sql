-- Native KUL annual remembrance reminders. Consent is explicit and defaults
-- off; candidates are generated only for a recurring death-anniversary event
-- linked to a family member explicitly marked deceased.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wants_family_remembrance_reminders boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS family_remembrance_time text NOT NULL DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS family_remembrance_opt_in_generation integer NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_family_remembrance_time_check,
  ADD CONSTRAINT profiles_family_remembrance_time_check
    CHECK (family_remembrance_time ~ '^(0[8-9]|1[0-9]|2[01]):[0-5][0-9]$'),
  DROP CONSTRAINT IF EXISTS profiles_family_remembrance_generation_check,
  ADD CONSTRAINT profiles_family_remembrance_generation_check
  CHECK (family_remembrance_opt_in_generation >= 0);

ALTER TABLE public.kul_family_members
  ADD COLUMN IF NOT EXISTS remembrance_generation integer NOT NULL DEFAULT 0;
ALTER TABLE public.kul_family_members
  DROP CONSTRAINT IF EXISTS kul_family_members_remembrance_generation_check,
  ADD CONSTRAINT kul_family_members_remembrance_generation_check
    CHECK (remembrance_generation >= 0);

ALTER TABLE public.kul_events
  ADD COLUMN IF NOT EXISTS remembrance_generation integer NOT NULL DEFAULT 0;
ALTER TABLE public.kul_events
  DROP CONSTRAINT IF EXISTS kul_events_remembrance_generation_check,
  ADD CONSTRAINT kul_events_remembrance_generation_check CHECK (remembrance_generation >= 0);

ALTER TABLE public.kuls
  ADD COLUMN IF NOT EXISTS remembrance_generation integer NOT NULL DEFAULT 0;
ALTER TABLE public.kuls
  DROP CONSTRAINT IF EXISTS kuls_remembrance_generation_check,
  ADD CONSTRAINT kuls_remembrance_generation_check CHECK (remembrance_generation >= 0);

-- Keep the PostgreSQL schedule-cadence guard consistent with the resolver's
-- explicit-user-requested classification. This reminder has independent
-- per-feature consent and must not consume the general engagement budget.
CREATE OR REPLACE FUNCTION public.notification_is_budget_exempt(
  p_event_type TEXT,
  p_notification_key TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
SET search_path = ''
AS $$
  SELECT public.canonical_notification_budget_type(p_event_type, p_notification_key) = ANY(ARRAY[
    'security', 'account', 'moderation', 'auth', 'transactional', 'critical_alert',
    'user_reminder', 'custom_reminder', 'explicit_request', 'user_sadhana_reminder',
    'sankalpa_midpoint', 'japa', 'brahma_muhurta', 'sandhya', 'nitya_madhyahn',
    'nitya_sandhya', 'ritual_window', 'pradosha_window', 'pradosha_kala',
    'ekadashi_parana', 'nitya', 'aarti', 'observance', 'festival', 'vrat', 'tithi',
    'observance_series', 'sankranti', 'sanskar_milestone', 'family_remembrance'
  ]::TEXT[]);
$$;

REVOKE ALL ON FUNCTION public.notification_is_budget_exempt(TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notification_is_budget_exempt(TEXT, TEXT)
  TO service_role;

CREATE INDEX IF NOT EXISTS idx_profiles_family_remembrance_opted_in
  ON public.profiles (id)
  WHERE wants_family_remembrance_reminders IS TRUE AND is_deleting IS NOT TRUE;

-- A death-anniversary event must represent a recurring date for a member of
-- this same KUL, and that person must be marked deceased. This protects direct
-- Supabase callers as well as the Native API validation.
CREATE OR REPLACE FUNCTION public.validate_kul_death_anniversary_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type = 'death_anniversary' AND (
    NEW.recurring IS NOT TRUE OR NEW.member_id IS NULL OR NOT EXISTS (
      SELECT 1
      FROM public.kul_family_members AS family_member
      WHERE family_member.id = NEW.member_id
        AND family_member.kul_id = NEW.kul_id
        AND family_member.is_alive IS FALSE
    )
  ) THEN
    RAISE EXCEPTION 'death_anniversary_requires_recurring_deceased_family_member'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_kul_death_anniversary_event() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS validate_kul_death_anniversary_event ON public.kul_events;
CREATE TRIGGER validate_kul_death_anniversary_event
  BEFORE INSERT OR UPDATE OF event_type, recurring, member_id, kul_id
  ON public.kul_events
  FOR EACH ROW EXECUTE FUNCTION public.validate_kul_death_anniversary_event();

-- All invalidation paths converge here. Future rows are cancelled when their
-- source event, KUL membership/calendar, or recipient's opt-in changes. The
-- Dispatcher rechecks the preference at send time as a second independent gate.
CREATE OR REPLACE FUNCTION public.cancel_family_remembrance_for_event(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notification_candidates
  SET status = 'cancelled', decision_reason = 'family_event_changed',
      resolved_at = now(), updated_at = now()
  WHERE event_type = 'family_remembrance'
    AND status IN ('pending', 'resolving')
    AND COALESCE(metadata -> 'event_ids', '[]'::jsonb) ? p_event_id::text;

  UPDATE public.notification_schedule
  SET status = 'cancelled', error = 'family_event_changed'
  WHERE notification_type = 'family_remembrance'
    AND status IN ('pending', 'sending')
    AND COALESCE(metadata -> 'event_ids', '[]'::jsonb) ? p_event_id::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_family_remembrance_for_kul(p_kul_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notification_candidates
  SET status = 'cancelled', decision_reason = 'kul_calendar_changed',
      resolved_at = now(), updated_at = now()
  WHERE event_type = 'family_remembrance'
    AND status IN ('pending', 'resolving')
    AND COALESCE(metadata -> 'kul_ids', '[]'::jsonb) ? p_kul_id::text;

  UPDATE public.notification_schedule
  SET status = 'cancelled', error = 'kul_calendar_changed'
  WHERE notification_type = 'family_remembrance'
    AND status IN ('pending', 'sending')
    AND COALESCE(metadata -> 'kul_ids', '[]'::jsonb) ? p_kul_id::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_family_remembrance_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notification_candidates
  SET status = 'cancelled', decision_reason = 'family_remembrance_opt_in_changed',
      resolved_at = now(), updated_at = now()
  WHERE user_id = p_user_id AND event_type = 'family_remembrance'
    AND status IN ('pending', 'resolving');

  UPDATE public.notification_schedule
  SET status = 'cancelled', error = 'family_remembrance_opt_in_changed'
  WHERE user_id = p_user_id AND notification_type = 'family_remembrance'
    AND status IN ('pending', 'sending');
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_family_remembrance_for_event(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_family_remembrance_for_kul(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_family_remembrance_for_user(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_kul_remembrance_event_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.event_type = 'death_anniversary' THEN
      PERFORM public.cancel_family_remembrance_for_event(OLD.id);
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.event_type = 'death_anniversary' AND (
    NEW.event_type IS DISTINCT FROM OLD.event_type OR
    NEW.member_id IS DISTINCT FROM OLD.member_id OR
    NEW.event_date IS DISTINCT FROM OLD.event_date OR
    NEW.date_system IS DISTINCT FROM OLD.date_system OR
    NEW.masa IS DISTINCT FROM OLD.masa OR
    NEW.paksha IS DISTINCT FROM OLD.paksha OR
    NEW.tithi IS DISTINCT FROM OLD.tithi OR
    NEW.month_system IS DISTINCT FROM OLD.month_system OR
    NEW.masa_is_adhika IS DISTINCT FROM OLD.masa_is_adhika OR
    NEW.recurring IS DISTINCT FROM OLD.recurring OR
    NEW.kul_id IS DISTINCT FROM OLD.kul_id
  ) THEN
    PERFORM public.cancel_family_remembrance_for_event(OLD.id);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_kul_remembrance_event_change() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS handle_kul_remembrance_event_change ON public.kul_events;
CREATE TRIGGER handle_kul_remembrance_event_change
  AFTER UPDATE OR DELETE ON public.kul_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_kul_remembrance_event_change();

CREATE OR REPLACE FUNCTION public.handle_kul_remembrance_member_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    FOR v_event_id IN
      SELECT id FROM public.kul_events
      WHERE member_id = OLD.id AND event_type = 'death_anniversary'
    LOOP
      PERFORM public.cancel_family_remembrance_for_event(v_event_id);
    END LOOP;
    RETURN OLD;
  END IF;

  IF (OLD.is_alive IS FALSE AND NEW.is_alive IS TRUE) OR OLD.kul_id IS DISTINCT FROM NEW.kul_id THEN
    FOR v_event_id IN
      SELECT id FROM public.kul_events
      WHERE member_id = OLD.id AND event_type = 'death_anniversary'
    LOOP
      PERFORM public.cancel_family_remembrance_for_event(v_event_id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_kul_remembrance_member_change() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS handle_kul_remembrance_member_change ON public.kul_family_members;
CREATE TRIGGER handle_kul_remembrance_member_change
  AFTER UPDATE OF is_alive, kul_id OR DELETE ON public.kul_family_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_kul_remembrance_member_change();

CREATE OR REPLACE FUNCTION public.guard_kul_remembrance_generation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_alive IS DISTINCT FROM OLD.is_alive THEN
    NEW.remembrance_generation := OLD.remembrance_generation + 1;
  ELSE
    NEW.remembrance_generation := OLD.remembrance_generation;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_kul_remembrance_generation() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_kul_remembrance_generation ON public.kul_family_members;
CREATE TRIGGER guard_kul_remembrance_generation
  BEFORE UPDATE OF is_alive, remembrance_generation ON public.kul_family_members
  FOR EACH ROW EXECUTE FUNCTION public.guard_kul_remembrance_generation();

CREATE OR REPLACE FUNCTION public.guard_kul_event_remembrance_generation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type IS DISTINCT FROM OLD.event_type OR
     NEW.member_id IS DISTINCT FROM OLD.member_id OR
     NEW.event_date IS DISTINCT FROM OLD.event_date OR
     NEW.date_system IS DISTINCT FROM OLD.date_system OR
     NEW.masa IS DISTINCT FROM OLD.masa OR
     NEW.paksha IS DISTINCT FROM OLD.paksha OR
     NEW.tithi IS DISTINCT FROM OLD.tithi OR
     NEW.month_system IS DISTINCT FROM OLD.month_system OR
     NEW.masa_is_adhika IS DISTINCT FROM OLD.masa_is_adhika OR
     NEW.recurring IS DISTINCT FROM OLD.recurring OR
     NEW.kul_id IS DISTINCT FROM OLD.kul_id THEN
    NEW.remembrance_generation := OLD.remembrance_generation + 1;
  ELSE
    NEW.remembrance_generation := OLD.remembrance_generation;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_kul_event_remembrance_generation() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_kul_event_remembrance_generation ON public.kul_events;
CREATE TRIGGER guard_kul_event_remembrance_generation
  BEFORE UPDATE OF event_type, member_id, event_date, date_system, masa, paksha, tithi,
    month_system, masa_is_adhika, recurring, kul_id, remembrance_generation
  ON public.kul_events
  FOR EACH ROW EXECUTE FUNCTION public.guard_kul_event_remembrance_generation();

CREATE OR REPLACE FUNCTION public.guard_kul_calendar_remembrance_generation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.calendar_latitude IS DISTINCT FROM OLD.calendar_latitude OR
     NEW.calendar_longitude IS DISTINCT FROM OLD.calendar_longitude OR
     NEW.calendar_timezone IS DISTINCT FROM OLD.calendar_timezone OR
     NEW.calendar_month_system IS DISTINCT FROM OLD.calendar_month_system THEN
    NEW.remembrance_generation := OLD.remembrance_generation + 1;
  ELSE
    NEW.remembrance_generation := OLD.remembrance_generation;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_kul_calendar_remembrance_generation() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_kul_calendar_remembrance_generation ON public.kuls;
CREATE TRIGGER guard_kul_calendar_remembrance_generation
  BEFORE UPDATE OF calendar_latitude, calendar_longitude, calendar_timezone,
    calendar_month_system, remembrance_generation
  ON public.kuls
  FOR EACH ROW EXECUTE FUNCTION public.guard_kul_calendar_remembrance_generation();

CREATE OR REPLACE FUNCTION public.handle_kul_remembrance_calendar_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.calendar_latitude IS DISTINCT FROM OLD.calendar_latitude OR
     NEW.calendar_longitude IS DISTINCT FROM OLD.calendar_longitude OR
     NEW.calendar_timezone IS DISTINCT FROM OLD.calendar_timezone OR
     NEW.calendar_month_system IS DISTINCT FROM OLD.calendar_month_system THEN
    PERFORM public.cancel_family_remembrance_for_kul(OLD.id);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_kul_remembrance_calendar_change() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS handle_kul_remembrance_calendar_change ON public.kuls;
CREATE TRIGGER handle_kul_remembrance_calendar_change
  AFTER UPDATE OF calendar_latitude, calendar_longitude, calendar_timezone, calendar_month_system
  ON public.kuls
  FOR EACH ROW EXECUTE FUNCTION public.handle_kul_remembrance_calendar_change();

CREATE OR REPLACE FUNCTION public.handle_kul_remembrance_membership_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notification_candidates
  SET status = 'cancelled', decision_reason = 'kul_membership_left',
      resolved_at = now(), updated_at = now()
  WHERE user_id = OLD.user_id AND event_type = 'family_remembrance'
    AND status IN ('pending', 'resolving')
    AND COALESCE(metadata -> 'kul_ids', '[]'::jsonb) ? OLD.kul_id::text;

  UPDATE public.notification_schedule
  SET status = 'cancelled', error = 'kul_membership_left'
  WHERE user_id = OLD.user_id AND notification_type = 'family_remembrance'
    AND status IN ('pending', 'sending')
    AND COALESCE(metadata -> 'kul_ids', '[]'::jsonb) ? OLD.kul_id::text;
  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_kul_remembrance_membership_delete() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS handle_kul_remembrance_membership_delete ON public.kul_members;
CREATE TRIGGER handle_kul_remembrance_membership_delete
  AFTER DELETE ON public.kul_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_kul_remembrance_membership_delete();

CREATE OR REPLACE FUNCTION public.handle_family_remembrance_preference_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.wants_family_remembrance_reminders IS NOT DISTINCT FROM OLD.wants_family_remembrance_reminders AND
     NEW.family_remembrance_time IS NOT DISTINCT FROM OLD.family_remembrance_time AND
     NEW.timezone IS NOT DISTINCT FROM OLD.timezone AND
     NEW.app_language IS NOT DISTINCT FROM OLD.app_language AND
     NEW.notification_quiet_hours_start IS NOT DISTINCT FROM OLD.notification_quiet_hours_start AND
     NEW.notification_quiet_hours_end IS NOT DISTINCT FROM OLD.notification_quiet_hours_end AND
     NEW.is_deleting IS NOT DISTINCT FROM OLD.is_deleting THEN
    NEW.family_remembrance_opt_in_generation := OLD.family_remembrance_opt_in_generation;
    RETURN NEW;
  END IF;

  IF OLD.wants_family_remembrance_reminders IS DISTINCT FROM NEW.wants_family_remembrance_reminders OR
     OLD.family_remembrance_time IS DISTINCT FROM NEW.family_remembrance_time OR
     OLD.timezone IS DISTINCT FROM NEW.timezone OR
     OLD.app_language IS DISTINCT FROM NEW.app_language OR
     OLD.notification_quiet_hours_start IS DISTINCT FROM NEW.notification_quiet_hours_start OR
     OLD.notification_quiet_hours_end IS DISTINCT FROM NEW.notification_quiet_hours_end OR
     OLD.is_deleting IS DISTINCT FROM NEW.is_deleting THEN
    IF NEW.wants_family_remembrance_reminders IS TRUE THEN
      NEW.family_remembrance_opt_in_generation := OLD.family_remembrance_opt_in_generation + 1;
    END IF;
    PERFORM public.cancel_family_remembrance_for_user(OLD.id);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_family_remembrance_preference_change() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS handle_family_remembrance_preference_change ON public.profiles;
CREATE TRIGGER handle_family_remembrance_preference_change
  BEFORE UPDATE OF wants_family_remembrance_reminders, family_remembrance_time, timezone, app_language,
    notification_quiet_hours_start, notification_quiet_hours_end, is_deleting,
    family_remembrance_opt_in_generation
  ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_family_remembrance_preference_change();

-- Producer reads and candidate insertion are separate requests. Validate the
-- producer's source snapshot at insert time so a concurrent event edit,
-- membership removal, deceased-status change, calendar edit, or opt-in change
-- cannot leave a stale candidate behind after its invalidation trigger ran.
CREATE OR REPLACE FUNCTION public.validate_family_remembrance_candidate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_generation integer;
  v_profile_opted_in boolean;
  v_profile_is_deleting boolean;
  v_profile_reminder_time text;
  v_quiet_hours_start integer;
  v_quiet_hours_end integer;
  v_source jsonb;
  v_source_count integer := 0;
BEGIN
  IF NEW.event_type IS DISTINCT FROM 'family_remembrance' THEN
    RETURN NEW;
  END IF;

  IF jsonb_typeof(NEW.metadata -> 'event_sources') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'family_remembrance_candidate_source_snapshot_required'
      USING ERRCODE = '23514';
  END IF;
  IF jsonb_array_length(NEW.metadata -> 'event_sources') = 0
     OR (NEW.metadata ->> 'local_date') IS DISTINCT FROM NEW.local_date::text
     OR (NEW.metadata ->> 'timezone') IS DISTINCT FROM NEW.timezone THEN
    RAISE EXCEPTION 'family_remembrance_candidate_source_snapshot_required'
      USING ERRCODE = '23514';
  END IF;

  SELECT family_remembrance_opt_in_generation, wants_family_remembrance_reminders,
         is_deleting, family_remembrance_time,
         notification_quiet_hours_start, notification_quiet_hours_end
  INTO v_profile_generation, v_profile_opted_in, v_profile_is_deleting,
       v_profile_reminder_time, v_quiet_hours_start, v_quiet_hours_end
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF NOT FOUND OR v_profile_opted_in IS DISTINCT FROM TRUE OR v_profile_is_deleting IS TRUE
     OR v_profile_generation IS DISTINCT FROM (NEW.metadata ->> 'profile_generation')::integer
     OR v_profile_reminder_time IS DISTINCT FROM (NEW.metadata ->> 'reminder_time')
     OR v_quiet_hours_start IS DISTINCT FROM NULLIF(NEW.metadata ->> 'quiet_hours_start', '')::integer
     OR v_quiet_hours_end IS DISTINCT FROM NULLIF(NEW.metadata ->> 'quiet_hours_end', '')::integer THEN
    RAISE EXCEPTION 'family_remembrance_candidate_requires_current_opt_in'
      USING ERRCODE = '23514';
  END IF;

  FOR v_source IN SELECT value FROM jsonb_array_elements(NEW.metadata -> 'event_sources') AS source(value)
  LOOP
    v_source_count := v_source_count + 1;
    IF v_source ->> 'event_type' IS DISTINCT FROM 'death_anniversary'
       OR NOT (COALESCE(NEW.metadata -> 'event_ids', '[]'::jsonb) ? (v_source ->> 'event_id'))
       OR NOT (COALESCE(NEW.metadata -> 'kul_ids', '[]'::jsonb) ? (v_source ->> 'kul_id'))
       OR NOT (COALESCE(NEW.metadata -> 'member_ids', '[]'::jsonb) ? (v_source ->> 'member_id'))
       OR NOT (COALESCE(NEW.metadata -> 'membership_ids', '[]'::jsonb) ? (v_source ->> 'membership_id'))
       OR NOT EXISTS (
         SELECT 1
         FROM public.kul_events AS family_event
         JOIN public.kul_family_members AS family_member
           ON family_member.id = family_event.member_id
          AND family_member.kul_id = family_event.kul_id
         JOIN public.kul_members AS membership
           ON membership.kul_id = family_event.kul_id
          AND membership.user_id = NEW.user_id
         JOIN public.kuls AS kul ON kul.id = family_event.kul_id
         WHERE family_event.id = (v_source ->> 'event_id')::uuid
           AND family_event.kul_id = (v_source ->> 'kul_id')::uuid
           AND family_event.member_id = (v_source ->> 'member_id')::uuid
           AND membership.id = (v_source ->> 'membership_id')::uuid
           AND family_event.event_type = 'death_anniversary'
           AND family_event.recurring IS TRUE
           AND family_event.remembrance_generation = (v_source ->> 'event_generation')::integer
           AND family_event.event_date::text = (v_source ->> 'event_date')
           AND family_event.date_system = (v_source ->> 'date_system')
           AND family_event.masa IS NOT DISTINCT FROM NULLIF(v_source ->> 'masa', '')::smallint
           AND family_event.paksha IS NOT DISTINCT FROM (v_source ->> 'paksha')
           AND family_event.tithi IS NOT DISTINCT FROM NULLIF(v_source ->> 'tithi', '')::smallint
           AND family_event.month_system IS NOT DISTINCT FROM (v_source ->> 'month_system')
           AND family_event.masa_is_adhika IS NOT DISTINCT FROM (v_source ->> 'masa_is_adhika')::boolean
           AND family_member.is_alive IS FALSE
           AND family_member.remembrance_generation = (v_source ->> 'member_generation')::integer
           AND kul.calendar_latitude IS NOT DISTINCT FROM (v_source #>> '{calendar,latitude}')::double precision
           AND kul.calendar_longitude IS NOT DISTINCT FROM (v_source #>> '{calendar,longitude}')::double precision
           AND kul.calendar_timezone IS NOT DISTINCT FROM (v_source #>> '{calendar,timezone}')
           AND kul.calendar_month_system IS NOT DISTINCT FROM (v_source #>> '{calendar,month_system}')
           AND kul.remembrance_generation = (v_source #>> '{calendar,generation}')::integer
       ) THEN
      RAISE EXCEPTION 'family_remembrance_candidate_source_changed'
        USING ERRCODE = '23514';
    END IF;
  END LOOP;

  IF v_source_count <> jsonb_array_length(NEW.metadata -> 'event_sources') THEN
    RAISE EXCEPTION 'family_remembrance_candidate_source_snapshot_incomplete'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_family_remembrance_candidate() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS validate_family_remembrance_candidate ON public.notification_candidates;
CREATE TRIGGER validate_family_remembrance_candidate
  BEFORE INSERT OR UPDATE OF event_type, metadata, user_id
  ON public.notification_candidates
  FOR EACH ROW EXECUTE FUNCTION public.validate_family_remembrance_candidate();

COMMENT ON COLUMN public.profiles.wants_family_remembrance_reminders IS
  'Explicit opt-in for annual KUL family-remembrance notifications; defaults off.';
COMMENT ON COLUMN public.profiles.family_remembrance_time IS
  'Preferred local delivery time for opted-in KUL family-remembrance notifications (HH:MM).';
COMMENT ON COLUMN public.profiles.family_remembrance_opt_in_generation IS
  'Server-managed candidate generation. Incremented when an enabled remembrance preference or schedule changes, to re-arm semantic candidate uniqueness safely.';
COMMENT ON COLUMN public.kul_family_members.remembrance_generation IS
  'Server-managed version incremented when alive/deceased status changes, so stale or cancelled family-remembrance candidates are never reused.';
COMMENT ON COLUMN public.kul_events.remembrance_generation IS
  'Server-managed version incremented when a family-remembrance event definition changes, so re-edits cannot collide with an older cancelled candidate.';
COMMENT ON COLUMN public.kuls.remembrance_generation IS
  'Server-managed version incremented when a KUL date-calculation reference changes, so restored calendar settings can re-arm a reminder safely.';
