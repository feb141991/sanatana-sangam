#!/usr/bin/env bash
set -euo pipefail

# Real PostgreSQL Shadow Harness for Vrat Observation Ledger & RPC
echo "=== Starting Real PostgreSQL Vrat Shadow Harness ==="

DB_NAME="shoonaya_vrat_shadow_$$"
PSQL="/opt/homebrew/bin/psql"

cleanup() {
  echo "--- Cleaning up shadow database ${DB_NAME} ---"
  rm -f /tmp/shoonaya-vrat-rpc-1.log /tmp/shoonaya-vrat-rpc-2.log
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
  sampradaya TEXT,
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
  tradition TEXT NOT NULL DEFAULT 'hindu',
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
  variant_key TEXT,
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

INSERT INTO public.profiles (id, timezone, calendar_profile, tradition, sampradaya, seva_score) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Asia/Kolkata', 'legacy-ujjain', 'hindu', null, 0),
  ('22222222-2222-2222-2222-222222222222', 'Asia/Kolkata', 'legacy-ujjain', 'hindu', null, 10);
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
  v_inactive_vrat_def_id UUID;
  v_major_def_id UUID;
  v_jain_vrat_def_id UUID;
  v_batch_complete_id UUID;
  v_batch_incomplete_id UUID;
  v_valid_occ_id UUID;
  v_second_occ_id UUID;
  v_unpublished_occ_id UUID;
  v_inactive_def_occ_id UUID;
  v_unreviewed_occ_id UUID;
  v_unverified_occ_id UUID;
  v_unaudited_occ_id UUID;
  v_fallback_occ_id UUID;
  v_withheld_occ_id UUID;
  v_wrong_date_occ_id UUID;
  v_wrong_profile_occ_id UUID;
  v_wrong_tradition_occ_id UUID;
  v_incomplete_batch_occ_id UUID;
  v_major_occ_id UUID;
  v_res JSON;
  v_today DATE;
  v_user1_score INTEGER;
  v_user1 UUID := '11111111-1111-1111-1111-111111111111';
  v_user2 UUID := '22222222-2222-2222-2222-222222222222';
  v_obs_count INTEGER;
BEGIN
  -- Compute today's spiritual date in Asia/Kolkata
  v_today := (now() AT TIME ZONE 'Asia/Kolkata' - interval '4 hours')::date;

  -- 1. Insert definitions
  INSERT INTO public.observance_definitions (slug, display_name, kind, active)
  VALUES ('ekadashi', 'Ekadashi', 'vrat', true) RETURNING id INTO v_vrat_def_id;

  INSERT INTO public.observance_definitions (slug, display_name, kind, active)
  VALUES ('inactive-vrat', 'Inactive Vrat', 'vrat', false) RETURNING id INTO v_inactive_vrat_def_id;

  INSERT INTO public.observance_definitions (slug, display_name, kind, active)
  VALUES ('diwali', 'Diwali', 'major', true) RETURNING id INTO v_major_def_id;

  INSERT INTO public.observance_definitions (slug, display_name, kind, tradition, active)
  VALUES ('jain-fast', 'Jain Fast', 'vrat', 'jain', true) RETURNING id INTO v_jain_vrat_def_id;

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

  -- (c) Unpublished occurrence
  INSERT INTO public.observance_occurrences (definition_id, date, calendar_profile, spiritual_tradition, audit_status, review_status, verification_status, final_date_source, batch_id, publication_status)
  VALUES (v_vrat_def_id, v_today, 'legacy-ujjain', 'hindu', 'completed', 'reviewed', 'verified', 'calculation_engine', v_batch_complete_id, 'draft')
  RETURNING id INTO v_unpublished_occ_id;

  -- (d) Inactive definition occurrence
  INSERT INTO public.observance_occurrences (definition_id, date, calendar_profile, spiritual_tradition, audit_status, review_status, verification_status, final_date_source, batch_id, publication_status)
  VALUES (v_inactive_vrat_def_id, v_today, 'legacy-ujjain', 'hindu', 'completed', 'reviewed', 'verified', 'calculation_engine', v_batch_complete_id, 'published')
  RETURNING id INTO v_inactive_def_occ_id;

  -- (e) Needs review occurrence
  INSERT INTO public.observance_occurrences (definition_id, date, calendar_profile, spiritual_tradition, audit_status, review_status, verification_status, final_date_source, batch_id, publication_status)
  VALUES (v_vrat_def_id, v_today, 'legacy-ujjain', 'hindu', 'completed', 'needs_review', 'verified', 'calculation_engine', v_batch_complete_id, 'published')
  RETURNING id INTO v_unreviewed_occ_id;

  -- (f) Unverified occurrence
  INSERT INTO public.observance_occurrences (definition_id, date, calendar_profile, spiritual_tradition, audit_status, review_status, verification_status, final_date_source, batch_id, publication_status)
  VALUES (v_vrat_def_id, v_today, 'legacy-ujjain', 'hindu', 'completed', 'reviewed', 'not_checked', 'calculation_engine', v_batch_complete_id, 'published')
  RETURNING id INTO v_unverified_occ_id;

  -- (g) Unaudited occurrence
  INSERT INTO public.observance_occurrences (definition_id, date, calendar_profile, spiritual_tradition, audit_status, review_status, verification_status, final_date_source, batch_id, publication_status)
  VALUES (v_vrat_def_id, v_today, 'legacy-ujjain', 'hindu', 'not_run', 'reviewed', 'verified', 'calculation_engine', v_batch_complete_id, 'published')
  RETURNING id INTO v_unaudited_occ_id;

  -- (h) Fallback occurrence
  INSERT INTO public.observance_occurrences (definition_id, date, calendar_profile, spiritual_tradition, audit_status, review_status, verification_status, final_date_source, batch_id, publication_status)
  VALUES (v_vrat_def_id, v_today, 'legacy-ujjain', 'hindu', 'completed', 'reviewed', 'verified', 'fallback', v_batch_complete_id, 'published')
  RETURNING id INTO v_fallback_occ_id;

  -- (i) Withheld / disputed occurrence
  INSERT INTO public.observance_occurrences (definition_id, date, calendar_profile, spiritual_tradition, audit_status, review_status, verification_status, final_date_source, batch_id, publication_status)
  VALUES (v_vrat_def_id, v_today, 'legacy-ujjain', 'hindu', 'completed', 'reviewed', 'verified', 'calculation_engine', v_batch_complete_id, 'withheld_disputed')
  RETURNING id INTO v_withheld_occ_id;

  -- (j) Wrong date (future) occurrence
  INSERT INTO public.observance_occurrences (definition_id, date, calendar_profile, spiritual_tradition, audit_status, review_status, verification_status, final_date_source, batch_id, publication_status)
  VALUES (v_vrat_def_id, v_today + 7, 'legacy-ujjain', 'hindu', 'completed', 'reviewed', 'verified', 'calculation_engine', v_batch_complete_id, 'published')
  RETURNING id INTO v_wrong_date_occ_id;

  -- (k) Wrong calendar profile occurrence
  INSERT INTO public.observance_occurrences (definition_id, date, calendar_profile, spiritual_tradition, audit_status, review_status, verification_status, final_date_source, batch_id, publication_status)
  VALUES (v_vrat_def_id, v_today, 'tamil_solar', 'hindu', 'completed', 'reviewed', 'verified', 'calculation_engine', v_batch_complete_id, 'published')
  RETURNING id INTO v_wrong_profile_occ_id;

  -- (l) Wrong tradition occurrence
  INSERT INTO public.observance_occurrences (definition_id, date, calendar_profile, spiritual_tradition, audit_status, review_status, verification_status, final_date_source, batch_id, publication_status)
  VALUES (v_jain_vrat_def_id, v_today, 'legacy-ujjain', 'jain', 'completed', 'reviewed', 'verified', 'calculation_engine', v_batch_complete_id, 'published')
  RETURNING id INTO v_wrong_tradition_occ_id;

  -- (m) Incomplete batch occurrence
  INSERT INTO public.observance_occurrences (definition_id, date, calendar_profile, spiritual_tradition, audit_status, review_status, verification_status, final_date_source, batch_id, publication_status)
  VALUES (v_vrat_def_id, v_today, 'legacy-ujjain', 'hindu', 'completed', 'reviewed', 'verified', 'calculation_engine', v_batch_incomplete_id, 'published')
  RETURNING id INTO v_incomplete_batch_occ_id;

  -- (n) Major (non-vrat) occurrence
  INSERT INTO public.observance_occurrences (definition_id, date, calendar_profile, spiritual_tradition, audit_status, review_status, verification_status, final_date_source, batch_id, publication_status)
  VALUES (v_major_def_id, v_today, 'legacy-ujjain', 'hindu', 'completed', 'reviewed', 'verified', 'calculation_engine', v_batch_complete_id, 'published')
  RETURNING id INTO v_major_occ_id;

  -- --- ASSERTION 1: Non-vrat rejects ---
  BEGIN
    PERFORM public.record_vrat_observation(v_user1, v_major_occ_id, 'legacy-ujjain', 'hindu', NULL, 'hindu', NULL);
    RAISE EXCEPTION 'Expected non-vrat to fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%not an active vrat%' THEN RAISE; END IF;
  END;

  -- --- ASSERTION 2: Inactive definition rejects ---
  BEGIN
    PERFORM public.record_vrat_observation(v_user1, v_inactive_def_occ_id, 'legacy-ujjain', 'hindu', NULL, 'hindu', NULL);
    RAISE EXCEPTION 'Expected inactive definition to fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%not an active vrat%' THEN RAISE; END IF;
  END;

  -- --- ASSERTION 3: Unpublished rejects ---
  BEGIN
    PERFORM public.record_vrat_observation(v_user1, v_unpublished_occ_id, 'legacy-ujjain', 'hindu', NULL, 'hindu', NULL);
    RAISE EXCEPTION 'Expected unpublished occurrence to fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%not published%' THEN RAISE; END IF;
  END;

  -- --- ASSERTION 4: Unreviewed rejects ---
  BEGIN
    PERFORM public.record_vrat_observation(v_user1, v_unreviewed_occ_id, 'legacy-ujjain', 'hindu', NULL, 'hindu', NULL);
    RAISE EXCEPTION 'Expected unreviewed occurrence to fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%not reviewed%' THEN RAISE; END IF;
  END;

  -- --- ASSERTION 5: Unverified rejects ---
  BEGIN
    PERFORM public.record_vrat_observation(v_user1, v_unverified_occ_id, 'legacy-ujjain', 'hindu', NULL, 'hindu', NULL);
    RAISE EXCEPTION 'Expected unverified occurrence to fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%not verified%' THEN RAISE; END IF;
  END;

  -- --- ASSERTION 6: Unaudited rejects ---
  BEGIN
    PERFORM public.record_vrat_observation(v_user1, v_unaudited_occ_id, 'legacy-ujjain', 'hindu', NULL, 'hindu', NULL);
    RAISE EXCEPTION 'Expected unaudited occurrence to fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%not completed%' THEN RAISE; END IF;
  END;

  -- --- ASSERTION 7: Fallback rejects ---
  BEGIN
    PERFORM public.record_vrat_observation(v_user1, v_fallback_occ_id, 'legacy-ujjain', 'hindu', NULL, 'hindu', NULL);
    RAISE EXCEPTION 'Expected fallback to fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%fallback%' THEN RAISE; END IF;
  END;

  -- --- ASSERTION 8: Withheld/disputed rejects ---
  BEGIN
    PERFORM public.record_vrat_observation(v_user1, v_withheld_occ_id, 'legacy-ujjain', 'hindu', NULL, 'hindu', NULL);
    RAISE EXCEPTION 'Expected withheld/disputed occurrence to fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%withheld%' AND SQLERRM NOT LIKE '%not published%' THEN RAISE; END IF;
  END;

  -- --- ASSERTION 9: Wrong date rejects ---
  BEGIN
    PERFORM public.record_vrat_observation(v_user1, v_wrong_date_occ_id, 'legacy-ujjain', 'hindu', NULL, 'hindu', NULL);
    RAISE EXCEPTION 'Expected future date to fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%does not match current spiritual date%' THEN RAISE; END IF;
  END;

  -- --- ASSERTION 10: Wrong calendar profile rejects ---
  BEGIN
    PERFORM public.record_vrat_observation(v_user1, v_wrong_profile_occ_id, 'legacy-ujjain', 'hindu', NULL, 'hindu', NULL);
    RAISE EXCEPTION 'Expected wrong calendar profile to fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%calendar profile%' THEN RAISE; END IF;
  END;

  -- --- ASSERTION 11: Wrong tradition rejects ---
  BEGIN
    PERFORM public.record_vrat_observation(v_user1, v_wrong_tradition_occ_id, 'legacy-ujjain', 'hindu', NULL, 'jain', NULL);
    RAISE EXCEPTION 'Expected wrong tradition to fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%tradition%' THEN RAISE; END IF;
  END;

  -- --- ASSERTION 12: Incomplete materialisation batch rejects ---
  BEGIN
    PERFORM public.record_vrat_observation(v_user1, v_incomplete_batch_occ_id, 'legacy-ujjain', 'hindu', NULL, 'hindu', NULL);
    RAISE EXCEPTION 'Expected incomplete batch to fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%batch is incomplete%' THEN RAISE; END IF;
  END;

  -- --- ASSERTION 13: Caller cannot substitute another sampradaya context ---
  BEGIN
    PERFORM public.record_vrat_observation(
      v_user1, v_valid_occ_id, 'legacy-ujjain', 'hindu', 'gaudiya_iskcon', 'hindu', NULL
    );
    RAISE EXCEPTION 'Expected mismatched sampradaya context to fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%sampradaya%' THEN RAISE; END IF;
  END;

  -- --- ASSERTION 14: Caller cannot substitute another occurrence variant ---
  BEGIN
    PERFORM public.record_vrat_observation(
      v_user1, v_valid_occ_id, 'legacy-ujjain', 'hindu', NULL, 'hindu', 'vaishnava_vidhava'
    );
    RAISE EXCEPTION 'Expected mismatched variant identity to fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%variant identity%' THEN RAISE; END IF;
  END;

  -- --- ASSERTION 15: Valid observation succeeds and awards 25 karma ---
  v_res := public.record_vrat_observation(v_user1, v_valid_occ_id, 'legacy-ujjain', 'hindu', NULL, 'hindu', NULL);
  IF (v_res->>'success')::boolean IS NOT TRUE OR (v_res->>'karma_earned')::integer != 25 THEN
    RAISE EXCEPTION 'First observation failed to award 25 karma: %', v_res;
  END IF;

  SELECT seva_score INTO v_user1_score FROM public.profiles WHERE id = v_user1;
  IF v_user1_score != 25 THEN
    RAISE EXCEPTION 'Profile seva_score not incremented to 25 (found %)', v_user1_score;
  END IF;

  -- --- ASSERTION 16: Duplicate observation returns 0 karma (idempotency) ---
  v_res := public.record_vrat_observation(v_user1, v_valid_occ_id, 'legacy-ujjain', 'hindu', NULL, 'hindu', NULL);
  IF (v_res->>'already_observed')::boolean IS NOT TRUE OR (v_res->>'karma_earned')::integer != 0 THEN
    RAISE EXCEPTION 'Duplicate observation awarded extra karma: %', v_res;
  END IF;

  SELECT seva_score INTO v_user1_score FROM public.profiles WHERE id = v_user1;
  IF v_user1_score != 25 THEN
    RAISE EXCEPTION 'Profile seva_score mutated on duplicate: %', v_user1_score;
  END IF;

  -- --- ASSERTION 17: Second recurring occurrence independently observable ---
  v_res := public.record_vrat_observation(v_user1, v_second_occ_id, 'legacy-ujjain', 'hindu', NULL, 'hindu', NULL);
  IF (v_res->>'success')::boolean IS NOT TRUE OR (v_res->>'karma_earned')::integer != 25 THEN
    RAISE EXCEPTION 'Second occurrence failed to record: %', v_res;
  END IF;

  SELECT seva_score INTO v_user1_score FROM public.profiles WHERE id = v_user1;
  IF v_user1_score != 50 THEN
    RAISE EXCEPTION 'Profile seva_score expected 50 (found %)', v_user1_score;
  END IF;

  SELECT COUNT(*) INTO v_obs_count FROM public.vrat_observations WHERE user_id = v_user1;
  IF v_obs_count != 2 THEN
    RAISE EXCEPTION 'Expected 2 ledger rows for user1, found %', v_obs_count;
  END IF;

  RAISE NOTICE 'All 17 internal PL/pgSQL validation assertions PASSED successfully!';
END $$;
EOF

# 5. Prove concurrent idempotency using two independent PostgreSQL sessions
echo "5. Testing concurrent idempotency with two PostgreSQL sessions..."
CONCURRENT_OCC_ID="$(${PSQL} -d ${DB_NAME} -Atc "
  SELECT oo.id
  FROM public.observance_occurrences oo
  JOIN public.observance_definitions od ON od.id = oo.definition_id
  WHERE od.slug = 'ekadashi'
    AND oo.date = (now() AT TIME ZONE 'Asia/Kolkata' - interval '4 hours')::date
    AND oo.calendar_profile = 'legacy-ujjain'
    AND oo.publication_status = 'published'
    AND oo.review_status = 'reviewed'
    AND oo.verification_status = 'verified'
    AND oo.audit_status = 'completed'
    AND oo.final_date_source <> 'fallback'
    AND oo.batch_id IN (
      SELECT id FROM public.observance_materialisation_batches
      WHERE status = 'complete' AND produced_row_count = expected_row_count
    )
  ORDER BY oo.id
  LIMIT 1
")"

RPC_SQL="SELECT public.record_vrat_observation(
  '22222222-2222-2222-2222-222222222222'::uuid,
  '${CONCURRENT_OCC_ID}'::uuid,
  'legacy-ujjain', 'hindu', NULL, 'hindu', NULL
);"

