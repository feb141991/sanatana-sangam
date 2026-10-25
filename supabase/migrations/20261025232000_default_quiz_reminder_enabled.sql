-- Migration: 20261025232000_default_quiz_reminder_enabled.sql
-- Sets profiles.quiz_reminder_enabled default to true and quiz_reminder_time to '10:00'
-- allowing seekers to receive daily quiz engagement by default with full opt-out control in Settings.

ALTER TABLE public.profiles
  ALTER COLUMN quiz_reminder_enabled SET DEFAULT true,
  ALTER COLUMN quiz_reminder_time SET DEFAULT '10:00';

-- Backfill legacy profiles where quiz_reminder_enabled was left at the legacy false default
UPDATE public.profiles
SET quiz_reminder_enabled = true
WHERE quiz_reminder_enabled = false;

UPDATE public.profiles
SET quiz_reminder_time = '10:00'
WHERE quiz_reminder_time = '08:00' OR quiz_reminder_time IS NULL;
