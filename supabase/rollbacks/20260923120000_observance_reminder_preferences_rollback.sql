-- Rollback for Stage O2 observance reminder preference columns
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_observance_reminder_time_check,
  DROP COLUMN IF EXISTS wants_vrat_reminders,
  DROP COLUMN IF EXISTS wants_tithi_reminders,
  DROP COLUMN IF EXISTS observance_reminder_lead_days,
  DROP COLUMN IF EXISTS observance_reminder_time;
