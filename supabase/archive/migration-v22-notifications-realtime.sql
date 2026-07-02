-- ─────────────────────────────────────────────────────────────────────────────
-- Sanatana Sangam — Migration v22 (Notifications Realtime)
-- Run this in Supabase SQL Editor
--
-- Enables Postgres Changes (Supabase Realtime) on the notifications table so
-- the bell icon in TopBar updates live when a new notification is inserted,
-- without requiring a page reload.
-- ─────────────────────────────────────────────────────────────────────────────

-- Required so Realtime can broadcast the full row (including user_id for
-- row-level filtering on the client side).
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add notifications to the Realtime publication (idempotent if already added).
-- Supabase creates this publication automatically; we just opt the table in.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
