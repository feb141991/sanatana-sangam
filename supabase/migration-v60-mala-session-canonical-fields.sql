-- Canonical Mala/Japa session context.
-- Product UI may say japa, simran, navkar, or breath practice; persistence
-- stays anchored to mala_sessions with tradition-aware metadata.

ALTER TABLE public.mala_sessions
  ADD COLUMN IF NOT EXISTS mood_before text,
  ADD COLUMN IF NOT EXISTS mood_after text,
  ADD COLUMN IF NOT EXISTS completed_beads integer CHECK (completed_beads IS NULL OR completed_beads >= 0),
  ADD COLUMN IF NOT EXISTS spiritual_date date,
  ADD COLUMN IF NOT EXISTS haptics_enabled boolean DEFAULT true;

UPDATE public.mala_sessions
SET completed_beads = COALESCE(completed_beads, count, bead_count, 0)
WHERE completed_beads IS NULL;

UPDATE public.mala_sessions
SET spiritual_date = COALESCE(spiritual_date, date, completed_at::date, created_at::date)
WHERE spiritual_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_mala_sessions_user_spiritual_date
  ON public.mala_sessions(user_id, spiritual_date DESC);

CREATE INDEX IF NOT EXISTS idx_mala_sessions_user_practice_type
  ON public.mala_sessions(user_id, practice_type, spiritual_date DESC);
