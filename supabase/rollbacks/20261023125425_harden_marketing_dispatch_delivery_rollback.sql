-- Rollback for 20261023125425_harden_marketing_dispatch_delivery.sql
-- Reverts marketing dispatch delivery hardening to pre-migration baseline.

-- 1. Drop approval RPC (does not alter stored data)
DROP FUNCTION IF EXISTS public.approve_marketing_campaign(UUID, TEXT, TIMESTAMPTZ, JSONB);

-- 2. Drop reconciliation RPC
DROP FUNCTION IF EXISTS public.reconcile_marketing_dispatch(UUID, TEXT, TEXT);

-- 3. Drop resolution RPC
DROP FUNCTION IF EXISTS public.resolve_marketing_dispatch(UUID, UUID, TEXT, TEXT, TEXT, TEXT);

-- 4. Restore original claim_marketing_dispatches implementation
CREATE OR REPLACE FUNCTION public.claim_marketing_dispatches(
  p_campaign_id UUID,
  p_variant_id UUID,
  p_channel TEXT,
  p_limit INT DEFAULT 100,
  p_lease_minutes INT DEFAULT 15
)
RETURNS SETOF public.marketing_dispatches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH to_claim AS (
    SELECT id
    FROM public.marketing_dispatches
    WHERE campaign_id = p_campaign_id
      AND variant_id = p_variant_id
      AND channel = p_channel
      AND (
        status = 'pending'
        OR (status = 'claimed' AND claimed_at <= NOW() - (p_lease_minutes || ' minutes')::INTERVAL)
      )
    ORDER BY created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.marketing_dispatches d
  SET status = 'claimed',
      claimed_at = NOW(),
      attempt_count = attempt_count + 1
  FROM to_claim
  WHERE d.id = to_claim.id
  RETURNING d.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_marketing_dispatches(UUID, UUID, TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_marketing_dispatches(UUID, UUID, TEXT, INT, INT) TO service_role;

-- 5. Drop manual reconciliation index
DROP INDEX IF EXISTS public.idx_marketing_dispatches_manual_reconciliation;

-- 6. Revert statuses not supported in original check constraint
UPDATE public.marketing_dispatches
SET status = 'failed'
WHERE status IN ('retryable', 'outcome_unknown');

ALTER TABLE public.marketing_dispatches
  DROP CONSTRAINT IF EXISTS marketing_dispatches_status_check;

ALTER TABLE public.marketing_dispatches
  ADD CONSTRAINT marketing_dispatches_status_check
  CHECK (status IN ('pending', 'claimed', 'sent', 'failed', 'suppressed'));

-- 7. Drop added columns
ALTER TABLE public.marketing_dispatches
  DROP COLUMN IF EXISTS claim_token,
  DROP COLUMN IF EXISTS provider_idempotency_expires_at;
