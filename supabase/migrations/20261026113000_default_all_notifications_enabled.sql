-- Migration: 20261026113000_default_all_notifications_enabled.sql
-- Sets all notification reminder columns in public.profiles to DEFAULT true
-- and standardizes default reminder times, backfilling existing profiles so all
-- notifications are enabled by default while seekers retain full control to toggle them off in Settings.

ALTER TABLE public.profiles
  ALTER COLUMN japa_reminder_enabled SET DEFAULT true,
  ALTER COLUMN japa_reminder_time SET DEFAULT '07:00',
  ALTER COLUMN wants_tithi_reminders SET DEFAULT true,
  ALTER COLUMN wants_sankalpa_midpoint_reminders SET DEFAULT true,
  ALTER COLUMN wants_brahma_muhurta_reminders SET DEFAULT true,
  ALTER COLUMN wants_family_remembrance_reminders SET DEFAULT true,
  ALTER COLUMN family_remembrance_time SET DEFAULT '09:00',
  ALTER COLUMN nitya_reminder_enabled SET DEFAULT true,
  ALTER COLUMN nitya_reminder_time SET DEFAULT '06:30',
  ALTER COLUMN wants_madhyahn_reminder SET DEFAULT true,
  ALTER COLUMN wants_evening_reminder SET DEFAULT true;

-- Backfill legacy profiles where these were left at legacy false/null defaults
UPDATE public.profiles
SET japa_reminder_enabled = true
WHERE japa_reminder_enabled = false OR japa_reminder_enabled IS NULL;

UPDATE public.profiles
SET japa_reminder_time = '07:00'
WHERE japa_reminder_time IS NULL;

UPDATE public.profiles
SET wants_tithi_reminders = true
WHERE wants_tithi_reminders = false OR wants_tithi_reminders IS NULL;

UPDATE public.profiles
SET wants_sankalpa_midpoint_reminders = true
WHERE wants_sankalpa_midpoint_reminders = false OR wants_sankalpa_midpoint_reminders IS NULL;

UPDATE public.profiles
SET wants_brahma_muhurta_reminders = true
WHERE wants_brahma_muhurta_reminders = false OR wants_brahma_muhurta_reminders IS NULL;

UPDATE public.profiles
SET wants_family_remembrance_reminders = true
WHERE wants_family_remembrance_reminders = false OR wants_family_remembrance_reminders IS NULL;

UPDATE public.profiles
SET family_remembrance_time = '09:00'
WHERE family_remembrance_time IS NULL;

UPDATE public.profiles
SET nitya_reminder_enabled = true
WHERE nitya_reminder_enabled = false OR nitya_reminder_enabled IS NULL;

UPDATE public.profiles
SET nitya_reminder_time = '06:30'
WHERE nitya_reminder_time IS NULL;

UPDATE public.profiles
SET wants_madhyahn_reminder = true
WHERE wants_madhyahn_reminder = false OR wants_madhyahn_reminder IS NULL;

UPDATE public.profiles
SET wants_evening_reminder = true
WHERE wants_evening_reminder = false OR wants_evening_reminder IS NULL;
