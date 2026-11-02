#!/usr/bin/env bash
# Verification for 20261102140000_drop_obsolete_complete_japa_session_overload.sql on scratch PostgreSQL.
# Tests:
# 1. Setup mock profiles, daily_sadhana, mala_sessions, karma_ledger tables and get_japa_context/safe_timezone functions.
# 2. Install both overloaded signatures of complete_japa_session (replicating current production drift).
# 3. Apply migration: verify obsolete signature is dropped and surviving signature exists.
# 4. Idempotency: re-apply migration and verify no errors.
# 5. Rollback: apply rollback file and verify both signatures are restored.
# 6. Re-apply migration to leave clean state.
set -euo pipefail

MIGRATION_FILE="supabase/migrations/20261102140000_drop_obsolete_complete_japa_session_overload.sql"
ROLLBACK_FILE="supabase/rollbacks/20261102140000_drop_obsolete_complete_japa_session_overload_rollback.sql"

export PGHOST="${PGHOST:-/tmp}"
export PGPORT="${PGPORT:-5432}"
unset PGDATABASE PGSERVICE PGSERVICEFILE

TEST_DB="scratch_drop_japa_overload_test_$$"
echo "Creating isolated test database: $TEST_DB"
createdb "$TEST_DB"
trap 'dropdb --if-exists "$TEST_DB"' EXIT
PSQL=(psql -X -q -v ON_ERROR_STOP=1 -d "$TEST_DB")

echo "Setting up mock schemas and dependencies..."
"${PSQL[@]}" <<'SQL'
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT id FROM auth.users LIMIT 1; $$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  timezone text DEFAULT 'UTC',
  last_freeze_used date,
  streak_freeze_count integer DEFAULT 0,
  karma_points integer DEFAULT 0
);

CREATE TABLE public.daily_sadhana (
  user_id uuid REFERENCES auth.users(id),
  date date NOT NULL,
  japa_done boolean DEFAULT false,
  streak_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

CREATE TABLE public.mala_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  client_completion_id uuid,
  mantra text,
  count integer,
  target_count integer,
  duration_seconds integer,
  duration_secs integer,
  completed_at timestamptz,
  date text,
  rounds integer,
  bead_count integer,
  mantra_id text,
  mala_id text,
  tradition text,
  practice_type text,
  intention text,
  completion_type text,
  target_rounds integer,
  completed_rounds integer,
  completed_beads integer,
  spiritual_time_window text,
  spiritual_date date,
  timezone text,
  haptics_enabled boolean,
  source_route text
);

CREATE TABLE public.karma_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  amount integer,
  reason text,
  source_route text,
  metadata jsonb,
  earned_date date
);

CREATE FUNCTION public.safe_timezone(tz text, default_tz text) RETURNS text LANGUAGE sql AS $$
  SELECT coalesce(tz, default_tz);
$$;

CREATE FUNCTION public.get_japa_context() RETURNS jsonb LANGUAGE sql AS $$
  SELECT '{"streak": 1}'::jsonb;
$$;
SQL

echo "Installing both overloaded functions (reproducing the conflict)..."
"${PSQL[@]}" -f "$ROLLBACK_FILE"
# Now install surviving definition
"${PSQL[@]}" <<'SQL'
CREATE OR REPLACE FUNCTION public.complete_japa_session(
  p_client_completion_id uuid,
  p_count integer,
  p_rounds integer,
  p_duration_seconds integer,
  p_mantra text,
  p_active_symbol_id text DEFAULT 'om',
  p_tradition text DEFAULT 'universal',
  p_practice_type text DEFAULT 'mala'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RETURN jsonb_build_object('success', true, 'signature', 'new');
END;
$$;
SQL

OVERLOAD_COUNT_BEFORE=$("${PSQL[@]}" -t -A -c "SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'complete_japa_session';")
if [ "$OVERLOAD_COUNT_BEFORE" -ne 2 ]; then
  echo "Expected 2 overloads before migration, got $OVERLOAD_COUNT_BEFORE"
  exit 1
fi
echo "Verified: 2 complete_japa_session overloads present before migration."

echo "Applying migration: $MIGRATION_FILE..."
"${PSQL[@]}" -f "$MIGRATION_FILE"

OVERLOAD_COUNT_AFTER=$("${PSQL[@]}" -t -A -c "SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'complete_japa_session';")
if [ "$OVERLOAD_COUNT_AFTER" -ne 1 ]; then
  echo "Expected exactly 1 complete_japa_session function after migration, got $OVERLOAD_COUNT_AFTER"
  exit 1
fi
echo "Verified: exactly 1 complete_japa_session function remains."

echo "Testing idempotency: re-applying migration..."
"${PSQL[@]}" -f "$MIGRATION_FILE"
OVERLOAD_COUNT_IDEMPOTENT=$("${PSQL[@]}" -t -A -c "SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'complete_japa_session';")
if [ "$OVERLOAD_COUNT_IDEMPOTENT" -ne 1 ]; then
  echo "Idempotency check failed: expected 1 overload, got $OVERLOAD_COUNT_IDEMPOTENT"
  exit 1
fi
echo "Verified: migration is idempotent."

echo "Testing rollback: applying $ROLLBACK_FILE..."
"${PSQL[@]}" -f "$ROLLBACK_FILE"
OVERLOAD_COUNT_ROLLBACK=$("${PSQL[@]}" -t -A -c "SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'complete_japa_session';")
if [ "$OVERLOAD_COUNT_ROLLBACK" -ne 2 ]; then
  echo "Rollback check failed: expected 2 overloads after rollback, got $OVERLOAD_COUNT_ROLLBACK"
  exit 1
fi
echo "Verified: rollback restored previous state."

echo "Re-applying migration for final clean verification..."
"${PSQL[@]}" -f "$MIGRATION_FILE"
echo "All scratch migration verification tests passed successfully!"