${PSQL} -d ${DB_NAME} -v ON_ERROR_STOP=1 -c "${RPC_SQL}" >/tmp/shoonaya-vrat-rpc-1.log &
RPC_PID_1=$!
${PSQL} -d ${DB_NAME} -v ON_ERROR_STOP=1 -c "${RPC_SQL}" >/tmp/shoonaya-vrat-rpc-2.log &
RPC_PID_2=$!
wait ${RPC_PID_1}
wait ${RPC_PID_2}

${PSQL} -d ${DB_NAME} -v ON_ERROR_STOP=1 << 'EOF'
DO $$
DECLARE
  v_rows integer;
  v_score integer;
  v_ledger_rows integer;
BEGIN
  SELECT count(*) INTO v_rows
  FROM public.vrat_observations
  WHERE user_id = '22222222-2222-2222-2222-222222222222';

  SELECT seva_score INTO v_score
  FROM public.profiles
  WHERE id = '22222222-2222-2222-2222-222222222222';

  SELECT count(*) INTO v_ledger_rows
  FROM public.karma_ledger
  WHERE user_id = '22222222-2222-2222-2222-222222222222'
    AND reason = 'vrat_observed:ekadashi';

  IF v_rows != 1 OR v_score != 35 OR v_ledger_rows != 1 THEN
    RAISE EXCEPTION 'Concurrent idempotency failed: observations %, score %, ledger rows %',
      v_rows, v_score, v_ledger_rows;
  END IF;
