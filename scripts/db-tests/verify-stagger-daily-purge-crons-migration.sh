#!/usr/bin/env bash
# Verification for 20261101010000_stagger_daily_purge_crons.sql on scratch PostgreSQL.
# Tests:
# 1. Setup mock pg_cron with 7 original maintenance jobs + 1 control job.
# 2. Phase 1: Apply migration, verify all 7 jobs updated to 19:15-20:45 UTC schedules, control untouched.
# 3. Phase 2: Re-apply migration (idempotency check).
# 4. Phase 3: Apply rollback, verify all 7 jobs restored to 03:15-03:47 UTC.
# 5. Phase 4: Re-apply after rollback.
set -euo pipefail

MIGRATION_FILE="supabase/migrations/20261101010000_stagger_daily_purge_crons.sql"
ROLLBACK_FILE="supabase/rollbacks/20261101010000_stagger_daily_purge_crons_rollback.sql"

export PGHOST="${PGHOST:-/tmp}"
export PGPORT="${PGPORT:-5432}"
unset PGDATABASE PGSERVICE PGSERVICEFILE

TEST_DB="scratch_stagger_purge_crons_test_$$"
echo "Creating isolated test database: $TEST_DB"
createdb "$TEST_DB"
trap 'dropdb --if-exists "$TEST_DB"' EXIT
PSQL=(psql -X -q -v ON_ERROR_STOP=1 -d "$TEST_DB")

echo "Setting up mock pg_cron..."
"${PSQL[@]}" <<'SQL'
CREATE SCHEMA cron;
CREATE TABLE cron.job (
  jobid bigserial PRIMARY KEY,
  schedule text NOT NULL,
  command text NOT NULL,
  nodename text DEFAULT 'localhost',
  nodeport integer DEFAULT 5432,
  database text DEFAULT current_database(),
  username text DEFAULT CURRENT_USER,
  active boolean DEFAULT true,
  jobname text UNIQUE
);

CREATE FUNCTION cron.schedule(p_jobname text, p_schedule text, p_command text) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE v_jobid bigint;
BEGIN
  INSERT INTO cron.job (jobname, schedule, command) VALUES (p_jobname, p_schedule, p_command)
  ON CONFLICT (jobname) DO UPDATE SET schedule = EXCLUDED.schedule, command = EXCLUDED.command
  RETURNING jobid INTO v_jobid;
  RETURN v_jobid;
END $$;

CREATE FUNCTION cron.unschedule(p_jobname text) RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM cron.job WHERE jobname = p_jobname;
  RETURN FOUND;
END $$;
SQL

echo "Seeding original 7 maintenance jobs + control job..."
"${PSQL[@]}" <<'SQL'
SELECT cron.schedule('purge-cron-job-run-details-daily', '15 3 * * *', 'DELETE FROM cron.job_run_details...');
SELECT cron.schedule('purge-client-error-events-daily', '17 3 * * *', 'delete from client_error_events...');
SELECT cron.schedule('purge-native-startup-telemetry-daily', '31 3 * * *', 'delete from native_startup_telemetry...');
SELECT cron.schedule('purge-native-auth-diagnostic-events-daily', '37 3 * * *', 'delete from native_auth_diagnostic_events...');
SELECT cron.schedule('purge-native-api-diagnostic-events-daily', '39 3 * * *', 'delete from native_api_diagnostic_events...');
SELECT cron.schedule('purge-native-product-analytics-daily', '47 3 * * *', 'delete from native_product_analytics_daily...');
SELECT cron.schedule('purge-ai-chat-answer-cache-daily', '47 3 * * *', 'delete from ai_chat_answer_cache...');
SELECT cron.schedule('control-job-keep-untouched', '0 12 * * *', 'SELECT 1;');
SQL

echo "===> Phase 1: Apply migration"
"${PSQL[@]}" -f "$MIGRATION_FILE"

