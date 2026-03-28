-- ─────────────────────────────────────────────────────────────────────────────
-- Sanatana Sangam — Migration v3 (Phase 2 + Step 3)
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────────────────────

-- ── profiles: new columns ────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onesignal_player_id  text,
  ADD COLUMN IF NOT EXISTS country_code         text;   -- ISO 3166-1 alpha-2, e.g. "GB", "IN", "US"

-- ── notifications table ───────────────────────────────────────────────────────
-- Stores in-app notification history for each user (bell icon feed).
-- OneSignal handles the actual push delivery; this table powers the UI.
CREATE TABLE IF NOT EXISTS notifications (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now()             NOT NULL,
  user_id      uuid        REFERENCES profiles(id)   ON DELETE CASCADE NOT NULL,
  title        text                                  NOT NULL,
  body         text                                  NOT NULL,
  emoji        text        DEFAULT '🔔',
  type         text        DEFAULT 'general',        -- 'festival' | 'mandali' | 'streak' | 'seva' | 'general'
  read         boolean     DEFAULT false,
  action_url   text                                  -- optional deep-link, e.g. "/mandali"
);

-- Row-level security: users can only see + update their own notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS notifications_user_id_idx
  ON notifications (user_id, created_at DESC);
