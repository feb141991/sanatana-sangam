#!/usr/bin/env bash
# Verification for 20261102150000_unschedule_monitoring_events_purge.sql on a scratch PostgreSQL (mock pg_cron).
# Jobs are created from the real definitions in 20261101190000 (extracted, not retyped). Checks: only the monitoring job is
# removed; the two notification purge jobs, an unrelated job and every row are untouched; absent-job, re-apply and a
# database without pg_cron are no-ops; the rollback restores the job exactly as 20261101190000 defined it and is idempotent.
set -euo pipefail

SOURCE_MIGRATION="supabase/migrations/20261101190000_optimize_notification_indexes_and_cleanup.sql"
MIGRATION_FILE="${MIGRATION_FILE:-supabase/migrations/20261102150000_unschedule_monitoring_events_purge.sql}"
ROLLBACK_FILE="${ROLLBACK_FILE:-supabase/rollbacks/20261102150000_unschedule_monitoring_events_purge_rollback.sql}"

export PGHOST="${PGHOST:-/tmp}"
export PGPORT="${PGPORT:-5432}"
unset PGDATABASE PGSERVICE PGSERVICEFILE

# Pull a job's schedule and command out of 20261101190000 so the test cannot drift from what production was given.
extract_job() {
  python3 -I - "$SOURCE_MIGRATION" "$1" "$2" <<'PY'
import re, sys
path, job, field = sys.argv[1:4]
text = open(path, encoding="utf-8").read()
m = re.search(r"cron\.schedule\(\s*'" + re.escape(job) + r"',\s*'([^']+)',\s*\$cmd\$(.*?)\$cmd\$", text, re.S)
if not m:
    sys.exit(f"job {job} not found in {path}")
print(m.group(1) if field == "schedule" else m.group(2))
PY
}

MON_SCHEDULE="$(extract_job purge-monitoring-events-daily schedule)"
MON_COMMAND="$(extract_job purge-monitoring-events-daily command)"
CAND_SCHEDULE="$(extract_job purge-notification-candidates-daily schedule)"
CAND_COMMAND="$(extract_job purge-notification-candidates-daily command)"
RES_SCHEDULE="$(extract_job purge-notification-resolver-events-daily schedule)"
RES_COMMAND="$(extract_job purge-notification-resolver-events-daily command)"

TEST_DB="scratch_unschedule_monitoring_test_$$"
NOCRON_DB="scratch_unschedule_monitoring_nocron_$$"
echo "Creating isolated test databases: $TEST_DB, $NOCRON_DB"
createdb "$TEST_DB"
createdb "$NOCRON_DB"
trap 'dropdb --if-exists "$TEST_DB"; dropdb --if-exists "$NOCRON_DB"' EXIT
PSQL=(psql -X -q -v ON_ERROR_STOP=1 -d "$TEST_DB")

