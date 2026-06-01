-- ─────────────────────────────────────────────────────────────────────────────
-- Sanatana Sangam — Migration v27 (Sangam Pro Status)
-- Run this in Supabase SQL Editor
--
-- Persists Pro activation in the database so it survives device changes,
-- browser clears, and incognito sessions. Real payment gating will gate
-- this column via a webhook once billing is integrated.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_pro             boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pro_activated_at   timestamptz,
  ADD COLUMN IF NOT EXISTS pro_note           text;       -- e.g. 'early_access', 'payment:stripe:sub_xxx'

-- Fast lookup for admin and analytics
CREATE INDEX IF NOT EXISTS idx_profiles_is_pro
  ON public.profiles (is_pro)
  WHERE is_pro = true;

COMMENT ON COLUMN public.profiles.is_pro IS
  'True when the user has an active Sangam Pro subscription or early access grant.';

COMMENT ON COLUMN public.profiles.pro_note IS
  'Free-text note for how Pro was granted (early_access, coupon code, payment reference, etc.)';
