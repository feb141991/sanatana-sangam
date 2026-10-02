-- Restore the direct delegation behavior. This rollback also reopens the
-- accepted-without-schedule edge case fixed by the forward migration.
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
  SELECT * FROM public.persist_notification_candidate_resolution_internal(
    p_schedule_rows, p_candidate_updates, p_audit_events
  );
END;
$$;

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
  SELECT * FROM public.persist_notification_candidate_resolution_internal(
    p_schedule_rows, p_candidate_updates, p_audit_events
  );
END;
$$;

DROP FUNCTION IF EXISTS public.persist_notification_candidate_resolution_checked(JSONB, JSONB, JSONB);
