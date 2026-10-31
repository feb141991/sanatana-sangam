#!/usr/bin/env bash
# Verification for 20261031090000_unschedule_redundant_net_response_purge.sql on a scratch PostgreSQL (mock pg_cron / pg_net).
# Sequence under test, the real one: 20261030120000 (already applied in production) creates both jobs, then this migration
# removes only the pg_net job. Checks: the other job and all rows are untouched; absent-job and re-apply are no-ops;
# the rollback restores the job exactly as 20261030120000 defined it, and is idempotent.
set -euo pipefail

PURGE_MIGRATION="supabase/migrations/20261030120000_purge_cron_and_net_history.sql"
MIGRATION_FILE="${MIGRATION_FILE:-supabase/migrations/20261031090000_unschedule_redundant_net_response_purge.sql}"
ROLLBACK_FILE="${ROLLBACK_FILE:-supabase/rollbacks/20261031090000_unschedule_redundant_net_response_purge_rollback.sql}"

export PGHOST="${PGHOST:-/tmp}"
export PGPORT="${PGPORT:-5432}"
unset PGDATABASE PGSERVICE PGSERVICEFILE

TEST_DB="scratch_unschedule_net_test_$$"
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
CREATE TABLE net._http_response (id bigserial PRIMARY KEY, status_code integer, content text, created timestamptz DEFAULT now());
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

echo "===> Phase 0: absent job - applying this migration to a database that never had the job must be a no-op"
"${PSQL[@]}" -f "$MIGRATION_FILE"

echo "===> Phase 1: seed rows that must survive, 20261030120000 creates both jobs, snapshot, then APPLY this migration"
# Seeded only now, after Phase 0, so a migration that deletes data cannot hide by running before the rows exist.
"${PSQL[@]}" <<'SQL'
INSERT INTO cron.job_run_details (command, status, start_time, end_time) VALUES
  ('recent-1', 'succeeded', now() - interval '3 days', now() - interval '3 days'),
  ('recent-2', 'succeeded', now() - interval '1 hour', now() - interval '1 hour');
INSERT INTO net._http_response (status_code, content, created) VALUES (200, 'recent', now() - interval '2 days');
SQL
"${PSQL[@]}" -f "$PURGE_MIGRATION"
"${PSQL[@]}" <<'SQL'
CREATE TABLE public._snapshot AS
  SELECT jobname, schedule, command, active FROM cron.job;
CREATE TABLE public._rows AS
  SELECT (SELECT count(*) FROM cron.job_run_details) AS cron_rows, (SELECT count(*) FROM net._http_response) AS net_rows;
DO $$ BEGIN
  IF (SELECT count(*) FROM cron.job) <> 2 THEN RAISE EXCEPTION 'precondition: expected 2 jobs after 20261030120000'; END IF;
END $$;
SQL
"${PSQL[@]}" -f "$MIGRATION_FILE"

check_after_apply() {
  "${PSQL[@]}" <<'SQL'
DO $$
DECLARE r record;
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-net-http-response-daily') THEN
    RAISE EXCEPTION 'purge-net-http-response-daily is still scheduled';
  END IF;
  -- the cron.job_run_details job is untouched (same schedule, command, active)
  SELECT * INTO r FROM public._snapshot WHERE jobname = 'purge-cron-job-run-details-daily';
  IF NOT EXISTS (SELECT 1 FROM cron.job j WHERE j.jobname = r.jobname AND j.schedule = r.schedule
                 AND j.command = r.command AND j.active = r.active) THEN
    RAISE EXCEPTION 'purge-cron-job-run-details-daily was changed or removed';
  END IF;
  IF (SELECT count(*) FROM cron.job) <> 1 THEN
    RAISE EXCEPTION 'expected exactly 1 remaining job, found %', (SELECT count(*) FROM cron.job);
  END IF;
  -- no data touched
  IF (SELECT count(*) FROM cron.job_run_details) <> (SELECT cron_rows FROM public._rows)
     OR (SELECT count(*) FROM net._http_response) <> (SELECT net_rows FROM public._rows) THEN
    RAISE EXCEPTION 'this migration changed row counts';
  END IF;
END $$;
SQL
}
check_after_apply
echo "✓ Only the pg_net job was removed; the other job and every row are untouched"

echo "===> Phase 2: re-apply is a no-op"
"${PSQL[@]}" -f "$MIGRATION_FILE"
check_after_apply
echo "✓ Re-apply changed nothing"

echo "===> Phase 3: ROLLBACK restores the job exactly as 20261030120000 defined it"
"${PSQL[@]}" -f "$ROLLBACK_FILE" >/dev/null
"${PSQL[@]}" <<'SQL'
DO $$
DECLARE s record; j record;
BEGIN
  FOR s IN SELECT * FROM public._snapshot LOOP
    SELECT * INTO j FROM cron.job WHERE jobname = s.jobname;
    IF NOT FOUND OR j.schedule <> s.schedule OR j.command <> s.command OR j.active <> s.active THEN
      RAISE EXCEPTION 'job % not restored identically (schedule/command/active differ)', s.jobname;
    END IF;
  END LOOP;
  IF (SELECT count(*) FROM cron.job) <> (SELECT count(*) FROM public._snapshot) THEN
    RAISE EXCEPTION 'unexpected job count after rollback';
  END IF;
END $$;
SQL
"${PSQL[@]}" -f "$ROLLBACK_FILE" >/dev/null
"${PSQL[@]}" -c "DO \$\$ BEGIN IF (SELECT count(*) FROM cron.job) <> 2 THEN RAISE EXCEPTION 'rollback is not idempotent'; END IF; END \$\$;"
echo "✓ Rollback restored both jobs identically and is idempotent"

echo "===> Phase 4: RE-APPLY after rollback"
"${PSQL[@]}" -f "$MIGRATION_FILE"
check_after_apply
echo "✓ Re-apply after rollback works"

echo "ALL TESTS PASSED for 20261031090000_unschedule_redundant_net_response_purge.sql"
