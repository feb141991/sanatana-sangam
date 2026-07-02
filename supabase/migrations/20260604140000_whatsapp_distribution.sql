-- 1. Add WhatsApp columns to public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT NULL,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN DEFAULT FALSE NOT NULL;

-- 2. Add referral tracking columns to public.waitlist
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS referred_by_number INTEGER NULL,
  ADD COLUMN IF NOT EXISTS referral_source TEXT NULL;

-- 3. Create referral_attributions table
CREATE TABLE IF NOT EXISTS public.referral_attributions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_sthapaka_number INTEGER NOT NULL,
  referee_user_id          UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  source                   TEXT NOT NULL CHECK (source IN ('whatsapp', 'twitter', 'direct')),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.referral_attributions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for referral_attributions
DROP POLICY IF EXISTS "Users can view own referral attribution" ON public.referral_attributions;
CREATE POLICY "Users can view own referral attribution"
  ON public.referral_attributions FOR SELECT
  USING (auth.uid() = referee_user_id);

DROP POLICY IF EXISTS "Users can insert own referral attribution" ON public.referral_attributions;
CREATE POLICY "Users can insert own referral attribution"
  ON public.referral_attributions FOR INSERT
  WITH CHECK (auth.uid() = referee_user_id);

-- 6. Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_referral_attributions_referee ON public.referral_attributions(referee_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_attributions_referrer ON public.referral_attributions(referrer_sthapaka_number);
