ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS quiz_reminder_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS quiz_reminder_time text DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS nitya_reminder_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS nitya_reminder_time text DEFAULT '06:30';
