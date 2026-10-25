-- Harden the marketing pipeline's irreversible boundaries.
--
-- 1. A worker can finalize only the exact claim it owns.
-- 2. Retryable provider failures are distinct from definitive failures.
-- 3. An expired WhatsApp claim is quarantined as outcome_unknown because the
--    provider does not offer a request idempotency key for this integration.
-- 4. Campaign approval and all variant approval stamps commit atomically.

ALTER TABLE public.marketing_dispatches
  ADD COLUMN IF NOT EXISTS claim_token UUID NULL,
  ADD COLUMN IF NOT EXISTS provider_idempotency_expires_at TIMESTAMPTZ NULL;

ALTER TABLE public.marketing_dispatches
  DROP CONSTRAINT IF EXISTS marketing_dispatches_status_check;

-- The old application described every failed row as retryable. Preserve that
-- operational meaning during the status-model upgrade. This must run after the old
-- status CHECK is removed because that constraint did not allow retryable yet.
UPDATE public.marketing_dispatches
SET status = 'retryable',
    provider_idempotency_expires_at = NOW() + INTERVAL '23 hours'
WHERE status = 'failed';

-- Preserve a bounded retry opportunity for an email already in flight when this
-- migration lands. The provider documents a 24-hour key window; one hour is kept as
-- operational margin rather than attempting a send at the boundary.
UPDATE public.marketing_dispatches
SET provider_idempotency_expires_at = NOW() + INTERVAL '23 hours'
WHERE channel = 'email'
  AND status = 'claimed'
  AND provider_idempotency_expires_at IS NULL;

ALTER TABLE public.marketing_dispatches
  ADD CONSTRAINT marketing_dispatches_status_check
  CHECK (status IN (
    'pending',
    'claimed',
    'sent',
    'retryable',
    'outcome_unknown',
    'failed',
    'suppressed'
  ));

