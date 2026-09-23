-- Migration: 20260923150000_notification_candidates_claim_and_persistence.sql
-- Prompt 3: Resolver persistence and schedule promotion
-- Adds claimed_at to notification_candidates, updates status check constraint,
-- and creates atomic claim RPC function with lease recovery and FOR UPDATE SKIP LOCKED.

-- 1. Add claimed_at column to notification_candidates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_candidates' AND column_name = 'claimed_at'
  ) THEN
    ALTER TABLE public.notification_candidates ADD COLUMN claimed_at TIMESTAMPTZ;
  END IF;
END $$;

-- 2. Update status check constraint to include 'resolving' and 'deferred'
ALTER TABLE public.notification_candidates
  DROP CONSTRAINT IF EXISTS notification_candidates_status_check;

ALTER TABLE public.notification_candidates
  ADD CONSTRAINT notification_candidates_status_check
  CHECK (status IN ('pending', 'resolving', 'accepted', 'suppressed', 'expired', 'cancelled', 'deferred'));

-- 3. Add index for pending and resolving candidates with lease recovery
CREATE INDEX IF NOT EXISTS idx_notification_candidates_resolving_lease
  ON public.notification_candidates (status, claimed_at)
  WHERE status = 'resolving';

-- 4. Create atomic claim RPC function
CREATE OR REPLACE FUNCTION public.claim_pending_notification_candidates(
  p_batch_limit INT DEFAULT 200,
  p_lease_minutes INT DEFAULT 10,
  p_event_type TEXT DEFAULT NULL
)
RETURNS SETOF public.notification_candidates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark overdue pending candidates (expires_at <= NOW()) as expired
  UPDATE public.notification_candidates
  SET status = 'expired',
      decision_reason = 'window_expired',
      resolved_at = NOW(),
      updated_at = NOW()
  WHERE status = 'pending'
    AND expires_at <= NOW()
    AND (p_event_type IS NULL OR event_type = p_event_type);

  RETURN QUERY
  WITH to_claim AS (
    SELECT id
    FROM public.notification_candidates
    WHERE (
      -- Genuinely pending candidates ready for resolution (scheduled within next 10 minutes or past due)
      (status = 'pending' AND scheduled_for <= NOW() + INTERVAL '10 minutes' AND expires_at > NOW())
      OR
      -- Stale resolving candidates where worker lease expired (> p_lease_minutes ago)
      (status = 'resolving' AND (claimed_at IS NULL OR claimed_at <= NOW() - (p_lease_minutes || ' minutes')::INTERVAL))
    )
      AND (p_event_type IS NULL OR event_type = p_event_type)
    ORDER BY priority ASC, scheduled_for ASC
    LIMIT p_batch_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.notification_candidates nc
  SET status = 'resolving',
      claimed_at = NOW(),
      updated_at = NOW()
  FROM to_claim
  WHERE nc.id = to_claim.id
  RETURNING nc.*;
END;
$$;

-- 5. Permissions: service-role only, revoke from public/anon/authenticated
REVOKE ALL ON FUNCTION public.claim_pending_notification_candidates(INT, INT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pending_notification_candidates(INT, INT, TEXT) TO service_role;
