-- Table to track daily AI chat usage per user
CREATE TABLE IF NOT EXISTS ai_chat_usage (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, usage_date)
);

-- RLS: users can only see their own rows
ALTER TABLE ai_chat_usage ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_chat_usage' AND policyname = 'users_own_ai_usage'
  ) THEN
    CREATE POLICY "users_own_ai_usage" ON ai_chat_usage
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Atomic increment RPC: increments counter and returns new count.
-- Returns null if the user would exceed the limit (does not increment).
CREATE OR REPLACE FUNCTION increment_ai_chat_usage(
  p_user_id UUID,
  p_date DATE,
  p_limit INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_count INTEGER;
  v_was_allowed BOOLEAN;
BEGIN
  INSERT INTO ai_chat_usage (user_id, usage_date, message_count)
  VALUES (p_user_id, p_date, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET message_count = ai_chat_usage.message_count + 1
  WHERE ai_chat_usage.message_count < p_limit
  RETURNING message_count INTO v_new_count;

  IF v_new_count IS NULL THEN
    -- Row exists but was already at limit — get current count
    SELECT message_count INTO v_new_count
    FROM ai_chat_usage
    WHERE user_id = p_user_id AND usage_date = p_date;
    v_was_allowed := FALSE;
  ELSE
    v_was_allowed := TRUE;
  END IF;

  RETURN json_build_object('new_count', v_new_count, 'was_allowed', v_was_allowed);
END;
$$;
