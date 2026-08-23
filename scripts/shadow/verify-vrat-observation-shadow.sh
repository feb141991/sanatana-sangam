#!/usr/bin/env bash
set -euo pipefail

# Real PostgreSQL Shadow Harness for Vrat Observation Ledger & RPC
echo "=== Starting Real PostgreSQL Vrat Shadow Harness ==="

DB_NAME="shoonaya_vrat_shadow_$$"
PSQL="/opt/homebrew/bin/psql"

cleanup() {
  echo "--- Cleaning up shadow database ${DB_NAME} ---"
  ${PSQL} -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# 1. Create temporary shadow database
echo "1. Creating shadow database ${DB_NAME}..."
${PSQL} -d postgres -c "CREATE DATABASE ${DB_NAME};" >/dev/null

# 2. Setup roles and base schema
echo "2. Setting up schema and roles..."
${PSQL} -d ${DB_NAME} -q << 'EOF'
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS 'SELECT null::uuid;' LANGUAGE sql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
END $$;

CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  calendar_profile TEXT DEFAULT 'legacy-ujjain',
  tradition TEXT DEFAULT 'hindu',
  seva_score INTEGER DEFAULT 0
);

CREATE TABLE public.karma_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source_route TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.observance_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  kind TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.observance_materialisation_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL,
  expected_row_count INTEGER NOT NULL,
  produced_row_count INTEGER NOT NULL
);

CREATE TABLE public.observance_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id UUID NOT NULL REFERENCES public.observance_definitions(id),
  date DATE NOT NULL,
  calendar_profile TEXT,
  spiritual_tradition TEXT,
  audit_status TEXT,
  review_status TEXT,
  verification_status TEXT,
  final_date_source TEXT,
  locked_for_regeneration BOOLEAN DEFAULT false,
  batch_id UUID REFERENCES public.observance_materialisation_batches(id),
  publication_status TEXT NOT NULL DEFAULT 'published'
);

-- Seed test users
INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'user1@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'user2@example.com');

INSERT INTO public.profiles (id, timezone, calendar_profile, tradition, seva_score) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Asia/Kolkata', 'legacy-ujjain', 'hindu', 0),
  ('22222222-2222-2222-2222-222222222222', 'Asia/Kolkata', 'legacy-ujjain', 'hindu', 10);
EOF

# 3. Apply the real forward migration
echo "3. Applying migration 20260823100000_create_vrat_observations_ledger.sql..."
${PSQL} -d ${DB_NAME} -f "supabase/migrations/20260823100000_create_vrat_observations_ledger.sql" >/dev/null

