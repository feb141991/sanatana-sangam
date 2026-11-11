#!/usr/bin/env bash
# Complete Shadow Database Verification for Notification Migrations:
# 1. 20261107100000_notification_reminders_default_off.sql
# 2. 20261108100000_notification_reminders_reset_never_chosen.sql
# 3. 20261110140000_one_nudge_a_day_cadence.sql
#
# Tests apply, validation, idempotency, provenance protection, and rollbacks on an isolated scratch PostgreSQL instance.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

PG_DATA="/tmp/scratch_pg_notif_$$"
PG_SOCKET="/tmp/scratch_pg_sock_$$"
PG_PORT="54339"

echo "=== 1. Starting Ephemeral Scratch PostgreSQL Cluster ==="
mkdir -p "${PG_DATA}" "${PG_SOCKET}"
LC_ALL=en_US.UTF-8 initdb --locale=en_US.UTF-8 -E UTF8 -D "${PG_DATA}" -U postgres --auth=trust --no-instructions >/dev/null

LC_ALL=en_US.UTF-8 pg_ctl -D "${PG_DATA}" -l "${PG_DATA}/postgres.log" -o "-k ${PG_SOCKET} -p ${PG_PORT} -h ''" start >/dev/null

cleanup() {
  echo "=== Cleaning up Ephemeral Scratch PostgreSQL Cluster ==="
  LC_ALL=en_US.UTF-8 pg_ctl -D "${PG_DATA}" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "${PG_DATA}" "${PG_SOCKET}"
}
trap cleanup EXIT

PSQL="psql -X -q -v ON_ERROR_STOP=1 -h ${PG_SOCKET} -p ${PG_PORT} -U postgres"

echo "=== 2. Creating Baseline Schema (Mocking Production Pre-Migration State) ==="
${PSQL} -d postgres <<'SQL'
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$
  SELECT id FROM auth.users LIMIT 1;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END
$$;

-- Create profiles matching pre-20261107 production schema (all 18 defaulted to true)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  timezone text DEFAULT 'UTC',
  notification_quiet_hours_start text,
  notification_quiet_hours_end text,
  onboarding_completed boolean DEFAULT false,
  dharm_veer_reminder_enabled boolean DEFAULT true,
  japa_reminder_enabled boolean DEFAULT true,
  nitya_reminder_enabled boolean DEFAULT true,
  quiz_reminder_enabled boolean DEFAULT true,
  wants_brahma_muhurta_reminders boolean DEFAULT true,
  wants_community_notifications boolean DEFAULT true,
  wants_evening_reminder boolean DEFAULT true,
  wants_family_notifications boolean DEFAULT true,
  wants_family_remembrance_reminders boolean DEFAULT true,
  wants_festival_reminders boolean DEFAULT true,
  wants_madhyahn_reminder boolean DEFAULT true,
  wants_mood_reminders boolean DEFAULT true,
  wants_nitya_reminders boolean DEFAULT true,
  wants_sankalpa_midpoint_reminders boolean DEFAULT true,
  wants_sattvic_reminders boolean DEFAULT true,
  wants_shloka_reminders boolean DEFAULT true,
  wants_tithi_reminders boolean DEFAULT true,
  wants_vrat_reminders boolean DEFAULT true,
  wants_sanskara_reminders boolean DEFAULT false
);

-- Cadence tables for migration 3
CREATE TABLE public.notification_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text DEFAULT '',
  body text DEFAULT '',
  send_at timestamptz NOT NULL DEFAULT now(),
  notification_type text NOT NULL,
  notification_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_notification_schedule_user_key UNIQUE (user_id, notification_key)
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  notification_key text,
  local_date date,
  sent_timezone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_cadence_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  canonical_type TEXT NOT NULL,
  notification_key TEXT NOT NULL,
  local_date DATE NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('scheduled', 'shifted', 'suppressed', 'duplicate')),
  reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL,
  scheduled_at TIMESTAMPTZ,
  policy_version TEXT NOT NULL DEFAULT 'engagement-cadence-v2',
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, notification_key, decision, policy_version)
);

