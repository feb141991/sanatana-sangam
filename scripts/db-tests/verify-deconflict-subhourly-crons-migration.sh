#!/usr/bin/env bash
# Verification for 20261101180000_deconflict_subhourly_crons.sql on scratch PostgreSQL.
set -euo pipefail

MIGRATION_FILE="supabase/migrations/20261101180000_deconflict_subhourly_crons.sql"
ROLLBACK_FILE="supabase/rollbacks/20261101180000_deconflict_subhourly_crons_rollback.sql"

export PGHOST="${PGHOST:-/tmp}"
export PGPORT="${PGPORT:-5432}"
unset PGDATABASE PGSERVICE PGSERVICEFILE

TEST_DB="scratch_deconflict_subhourly_test_$$"
echo "Creating isolated test database: $TEST_DB"
createdb "$TEST_DB"
trap 'dropdb --if-exists "$TEST_DB"' EXIT
PSQL=(psql -X -q -v ON_ERROR_STOP=1 -d "$TEST_DB")

echo "Setting up mock pg_cron and pg_net..."
"${PSQL[@]}" <<'SQL'
CREATE SCHEMA cron;
CREATE TABLE cron.job (
  jobid bigserial PRIMARY KEY,
  schedule text NOT NULL,
  command text NOT NULL,
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
BEGIN DELETE FROM cron.job WHERE jobname = p_jobname; RETURN FOUND; END $$;

SELECT cron.schedule('notification-candidate-resolver-every-10-min', '*/10 * * * *', 'SELECT 1;');
SELECT cron.schedule('notification-dispatch-every-10-min', '*/10 * * * *', 'SELECT 1;');
SELECT cron.schedule('social-pipeline-tick-every-15-min', '*/15 * * * *', 'SELECT 1;');
SELECT cron.schedule('control-job', '0 12 * * *', 'SELECT 1;');
SQL

echo "===> Phase 1: Apply migration"
"${PSQL[@]}" -f "$MIGRATION_FILE"

CHECK=$("${PSQL[@]}" -t -A -c "
  SELECT (
    (SELECT schedule FROM cron.job WHERE jobname = 'notification-candidate-resolver-every-10-min') = '1,11,21,31,41,51 * * * *' AND
    (SELECT schedule FROM cron.job WHERE jobname = 'notification-dispatch-every-10-min') = '3,13,23,33,43,53 * * * *' AND
    (SELECT schedule FROM cron.job WHERE jobname = 'social-pipeline-tick-every-15-min') = '7,22,37,52 * * * *' AND
    (SELECT schedule FROM cron.job WHERE jobname = 'control-job') = '0 12 * * *'
  );
")

if [ "$CHECK" != "t" ]; then
  echo "FAIL: schedules not expected"
  "${PSQL[@]}" -c "SELECT jobname, schedule FROM cron.job;"
  exit 1
fi
echo "✓ Phase 1 Passed: schedules updated cleanly, control untouched."

echo "===> Phase 2: Idempotency"
"${PSQL[@]}" -f "$MIGRATION_FILE"
echo "✓ Phase 2 Passed: re-apply is clean."

echo "===> Phase 3: Rollback"
"${PSQL[@]}" -f "$ROLLBACK_FILE"
CHECK_RB=$("${PSQL[@]}" -t -A -c "
  SELECT (
    (SELECT schedule FROM cron.job WHERE jobname = 'notification-candidate-resolver-every-10-min') = '*/10 * * * *' AND
    (SELECT schedule FROM cron.job WHERE jobname = 'notification-dispatch-every-10-min') = '*/10 * * * *' AND
    (SELECT schedule FROM cron.job WHERE jobname = 'social-pipeline-tick-every-15-min') = '*/15 * * * *'
  );
")
if [ "$CHECK_RB" != "t" ]; then
  echo "FAIL: rollback failed"
  exit 1
fi
echo "✓ Phase 3 Passed: rollback restored original schedules."

echo "===> Phase 4: Re-apply"
"${PSQL[@]}" -f "$MIGRATION_FILE"
echo "✓ Phase 4 Passed: re-apply works."

echo "ALL TESTS PASSED for 20261101180000_deconflict_subhourly_crons.sql!"
