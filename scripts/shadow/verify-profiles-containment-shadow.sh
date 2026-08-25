#!/usr/bin/env bash
set -euo pipefail

DB_NAME="shoonaya_profiles_security_shadow_$$"
PSQL="$(command -v psql)"
MIGRATION="supabase/migrations/20260824162352_contain_profiles_exposure.sql"
LOCKDOWN="supabase/migrations/20260824162430_lock_down_profiles_reads.sql"
ROLLBACK="supabase/rollbacks/20260824162352_contain_profiles_exposure_rollback.sql"
LOCKDOWN_ROLLBACK="supabase/rollbacks/20260824162430_lock_down_profiles_reads_rollback.sql"

cleanup() {
  "${PSQL}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};" >/dev/null 2>&1 || true
}
trap cleanup EXIT

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
  avatar_url TEXT,
  bio TEXT,
  date_of_birth DATE,
  tradition TEXT,
  sampradaya TEXT,
  gotra TEXT,
  home_latitude DOUBLE PRECISION,
  home_longitude DOUBLE PRECISION,
  seva_score INTEGER DEFAULT 0,
  weekly_seva INTEGER DEFAULT 0,
  monthly_seva INTEGER DEFAULT 0,
  active_symbol_id TEXT
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;

INSERT INTO public.profiles (
  id, username, avatar_url, bio, date_of_birth, tradition, sampradaya, gotra,
  home_latitude, home_longitude, seva_score, weekly_seva, monthly_seva, active_symbol_id
) VALUES
  ('11111111-1111-1111-1111-111111111111', 'seeker-one', null, 'public bio', '1990-01-01', 'hindu', 'smarta', 'test-gotra', 51.5, -0.1, 10, 2, 4, 'lotus'),
  ('22222222-2222-2222-2222-222222222222', 'seeker-two', null, null, '1991-01-01', 'sikh', null, null, 28.6, 77.2, 20, 3, 5, null);
SQL

"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -f "${MIGRATION}" >/dev/null
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -f "${LOCKDOWN}" >/dev/null

"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE
  column_names TEXT[];
  row_count INTEGER;
  updated_count INTEGER;
BEGIN
  SELECT array_agg(column_name ORDER BY ordinal_position)
  INTO column_names
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'public_profiles';

  IF column_names <> ARRAY['id','username','avatar_url','bio','seva_score','weekly_seva','monthly_seva','active_symbol_id','updated_at'] THEN
    RAISE EXCEPTION 'Unexpected public_profiles columns: %', column_names;
  END IF;

  SELECT count(*) INTO row_count FROM public.public_profiles;
  IF row_count <> 2 THEN RAISE EXCEPTION 'Backfill mismatch: %', row_count; END IF;

  BEGIN
    SET LOCAL ROLE anon;
    PERFORM id FROM public.profiles;
    RAISE EXCEPTION 'anon unexpectedly selected private profiles';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  BEGIN
    SET LOCAL ROLE anon;
    PERFORM id FROM public.public_profiles;
    RAISE EXCEPTION 'anon unexpectedly selected authenticated projection';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  BEGIN
    SET LOCAL ROLE anon;
    INSERT INTO public.public_profiles (id, username) VALUES ('33333333-3333-3333-3333-333333333333', 'forbidden');
    RAISE EXCEPTION 'anon unexpectedly inserted public projection';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  PERFORM set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO row_count FROM public.public_profiles;
  IF row_count <> 2 THEN RAISE EXCEPTION 'authenticated projection count mismatch: %', row_count; END IF;
  SELECT count(*) INTO row_count FROM public.profiles;
  IF row_count <> 1 THEN RAISE EXCEPTION 'authenticated self-read mismatch: %', row_count; END IF;

  UPDATE public.profiles SET username = 'seeker-one-updated', seva_score = 42
  WHERE id = '11111111-1111-1111-1111-111111111111';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count <> 1 THEN RAISE EXCEPTION 'self update failed'; END IF;

  UPDATE public.profiles SET username = 'forbidden'
  WHERE id = '22222222-2222-2222-2222-222222222222';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RESET ROLE;
  IF updated_count <> 0 THEN RAISE EXCEPTION 'cross-user update succeeded'; END IF;

  SELECT count(*) INTO row_count FROM public.public_profiles
  WHERE id = '11111111-1111-1111-1111-111111111111'
    AND username = 'seeker-one-updated'
    AND seva_score = 42;
  IF row_count <> 1 THEN RAISE EXCEPTION 'projection trigger did not synchronize'; END IF;

  IF has_function_privilege('anon', 'app_private.sync_public_profile()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'app_private.sync_public_profile()', 'EXECUTE') THEN
    RAISE EXCEPTION 'projection trigger function is directly executable';
  END IF;

  SET LOCAL ROLE service_role;
  SELECT count(*) INTO row_count FROM public.profiles;
  RESET ROLE;
  IF row_count <> 2 THEN RAISE EXCEPTION 'service role lost private profile access: %', row_count; END IF;
END
$$;

SELECT 'profiles containment shadow: 11 assertions passed' AS result;
SQL

"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -f "${LOCKDOWN_ROLLBACK}" >/dev/null
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -f "${ROLLBACK}" >/dev/null

"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -q <<'SQL'
DO $$
BEGIN
  IF to_regclass('public.public_profiles') IS NOT NULL THEN
    RAISE EXCEPTION 'rollback left public_profiles behind';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.profiles'::regclass
      AND polname = 'Public profiles are viewable by everyone'
      AND pg_get_expr(polqual, polrelid) = 'true'
  ) THEN
    RAISE EXCEPTION 'rollback did not restore legacy read policy';
  END IF;
END
$$;
SQL

echo "profiles containment shadow: PASS"