echo "Setting up mock pg_cron..."
"${PSQL[@]}" <<'SQL'
CREATE SCHEMA cron;
CREATE TABLE cron.job (
  jobid bigserial PRIMARY KEY, schedule text NOT NULL, command text NOT NULL,
  active boolean DEFAULT true, jobname text UNIQUE
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
CREATE TABLE public.monitoring_events (id bigserial PRIMARY KEY, "timestamp" timestamptz NOT NULL, provider text);
SQL

echo "===> Phase 0a: absent job - applying this migration to a database that never had the job must be a no-op"
"${PSQL[@]}" -f "$MIGRATION_FILE"

echo "===> Phase 0b: a database without pg_cron at all must not fail on apply or rollback"
psql -X -q -v ON_ERROR_STOP=1 -d "$NOCRON_DB" -f "$MIGRATION_FILE"
psql -X -q -v ON_ERROR_STOP=1 -d "$NOCRON_DB" -f "$ROLLBACK_FILE" >/dev/null
echo "✓ No pg_cron: both files are no-ops"

echo "===> Phase 1: seed rows that must survive, create the jobs from 20261101190000, snapshot, then APPLY this migration"
# Rows are seeded only now, after Phase 0, so a migration that deletes data cannot hide by running before they exist.
"${PSQL[@]}" <<'SQL'
INSERT INTO public.monitoring_events ("timestamp", provider) VALUES
  (now() - interval '90 days', 'sarvam-hosted'),
  (now() - interval '45 days', 'google-gemini'),
  (now() - interval '1 day',   NULL);
SQL
"${PSQL[@]}" \
  -v mon_schedule="$MON_SCHEDULE" -v mon_command="$MON_COMMAND" \
  -v cand_schedule="$CAND_SCHEDULE" -v cand_command="$CAND_COMMAND" \
  -v res_schedule="$RES_SCHEDULE" -v res_command="$RES_COMMAND" >/dev/null <<'SQL'
SELECT cron.schedule('purge-monitoring-events-daily', :'mon_schedule', :'mon_command');
SELECT cron.schedule('purge-notification-candidates-daily', :'cand_schedule', :'cand_command');
SELECT cron.schedule('purge-notification-resolver-events-daily', :'res_schedule', :'res_command');
SELECT cron.schedule('purge-unrelated-daily', '0 4 * * *', 'SELECT 1');
CREATE TABLE public._snapshot AS SELECT jobname, schedule, command, active FROM cron.job;
CREATE TABLE public._rows AS SELECT count(*) AS monitoring_rows FROM public.monitoring_events;
DO $$ BEGIN
  IF (SELECT count(*) FROM cron.job) <> 4 THEN RAISE EXCEPTION 'precondition: expected 4 jobs before the migration'; END IF;
END $$;
SQL
"${PSQL[@]}" -f "$MIGRATION_FILE"

check_after_apply() {
  "${PSQL[@]}" <<'SQL'
DO $$
DECLARE s record;
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-monitoring-events-daily') THEN
    RAISE EXCEPTION 'purge-monitoring-events-daily is still scheduled';
  END IF;
  -- every other job is untouched (same schedule, command, active)
  FOR s IN SELECT * FROM public._snapshot WHERE jobname <> 'purge-monitoring-events-daily' LOOP
    IF NOT EXISTS (SELECT 1 FROM cron.job j WHERE j.jobname = s.jobname AND j.schedule = s.schedule
                   AND j.command = s.command AND j.active = s.active) THEN
      RAISE EXCEPTION 'job % was changed or removed', s.jobname;
    END IF;
  END LOOP;
  IF (SELECT count(*) FROM cron.job) <> 3 THEN
    RAISE EXCEPTION 'expected exactly 3 remaining jobs, found %', (SELECT count(*) FROM cron.job);
  END IF;
  -- no data touched
  IF (SELECT count(*) FROM public.monitoring_events) <> (SELECT monitoring_rows FROM public._rows) THEN
    RAISE EXCEPTION 'this migration changed monitoring_events row count';
  END IF;
END $$;
SQL
}
check_after_apply
echo "✓ Only the monitoring purge job was removed; the other jobs and every row are untouched"

echo "===> Phase 2: re-apply is a no-op"
"${PSQL[@]}" -f "$MIGRATION_FILE"
check_after_apply
echo "✓ Re-apply changed nothing"

echo "===> Phase 3: ROLLBACK restores the job exactly as 20261101190000 defined it"
"${PSQL[@]}" -f "$ROLLBACK_FILE" >/dev/null
check_after_rollback() {
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
  IF (SELECT count(*) FROM public.monitoring_events) <> (SELECT monitoring_rows FROM public._rows) THEN
    RAISE EXCEPTION 'the rollback changed monitoring_events row count';
  END IF;
END $$;
SQL
}
check_after_rollback
"${PSQL[@]}" -f "$ROLLBACK_FILE" >/dev/null
check_after_rollback
echo "✓ Rollback restored the job identically, touched no rows, and is idempotent"

echo "===> Phase 4: RE-APPLY after rollback"
"${PSQL[@]}" -f "$MIGRATION_FILE"
check_after_apply
echo "✓ Re-apply after rollback works"

echo "ALL TESTS PASSED for 20261102150000_unschedule_monitoring_events_purge.sql"
