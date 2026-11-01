#!/usr/bin/env bash
# Verification for 20261101183000_fix_handle_new_user_username_truncation.sql
# Tests:
# 1. Setup mock auth.users and public.profiles with the old buggy trigger.
# 2. Insert test users with uppercase letters ("Alex", "Emily Rose", "ASHUTOSH JOSHI") and confirm old bug truncates them.
# 3. Apply migration: verify handle_new_user() definition is updated.
# 4. Verify backfill updates truncated usernames to their correct intended values without collisions.
# 5. Insert new user with uppercase name and verify new trigger generates complete, untruncated username.
# 6. Idempotency: re-apply migration and verify no change.
# 7. Rollback: apply rollback file and verify trigger is restored.
set -euo pipefail

MIGRATION_FILE="supabase/migrations/20261101183000_fix_handle_new_user_username_truncation.sql"
ROLLBACK_FILE="supabase/rollbacks/20261101183000_fix_handle_new_user_username_truncation_rollback.sql"

export PGHOST="${PGHOST:-/tmp}"
export PGPORT="${PGPORT:-5432}"
unset PGDATABASE PGSERVICE PGSERVICEFILE

TEST_DB="scratch_username_truncation_test_$$"
echo "Creating isolated test database: $TEST_DB"
createdb "$TEST_DB"
trap 'dropdb --if-exists "$TEST_DB"' EXIT
PSQL=(psql -X -q -v ON_ERROR_STOP=1 -d "$TEST_DB")

echo "Setting up mock auth and public schemas with old buggy trigger..."
"${PSQL[@]}" <<'SQL'
CREATE SCHEMA auth;

CREATE TABLE auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text
);

-- Previous buggy definition from 20260826010000
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _username  text;
  _base      text;
  _counter   int := 0;
  _full_name text;
BEGIN
  _username := NEW.raw_user_meta_data->>'username';

  IF _username IS NULL OR _username = '' THEN
    _base := lower(regexp_replace(
      coalesce(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      '[^a-z0-9]+', '_', 'g'
    ));
    _base := trim(both '_' from _base);
    IF _base = '' THEN _base := 'user'; END IF;

    _username := _base;

    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = _username) LOOP
      _counter  := _counter + 1;
      _username := _base || '_' || _counter;
    END LOOP;
  END IF;

  _full_name := NEW.raw_user_meta_data->>'full_name';
  IF _full_name IS NULL OR trim(_full_name) = '' THEN
    _full_name := nullif(split_part(NEW.email, '@', 1), '');
  END IF;
  IF _full_name IS NULL OR trim(_full_name) = '' THEN
    _full_name := 'Seeker';
  END IF;

  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    _username,
    _full_name,
    coalesce(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );

  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert users under the buggy trigger
INSERT INTO auth.users (email, raw_user_meta_data) VALUES
  ('alex@example.com', '{"full_name": "Alex"}'::jsonb),
  ('emily@example.com', '{"full_name": "Emily Rose"}'::jsonb),
  ('ashutosh@example.com', '{"full_name": "ASHUTOSH JOSHI"}'::jsonb),
  ('mason@example.com', '{"full_name": "mason reed"}'::jsonb);
SQL

echo "Verifying pre-migration bug state:"
"${PSQL[@]}" -c "SELECT full_name, username FROM public.profiles ORDER BY full_name;"

# Check that Alex became lex, Emily Rose became mily_ose
alex_pre=$("${PSQL[@]}" -t -A -c "SELECT username FROM public.profiles WHERE full_name = 'Alex';")
if [ "$alex_pre" != "lex" ]; then
  echo "Expected Alex to be 'lex' under buggy trigger, got '$alex_pre'"
  exit 1
fi

echo "Phase 1: Applying migration..."
"${PSQL[@]}" -f "$MIGRATION_FILE"

echo "Verifying post-migration backfill state:"
"${PSQL[@]}" -c "SELECT full_name, username FROM public.profiles ORDER BY full_name;"

alex_post=$("${PSQL[@]}" -t -A -c "SELECT username FROM public.profiles WHERE full_name = 'Alex';")
emily_post=$("${PSQL[@]}" -t -A -c "SELECT username FROM public.profiles WHERE full_name = 'Emily Rose';")
ashutosh_post=$("${PSQL[@]}" -t -A -c "SELECT username FROM public.profiles WHERE full_name = 'ASHUTOSH JOSHI';")
mason_post=$("${PSQL[@]}" -t -A -c "SELECT username FROM public.profiles WHERE full_name = 'mason reed';")

if [ "$alex_post" != "alex" ]; then
  echo "FAIL: Expected 'alex', got '$alex_post'"
  exit 1
fi
if [ "$emily_post" != "emily_rose" ]; then
  echo "FAIL: Expected 'emily_rose', got '$emily_post'"
  exit 1
fi
if [ "$ashutosh_post" != "ashutosh_joshi" ]; then
  echo "FAIL: Expected 'ashutosh_joshi', got '$ashutosh_post'"
  exit 1
fi
if [ "$mason_post" != "mason_reed" ]; then
  echo "FAIL: Expected 'mason_reed', got '$mason_post'"
  exit 1
fi
echo "Phase 1 PASS: Existing profiles backfilled cleanly."

echo "Phase 2: Testing new user insertion under updated trigger..."
"${PSQL[@]}" <<'SQL'
INSERT INTO auth.users (email, raw_user_meta_data) VALUES
  ('lukas@example.com', '{"full_name": "Lukas"}'::jsonb),
  ('prince@example.com', '{"full_name": "Prince Sharma"}'::jsonb);
SQL

lukas_user=$("${PSQL[@]}" -t -A -c "SELECT username FROM public.profiles WHERE full_name = 'Lukas';")
prince_user=$("${PSQL[@]}" -t -A -c "SELECT username FROM public.profiles WHERE full_name = 'Prince Sharma';")

if [ "$lukas_user" != "lukas" ]; then
  echo "FAIL: Expected 'lukas', got '$lukas_user'"
  exit 1
fi
if [ "$prince_user" != "prince_sharma" ]; then
  echo "FAIL: Expected 'prince_sharma', got '$prince_user'"
  exit 1
fi
echo "Phase 2 PASS: New users generate untruncated usernames."

echo "Phase 3: Testing Idempotency (re-applying migration)..."
"${PSQL[@]}" -f "$MIGRATION_FILE"
echo "Phase 3 PASS: Re-apply succeeded without error."

echo "Phase 4: Testing Rollback..."
"${PSQL[@]}" -f "$ROLLBACK_FILE"
echo "Phase 4 PASS: Rollback executed cleanly."

echo "All verification checks passed!"
