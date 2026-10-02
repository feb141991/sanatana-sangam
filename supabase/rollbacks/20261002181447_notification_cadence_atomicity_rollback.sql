-- Restore the pre-cadence atomic persistence function and remove resolver leases.
DROP FUNCTION IF EXISTS public.update_seva_tier_and_queue_notification(uuid, integer, text, text, text, text, text, timestamptz, jsonb);
DROP TRIGGER IF EXISTS notification_schedule_cadence_guard ON public.notification_schedule;
DROP TRIGGER IF EXISTS notification_schedule_cadence_statement_guard ON public.notification_schedule;
DROP FUNCTION IF EXISTS public.enforce_notification_schedule_cadence();
DROP FUNCTION IF EXISTS public.validate_notification_schedule_cadence_statement();
DROP TABLE IF EXISTS public.notification_cadence_events;

CREATE OR REPLACE FUNCTION public.persist_notification_candidate_resolution(
  p_schedule_rows jsonb DEFAULT '[]'::jsonb,
  p_candidate_updates jsonb DEFAULT '[]'::jsonb,
  p_audit_events jsonb DEFAULT '[]'::jsonb
)
RETURNS TABLE(promoted_count integer, candidate_count integer, audit_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promoted integer := 0;
  v_candidates integer := 0;
  v_audits integer := 0;
BEGIN
  IF jsonb_typeof(p_schedule_rows) <> 'array'
    OR jsonb_typeof(p_candidate_updates) <> 'array'
    OR jsonb_typeof(p_audit_events) <> 'array' THEN
    RAISE EXCEPTION 'resolution payloads must be JSON arrays';
  END IF;

  INSERT INTO public.notification_schedule (
    user_id, notification_type, title, body, send_at, status,
    notification_key, metadata
  )
  SELECT r.user_id, r.notification_type, r.title, r.body, r.send_at,
         'pending', r.notification_key, COALESCE(r.metadata, '{}'::jsonb)
  FROM jsonb_to_recordset(p_schedule_rows) AS r(
    user_id uuid,
    notification_type text,
    title text,
    body text,
    send_at timestamptz,
    notification_key text,
    metadata jsonb
  )
  ON CONFLICT (user_id, notification_key) DO NOTHING;
  GET DIAGNOSTICS v_promoted = ROW_COUNT;

  UPDATE public.notification_candidates AS candidate
  SET status = update_row.status,
      decision_reason = update_row.reason,
      resolved_at = update_row.resolved_at,
      claimed_at = NULL,
      updated_at = now()
  FROM jsonb_to_recordset(p_candidate_updates) AS update_row(
    candidate_id uuid,
    status text,
    reason text,
    resolved_at timestamptz
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
         event_row.policy_version, COALESCE(event_row.metadata, '{}'::jsonb),
         event_row.resolved_at
  FROM jsonb_to_recordset(p_audit_events) AS event_row(
    candidate_id uuid,
    user_id uuid,
    event_type text,
    decision text,
    reason text,
    winning_candidate_id uuid,
    policy_version text,
    metadata jsonb,
    resolved_at timestamptz
  );
  GET DIAGNOSTICS v_audits = ROW_COUNT;
  IF v_audits <> jsonb_array_length(p_audit_events) THEN
    RAISE EXCEPTION 'recorded % of % resolver events; rolling back promotion',
      v_audits, jsonb_array_length(p_audit_events);
  END IF;

  RETURN QUERY SELECT v_promoted, v_candidates, v_audits;
END;
$$;

REVOKE ALL ON FUNCTION public.persist_notification_candidate_resolution(jsonb, jsonb, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.persist_notification_candidate_resolution(jsonb, jsonb, jsonb)
  TO service_role;

DROP FUNCTION IF EXISTS public.persist_notification_candidate_resolution_with_lock(uuid, jsonb, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.persist_notification_candidate_resolution_internal(jsonb, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.notification_cadence_safe_timezone(text);
DROP FUNCTION IF EXISTS public.notification_is_budget_exempt(text, text);
DROP FUNCTION IF EXISTS public.canonical_notification_budget_type(text, text);
DROP FUNCTION IF EXISTS public.try_parse_notification_date(text);
DROP FUNCTION IF EXISTS public.release_notification_resolver_lock(uuid);
DROP FUNCTION IF EXISTS public.try_acquire_notification_resolver_lock(uuid, integer);
DROP TABLE IF EXISTS public.notification_resolver_lock;

-- The obsolete global notification_key index on notification_schedule is not
-- restored: it conflicts with the established per-user idempotency contract.
