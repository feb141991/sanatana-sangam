-- Migration: Update default observance reminder lead days from [1, 7] to [0, 1] (same day and previous day only)
ALTER TABLE public.profiles 
  ALTER COLUMN observance_reminder_lead_days SET DEFAULT ARRAY[0, 1];

COMMENT ON COLUMN public.profiles.observance_reminder_lead_days IS
  'Array of integer lead offsets before observances (e.g. 0 = same day / today, 1 = previous day / tomorrow). Reminders are restricted to previous day and same day.';
