-- ─────────────────────────────────────────────────────────────────────────────
-- Shoonaya — Migration v62 (Nitya Reminder Preference)
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wants_nitya_reminders boolean NOT NULL DEFAULT true;