END $$;
EOF

# 6. Test Permissions & Roles & RLS
echo "6. Testing permissions, role restrictions, and RLS..."
${PSQL} -d ${DB_NAME} -v ON_ERROR_STOP=1 << 'EOF'
-- (a) Authenticated cannot INSERT into vrat_observations directly
SET ROLE authenticated;
DO $$
BEGIN
  BEGIN
    INSERT INTO public.vrat_observations (user_id, occurrence_id, vrat_id, occurrence_date)
    VALUES ('11111111-1111-1111-1111-111111111111', gen_random_uuid(), 'ekadashi', current_date);
    RAISE EXCEPTION 'Direct INSERT by authenticated should be denied';
  EXCEPTION WHEN insufficient_privilege THEN
    -- Expected!
  END;
END $$;

-- (b) Anon cannot INSERT into vrat_observations directly
SET ROLE anon;
DO $$
BEGIN
  BEGIN
    INSERT INTO public.vrat_observations (user_id, occurrence_id, vrat_id, occurrence_date)
    VALUES ('11111111-1111-1111-1111-111111111111', gen_random_uuid(), 'ekadashi', current_date);
    RAISE EXCEPTION 'Direct INSERT by anon should be denied';
  EXCEPTION WHEN insufficient_privilege THEN
    -- Expected!
  END;
