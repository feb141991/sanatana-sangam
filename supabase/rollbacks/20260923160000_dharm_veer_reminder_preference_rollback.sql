-- Rollback: 20260923160000_dharm_veer_reminder_preference_rollback.sql

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'dharm_veer_reminder_enabled'
  ) THEN
    ALTER TABLE public.profiles DROP COLUMN dharm_veer_reminder_enabled;
  END IF;
END $$;
