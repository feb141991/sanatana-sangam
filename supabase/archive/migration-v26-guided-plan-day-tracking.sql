-- ─────────────────────────────────────────────────────────────────────────────
-- Sanatana Sangam — Migration v26 (Guided Plan Day Tracking)
-- Run this in Supabase SQL Editor
--
-- Adds day_reached and started_at to guided_path_progress so the daily cron
-- can track which day of a plan the user is on, auto-advance it each morning,
-- and mark the plan completed when the final day is reached.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.guided_path_progress
  ADD COLUMN IF NOT EXISTS day_reached  integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS started_at   timestamptz NOT NULL DEFAULT now();

-- Index for the cron: quickly fetch active plans needing today's nudge
CREATE INDEX IF NOT EXISTS idx_guided_path_progress_active_day
  ON public.guided_path_progress (status, day_reached, updated_at DESC)
  WHERE status = 'active';

-- Comment for clarity
COMMENT ON COLUMN public.guided_path_progress.day_reached IS
  'Which day of the plan the user has reached (1-indexed). Incremented by the daily cron after each push is sent.';

COMMENT ON COLUMN public.guided_path_progress.started_at IS
  'When the user first started this plan (set on upsert, not updated thereafter).';
