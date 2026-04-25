-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v29 — gender_context on profiles
--
-- Adds an optional practice-path preference so the Ashrama Dharma section
-- can surface tradition-accurate female duties (Stridharma) instead of the
-- default general/male path.
--
-- Values: 'female' | 'general'
-- NULL   = user has not chosen yet (falls back to general duties)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender_context text
    CHECK (gender_context IN ('female', 'general'));

-- Lightweight index for cron queries that will filter/personalise by this field
CREATE INDEX IF NOT EXISTS idx_profiles_gender_context
  ON public.profiles (gender_context)
  WHERE gender_context IS NOT NULL;

COMMENT ON COLUMN public.profiles.gender_context IS
  'Practice path preference. female = Stridharma duties; general = default path. NULL = unset.';
