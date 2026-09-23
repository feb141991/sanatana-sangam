-- Stage O2: Observance preference storage and settings contract
-- Adds granular preference controls for sacred observances:
-- - wants_vrat_reminders (Ekadashi, Pradosha, Purnima, Amavasya)
-- - wants_tithi_reminders (Daily lunar phase transitions)
-- - observance_reminder_lead_days (Array of integer lead offsets, e.g. [1, 7])
-- - observance_reminder_time (Local 24-hr send time HH:MM, default 08:00)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wants_vrat_reminders boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS wants_tithi_reminders boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS observance_reminder_lead_days integer[] NOT NULL DEFAULT ARRAY[1, 7],
  ADD COLUMN IF NOT EXISTS observance_reminder_time text NOT NULL DEFAULT '08:00';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_observance_reminder_time_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_observance_reminder_time_check
      CHECK (observance_reminder_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.wants_vrat_reminders IS
  'Whether the user wants reminders for reviewed fasting and spiritual observances (Ekadashi, Pradosha, etc.)';

COMMENT ON COLUMN public.profiles.wants_tithi_reminders IS
  'Whether the user wants reminders for daily lunar tithi transitions';

COMMENT ON COLUMN public.profiles.observance_reminder_lead_days IS
  'Lead-time offsets in days for observance alerts (e.g. {1, 7} for D-1 and D-7; {0} for morning of)';

COMMENT ON COLUMN public.profiles.observance_reminder_time IS
  'Preferred local send time formatted as HH:MM in 24-hour time';

-- Conservative backfill preserving explicit user choices:
-- If user had explicitly disabled festival reminders, set vrat and tithi reminders to false as well.
UPDATE public.profiles
SET wants_vrat_reminders = false,
    wants_tithi_reminders = false
WHERE wants_festival_reminders = false;
