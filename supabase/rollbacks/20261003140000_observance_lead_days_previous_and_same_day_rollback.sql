-- Rollback: Restore default observance reminder lead days to [1, 7]
ALTER TABLE public.profiles 
  ALTER COLUMN observance_reminder_lead_days SET DEFAULT ARRAY[1, 7];
