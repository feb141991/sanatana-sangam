-- Migration: 20260820150000_notification_schedule_pipeline.sql
-- Description: Uniqueness constraints, retry tracking, atomic claim RPC, and retention cleanup for notification_schedule

CREATE TABLE IF NOT EXISTS public.notification_schedule (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  body              TEXT NOT NULL,
  send_at           TIMESTAMPTZ NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'generic',
  status            TEXT NOT NULL DEFAULT 'pending',
  metadata          JSONB DEFAULT '{}'::jsonb,
  sent_at           TIMESTAMPTZ,
  error             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  retry_count       INTEGER NOT NULL DEFAULT 0,
  notification_key  TEXT
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_schedule' AND column_name = 'retry_count'
  ) THEN
    ALTER TABLE public.notification_schedule ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_schedule' AND column_name = 'notification_key'
  ) THEN
    ALTER TABLE public.notification_schedule ADD COLUMN notification_key TEXT;
  END IF;
END $$;

ALTER TABLE public.notification_schedule DROP CONSTRAINT IF EXISTS notification_schedule_status_check;
ALTER TABLE public.notification_schedule ADD CONSTRAINT notification_schedule_status_check
  CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled', 'skipped'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_schedule_notification_key
  ON public.notification_schedule (notification_key)
  WHERE notification_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_schedule_user_type_date
  ON public.notification_schedule (user_id, notification_type, ((send_at AT TIME ZONE 'UTC')::date))
  WHERE notification_key IS NULL;

CREATE INDEX IF NOT EXISTS idx_notification_schedule_pending_claim
  ON public.notification_schedule (send_at, status, notification_type)
  WHERE status = 'pending';

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
    WHERE status = 'pending'
      AND (p_notification_type IS NULL OR notification_type = p_notification_type)
      AND send_at <= NOW()
      AND send_at > NOW() - INTERVAL '2 hours'
    ORDER BY send_at ASC
    LIMIT p_batch_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.notification_schedule ns
  SET status = 'sending'
  FROM to_claim
  WHERE ns.id = to_claim.id
  RETURNING ns.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_scheduled_notifications(
  p_days_old INT DEFAULT 90
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM public.notification_schedule
  WHERE status IN ('sent', 'failed', 'skipped', 'cancelled')
    AND created_at < NOW() - (p_days_old || ' days')::INTERVAL;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_due_scheduled_notifications(TEXT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_scheduled_notifications(INT) TO service_role;