# Verify schedules
CHECK_COUNT=$("${PSQL[@]}" -t -A -c "
  SELECT count(*) FROM cron.job WHERE (
    (jobname = 'purge-cron-job-run-details-daily' AND schedule = '15 19 * * *') OR
    (jobname = 'purge-client-error-events-daily' AND schedule = '30 19 * * *') OR
    (jobname = 'purge-native-startup-telemetry-daily' AND schedule = '45 19 * * *') OR
    (jobname = 'purge-native-auth-diagnostic-events-daily' AND schedule = '00 20 * * *') OR
    (jobname = 'purge-native-api-diagnostic-events-daily' AND schedule = '15 20 * * *') OR
    (jobname = 'purge-native-product-analytics-daily' AND schedule = '30 20 * * *') OR
    (jobname = 'purge-ai-chat-answer-cache-daily' AND schedule = '45 20 * * *') OR
    (jobname = 'control-job-keep-untouched' AND schedule = '0 12 * * *')
  );
")

if [ "$CHECK_COUNT" -ne 8 ]; then
  echo "FAIL: Expected 8 matching jobs after migration, found $CHECK_COUNT"
  "${PSQL[@]}" -c "SELECT jobname, schedule FROM cron.job ORDER BY jobname;"
  exit 1
fi
echo "✓ Phase 1 Passed: All 7 maintenance crons staggered to 19:15-20:45 UTC, control job intact."

echo "===> Phase 2: Idempotency (re-apply migration)"
"${PSQL[@]}" -f "$MIGRATION_FILE"
CHECK_COUNT2=$("${PSQL[@]}" -t -A -c "SELECT count(*) FROM cron.job;")
if [ "$CHECK_COUNT2" -ne 8 ]; then
  echo "FAIL: Re-apply altered job count: $CHECK_COUNT2"
  exit 1
fi
echo "✓ Phase 2 Passed: Re-apply is a safe no-op."

echo "===> Phase 3: Rollback"
"${PSQL[@]}" -f "$ROLLBACK_FILE"
CHECK_ROLLBACK=$("${PSQL[@]}" -t -A -c "
  SELECT count(*) FROM cron.job WHERE (
    (jobname = 'purge-cron-job-run-details-daily' AND schedule = '15 3 * * *') OR
    (jobname = 'purge-client-error-events-daily' AND schedule = '17 3 * * *') OR
    (jobname = 'purge-native-startup-telemetry-daily' AND schedule = '31 3 * * *') OR
    (jobname = 'purge-native-auth-diagnostic-events-daily' AND schedule = '37 3 * * *') OR
    (jobname = 'purge-native-api-diagnostic-events-daily' AND schedule = '39 3 * * *') OR
    (jobname = 'purge-native-product-analytics-daily' AND schedule = '47 3 * * *') OR
    (jobname = 'purge-ai-chat-answer-cache-daily' AND schedule = '47 3 * * *') OR
    (jobname = 'control-job-keep-untouched' AND schedule = '0 12 * * *')
  );
")
if [ "$CHECK_ROLLBACK" -ne 8 ]; then
  echo "FAIL: Rollback did not restore original schedules, found $CHECK_ROLLBACK"
  "${PSQL[@]}" -c "SELECT jobname, schedule FROM cron.job ORDER BY jobname;"
  exit 1
fi
echo "✓ Phase 3 Passed: Rollback restored original 03:xx schedules."

echo "===> Phase 4: Re-apply after rollback"
"${PSQL[@]}" -f "$MIGRATION_FILE"
CHECK_REAPPLY=$("${PSQL[@]}" -t -A -c "
  SELECT count(*) FROM cron.job WHERE schedule LIKE '% 19 * * *' OR schedule LIKE '% 20 * * *';
")
if [ "$CHECK_REAPPLY" -ne 7 ]; then
  echo "FAIL: Re-apply after rollback failed, matched $CHECK_REAPPLY"
  exit 1
fi
echo "✓ Phase 4 Passed: Re-apply after rollback succeeded."

echo "ALL TESTS PASSED for 20261101010000_stagger_daily_purge_crons.sql!"

