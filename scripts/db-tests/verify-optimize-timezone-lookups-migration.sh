#!/usr/bin/env bash
# Verification for 20261101020000_optimize_timezone_lookups.sql on scratch PostgreSQL.
# Tests:
# 1. Setup mock profiles, daily_sadhana, mala_sessions tables.
# 2. Phase 1: Apply migration, verify safe_timezone works for valid and invalid timezones.
# 3. Phase 2: Verify notification_cadence_safe_timezone uses safe_timezone.
# 4. Phase 3: Idempotency (re-apply migration).
# 5. Phase 4: Rollback and re-apply.
set -euo pipefail

MIGRATION_FILE="supabase/migrations/20261101020000_optimize_timezone_lookups.sql"
ROLLBACK_FILE="supabase/rollbacks/20261101020000_optimize_timezone_lookups_rollback.sql"

export PGHOST="${PGHOST:-/tmp}"
export PGPORT="${PGPORT:-5432}"
unset PGDATABASE PGSERVICE PGSERVICEFILE

TEST_DB="scratch_optimize_tz_test_$$"
echo "Creating isolated test database: $TEST_DB"
createdb "$TEST_DB"
trap 'dropdb --if-exists "$TEST_DB"' EXIT
PSQL=(psql -X -q -v ON_ERROR_STOP=1 -d "$TEST_DB")

echo "Setting up mock tables..."
"${PSQL[@]}" <<'SQL'
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT id FROM auth.users LIMIT 1; $$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  timezone text,
  tradition text,
  active_symbol_id text,
  japa_reminder_enabled boolean,
  last_freeze_used date,
  streak_freeze_count integer,
  karma_points integer
);

CREATE TABLE public.daily_sadhana (
  user_id uuid,
  date date,
  japa_done boolean,
  streak_count integer,
  created_at timestamptz,
  updated_at timestamptz,
  PRIMARY KEY (user_id, date)
);

CREATE TABLE public.mala_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
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
  user_id uuid,
  amount integer,
  reason text,
  created_at timestamptz
);
SQL

echo "===> Phase 1: Apply migration"
"${PSQL[@]}" -f "$MIGRATION_FILE"

# Test safe_timezone directly
TEST_TZ=$("${PSQL[@]}" -t -A -c "
  SELECT (public.safe_timezone('Asia/Kolkata') = 'Asia/Kolkata')
     AND (public.safe_timezone('America/New_York') = 'America/New_York')
     AND (public.safe_timezone('Invalid/BogusZone') = 'UTC')
     AND (public.safe_timezone('') = 'UTC')
     AND (public.safe_timezone(NULL) = 'UTC')
     AND (public.safe_timezone('Invalid/BogusZone', 'Asia/Kolkata') = 'Asia/Kolkata');
")

if [ "$TEST_TZ" != "t" ]; then
  echo "FAIL: safe_timezone validation did not return expected outputs: $TEST_TZ"
  exit 1
fi
echo "✓ Phase 1 Passed: safe_timezone correctly validates real zones and safely falls back."

echo "===> Phase 2: Test notification_cadence_safe_timezone"
TEST_CADENCE=$("${PSQL[@]}" -t -A -c "
  SELECT (public.notification_cadence_safe_timezone('Europe/London') = 'Europe/London')
     AND (public.notification_cadence_safe_timezone('Nonexistent/Tz') = 'UTC');
")
if [ "$TEST_CADENCE" != "t" ]; then
  echo "FAIL: notification_cadence_safe_timezone failed: $TEST_CADENCE"
  exit 1
fi
echo "✓ Phase 2 Passed: notification_cadence_safe_timezone correctly delegates to safe_timezone."

echo "===> Phase 3: Idempotency (re-apply migration)"
"${PSQL[@]}" -f "$MIGRATION_FILE"
echo "✓ Phase 3 Passed: Re-apply is clean and idempotent."

echo "===> Phase 4: Rollback and re-apply"
"${PSQL[@]}" -f "$ROLLBACK_FILE"
echo "✓ Rollback executed."
"${PSQL[@]}" -f "$MIGRATION_FILE"
echo "✓ Phase 4 Passed: Re-apply after rollback succeeded."

echo "ALL TESTS PASSED for 20261101020000_optimize_timezone_lookups.sql!"
