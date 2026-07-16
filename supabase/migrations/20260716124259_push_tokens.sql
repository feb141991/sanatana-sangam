-- Push tokens for Expo push notifications (replaces OneSignal's
-- external_id-based targeting, which relied on OneSignal's own device
-- registry and needed no local table).
--
-- One user can have multiple devices; one physical device/install should
-- only ever map to one row (enforced via the unique index on `token`), so
-- re-registering after reinstall/logout-login just moves the existing row
-- to the new user rather than accumulating duplicates.
--
-- Note: an older, unrelated `device_tokens` table already exists in this
-- schema, built for a player_id-based OneSignal integration used only by
-- the ai-nudge / ai-kul-nudge edge functions. Nothing in src/ writes to
-- that table, so it looks orphaned/dead -- left untouched, out of scope.

CREATE TABLE IF NOT EXISTS push_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token         text NOT NULL,
  platform      text NOT NULL DEFAULT 'unknown',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_tokens_token
  ON push_tokens (token);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user
  ON push_tokens (user_id);

CREATE OR REPLACE FUNCTION update_push_token_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_push_tokens_updated ON push_tokens;
CREATE TRIGGER trg_push_tokens_updated
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW EXECUTE FUNCTION update_push_token_timestamp();

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename   = 'push_tokens'
      AND policyname  = 'Users manage own push tokens'
  ) THEN
    CREATE POLICY "Users manage own push tokens"
      ON push_tokens
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION upsert_push_token(
  p_user_id  uuid,
  p_token    text,
  p_platform text DEFAULT 'unknown'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO push_tokens (user_id, token, platform, last_seen_at, updated_at)
  VALUES (p_user_id, p_token, p_platform, now(), now())
  ON CONFLICT (token) DO UPDATE
    SET user_id      = EXCLUDED.user_id,
        platform     = EXCLUDED.platform,
        last_seen_at = now(),
        updated_at   = now();
END;
$$;

CREATE OR REPLACE FUNCTION delete_push_token(
  p_user_id uuid,
  p_token   text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  DELETE FROM push_tokens WHERE user_id = p_user_id AND token = p_token;
END;
$$;

CREATE TABLE IF NOT EXISTS push_receipts_pending (
  ticket_id  text PRIMARY KEY,
  token      text NOT NULL,
  user_id    uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_receipts_pending_created
  ON push_receipts_pending (created_at);

ALTER TABLE push_receipts_pending ENABLE ROW LEVEL SECURITY;
-- Deliberately no policies: RLS enabled with zero policies denies all
-- non-service-role access by default.
;
