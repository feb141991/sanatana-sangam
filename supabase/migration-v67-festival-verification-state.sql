-- ─────────────────────────────────────────────────────────────────────────────
-- Shoonaya — Migration v67 (Festival Verification State)
-- Adds durable AI/manual verification metadata to the festivals table.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.festivals
  ADD COLUMN IF NOT EXISTS verification_status text CHECK (
    verification_status IN ('verified', 'mismatch', 'uncertain', 'not_checked', 'manual_review')
  ),
  ADD COLUMN IF NOT EXISTS verification_confidence text CHECK (
    verification_confidence IN ('high', 'medium', 'low')
  ),
  ADD COLUMN IF NOT EXISTS verification_note text,
  ADD COLUMN IF NOT EXISTS suggested_date date,
  ADD COLUMN IF NOT EXISTS verification_run_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_type text CHECK (
    verification_type IN ('solar_fixed', 'lunar_tithi', 'nakshatra_based', 'regional_calendar', 'historical_commemoration')
  );

CREATE INDEX IF NOT EXISTS idx_festivals_verification_status
  ON public.festivals (verification_status);

CREATE INDEX IF NOT EXISTS idx_festivals_verification_run_at
  ON public.festivals (verification_run_at DESC);
