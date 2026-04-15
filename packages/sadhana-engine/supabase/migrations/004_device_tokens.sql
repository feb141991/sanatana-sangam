-- ============================================================
-- Migration 004: Device Tokens for OneSignal Push Notifications
-- Run in Supabase SQL Editor
-- SAFE TO RE-RUN — all statements are idempotent.
-- ============================================================

-- Store OneSignal player IDs per user/device.
-- One user can have multiple devices (phone + tablet + browser).

CREATE TABLE IF NOT EXISTS device_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id     text NOT NULL,                    -- OneSignal player/subscription ID
  platform      text NOT NULL DEFAULT 'web',      -- 'web' | 'ios' | 'android'
  is_active     boolean NOT NULL DEFAULT true,
  registered_at timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint: one player_id per user (prevent duplicates on re-register)
CREATE UNIQUE INDEX IF NOT EXISTS idx_device_tokens_player
  ON device_tokens (player_id);

-- Index for quick user lookup (active tokens only)
CREATE INDEX IF NOT EXISTS idx_device_tokens_user
  ON device_tokens (user_id)
  WHERE is_active = true;

-- ── Auto-update timestamp trigger ──
-- CREATE OR REPLACE is idempotent — safe to re-run.

CREATE OR REPLACE FUNCTION update_device_token_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger: drop + recreate so it's idempotent.
DROP TRIGGER IF EXISTS trg_device_tokens_updated ON device_tokens;
CREATE TRIGGER trg_device_tokens_updated
  BEFORE UPDATE ON device_tokens
  FOR EACH ROW EXECUTE FUNCTION update_device_token_timestamp();

-- ── Row Level Security ──

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: users can manage their own tokens (idempotent via DO block)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename   = 'device_tokens'
      AND policyname  = 'Users manage own device tokens'
  ) THEN
    CREATE POLICY "Users manage own device tokens"
      ON device_tokens
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Service role bypasses RLS automatically (BYPASSRLS privilege).
-- No extra policy needed for Edge Functions using service_role key.

-- ── Upsert helper function ──
-- Handles the case where a player_id is re-used after app reinstall.
-- CREATE OR REPLACE is idempotent — safe to re-run.

CREATE OR REPLACE FUNCTION upsert_device_token(
  p_user_id   uuid,
  p_player_id text,
  p_platform  text DEFAULT 'web'
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO device_tokens (user_id, player_id, platform, is_active)
  VALUES (p_user_id, p_player_id, p_platform, true)
  ON CONFLICT (player_id) DO UPDATE
    SET user_id    = EXCLUDED.user_id,
        platform   = EXCLUDED.platform,
        is_active  = true,
        updated_at = now();
END;
$$;
