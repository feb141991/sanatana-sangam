-- ─── Migration v5 — Fixes & Foundations ──────────────────────────────────────
-- Covers: Mandali Satsang Connect, last_seen tracking
-- Run in Supabase SQL Editor

-- ── 1. Add last_seen to profiles (for welcome-back greeting) ──────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT now();

-- Auto-update last_seen on any profile update
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.last_seen = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_last_seen ON profiles;
CREATE TRIGGER trg_update_last_seen
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_last_seen();

-- ── 2. Satsang connections table (Mandali friend connections) ─────────────────
CREATE TABLE IF NOT EXISTS satsang_connections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(requester_id, receiver_id)
);

-- Prevent self-connections
ALTER TABLE satsang_connections
  ADD CONSTRAINT no_self_connect CHECK (requester_id <> receiver_id);

-- RLS
ALTER TABLE satsang_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own connections"
  ON satsang_connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send connection requests"
  ON satsang_connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Receivers can update status"
  ON satsang_connections FOR UPDATE
  USING (auth.uid() = receiver_id OR auth.uid() = requester_id);

-- ── 3. Content reports table (for moderation) ────────────────────────────────
CREATE TABLE IF NOT EXISTS content_reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type  text NOT NULL, -- 'post' | 'profile' | 'mandali_post' | 'kul_message'
  content_id    text NOT NULL, -- the ID of the reported item
  reason        text NOT NULL, -- 'abusive' | 'intolerant' | 'spam'
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  admin_note    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit reports"
  ON content_reports FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can see their own reports"
  ON content_reports FOR SELECT
  USING (auth.uid() = reported_by);

-- Admin policy (is_admin = true on profile)
CREATE POLICY "Admins can see all reports"
  ON content_reports FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- ── 4. Add is_admin to profiles (for admin panel) ────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- ── 5. Index for Mandali user search ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles USING gin(to_tsvector('english', coalesce(full_name, '')));
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ── Done ──────────────────────────────────────────────────────────────────────
-- Summary of changes:
--   profiles.last_seen        — for welcome-back greeting
--   profiles.is_admin         — for admin panel access control
--   satsang_connections       — Mandali peer connections (Satsang Connect)
--   content_reports           — moderation reporting system
--   indexes on name/username  — fast Mandali user search