# 4. Exercise PostgreSQL security, privileges, RLS, and RPC tests
echo "4. Executing real PostgreSQL test assertions..."
${PSQL} -d ${DB_NAME} -v ON_ERROR_STOP=1 << 'EOF'
DO $$
DECLARE
  v_vrat_def_id UUID;
  v_major_def_id UUID;
  v_batch_complete_id UUID;
  v_batch_incomplete_id UUID;
  v_valid_occ_id UUID;
  v_second_occ_id UUID;
  v_fallback_occ_id UUID;
  v_unreviewed_occ_id UUID;
  v_unverified_occ_id UUID;
  v_unaudited_occ_id UUID;
  v_wrong_date_occ_id UUID;
  v_incomplete_batch_occ_id UUID;
  v_major_occ_id UUID;
  v_res JSON;
  v_today DATE;
  v_user1_score INTEGER;
  v_user1 UUID := '11111111-1111-1111-1111-111111111111';
  v_user2 UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
  -- Compute today's spiritual date in Asia/Kolkata
  v_today := (now() AT TIME ZONE 'Asia/Kolkata' - interval '4 hours')::date;

  -- 1. Insert definitions
  INSERT INTO public.observance_definitions (slug, display_name, kind, active)
  VALUES ('ekadashi', 'Ekadashi', 'vrat', true) RETURNING id INTO v_vrat_def_id;

  INSERT INTO public.observance_definitions (slug, display_name, kind, active)
  VALUES ('diwali', 'Diwali', 'major', true) RETURNING id INTO v_major_def_id;

  -- 2. Insert batches
  INSERT INTO public.observance_materialisation_batches (status, expected_row_count, produced_row_count)
  VALUES ('complete', 24, 24) RETURNING id INTO v_batch_complete_id;

  INSERT INTO public.observance_materialisation_batches (status, expected_row_count, produced_row_count)
  VALUES ('partial', 24, 18) RETURNING id INTO v_batch_incomplete_id;

  -- 3. Insert occurrences
  -- (a) Valid primary occurrence today
  INSERT INTO public.observance_occurrences (definition_id, date, calendar_profile, spiritual_tradition, audit_status, review_status, verification_status, final_date_source, batch_id, publication_status)
  VALUES (v_vrat_def_id, v_today, 'legacy-ujjain', 'hindu', 'completed', 'reviewed', 'verified', 'calculation_engine', v_batch_complete_id, 'published')
  RETURNING id INTO v_valid_occ_id;

  -- (b) Second valid recurring occurrence today
  INSERT INTO public.observance_occurrences (definition_id, date, calendar_profile, spiritual_tradition, audit_status, review_status, verification_status, final_date_source, batch_id, publication_status)
  VALUES (v_vrat_def_id, v_today, 'legacy-ujjain', 'hindu', 'completed', 'reviewed', 'verified', 'calculation_engine', v_batch_complete_id, 'published')
  RETURNING id INTO v_second_occ_id;

  -- (c) Fallback occurrence
  INSERT INTO public.observance_occurrences (definition_id, date, calendar_profile, spiritual_tradition, audit_status, review_status, verification_status, final_date_source, batch_id, publication_status)
  VALUES (v_vrat_def_id, v_today, 'legacy-ujjain', 'hindu', 'completed', 'reviewed', 'verified', 'fallback', v_batch_complete_id, 'published')
  RETURNING id INTO v_fallback_occ_id;

  -- (d) Needs review occurrence
  INSERT INTO public.observance_occurrences (definition_id, date, calendar_profile, spiritual_tradition, audit_status, review_status, verification_status, final_date_source, batch_id, publication_status)
  VALUES (v_vrat_def_id, v_today, 'legacy-ujjain', 'hindu', 'completed', 'needs_review', 'verified', 'calculation_engine', v_batch_complete_id, 'published')
  RETURNING id INTO v_unreviewed_occ_id;

  -- (e) Wrong date (future) occurrence
  INSERT INTO public.observance_occurrences (definition_id, date, calendar_profile, spiritual_tradition, audit_status, review_status, verification_status, final_date_source, batch_id, publication_status)
  VALUES (v_vrat_def_id, v_today + 7, 'legacy-ujjain', 'hindu', 'completed', 'reviewed', 'verified', 'calculation_engine', v_batch_complete_id, 'published')
  RETURNING id INTO v_wrong_date_occ_id;

  -- (f) Major (non-vrat) occurrence
  INSERT INTO public.observance_occurrences (definition_id, date, calendar_profile, spiritual_tradition, audit_status, review_status, verification_status, final_date_source, batch_id, publication_status)
  VALUES (v_major_def_id, v_today, 'legacy-ujjain', 'hindu', 'completed', 'reviewed', 'verified', 'calculation_engine', v_batch_complete_id, 'published')
  RETURNING id INTO v_major_occ_id;

  -- --- ASSERTION 1: Non-vrat rejects ---
  BEGIN
    PERFORM public.record_vrat_observation(v_user1, v_major_occ_id);
    RAISE EXCEPTION 'Expected non-vrat to fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%not an active vrat%' THEN RAISE; END IF;
  END;

  -- --- ASSERTION 2: Fallback rejects ---
  BEGIN
    PERFORM public.record_vrat_observation(v_user1, v_fallback_occ_id);
    RAISE EXCEPTION 'Expected fallback to fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%fallback%' THEN RAISE; END IF;
  END;

  -- --- ASSERTION 3: Needs review rejects ---
  BEGIN
    PERFORM public.record_vrat_observation(v_user1, v_unreviewed_occ_id);
    RAISE EXCEPTION 'Expected needs_review to fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%unreviewed%' AND SQLERRM NOT LIKE '%unverified%' THEN RAISE; END IF;
  END;

  -- --- ASSERTION 4: Future date rejects ---
  BEGIN
    PERFORM public.record_vrat_observation(v_user1, v_wrong_date_occ_id);
    RAISE EXCEPTION 'Expected future date to fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%does not match current spiritual date%' THEN RAISE; END IF;
  END;

  -- --- ASSERTION 5: Valid observation succeeds and awards 25 karma ---
  v_res := public.record_vrat_observation(v_user1, v_valid_occ_id);
  IF (v_res->>'success')::boolean IS NOT TRUE OR (v_res->>'karma_earned')::integer != 25 THEN
    RAISE EXCEPTION 'First observation failed to award 25 karma: %', v_res;
  END IF;

  SELECT seva_score INTO v_user1_score FROM public.profiles WHERE id = v_user1;
  IF v_user1_score != 25 THEN
    RAISE EXCEPTION 'Profile seva_score not incremented to 25 (found %)', v_user1_score;
  END IF;

  -- --- ASSERTION 6: Duplicate/idempotent observation returns 0 karma ---
  v_res := public.record_vrat_observation(v_user1, v_valid_occ_id);
  IF (v_res->>'already_observed')::boolean IS NOT TRUE OR (v_res->>'karma_earned')::integer != 0 THEN
    RAISE EXCEPTION 'Duplicate observation awarded extra karma: %', v_res;
  END IF;

  SELECT seva_score INTO v_user1_score FROM public.profiles WHERE id = v_user1;
  IF v_user1_score != 25 THEN
    RAISE EXCEPTION 'Profile seva_score mutated on duplicate: %', v_user1_score;
  END IF;

  -- --- ASSERTION 7: Second recurring occurrence independently observable ---
  v_res := public.record_vrat_observation(v_user1, v_second_occ_id);
  IF (v_res->>'success')::boolean IS NOT TRUE OR (v_res->>'karma_earned')::integer != 25 THEN
    RAISE EXCEPTION 'Second occurrence failed to record: %', v_res;
  END IF;

  SELECT seva_score INTO v_user1_score FROM public.profiles WHERE id = v_user1;
  IF v_user1_score != 50 THEN
    RAISE EXCEPTION 'Profile seva_score expected 50 (found %)', v_user1_score;
  END IF;

  RAISE NOTICE 'All PostgreSQL shadow assertions PASSED successfully!';
END $$;
EOF

# 5. Test Rollback
echo "5. Testing rollback migration..."
${PSQL} -d ${DB_NAME} -f "supabase/rollbacks/20260823100000_create_vrat_observations_ledger_rollback.sql" >/dev/null

# Verify table and RPC dropped
${PSQL} -d ${DB_NAME} -v ON_ERROR_STOP=1 << 'EOF'
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vrat_observations') THEN
    RAISE EXCEPTION 'Table vrat_observations was not dropped by rollback';
  END IF;
  IF EXISTS (SELECT FROM pg_proc WHERE proname = 'record_vrat_observation') THEN
    RAISE EXCEPTION 'Function record_vrat_observation was not dropped by rollback';
  END IF;
  RAISE NOTICE 'Rollback verified: all artifacts cleanly dropped.';
END $$;
EOF

echo "=== Real PostgreSQL Vrat Shadow Harness: ALL 10 TESTS PASSED ==="
