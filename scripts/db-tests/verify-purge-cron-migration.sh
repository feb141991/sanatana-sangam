#!/usr/bin/env bash
# Verification test for 20261030120000_purge_cron_and_net_history.sql
# Tests on scratch PostgreSQL: apply -> rollback -> check for leftovers -> re-apply
set -euo pipefail

export PGHOST="${PGHOST:-/tmp}"
export PGPORT="${PGPORT:-5432}"
unset PGDATABASE PGSERVICE PGSERVICEFILE

TEST_DB="scratch_cron_test_$$"
echo "Creating isolated test database: $TEST_DB"
createdb "$TEST_DB"
trap 'dropdb --if-exists "$TEST_DB"' EXIT

echo "Setting up mock pg_cron and pg_net harness schemas..."
psql -X -v ON_ERROR_STOP=1 -d "$TEST_DB" <<'SQL'
CREATE SCHEMA IF NOT EXISTS cron;
CREATE SCHEMA IF NOT EXISTS net;

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

CREATE TABLE cron.job_run_details (
  jobid bigint,
  runid bigserial PRIMARY KEY,
  job_pid integer,
  database text,
  username text,
  command text,
  status text,
  return_message text,
  start_time timestamptz,
  end_time timestamptz
);

CREATE TABLE net._http_response (
  id bigserial PRIMARY KEY,
  status_code integer,
  content_type text,
  headers jsonb,
  content text,
  timed_out boolean,
  error_msg text,
  created timestamptz DEFAULT now()
);

-- Mock pg_cron scheduling functions
CREATE OR REPLACE FUNCTION cron.schedule(p_jobname text, p_schedule text, p_command text)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  v_jobid bigint;
BEGIN
  INSERT INTO cron.job (jobname, schedule, command)
  VALUES (p_jobname, p_schedule, p_command)
  ON CONFLICT (jobname) DO UPDATE
    SET schedule = EXCLUDED.schedule, command = EXCLUDED.command
  RETURNING jobid INTO v_jobid;
  RETURN v_jobid;
END;
$$;

CREATE OR REPLACE FUNCTION cron.unschedule(p_jobname text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM cron.job WHERE jobname = p_jobname;
  RETURN FOUND;
END;
$$;

-- Seed historical rows into cron.job_run_details
INSERT INTO cron.job_run_details (command, status, start_time, end_time) VALUES
  ('test-old-completed', 'succeeded', now() - interval '10 days', now() - interval '10 days'),
  ('test-old-orphaned', 'running', now() - interval '8 days', NULL),
  ('test-recent-1', 'succeeded', now() - interval '3 days', now() - interval '3 days'),
  ('test-recent-2', 'succeeded', now() - interval '1 hour', now() - interval '1 hour');

-- Seed historical rows into net._http_response
INSERT INTO net._http_response (status_code, content, created) VALUES
  (200, '{"old": true}', now() - interval '9 days'),
  (200, '{"recent": true}', now() - interval '2 days');
SQL

echo "===> Phase 1: APPLY migration"
psql -X -v ON_ERROR_STOP=1 -d "$TEST_DB" -f supabase/migrations/20261030120000_purge_cron_and_net_history.sql

echo "Verifying backlog purge in cron.job_run_details..."
psql -X -v ON_ERROR_STOP=1 -d "$TEST_DB" <<'SQL'
DO $$
DECLARE
  v_count integer;
  v_old_count integer;
BEGIN
  SELECT count(*) INTO v_count FROM cron.job_run_details;
  IF v_count <> 2 THEN
    RAISE EXCEPTION 'Expected 2 remaining rows in cron.job_run_details, got %', v_count;
  END IF;

  SELECT count(*) INTO v_old_count FROM cron.job_run_details
  WHERE COALESCE(end_time, start_time) < now() - interval '7 days';
  IF v_old_count <> 0 THEN
    RAISE EXCEPTION 'Found % unpurged stale rows in cron.job_run_details', v_old_count;
  END IF;
END $$;
SQL
echo "✓ cron.job_run_details purge verified (2 old rows removed, 2 recent rows preserved, orphan handled)"

echo "Verifying backlog purge in net._http_response..."
psql -X -v ON_ERROR_STOP=1 -d "$TEST_DB" <<'SQL'
DO $$
DECLARE
  v_count integer;
  v_old_count integer;
BEGIN
  SELECT count(*) INTO v_count FROM net._http_response;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Expected 1 remaining row in net._http_response, got %', v_count;
  END IF;

  SELECT count(*) INTO v_old_count FROM net._http_response
  WHERE created < now() - interval '7 days';
  IF v_old_count <> 0 THEN
    RAISE EXCEPTION 'Found % unpurged stale rows in net._http_response', v_old_count;
  END IF;
END $$;
SQL
echo "✓ net._http_response purge verified (1 old row removed, 1 recent row preserved)"

echo "Verifying cron jobs scheduled in cron.job..."
psql -X -v ON_ERROR_STOP=1 -d "$TEST_DB" <<'SQL'
DO $$
DECLARE
  v_cron_job_count integer;
BEGIN
  SELECT count(*) INTO v_cron_job_count FROM cron.job
  WHERE jobname IN ('purge-cron-job-run-details-daily', 'purge-net-http-response-daily');
  IF v_cron_job_count <> 2 THEN
    RAISE EXCEPTION 'Expected 2 scheduled cron jobs, got %', v_cron_job_count;
  END IF;
END $$;
SQL
echo "✓ 2 pruning cron jobs confirmed scheduled"

echo "===> Phase 2: ROLLBACK migration"
psql -X -v ON_ERROR_STOP=1 -d "$TEST_DB" -f supabase/rollbacks/20261030120000_purge_cron_and_net_history_rollback.sql

echo "Checking for leftovers in cron.job..."
psql -X -v ON_ERROR_STOP=1 -d "$TEST_DB" <<'SQL'
DO $$
DECLARE
  v_leftovers integer;
BEGIN
  SELECT count(*) INTO v_leftovers FROM cron.job
  WHERE jobname IN ('purge-cron-job-run-details-daily', 'purge-net-http-response-daily');
  IF v_leftovers <> 0 THEN
    RAISE EXCEPTION 'Expected 0 leftover cron jobs after rollback, got %', v_leftovers;
  END IF;
END $$;
SQL
echo "✓ Rollback verified: 0 leftovers in cron.job"

echo "===> Phase 3: RE-APPLY migration (idempotency test)"
psql -X -v ON_ERROR_STOP=1 -d "$TEST_DB" -f supabase/migrations/20261030120000_purge_cron_and_net_history.sql

echo "Checking scheduled jobs after re-application..."
psql -X -v ON_ERROR_STOP=1 -d "$TEST_DB" <<'SQL'
DO $$
DECLARE
  v_cron_job_count integer;
BEGIN
  SELECT count(*) INTO v_cron_job_count FROM cron.job
  WHERE jobname IN ('purge-cron-job-run-details-daily', 'purge-net-http-response-daily');
  IF v_cron_job_count <> 2 THEN
    RAISE EXCEPTION 'Expected 2 scheduled cron jobs after re-apply, got %', v_cron_job_count;
  END IF;
END $$;
SQL
echo "✓ Re-apply verified: 2 scheduled jobs cleanly re-established"

echo "ALL TESTS PASSED for 20261030120000_purge_cron_and_net_history.sql!"
