#!/usr/bin/env bash
set -euo pipefail

DB_NAME="shoonaya_obs_pref_shadow_$$"
PSQL="$(command -v psql)"
MIGRATION="supabase/migrations/20260923120000_observance_reminder_preferences.sql"
ROLLBACK="supabase/rollbacks/20260923120000_observance_reminder_preferences_rollback.sql"

cleanup() {
  "${PSQL}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "=== Creating shadow database ${DB_NAME} ==="
"${PSQL}" -d postgres -c "CREATE DATABASE ${DB_NAME};" >/dev/null

"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -q <<'SQL'
CREATE SCHEMA auth;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END
$$;
ALTER ROLE service_role BYPASSRLS;

CREATE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL,
  wants_festival_reminders BOOLEAN DEFAULT true NOT NULL,
  wants_shloka_reminders BOOLEAN DEFAULT true NOT NULL,
  wants_nitya_reminders BOOLEAN DEFAULT true NOT NULL,
  wants_community_notifications BOOLEAN DEFAULT true NOT NULL,
  wants_family_notifications BOOLEAN DEFAULT true NOT NULL,
  app_language TEXT DEFAULT 'en' NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;

-- Insert two test users: User 1 (opted in), User 2 (opted out of festival reminders)
INSERT INTO public.profiles (id, username, wants_festival_reminders)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'user_opted_in', true),
  ('22222222-2222-2222-2222-222222222222', 'user_opted_out', false);
SQL

echo "=== Applying Stage O2 Migration ==="
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -f "${MIGRATION}"

echo "=== Verifying backfill and default values ==="
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -q <<'SQL'
DO $$
DECLARE
  u1 RECORD;
  u2 RECORD;
BEGIN
  SELECT * INTO u1 FROM public.profiles WHERE id = '11111111-1111-1111-1111-111111111111';
  SELECT * INTO u2 FROM public.profiles WHERE id = '22222222-2222-2222-2222-222222222222';

  -- User 1 should have defaults: wants_vrat=true, wants_tithi=false, lead_days={1,7}, time='08:00'
  IF u1.wants_vrat_reminders IS NOT TRUE THEN RAISE EXCEPTION 'User 1 wants_vrat_reminders should be true'; END IF;
  IF u1.wants_tithi_reminders IS NOT FALSE THEN RAISE EXCEPTION 'User 1 wants_tithi_reminders should be false'; END IF;
  IF u1.observance_reminder_lead_days <> ARRAY[1, 7] THEN RAISE EXCEPTION 'User 1 lead days should be {1,7}'; END IF;
  IF u1.observance_reminder_time <> '08:00' THEN RAISE EXCEPTION 'User 1 reminder time should be 08:00'; END IF;

  -- User 2 (opted out of festival) must have both vrat and tithi backfilled to false
  IF u2.wants_vrat_reminders IS NOT FALSE THEN RAISE EXCEPTION 'User 2 wants_vrat_reminders should be false'; END IF;
  IF u2.wants_tithi_reminders IS NOT FALSE THEN RAISE EXCEPTION 'User 2 wants_tithi_reminders should be false'; END IF;
END $$;
SQL

echo "=== Verifying constraints ==="
# Test invalid time format rejection
if "${PSQL}" -d "${DB_NAME}" -c "UPDATE public.profiles SET observance_reminder_time = '25:00' WHERE id = '11111111-1111-1111-1111-111111111111';" 2>/dev/null; then
  echo "FAIL: Invalid time format '25:00' was accepted"
  exit 1
else
  echo "PASS: Invalid time format '25:00' rejected by constraint"
fi

if "${PSQL}" -d "${DB_NAME}" -c "UPDATE public.profiles SET observance_reminder_time = 'bad_time' WHERE id = '11111111-1111-1111-1111-111111111111';" 2>/dev/null; then
  echo "FAIL: Invalid time format 'bad_time' was accepted"
  exit 1
else
  echo "PASS: Invalid time format 'bad_time' rejected by constraint"
fi

# Test valid time update
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -c "UPDATE public.profiles SET observance_reminder_time = '06:30' WHERE id = '11111111-1111-1111-1111-111111111111';" >/dev/null
echo "PASS: Valid time '06:30' accepted"

echo "=== Verifying RLS user isolation ==="
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -q <<'SQL'
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

-- Updating own observance preferences should succeed
UPDATE public.profiles
SET wants_vrat_reminders = false,
    observance_reminder_lead_days = ARRAY[0, 1]
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Updating User 2 should update 0 rows
UPDATE public.profiles
SET wants_vrat_reminders = true
WHERE id = '22222222-2222-2222-2222-222222222222';
COMMIT;
SQL

"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -q <<'SQL'
DO $$
DECLARE
  u1 RECORD;
  u2 RECORD;
BEGIN
  SELECT * INTO u1 FROM public.profiles WHERE id = '11111111-1111-1111-1111-111111111111';
  SELECT * INTO u2 FROM public.profiles WHERE id = '22222222-2222-2222-2222-222222222222';

  IF u1.wants_vrat_reminders IS NOT FALSE THEN RAISE EXCEPTION 'User 1 self-update did not take effect'; END IF;
  IF u1.observance_reminder_lead_days <> ARRAY[0, 1] THEN RAISE EXCEPTION 'User 1 lead days did not update'; END IF;
  IF u2.wants_vrat_reminders IS NOT FALSE THEN RAISE EXCEPTION 'User 2 was illegally modified by User 1'; END IF;
END $$;
SQL
echo "PASS: RLS user isolation verified"

echo "=== Testing Rollback ==="
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -f "${ROLLBACK}"

# Verify columns are dropped
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -q <<'SQL'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name IN (
      'wants_vrat_reminders', 'wants_tithi_reminders', 'observance_reminder_lead_days', 'observance_reminder_time'
    )
  ) THEN
    RAISE EXCEPTION 'Rollback failed to drop new columns';
  END IF;
END $$;
SQL
echo "PASS: Rollback dropped all columns cleanly"
echo "=== Shadow test completed successfully ==="
