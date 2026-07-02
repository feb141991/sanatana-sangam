-- ─────────────────────────────────────────────────────────────────────────────
-- Sanatana Sangam — Migration v18 (Sacred Time Delivery)
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone text;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS notification_key text,
  ADD COLUMN IF NOT EXISTS local_date date,
  ADD COLUMN IF NOT EXISTS sent_timezone text;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_notification_key_idx
  ON public.notifications (user_id, notification_key)
  WHERE notification_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS notifications_local_date_idx
  ON public.notifications (local_date DESC);
