-- migration-v30-mala-sessions-schema-fix.sql
--
-- The original mala_sessions schema (v20) used old column names:
--   mantra, count, duration_seconds, completed_at, chant_source, etc.
--
-- The current JapaClient inserts and all insight pages use new names:
--   mantra_id, rounds, bead_count, duration_secs, date
--
-- Because these columns didn't exist, every Japa insert has been failing
-- silently, producing 0 rows in mala_sessions despite daily_sadhana showing
-- japa_done = true.
--
-- This migration adds the missing columns so new inserts land correctly.
-- Existing columns are left intact so any legacy bhakti/mala code still works.

ALTER TABLE public.mala_sessions
  ADD COLUMN IF NOT EXISTS date         text,          -- YYYY-MM-DD spiritual date (4 AM boundary)
  ADD COLUMN IF NOT EXISTS rounds       integer DEFAULT 0 CHECK (rounds >= 0),
  ADD COLUMN IF NOT EXISTS bead_count   integer DEFAULT 0 CHECK (bead_count >= 0),
  ADD COLUMN IF NOT EXISTS mantra_id    text,          -- mantra identifier string
  ADD COLUMN IF NOT EXISTS duration_secs integer DEFAULT 0 CHECK (duration_secs >= 0);

-- Index for efficient date-range queries on insights pages
CREATE INDEX IF NOT EXISTS idx_mala_sessions_user_date
  ON public.mala_sessions(user_id, date DESC);
