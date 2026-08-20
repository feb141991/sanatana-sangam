-- Migration: 20260820160000_notification_schedule_lease_recovery.sql
-- Description: Add claimed_at lease recovery to notification_schedule and api_rate_limits table

-- 1. Add claimed_at column to notification_schedule
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_schedule' AND column_name = 'claimed_at'
  ) THEN
    ALTER TABLE public.notification_schedule ADD COLUMN claimed_at TIMESTAMPTZ;
  END IF;
END $$;

-- 2. Index for pending/reclaimable notifications
CREATE INDEX IF NOT EXISTS idx_notification_schedule_claimed_lease
  ON public.notification_schedule (status, claimed_at)
  WHERE status = 'sending';

-- 3. Update claim_due_scheduled_notifications to support 15-minute lease recovery and record claimed_at
CREATE OR REPLACE FUNCTION public.claim_due_scheduled_notifications(
  p_notification_type TEXT,
  p_batch_limit INT DEFAULT 100
)
RETURNS SETOF public.notification_schedule
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark expired rows older than grace window (2 hours) as failed
  UPDATE public.notification_schedule
  SET status = 'failed',
      error = 'expired_grace_window'
  WHERE status = 'pending'
    AND (p_notification_type IS NULL OR notification_type = p_notification_type)
    AND send_at <= NOW() - INTERVAL '2 hours';

  RETURN QUERY
  WITH to_claim AS (
    SELECT id
    FROM public.notification_schedule
    WHERE (
      -- Genuinely pending rows within 2-hour grace window
      (status = 'pending' AND send_at <= NOW() AND send_at > NOW() - INTERVAL '2 hours')
      OR
      -- Stuck 'sending' rows where worker timed out / crashed (> 15 minutes ago)
      (status = 'sending' AND (claimed_at IS NULL OR claimed_at <= NOW() - INTERVAL '15 minutes'))
    )
      AND (p_notification_type IS NULL OR notification_type = p_notification_type)
    ORDER BY send_at ASC
    LIMIT p_batch_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.notification_schedule ns
  SET status = 'sending',
      claimed_at = NOW()
  FROM to_claim
  WHERE ns.id = to_claim.id
  RETURNING ns.*;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_due_scheduled_notifications(TEXT, INT) TO service_role;

-- 4. Durable rate limiting table and atomic RPC
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  key        TEXT PRIMARY KEY,
  count      INTEGER NOT NULL DEFAULT 1,
  reset_at   TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'api_rate_limits' AND policyname = 'service_role_all_rate_limits'
  ) THEN
    CREATE POLICY "service_role_all_rate_limits" ON public.api_rate_limits
      FOR ALL USING (true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_key TEXT,
  p_limit INT,
  p_window_seconds INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_row public.api_rate_limits%ROWTYPE;
  v_count INT;
  v_allowed BOOLEAN;
  v_reset_at TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_row FROM public.api_rate_limits WHERE key = p_key FOR UPDATE;

  IF NOT FOUND OR v_row.reset_at <= v_now THEN
    v_reset_at := v_now + (p_window_seconds || ' seconds')::INTERVAL;
    INSERT INTO public.api_rate_limits (key, count, reset_at)
    VALUES (p_key, 1, v_reset_at)
    ON CONFLICT (key)
    DO UPDATE SET count = 1, reset_at = v_reset_at;

    v_count := 1;
    v_allowed := TRUE;
  ELSE
    IF v_row.count < p_limit THEN
      UPDATE public.api_rate_limits
      SET count = count + 1
      WHERE key = p_key;
      v_count := v_row.count + 1;
      v_allowed := TRUE;
    ELSE
      v_count := v_row.count;
      v_allowed := FALSE;
    END IF;
    v_reset_at := v_row.reset_at;
  END IF;

  RETURN json_build_object(
    'allowed', v_allowed,
    'count', v_count,
    'limit', p_limit,
    'reset_at', v_reset_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(TEXT, INT, INT) TO anon, authenticated, service_role;
