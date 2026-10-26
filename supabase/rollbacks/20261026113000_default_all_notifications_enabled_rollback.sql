-- Rollback for 20261026113000_default_all_notifications_enabled.sql
-- Restores reminder columns in public.profiles to DEFAULT false

ALTER TABLE public.profiles
  ALTER COLUMN japa_reminder_enabled SET DEFAULT false,
  ALTER COLUMN japa_reminder_time SET DEFAULT '07:00',
  ALTER COLUMN wants_tithi_reminders SET DEFAULT false,
  ALTER COLUMN wants_sankalpa_midpoint_reminders SET DEFAULT false,
  ALTER COLUMN wants_brahma_muhurta_reminders SET DEFAULT false,
  ALTER COLUMN wants_family_remembrance_reminders SET DEFAULT false,
  ALTER COLUMN family_remembrance_time SET DEFAULT '09:00',
  ALTER COLUMN nitya_reminder_enabled SET DEFAULT false,
  ALTER COLUMN nitya_reminder_time SET DEFAULT '06:30',
  ALTER COLUMN wants_madhyahn_reminder SET DEFAULT false,
  ALTER COLUMN wants_evening_reminder SET DEFAULT false;