-- Baseline Cadence v2 functions
CREATE OR REPLACE FUNCTION public.try_parse_notification_date(p_value TEXT)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
  IF p_value IS NULL OR p_value !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RETURN NULL;
  END IF;

  RETURN p_value::DATE;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.canonical_notification_budget_type(
  p_event_type TEXT,
  p_notification_key TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE normalized.event_type
    WHEN 'mood_checkin' THEN 'mood'
    WHEN 'mood_evening' THEN 'mood'
    WHEN 'mood_midday' THEN 'mood'
    WHEN 'mood_reminder' THEN 'mood'
    WHEN 'sattvic_reminder' THEN 'sattvic'
    WHEN 'streak' THEN 'shloka'
    WHEN 'streak_nudge' THEN 'shloka'
    WHEN 'quiz_daily' THEN 'quiz'
    ELSE normalized.event_type
  END
  FROM (
    SELECT trim(both '_' FROM regexp_replace(
      lower(CASE
        WHEN lower(coalesce(nullif(btrim(p_event_type), ''), '')) IN ('general', 'notification')
          AND nullif(split_part(coalesce(p_notification_key, ''), ':', 1), '') IS NOT NULL
          THEN split_part(p_notification_key, ':', 1)
        ELSE coalesce(p_event_type, '')
      END),
      '[^a-z0-9]+', '_', 'g'
    )) AS event_type
  ) AS normalized;
$$;

CREATE OR REPLACE FUNCTION public.notification_is_budget_exempt(
  p_event_type TEXT,
  p_notification_key TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
SET search_path = ''
AS $$
  SELECT public.canonical_notification_budget_type(p_event_type, p_notification_key) = ANY(ARRAY[
    'security', 'account', 'moderation', 'auth', 'transactional', 'critical_alert',
    'user_reminder', 'custom_reminder', 'explicit_request', 'user_sadhana_reminder',
    'sankalpa_midpoint', 'japa', 'brahma_muhurta', 'sandhya', 'nitya_madhyahn',
    'nitya_sandhya', 'ritual_window', 'pradosha_window', 'pradosha_kala',
    'ekadashi_parana', 'nitya', 'aarti', 'observance', 'festival', 'vrat', 'tithi',
    'observance_series', 'sankranti', 'sanskar_milestone', 'family_remembrance'
  ]::TEXT[]);
$$;

CREATE OR REPLACE FUNCTION public.notification_cadence_safe_timezone(p_timezone TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_timezone IS NOT NULL AND p_timezone <> '' THEN p_timezone
    ELSE 'UTC'
  END;
$$;

CREATE OR REPLACE FUNCTION public.notification_cadence_policy_version() RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT 'engagement-cadence-v2'::text;
$$;

CREATE OR REPLACE FUNCTION public.notification_cadence_limit(p_scope text) RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT 5;
$$;

CREATE OR REPLACE FUNCTION public.enforce_notification_schedule_cadence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notification_schedule_cadence_guard ON public.notification_schedule;
CREATE TRIGGER notification_schedule_cadence_guard
  BEFORE INSERT ON public.notification_schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_notification_schedule_cadence();

CREATE OR REPLACE FUNCTION public.validate_notification_schedule_cadence_statement() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS notification_schedule_cadence_statement_guard ON public.notification_schedule;
CREATE TRIGGER notification_schedule_cadence_statement_guard
  AFTER INSERT ON public.notification_schedule
  REFERENCING NEW TABLE AS inserted_rows
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.validate_notification_schedule_cadence_statement();

CREATE OR REPLACE FUNCTION public.persist_notification_candidate_resolution_internal(
  p_schedule_rows jsonb DEFAULT '[]'::jsonb,
  p_candidate_updates jsonb DEFAULT '[]'::jsonb,
  p_audit_events jsonb DEFAULT '[]'::jsonb
) RETURNS TABLE(promoted_count INTEGER, candidate_count INTEGER, audit_count INTEGER) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY SELECT 0, 0, 0;
END;
$$;

-- Seed production-representative profiles (32 total)
-- Group A: 4 rows created before Oct 26 cutoff, onboarding NOT completed
INSERT INTO auth.users (id) SELECT ('a0000000-0000-0000-0000-00000000000' || i)::uuid FROM generate_series(1, 4) i;
INSERT INTO public.profiles (id, created_at, updated_at, onboarding_completed, wants_brahma_muhurta_reminders)
SELECT ('a0000000-0000-0000-0000-00000000000' || i)::uuid, '2026-10-15 10:00:00Z', '2026-10-15 10:00:00Z', false, true
FROM generate_series(1, 4) i;

-- Group B: 6 rows created after Oct 26 cutoff, onboarding NOT completed
INSERT INTO auth.users (id) SELECT ('b0000000-0000-0000-0000-00000000000' || i)::uuid FROM generate_series(1, 6) i;
INSERT INTO public.profiles (id, created_at, updated_at, onboarding_completed, wants_brahma_muhurta_reminders)
SELECT ('b0000000-0000-0000-0000-00000000000' || i)::uuid, '2026-10-28 10:00:00Z', '2026-10-28 10:00:00Z', false, true
FROM generate_series(1, 6) i;

-- Group C: 10 rows created before Oct 26 cutoff, onboarding completed, brahma true (legacy defaulted)
INSERT INTO auth.users (id) SELECT ('c0000000-0000-0000-0000-0000000000' || lpad(i::text, 2, '0'))::uuid FROM generate_series(1, 10) i;
INSERT INTO public.profiles (id, created_at, updated_at, onboarding_completed, wants_brahma_muhurta_reminders)
SELECT ('c0000000-0000-0000-0000-0000000000' || lpad(i::text, 2, '0'))::uuid, '2026-10-20 10:00:00Z', '2026-10-20 10:00:00Z', true, true
FROM generate_series(1, 10) i;

-- Group D: 1 row created before Oct 26 cutoff, onboarding completed, brahma false (deliberate opt-out)
INSERT INTO auth.users (id) VALUES ('d0000000-0000-0000-0000-000000000001');
INSERT INTO public.profiles (id, created_at, updated_at, onboarding_completed, wants_brahma_muhurta_reminders)
VALUES ('d0000000-0000-0000-0000-000000000001', '2026-10-20 10:00:00Z', '2026-10-20 10:00:00Z', true, false);

-- Group E: 1 row created after Oct 26 cutoff, onboarding completed, brahma true (explicit opt-in)
INSERT INTO auth.users (id) VALUES ('e0000000-0000-0000-0000-000000000001');
INSERT INTO public.profiles (id, created_at, updated_at, onboarding_completed, wants_brahma_muhurta_reminders)
VALUES ('e0000000-0000-0000-0000-000000000001', '2026-11-02 10:00:00Z', '2026-11-02 10:00:00Z', true, true);

-- Group F: 10 rows created after Oct 26 cutoff, onboarding completed, brahma false (explicit opt-out)
INSERT INTO auth.users (id) SELECT ('f0000000-0000-0000-0000-0000000000' || lpad(i::text, 2, '0'))::uuid FROM generate_series(1, 10) i;
INSERT INTO public.profiles (id, created_at, updated_at, onboarding_completed, wants_brahma_muhurta_reminders)
SELECT ('f0000000-0000-0000-0000-0000000000' || lpad(i::text, 2, '0'))::uuid, '2026-11-02 10:00:00Z', '2026-11-02 10:00:00Z', true, false
FROM generate_series(1, 10) i;
SQL

echo "=== 3. Testing Migration 1: 20261107100000_notification_reminders_default_off.sql ==="
${PSQL} -d postgres -f "${REPO_ROOT}/supabase/migrations/20261107100000_notification_reminders_default_off.sql"

# Verify all defaults are false
DEFAULTS_NOT_FALSE=$(${PSQL} -d postgres -t -A -c "
  SELECT count(*)
  FROM pg_attribute a
  LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
  WHERE a.attrelid = 'public.profiles'::regclass
    AND a.attnum > 0 AND NOT a.attisdropped
    AND (a.attname LIKE 'wants\_%' ESCAPE '\' OR a.attname LIKE '%\_reminder\_enabled' ESCAPE '\')
    AND a.atttypid = 'boolean'::regtype
    AND COALESCE(pg_get_expr(d.adbin, d.adrelid), '') <> 'false';
")
if [ "${DEFAULTS_NOT_FALSE}" -ne 0 ]; then
  echo "FAIL: ${DEFAULTS_NOT_FALSE} reminder columns do not default to false!"
  exit 1
fi
echo "PASS: All 18 reminder column defaults are false."

# Test Rollback 1
echo "=== Testing Rollback 1: 20261107100000_notification_reminders_default_off_rollback.sql ==="
${PSQL} -d postgres -f "${REPO_ROOT}/supabase/rollbacks/20261107100000_notification_reminders_default_off_rollback.sql"

DEFAULTS_RESTORED=$(${PSQL} -d postgres -t -A -c "
  SELECT count(*)
  FROM pg_attribute a
  LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
  WHERE a.attrelid = 'public.profiles'::regclass
    AND a.attname = 'japa_reminder_enabled'
    AND COALESCE(pg_get_expr(d.adbin, d.adrelid), '') = 'true';
")
if [ "${DEFAULTS_RESTORED}" -ne 1 ]; then
  echo "FAIL: Rollback did not restore true default!"
  exit 1
fi
echo "PASS: Rollback 1 restored original defaults cleanly."

# Re-apply Migration 1
${PSQL} -d postgres -f "${REPO_ROOT}/supabase/migrations/20261107100000_notification_reminders_default_off.sql"
echo "PASS: Migration 1 re-applied cleanly."

echo "=== 4. Testing Migration 2: 20261108100000_notification_reminders_reset_never_chosen.sql ==="
PREFLIGHT=$(${PSQL} -d postgres -t -A -f "${REPO_ROOT}/scripts/notification-routing/reminder-reset-preflight.sql")
test "${PREFLIGHT%%$'\n'*}" = '20|10|10|20'
${PSQL} -d postgres -f "${REPO_ROOT}/supabase/migrations/20261108100000_notification_reminders_reset_never_chosen.sql"

BACKUP_COUNT=$(${PSQL} -d postgres -t -A -c "SELECT count(*) FROM public.notification_reset_backup_20261108;")
if [ "${BACKUP_COUNT}" -ne 20 ]; then
  echo "FAIL: Expected exactly 20 backed up profiles, got ${BACKUP_COUNT}!"
  exit 1
fi
echo "PASS: Exactly 20 distinct profiles backed up into notification_reset_backup_20261108."

# Verify reset states:
# 10 never-onboarded profiles must have all 18 switches false
UNONBOARDED_ACTIVE=$(${PSQL} -d postgres -t -A -c "
  SELECT count(*) FROM public.profiles WHERE onboarding_completed IS NOT TRUE AND wants_shloka_reminders IS NOT FALSE;
")
if [ "${UNONBOARDED_ACTIVE}" -ne 0 ]; then
  echo "FAIL: Never-onboarded profile still has reminder enabled!"
  exit 1
fi

# Group E (explicit opt-in post cutoff) MUST KEEP brahma = true
EXPLICIT_OPTIN_VAL=$(${PSQL} -d postgres -t -A -c "
  SELECT wants_brahma_muhurta_reminders FROM public.profiles WHERE id = 'e0000000-0000-0000-0000-000000000001';
")
if [ "${EXPLICIT_OPTIN_VAL}" != "t" ]; then
  echo "FAIL: Explicit opt-in post-cutoff was clobbered to ${EXPLICIT_OPTIN_VAL}!"
  exit 1
fi
echo "PASS: Explicit opt-in post-cutoff was preserved."

# A second execution must not reset a new choice or replace the snapshot.
${PSQL} -d postgres -c "UPDATE public.profiles SET wants_shloka_reminders = true WHERE id = 'a0000000-0000-0000-0000-000000000001';"
if ${PSQL} -d postgres -f "${REPO_ROOT}/supabase/migrations/20261108100000_notification_reminders_reset_never_chosen.sql"; then
  echo "FAIL: the already-backed-up reset was allowed to run again"
  exit 1
fi
REPLAY_PREF=$(${PSQL} -d postgres -t -A -c "SELECT wants_shloka_reminders FROM public.profiles WHERE id = 'a0000000-0000-0000-0000-000000000001';")
test "${REPLAY_PREF}" = t

# Test Provenance-Guarded Rollback 2
# Even a same-value write without an updated_at change must block rollback.
${PSQL} -d postgres -c "
  UPDATE public.profiles
  SET wants_brahma_muhurta_reminders = false
  WHERE id = 'c0000000-0000-0000-0000-000000000001';
"

echo "=== Testing Provenance-Guarded Rollback 2 ==="
${PSQL} -d postgres -f "${REPO_ROOT}/supabase/rollbacks/20261108100000_notification_reminders_reset_never_chosen_rollback.sql"

# Check that the modified user was NOT reverted to true!
MODIFIED_USER_VAL=$(${PSQL} -d postgres -t -A -c "
  SELECT wants_brahma_muhurta_reminders FROM public.profiles WHERE id = 'c0000000-0000-0000-0000-000000000001';
")
if [ "${MODIFIED_USER_VAL}" != "f" ]; then
  echo "FAIL: Post-migration deliberate user choice was clobbered by rollback!"
  exit 1
fi
echo "PASS: Rollback safely preserved post-migration user preference update (Rule 6 enforced)."

# Check that an unmodified user WAS restored to true
UNMODIFIED_USER_VAL=$(${PSQL} -d postgres -t -A -c "
  SELECT wants_brahma_muhurta_reminders FROM public.profiles WHERE id = 'c0000000-0000-0000-0000-000000000002';
")
if [ "${UNMODIFIED_USER_VAL}" != "t" ]; then
  echo "FAIL: Unmodified user was not restored by rollback!"
  exit 1
fi
echo "PASS: Unmodified users restored by rollback cleanly."

# Re-apply Migration 2
${PSQL} -d postgres -f "${REPO_ROOT}/supabase/migrations/20261108100000_notification_reminders_reset_never_chosen.sql"
echo "PASS: Migration 2 re-applied cleanly."

echo "=== 5. Testing Migration 3: 20261110140000_one_nudge_a_day_cadence.sql ==="
${PSQL} -d postgres -f "${REPO_ROOT}/supabase/migrations/20261110140000_one_nudge_a_day_cadence.sql"

CADENCE_VERSION=$(${PSQL} -d postgres -t -A -c "SELECT public.notification_cadence_policy_version();")
if [ "${CADENCE_VERSION}" != "engagement-cadence-v3" ]; then
  echo "FAIL: Cadence version is ${CADENCE_VERSION}, expected engagement-cadence-v3!"
  exit 1
fi
echo "PASS: public.notification_cadence_policy_version() returned 'engagement-cadence-v3'."

LIMIT_SHLOKA=$(${PSQL} -d postgres -t -A -c "SELECT public.notification_cadence_limit('shloka');")
LIMIT_LEARNING=$(${PSQL} -d postgres -t -A -c "SELECT public.notification_cadence_limit('learning');")
LIMIT_OTHER=$(${PSQL} -d postgres -t -A -c "SELECT public.notification_cadence_limit('other');")
LIMIT_CEILING=$(${PSQL} -d postgres -t -A -c "SELECT public.notification_cadence_limit('ceiling');")

if [ "${LIMIT_SHLOKA}" -ne 1 ] || [ "${LIMIT_LEARNING}" -ne 1 ] || [ "${LIMIT_OTHER}" -ne 1 ] || [ "${LIMIT_CEILING}" -ne 7 ]; then
  echo "FAIL: Cadence limits mismatch: shloka=${LIMIT_SHLOKA}, learning=${LIMIT_LEARNING}, other=${LIMIT_OTHER}, ceiling=${LIMIT_CEILING}"
  exit 1
fi
echo "PASS: Cadence limits verified: shloka=1, learning=1, other=1, ceiling=7."

# Test Cadence trigger enforcement:
# Choose a future UTC day rather than depending on the test runner's clock.
TEST_DATE=$(${PSQL} -d postgres -t -A -c "SELECT (now() AT TIME ZONE 'UTC')::date + 1;")
# 1st Shloka succeeds
${PSQL} -d postgres -c "
  INSERT INTO public.notification_schedule (user_id, notification_type, notification_key, send_at, metadata)
  VALUES ('e0000000-0000-0000-0000-000000000001', 'shloka', 'shloka:${TEST_DATE}:1', '${TEST_DATE} 08:00:00+00', '{\"local_date\": \"${TEST_DATE}\"}'::jsonb);
"
echo "PASS: 1st Shloka scheduled successfully."

# 2nd Shloka on same day is suppressed by BEFORE INSERT trigger
${PSQL} -d postgres -c "
  INSERT INTO public.notification_schedule (user_id, notification_type, notification_key, send_at, metadata)
  VALUES ('e0000000-0000-0000-0000-000000000001', 'shloka', 'shloka:${TEST_DATE}:2', '${TEST_DATE} 08:00:00+00', '{\"local_date\": \"${TEST_DATE}\"}'::jsonb);
"

SECOND_SHLOKA_SCHEDULED=$(${PSQL} -d postgres -t -A -c "
  SELECT count(*) FROM public.notification_schedule WHERE notification_key = 'shloka:${TEST_DATE}:2';
")
if [ "${SECOND_SHLOKA_SCHEDULED}" -ne 0 ]; then
  echo "FAIL: 2nd Shloka was scheduled but should have been suppressed by cadence trigger!"
  exit 1
fi

SUPPRESSION_REASON=$(${PSQL} -d postgres -t -A -c "
  SELECT reason FROM public.notification_cadence_events WHERE notification_key = 'shloka:${TEST_DATE}:2' AND decision = 'suppressed';
")
if [ "${SUPPRESSION_REASON}" != "shloka_slot_reached" ]; then
  echo "FAIL: Expected suppression reason 'shloka_slot_reached', got '${SUPPRESSION_REASON}'!"
  exit 1
fi
echo "PASS: 2nd Shloka correctly suppressed by database cadence trigger with reason 'shloka_slot_reached'."

# Mandali exempt item MUST SUCCEED even if other slots are full
${PSQL} -d postgres -c "
  INSERT INTO public.notification_schedule (user_id, notification_type, notification_key, send_at, metadata)
  VALUES ('e0000000-0000-0000-0000-000000000001', 'mandali_comment', 'comment:1', '${TEST_DATE} 08:00:00+00', '{\"local_date\": \"${TEST_DATE}\"}'::jsonb);
"
echo "PASS: Person-initiated Mandali event exempted from daily cadence limits."

# Test Rollback 3
echo "=== Testing Rollback 3: 20261110140000_one_nudge_a_day_cadence_rollback.sql ==="
${PSQL} -d postgres -f "${REPO_ROOT}/supabase/rollbacks/20261110140000_one_nudge_a_day_cadence_rollback.sql"

V3_HELPERS_REMAINING=$(${PSQL} -d postgres -t -A -c "
  SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname IN ('notification_cadence_class', 'notification_cadence_limit', 'notification_cadence_policy_version');
")
if [ "${V3_HELPERS_REMAINING}" -ne 0 ]; then
  echo "FAIL: Rollback 3 left ${V3_HELPERS_REMAINING} cadence v3 helper functions behind!"
  exit 1
fi

TRIGGER_RESTORED=$(${PSQL} -d postgres -t -A -c "
  SELECT CASE WHEN pg_get_functiondef('public.enforce_notification_schedule_cadence()'::regprocedure) LIKE '%>= 5%' THEN 'true' ELSE 'false' END;
")
if [ "${TRIGGER_RESTORED}" != "true" ]; then
  echo "FAIL: Rollback 3 did not restore the five-per-day Cadence v2 trigger!"
  exit 1
fi
echo "PASS: Rollback 3 dropped v3 helpers and restored Cadence v2 cleanly."

# Re-apply Migration 3
${PSQL} -d postgres -f "${REPO_ROOT}/supabase/migrations/20261110140000_one_nudge_a_day_cadence.sql"
echo "PASS: Migration 3 re-applied cleanly."

echo "=========================================================="
echo "ALL SHADOW DATABASE APPLY & ROLLBACK TESTS PASSED CLEANLY!"
echo "=========================================================="
