-- migration-v31-date-of-birth.sql
--
-- Adds date_of_birth to profiles so we can:
--   1. Auto-suggest the correct Ashrama stage during onboarding
--   2. Run a background cron that re-evaluates life_stage each year
--   3. Support gender-specific vrat reminders in a future migration
--
-- Also adds life_stage_locked so users who override the auto-suggestion
-- aren't silently reverted by the cron.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth    date,
  ADD COLUMN IF NOT EXISTS life_stage_locked boolean NOT NULL DEFAULT false;

-- Index for the background cron: finds profiles where life_stage may need re-evaluation
CREATE INDEX IF NOT EXISTS idx_profiles_dob
  ON public.profiles(date_of_birth)
  WHERE date_of_birth IS NOT NULL;
