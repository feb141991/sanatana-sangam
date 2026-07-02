-- ─────────────────────────────────────────────────────────────────────────────
-- Sanatana Sangam — Migration v28 (Ashrama / Life Stage)
-- Run this in Supabase SQL Editor
--
-- Adds life_stage to profiles so the app can personalise Nitya Karma duties,
-- notification copy, Guided Plans recommendations, and AI advice by the
-- user's current stage of life (Brahmacharya → Grihastha → Vanaprastha → Sannyasa).
--
-- The column stores a universal key regardless of tradition, so Sikh users
-- who select "Grihasthi" and Hindu users who select "Grihastha" both store
-- 'grihastha'. Tradition-aware display names live in src/lib/ashrama.ts.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS life_stage text
    CHECK (life_stage IN ('brahmacharya', 'grihastha', 'vanaprastha', 'sannyasa'));

COMMENT ON COLUMN public.profiles.life_stage IS
  'User''s current Ashrama / life stage. Universal key regardless of tradition.
   brahmacharya = student (0-25), grihastha = householder (25-50),
   vanaprastha = forest dweller / elder (50-75), sannyasa = renunciate (75+).
   NULL means the user has not yet selected a stage (skip Ashrama section).';

-- Index for efficient filtering in notification crons and analytics
CREATE INDEX IF NOT EXISTS idx_profiles_life_stage
  ON public.profiles (life_stage)
  WHERE life_stage IS NOT NULL;
