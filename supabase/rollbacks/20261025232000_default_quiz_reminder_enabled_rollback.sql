-- Rollback for 20261025232000_default_quiz_reminder_enabled.sql
-- Restores quiz_reminder_enabled default to false and quiz_reminder_time default to '08:00'

ALTER TABLE public.profiles
  ALTER COLUMN quiz_reminder_enabled SET DEFAULT false,
  ALTER COLUMN quiz_reminder_time SET DEFAULT '08:00';
