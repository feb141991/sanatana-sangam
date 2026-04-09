-- ─────────────────────────────────────────────────────────────────────────────
-- Sanatana Sangam — Migration v19 (Notification Preferences)
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wants_festival_reminders boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS wants_shloka_reminders boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS wants_community_notifications boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS wants_family_notifications boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_quiet_hours_start smallint,
  ADD COLUMN IF NOT EXISTS notification_quiet_hours_end smallint;

