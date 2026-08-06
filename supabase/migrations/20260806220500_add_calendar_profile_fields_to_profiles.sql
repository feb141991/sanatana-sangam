-- Migration: 20260806220500_add_calendar_profile_fields_to_profiles.sql
-- Description: Add additive columns for user calendar profile fields to the profiles table.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS calendar_profile text REFERENCES public.calendar_profiles(slug),
  ADD COLUMN IF NOT EXISTS calendar_scope text,
  ADD COLUMN IF NOT EXISTS calendar_language text;

-- Add check constraint for valid calendar_scope values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_calendar_scope'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT chk_calendar_scope
      CHECK (calendar_scope IN ('major_only', 'all_observances'));
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.calendar_profile IS 'Selected regional calendar system (references calendar_profiles).';
COMMENT ON COLUMN public.profiles.calendar_scope IS 'Observed density level: major_only or all_observances.';
COMMENT ON COLUMN public.profiles.calendar_language IS 'Preferred language for calendar names.';
