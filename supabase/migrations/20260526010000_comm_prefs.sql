ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_consent    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_newsletter     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_updates     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS newsletter_frequency text    DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS comm_prefs_set       boolean DEFAULT false;
