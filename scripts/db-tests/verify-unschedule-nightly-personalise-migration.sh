#!/usr/bin/env bash
# Verification for 20261031140000_unschedule_nightly_personalise_cron.sql on a scratch PostgreSQL.
# Sequence under test:
# 1. Setup mock pg_cron and pg_net.
# 2. Phase 0: absent job - applying migration when job doesn't exist is a no-op.
# 3. Phase 1: create nightly-personalise job + another job (e.g. purge-cron-job-run-details-daily),
#    apply migration, confirm only nightly-personalise is removed, other job untouched.
# 4. Phase 2: re-apply is a no-op.
# 5. Phase 3: rollback restores nightly-personalise identically.
# 6. Phase 4: re-apply after rollback works cleanly.
set -euo pipefail

MIGRATION_FILE="supabase/migrations/20261031140000_unschedule_nightly_personalise_cron.sql"
ROLLBACK_FILE="supabase/rollbacks/20261031140000_unschedule_nightly_personalise_cron_rollback.sql"

export PGHOST="${PGHOST:-/tmp}"
export PGPORT="${PGPORT:-5432}"
unset PGDATABASE PGSERVICE PGSERVICEFILE

TEST_DB="scratch_unschedule_personalise_test_$$"
echo "Creating isolated test database: $TEST_DB"
createdb "$TEST_DB"
trap 'dropdb --if-exists "$TEST_DB"' EXIT
PSQL=(psql -X -q -v ON_ERROR_STOP=1 -d "$TEST_DB")

echo "Setting up mock pg_cron and pg_net..."
"${PSQL[@]}" <<'SQL'
CREATE SCHEMA cron;
CREATE SCHEMA net;
CREATE TABLE cron.job (
  jobid bigserial PRIMARY KEY, schedule text NOT NULL, command text NOT NULL,
  active boolean DEFAULT true, jobname text UNIQUE
);
CREATE TABLE cron.job_run_details (
  jobid bigint, runid bigserial PRIMARY KEY, command text, status text, start_time timestamptz, end_time timestamptz
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
SQL

echo "===> Phase 0: absent job - applying migration when job is not present must be a clean no-op"
"${PSQL[@]}" -f "$MIGRATION_FILE"

echo "===> Phase 1: setup nightly-personalise and a control job, then apply migration"
"${PSQL[@]}" -f "$ROLLBACK_FILE"
"${PSQL[@]}" -c "SELECT cron.schedule('purge-cron-job-run-details-daily', '15 3 * * *', 'DELETE FROM cron.job_run_details');"

"${PSQL[@]}" <<'SQL'
DO $$ BEGIN
  IF (SELECT count(*) FROM cron.job) <> 2 THEN RAISE EXCEPTION 'precondition: expected 2 jobs'; END IF;
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'nightly-personalise') THEN RAISE EXCEPTION 'precondition: missing nightly-personalise'; END IF;
END $$;
SQL

"${PSQL[@]}" -f "$MIGRATION_FILE"

check_after_apply() {
  "${PSQL[@]}" <<'SQL'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'nightly-personalise') THEN
    RAISE EXCEPTION 'nightly-personalise is still scheduled';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-cron-job-run-details-daily') THEN
    RAISE EXCEPTION 'control job purge-cron-job-run-details-daily was incorrectly removed';
  END IF;
  IF (SELECT count(*) FROM cron.job) <> 1 THEN
    RAISE EXCEPTION 'expected exactly 1 remaining job, found %', (SELECT count(*) FROM cron.job);
  END IF;
END $$;
SQL
}

check_after_apply
echo "✓ Only nightly-personalise was removed; control job is untouched"

echo "===> Phase 2: re-apply is idempotent"
"${PSQL[@]}" -f "$MIGRATION_FILE"
check_after_apply
echo "✓ Re-apply changed nothing"

echo "===> Phase 3: ROLLBACK restores nightly-personalise"
"${PSQL[@]}" -f "$ROLLBACK_FILE" >/dev/null
"${PSQL[@]}" <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'nightly-personalise' AND schedule = '0 4 * * *') THEN
    RAISE EXCEPTION 'nightly-personalise not restored correctly';
  END IF;
  IF (SELECT count(*) FROM cron.job) <> 2 THEN
    RAISE EXCEPTION 'expected 2 jobs after rollback';
  END IF;
END $$;
SQL
echo "✓ Rollback restored nightly-personalise identically"

echo "===> Phase 4: RE-APPLY after rollback"
"${PSQL[@]}" -f "$MIGRATION_FILE"
check_after_apply
echo "✓ Re-apply after rollback works"

echo "ALL TESTS PASSED for 20261031140000_unschedule_nightly_personalise_cron.sql"