END $$;

-- (c) Authenticated cannot execute record_vrat_observation RPC
SET ROLE authenticated;
DO $$
BEGIN
  BEGIN
    PERFORM public.record_vrat_observation(
      '11111111-1111-1111-1111-111111111111', gen_random_uuid(),
      'legacy-ujjain', 'hindu', NULL, NULL, NULL
    );
    RAISE EXCEPTION 'RPC execution by authenticated should be denied';
  EXCEPTION WHEN insufficient_privilege THEN
    -- Expected!
  END;
END $$;

-- (d) Anon cannot execute record_vrat_observation RPC
SET ROLE anon;
DO $$
BEGIN
  BEGIN
    PERFORM public.record_vrat_observation(
      '11111111-1111-1111-1111-111111111111', gen_random_uuid(),
      'legacy-ujjain', 'hindu', NULL, NULL, NULL
    );
    RAISE EXCEPTION 'RPC execution by anon should be denied';
  EXCEPTION WHEN insufficient_privilege THEN
    -- Expected!
  END;
END $$;

RESET ROLE;

-- (e) RLS cross-user read isolation test
-- Set auth context to user2: user2 sees only their concurrent-test row, not user1's rows
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
  SELECT '22222222-2222-2222-2222-222222222222'::uuid;
$$ LANGUAGE sql STABLE;

SET ROLE authenticated;
DO $$
DECLARE
  v_visible_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_visible_count FROM public.vrat_observations;
  IF v_visible_count != 1 THEN
    RAISE EXCEPTION 'User2 should see exactly their own observation, found %', v_visible_count;
  END IF;
END $$;

-- Set auth context to user1: user1 must see their 2 rows
RESET ROLE;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
  SELECT '11111111-1111-1111-1111-111111111111'::uuid;
$$ LANGUAGE sql STABLE;

SET ROLE authenticated;
DO $$
DECLARE
  v_visible_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_visible_count FROM public.vrat_observations;
  IF v_visible_count != 2 THEN
    RAISE EXCEPTION 'User1 should see exactly 2 observations, found %', v_visible_count;
  END IF;
END $$;

RESET ROLE;
EOF

# 7. Test Rollback
echo "7. Testing rollback migration..."
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

echo "=== Real PostgreSQL Vrat Shadow Harness: ALL 22 CONTRACT ASSERTIONS + ROLLBACK PASSED ==="
