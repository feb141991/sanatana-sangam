-- Rollback: 20260923150000_notification_candidates_claim_and_persistence_rollback.sql

DROP FUNCTION IF EXISTS public.claim_pending_notification_candidates(INT, INT, TEXT);

DROP INDEX IF EXISTS public.idx_notification_candidates_resolving_lease;

-- Revert any 'resolving' or 'deferred' candidate rows back to 'pending' before narrowing check constraint
UPDATE public.notification_candidates
SET status = 'pending'
WHERE status IN ('resolving', 'deferred');

ALTER TABLE public.notification_candidates
  DROP CONSTRAINT IF EXISTS notification_candidates_status_check;

ALTER TABLE public.notification_candidates
  ADD CONSTRAINT notification_candidates_status_check
  CHECK (status IN ('pending', 'accepted', 'suppressed', 'expired', 'cancelled'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_candidates' AND column_name = 'claimed_at'
  ) THEN
    ALTER TABLE public.notification_candidates DROP COLUMN claimed_at;
  END IF;
END $$;
