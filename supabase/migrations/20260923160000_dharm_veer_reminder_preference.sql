-- Migration: 20260923160000_dharm_veer_reminder_preference.sql
-- Prompt 4: Add dharm_veer_reminder_enabled to public.profiles

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'dharm_veer_reminder_enabled'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN dharm_veer_reminder_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;
