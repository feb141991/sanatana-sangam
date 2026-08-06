-- Rollback: 20260806220500_add_calendar_profile_fields_to_profiles_rollback.sql
-- Description: Revert adding calendar profile fields from the profiles table.

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS chk_calendar_scope,
  DROP COLUMN IF EXISTS calendar_profile,
  DROP COLUMN IF EXISTS calendar_scope,
  DROP COLUMN IF EXISTS calendar_language;
