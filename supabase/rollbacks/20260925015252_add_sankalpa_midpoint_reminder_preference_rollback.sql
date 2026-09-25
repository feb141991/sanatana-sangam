ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS wants_sankalpa_midpoint_reminders,
  DROP COLUMN IF EXISTS consent_activity_personalization;
