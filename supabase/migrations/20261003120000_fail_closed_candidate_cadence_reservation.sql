-- Do not mark a resolver candidate accepted when the cadence trigger skipped
-- its schedule row because there was no safe same-day delivery slot.
--
-- The internal function remains the single transaction owner for schedule,
-- candidate, and resolver-event writes. This wrapper checks its inserted-row
-- count against the distinct, genuinely new schedule keys in the request. A
-- mismatch raises inside the same transaction so all candidate/audit changes
-- roll back and the caller can return claimed candidates to pending.
CREATE OR REPLACE FUNCTION public.persist_notification_candidate_resolution_checked(
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
  v_expected_promoted INTEGER := 0;
  v_promoted INTEGER := 0;
  v_candidates INTEGER := 0;
  v_audits INTEGER := 0;
BEGIN
  SELECT count(*)::INTEGER
  INTO v_expected_promoted
  FROM (
    SELECT DISTINCT r.user_id, r.notification_key
    FROM jsonb_to_recordset(p_schedule_rows) AS r(
      user_id UUID,
      notification_key TEXT
    )
    WHERE nullif(btrim(r.notification_key), '') IS NOT NULL
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
      )
  ) AS expected_rows;

  SELECT result.promoted_count, result.candidate_count, result.audit_count
  INTO v_promoted, v_candidates, v_audits
  FROM public.persist_notification_candidate_resolution_internal(
    p_schedule_rows, p_candidate_updates, p_audit_events
  ) AS result;

  IF v_promoted <> v_expected_promoted THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'notification_cadence_candidate_reservation_mismatch',
      DETAIL = format(
        'expected_new_schedule_rows=%s inserted_schedule_rows=%s',
        v_expected_promoted, v_promoted
      );
  END IF;

  RETURN QUERY SELECT v_promoted, v_candidates, v_audits;
END;
$$;

REVOKE ALL ON FUNCTION public.persist_notification_candidate_resolution_checked(JSONB, JSONB, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.persist_notification_candidate_resolution_checked(JSONB, JSONB, JSONB)
  TO service_role;

CREATE OR REPLACE FUNCTION public.persist_notification_candidate_resolution(
  p_schedule_rows JSONB DEFAULT '[]'::JSONB,
  p_candidate_updates JSONB DEFAULT '[]'::JSONB,
  p_audit_events JSONB DEFAULT '[]'::JSONB
)
RETURNS TABLE(promoted_count INTEGER, candidate_count INTEGER, audit_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.persist_notification_candidate_resolution_checked(
    p_schedule_rows, p_candidate_updates, p_audit_events
  );
END;
$$;

REVOKE ALL ON FUNCTION public.persist_notification_candidate_resolution(JSONB, JSONB, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.persist_notification_candidate_resolution(JSONB, JSONB, JSONB)
  TO service_role;

CREATE OR REPLACE FUNCTION public.persist_notification_candidate_resolution_with_lock(
  p_owner_id UUID,
  p_schedule_rows JSONB DEFAULT '[]'::JSONB,
  p_candidate_updates JSONB DEFAULT '[]'::JSONB,
  p_audit_events JSONB DEFAULT '[]'::JSONB
)
RETURNS TABLE(promoted_count INTEGER, candidate_count INTEGER, audit_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.notification_resolver_lock
    WHERE singleton_id = 1
      AND owner_id = p_owner_id
      AND lease_expires_at > clock_timestamp()
  ) THEN
    RAISE EXCEPTION 'notification_resolver_lock_lost';
  END IF;

  RETURN QUERY
  SELECT * FROM public.persist_notification_candidate_resolution_checked(
    p_schedule_rows, p_candidate_updates, p_audit_events
  );
END;
$$;

REVOKE ALL ON FUNCTION public.persist_notification_candidate_resolution_with_lock(UUID, JSONB, JSONB, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.persist_notification_candidate_resolution_with_lock(UUID, JSONB, JSONB, JSONB)
  TO service_role;
