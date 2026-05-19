-- ─────────────────────────────────────────────────────────────────────────────
-- Shoonaya — Migration v63 (Entitlement Foundation)
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'free'
    CHECK (subscription_status IN ('free', 'pro', 'kul_pro', 'grace', 'expired')),
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS entitlement_source text,
  ADD COLUMN IF NOT EXISTS entitlement_updated_at timestamptz;

COMMENT ON COLUMN public.profiles.subscription_status IS
  'Canonical server-side entitlement state. Replaces ad hoc is_pro-only gating for production billing.';

COMMENT ON COLUMN public.profiles.entitlement_source IS
  'Source of current entitlement truth, e.g. early_access, admin_grant, stripe:webhook, app_store, play_store.';
