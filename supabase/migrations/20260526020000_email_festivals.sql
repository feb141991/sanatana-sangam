ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_festivals boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS unsubscribe_token text UNIQUE DEFAULT gen_random_uuid()::text;
