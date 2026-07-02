-- ─── Migration v50 — Legal & Compliance (GDPR / India IT Rules) ──────────────
-- WHY THIS IS NEEDED
-- ─────────────────────────────────────────────────────────────────────────────
-- 1. GDPR (L-02): Users must be able to export their data.
-- 2. Data Retention (L-03): Pruning of old logs/sessions.
-- 3. Consent (L-04): Explicit consent for religious data processing.
-- 4. K-06: Clean up legacy 'kul' column to avoid confusion with structured Kuls.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Consent (L-04) ───────────────────────────────────────────────────────
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS consent_religious_data boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_updated_at      timestamptz;

COMMENT ON COLUMN profiles.consent_religious_data IS 'Explicit consent for processing religious/spiritual data (GDPR Art. 9)';

-- ── 2. Legacy Cleanup (K-06) ────────────────────────────────────────────────
-- Rename 'kul' to 'legacy_family_name' to disambiguate from structured 'kuls' table
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='kul') THEN
    ALTER TABLE profiles RENAME COLUMN kul TO legacy_family_name;
  END IF;
END $$;

-- ── 3. GDPR Data Export (L-02) ──────────────────────────────────────────────
-- RPC to aggregate ALL user data into a single JSON blob
CREATE OR REPLACE FUNCTION export_user_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result  json;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT json_build_object(
    'exported_at', now(),
    'profile', (SELECT row_to_json(p) FROM profiles p WHERE id = v_user_id),
    'sadhana_sessions', (SELECT json_agg(s) FROM (SELECT * FROM mala_sessions WHERE user_id = v_user_id) s),
    'nitya_karma_logs', (SELECT json_agg(l) FROM (SELECT * FROM nitya_karma_logs WHERE user_id = v_user_id) l),
    'kul_memberships', (SELECT json_agg(m) FROM (SELECT * FROM kul_members WHERE user_id = v_user_id) m),
    'messages_sent', (SELECT json_agg(msg) FROM (SELECT * FROM kul_messages WHERE sender_id = v_user_id) msg),
    'quiz_responses', (SELECT json_agg(q) FROM (SELECT * FROM quiz_responses WHERE user_id = v_user_id) q),
    'notification_preferences', (SELECT row_to_json(n) FROM notification_preferences n WHERE user_id = v_user_id)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ── 4. Data Retention (L-03) ────────────────────────────────────────────────
-- Prune logs older than 180 days (standard retention for non-essential audit logs)
-- Note: This is an idempotent function that can be called by a cron job or admin
CREATE OR REPLACE FUNCTION prune_old_user_data(p_days int DEFAULT 180)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
BEGIN
  -- We don't delete essential profile/account data, only ephemeral logs
  -- Example: Nitya Karma logs older than 6 months
  DELETE FROM nitya_karma_logs 
  WHERE created_at < (now() - (p_days || ' days')::interval);
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