CREATE INDEX IF NOT EXISTS idx_marketing_dispatches_manual_reconciliation
  ON public.marketing_dispatches(campaign_id, status, updated_at)
  WHERE status = 'outcome_unknown';

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
  IF p_channel NOT IN ('email', 'whatsapp') THEN
    RAISE EXCEPTION 'unsupported marketing channel';
  END IF;
  IF p_limit < 1 OR p_limit > 500 THEN
    RAISE EXCEPTION 'p_limit must be between 1 and 500';
  END IF;
  IF p_lease_minutes < 1 OR p_lease_minutes > 1440 THEN
    RAISE EXCEPTION 'p_lease_minutes must be between 1 and 1440';
  END IF;

  -- A crashed WhatsApp worker may have sent successfully before losing its DB
  -- response. Re-sending would risk a duplicate, so require human/provider
  -- reconciliation rather than automatically reclaiming the row.
  IF p_channel = 'whatsapp' THEN
    UPDATE public.marketing_dispatches
    SET status = 'outcome_unknown',
        claim_token = NULL,
        last_error_code = 'claim_expired_after_provider_attempt'
    WHERE campaign_id = p_campaign_id
      AND variant_id = p_variant_id
      AND channel = p_channel
      AND status = 'claimed'
      AND claimed_at <= NOW() - make_interval(mins => p_lease_minutes);
  END IF;

  -- Email retries are safe only while the original provider idempotency key remains
  -- inside its documented window. Afterwards, require provider-side reconciliation.
  IF p_channel = 'email' THEN
    UPDATE public.marketing_dispatches
    SET status = 'outcome_unknown',
        claim_token = NULL,
        last_error_code = 'provider_idempotency_window_expired'
    WHERE campaign_id = p_campaign_id
      AND variant_id = p_variant_id
      AND channel = p_channel
      AND status IN ('claimed', 'retryable')
      AND provider_idempotency_expires_at <= NOW();
  END IF;

  RETURN QUERY
  WITH to_claim AS (
    SELECT id
    FROM public.marketing_dispatches
    WHERE campaign_id = p_campaign_id
      AND variant_id = p_variant_id
      AND channel = p_channel
      AND (
        status IN ('pending', 'retryable')
        OR (
          p_channel = 'email'
          AND status = 'claimed'
          AND provider_idempotency_expires_at > NOW()
          AND claimed_at <= NOW() - make_interval(mins => p_lease_minutes)
        )
      )
    ORDER BY created_at ASC, id ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.marketing_dispatches d
  SET status = 'claimed',
      claimed_at = NOW(),
      claim_token = gen_random_uuid(),
      provider_idempotency_expires_at = CASE
        WHEN d.channel = 'email'
          THEN COALESCE(d.provider_idempotency_expires_at, NOW() + INTERVAL '23 hours')
        ELSE NULL
      END,
      attempt_count = attempt_count + 1
  FROM to_claim
  WHERE d.id = to_claim.id
  RETURNING d.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_marketing_dispatches(UUID, UUID, TEXT, INT, INT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_marketing_dispatches(UUID, UUID, TEXT, INT, INT)
  TO service_role;

CREATE OR REPLACE FUNCTION public.resolve_marketing_dispatch(
  p_dispatch_id UUID,
  p_claim_token UUID,
  p_status TEXT,
  p_provider TEXT DEFAULT NULL,
  p_provider_message_id TEXT DEFAULT NULL,
  p_error_code TEXT DEFAULT NULL
)
RETURNS SETOF public.marketing_dispatches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('sent', 'retryable', 'outcome_unknown', 'failed', 'suppressed') THEN
    RAISE EXCEPTION 'unsupported marketing dispatch resolution';
  END IF;
  IF p_status = 'sent' AND NULLIF(BTRIM(p_provider_message_id), '') IS NULL THEN
    RAISE EXCEPTION 'sent resolution requires provider_message_id';
  END IF;

  RETURN QUERY
  UPDATE public.marketing_dispatches AS dispatch
  SET status = p_status,
      provider = COALESCE(NULLIF(BTRIM(p_provider), ''), provider),
      provider_message_id = CASE
        WHEN p_status = 'sent' THEN p_provider_message_id
        ELSE provider_message_id
      END,
      last_error_code = CASE WHEN p_status = 'sent' THEN NULL ELSE p_error_code END,
      sent_at = CASE WHEN p_status = 'sent' THEN NOW() ELSE sent_at END,
      claim_token = NULL
  WHERE dispatch.id = p_dispatch_id
    AND dispatch.status = 'claimed'
    AND dispatch.claim_token = p_claim_token
  RETURNING dispatch.*;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_marketing_dispatch(UUID, UUID, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_marketing_dispatch(UUID, UUID, TEXT, TEXT, TEXT, TEXT)
  TO service_role;

CREATE OR REPLACE FUNCTION public.reconcile_marketing_dispatch(
  p_dispatch_id UUID,
  p_resolution TEXT,
  p_provider_message_id TEXT DEFAULT NULL
)
RETURNS SETOF public.marketing_dispatches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_resolution NOT IN ('confirmed_sent', 'confirmed_not_sent') THEN
    RAISE EXCEPTION 'unsupported reconciliation resolution';
  END IF;
  IF p_resolution = 'confirmed_sent'
     AND NULLIF(BTRIM(p_provider_message_id), '') IS NULL THEN
    RAISE EXCEPTION 'confirmed_sent requires provider_message_id';
  END IF;

  RETURN QUERY
  UPDATE public.marketing_dispatches AS dispatch
  SET status = CASE
        WHEN p_resolution = 'confirmed_sent' THEN 'sent'
        ELSE 'retryable'
      END,
      provider_message_id = CASE
        WHEN p_resolution = 'confirmed_sent' THEN p_provider_message_id
        ELSE provider_message_id
      END,
      sent_at = CASE
        WHEN p_resolution = 'confirmed_sent' THEN NOW()
        ELSE sent_at
      END,
      last_error_code = CASE
        WHEN p_resolution = 'confirmed_sent' THEN NULL
        ELSE 'manually_confirmed_not_sent'
      END,
      provider_idempotency_expires_at = CASE
        WHEN p_resolution = 'confirmed_not_sent' AND dispatch.channel = 'email'
          THEN NOW() + INTERVAL '23 hours'
        ELSE provider_idempotency_expires_at
      END
  WHERE dispatch.id = p_dispatch_id
    AND dispatch.status = 'outcome_unknown'
  RETURNING dispatch.*;
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_marketing_dispatch(UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_marketing_dispatch(UUID, TEXT, TEXT)
  TO service_role;

CREATE OR REPLACE FUNCTION public.approve_marketing_campaign(
  p_campaign_id UUID,
  p_approved_by TEXT,
  p_source_verified_at TIMESTAMPTZ,
  p_variant_approvals JSONB
)
RETURNS SETOF public.marketing_campaigns
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign public.marketing_campaigns%ROWTYPE;
  v_variant_count INT;
  v_approval_count INT;
BEGIN
  IF NULLIF(BTRIM(p_approved_by), '') IS NULL THEN
    RAISE EXCEPTION 'approved_by is required';
  END IF;
  IF p_variant_approvals IS NULL OR jsonb_typeof(p_variant_approvals) <> 'array' THEN
    RAISE EXCEPTION 'variant approvals must be an array';
  END IF;

  SELECT * INTO v_campaign
  FROM public.marketing_campaigns
  WHERE id = p_campaign_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign not found';
  END IF;
  IF v_campaign.status <> 'in_review' THEN
    RAISE EXCEPTION 'campaign must be in_review';
  END IF;

  -- Freeze the reviewed variant set until both its stamps and campaign status commit.
  PERFORM 1
  FROM public.marketing_campaign_variants
  WHERE campaign_id = p_campaign_id
  FOR UPDATE;

  SELECT COUNT(*) INTO v_variant_count
  FROM public.marketing_campaign_variants
  WHERE campaign_id = p_campaign_id;

  SELECT COUNT(DISTINCT approval.id) INTO v_approval_count
  FROM jsonb_to_recordset(p_variant_approvals)
    AS approval(id UUID, manifest_hash TEXT, content_version INT);

  IF v_variant_count = 0 OR v_approval_count <> v_variant_count THEN
    RAISE EXCEPTION 'variant approval set does not match campaign variants';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.marketing_campaign_variants variant
    LEFT JOIN jsonb_to_recordset(p_variant_approvals)
      AS approval(id UUID, manifest_hash TEXT, content_version INT)
      ON approval.id = variant.id
    WHERE variant.campaign_id = p_campaign_id
      AND (
        approval.id IS NULL
        OR approval.manifest_hash IS DISTINCT FROM variant.content_hash
        OR approval.content_version IS DISTINCT FROM variant.content_version
      )
  ) THEN
    RAISE EXCEPTION 'variant content changed during approval';
  END IF;

  UPDATE public.marketing_campaign_variants variant
  SET approved_manifest_hash = approval.manifest_hash,
      approved_content_version = approval.content_version
  FROM jsonb_to_recordset(p_variant_approvals)
    AS approval(id UUID, manifest_hash TEXT, content_version INT)
  WHERE variant.campaign_id = p_campaign_id
    AND variant.id = approval.id;

  RETURN QUERY
  UPDATE public.marketing_campaigns AS campaign
  SET status = 'approved',
      approved_by = BTRIM(p_approved_by),
      approved_at = NOW(),
      source_verified_at = p_source_verified_at
  WHERE campaign.id = p_campaign_id
    AND campaign.status = 'in_review'
  RETURNING campaign.*;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_marketing_campaign(UUID, TEXT, TIMESTAMPTZ, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_marketing_campaign(UUID, TEXT, TIMESTAMPTZ, JSONB)
  TO service_role;

-- Rollback guidance:
-- Do not drop claim_token while any rows are claimed. First pause dispatch, reconcile
-- outcome_unknown rows, and return retryable rows to pending. The approval RPC can be
-- dropped independently because it does not alter stored schema.
