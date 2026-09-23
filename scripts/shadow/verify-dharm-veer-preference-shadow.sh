#!/usr/bin/env bash
set -euo pipefail

DB_NAME="shoonaya_dharm_veer_shadow_$$"
PSQL="$(command -v psql)"
MIGRATION="supabase/migrations/20260923160000_dharm_veer_reminder_preference.sql"
ROLLBACK="supabase/rollbacks/20260923160000_dharm_veer_reminder_preference_rollback.sql"

cleanup() {
  "${PSQL}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "=== Creating shadow database ${DB_NAME} ==="
"${PSQL}" -d postgres -c "CREATE DATABASE ${DB_NAME};" >/dev/null

"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -q <<'SQL'
CREATE SCHEMA auth;

CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  username TEXT NOT NULL DEFAULT '',
  quiz_reminder_enabled BOOLEAN DEFAULT true,
  quiz_reminder_time TEXT DEFAULT '12:00'
);

INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'devotee1@example.com');

INSERT INTO public.profiles (id, full_name, username) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Test Devotee', 'devotee1');
SQL

echo "=== Applying Prompt 4 Migration ==="
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -f "${MIGRATION}" >/dev/null

echo "=== Verifying dharm_veer_reminder_enabled Column & Defaults ==="
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -q <<'SQL'
DO $$
DECLARE
  v_col_exists BOOLEAN;
  v_val BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'dharm_veer_reminder_enabled'
  ) INTO v_col_exists;

  IF NOT v_col_exists THEN
    RAISE EXCEPTION 'Column dharm_veer_reminder_enabled does not exist';
  END IF;

  SELECT dharm_veer_reminder_enabled INTO v_val FROM public.profiles WHERE id = '11111111-1111-1111-1111-111111111111';
  IF v_val IS NOT TRUE THEN
    RAISE EXCEPTION 'Expected default dharm_veer_reminder_enabled to be true, got %', v_val;
  END IF;
END $$;
SQL

echo "=== Testing Clean Rollback ==="
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -f "${ROLLBACK}" >/dev/null

"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -q <<'SQL'
DO $$
DECLARE
  v_col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'dharm_veer_reminder_enabled'
  ) INTO v_col_exists;

  IF v_col_exists THEN
    RAISE EXCEPTION 'Column dharm_veer_reminder_enabled still exists after rollback';
  END IF;
END $$;
SQL

echo "=== ALL PROMPT 4 PREFERENCE SHADOW TESTS PASSED SUCCESSFULLY ==="
