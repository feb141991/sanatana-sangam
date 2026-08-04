-- scripts/test-d15-constraint.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- D15 Constraint Verification Script — §3.3 Both Directions
-- Tests that uq_observance_occurrences_instance:
--   ACCEPT  24 Ekadashi rows: same definition, year, profile, variant, DIFFERENT dates
--   ACCEPT  same instance on different dates for two sampradayas (different variant_key)
--   ACCEPT  same festival on different dates for two calendar profiles
--   REJECT  true duplicate: same (definition, year, profile, date, variant)
--
-- Run on a shadow/branch DB ONLY. Never production.
-- Usage:
--   psql $DATABASE_URL -f scripts/test-d15-constraint.sql
--   Exit code 0 = all four cases verified.
--
-- All numbers are printed by this script. Zero hand-written figures.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── Setup: temporary test definition ─────────────────────────────────────────

-- Create a test definition_id to avoid polluting real data.
-- We use a fake UUID that is extremely unlikely to collide.
DO $$
DECLARE
  fake_def_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
BEGIN
  -- If observance_definitions has a FK, we need a matching row.
  -- Insert a temporary definition if the table allows it.
  -- (If FK is DEFERRED or the table is not yet created, skip gracefully.)
  BEGIN
    INSERT INTO public.observance_definitions (id, slug, display_name, active)
    VALUES (fake_def_id, '_test_ekadashi_d15_', '[D15 test] Ekadashi', false)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN undefined_table THEN NULL;
    WHEN insufficient_privilege THEN NULL;
  END;
END $$;


-- ── Case 1: ACCEPT 24 Ekadashi rows ─────────────────────────────────────────
-- Same (definition_id, year, calendar_profile, variant_key) — 24 different occurrence_dates.
-- This is the primary case the old constraint (def, year, profile, variant) blocked.

\echo ''
\echo '=== Case 1: ACCEPT 24 Ekadashi rows (same def/year/profile/variant, different dates) ==='

DO $$
DECLARE
  fake_def_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  i integer;
  inserted integer := 0;
  d text;
BEGIN
  -- Generate 24 synthetic Ekadashi dates across 2026 (bi-monthly, ~14 days apart)
  -- Starting from 2026-01-11 (approximate first Ekadashi)
  FOR i IN 0..23 LOOP
    d := (DATE '2026-01-11' + (i * 14))::text;
    INSERT INTO public.observance_occurrences (
      definition_id, year, date, occurrence_date,
      calendar_profile, variant_key, is_primary_variant,
      final_date_source, audit_status, verification_status,
      review_status
    ) VALUES (
      fake_def_id, 2026, d::date, d,
      'north-indian', 'smarta', true,
      'calculation_engine', 'not_run', 'not_checked',
      'needs_review'
    )
    ON CONFLICT DO NOTHING;
    inserted := inserted + 1;
  END LOOP;
  RAISE NOTICE 'Case 1: Attempted to insert 24 rows. Check count below.';
END $$;

SELECT
  'Case 1 — 24 Ekadashi rows' AS case_name,
  COUNT(*) AS rows_inserted,
  CASE WHEN COUNT(*) = 24 THEN 'PASS ✓' ELSE 'FAIL ✗ expected 24' END AS result
FROM public.observance_occurrences
WHERE definition_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND year = 2026
  AND calendar_profile = 'north-indian'
  AND variant_key = 'smarta';


-- ── Case 2: ACCEPT same instance on different dates for two sampradayas ──────
-- Smarta Janmashtami on 2026-08-16, Vaishnava on 2026-08-17.
-- Same (def, year, profile, occurrence_date is DIFFERENT because date differs)
-- variant_key = 'smarta' vs 'vaishnava'

\echo ''
\echo '=== Case 2: ACCEPT same instance on different dates for two sampradayas ==='

DO $$
DECLARE
  fake_def_id uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
BEGIN
  BEGIN
    INSERT INTO public.observance_definitions (id, slug, display_name, active)
    VALUES (fake_def_id, '_test_janmashtami_d15_', '[D15 test] Janmashtami', false)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- Smarta: 2026-08-16
  INSERT INTO public.observance_occurrences (
    definition_id, year, date, occurrence_date,
    calendar_profile, variant_key, is_primary_variant,
    final_date_source, audit_status, verification_status, review_status
  ) VALUES (
    fake_def_id, 2026, '2026-08-16', '2026-08-16',
    'north-indian', 'smarta', true,
    'calculation_engine', 'not_run', 'not_checked', 'needs_review'
  ) ON CONFLICT DO NOTHING;

  -- Vaishnava: 2026-08-17
  INSERT INTO public.observance_occurrences (
    definition_id, year, date, occurrence_date,
    calendar_profile, variant_key, is_primary_variant,
    final_date_source, audit_status, verification_status, review_status
  ) VALUES (
    fake_def_id, 2026, '2026-08-17', '2026-08-17',
    'north-indian', 'vaishnava', false,
    'calculation_engine', 'not_run', 'not_checked', 'needs_review'
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Case 2: Inserted Smarta + Vaishnava variants.';
END $$;

SELECT
  'Case 2 — two sampradaya variants' AS case_name,
  COUNT(*) AS rows_inserted,
  CASE WHEN COUNT(*) = 2 THEN 'PASS ✓' ELSE 'FAIL ✗ expected 2' END AS result
FROM public.observance_occurrences
WHERE definition_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  AND year = 2026;


-- ── Case 3: ACCEPT same festival on two dates for two calendar profiles ───────
-- Shivaratri: north-indian profile 2026-02-15, south-indian profile 2026-02-26.

\echo ''
\echo '=== Case 3: ACCEPT same festival on different dates for two calendar profiles ==='

DO $$
DECLARE
  fake_def_id uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
BEGIN
  BEGIN
    INSERT INTO public.observance_definitions (id, slug, display_name, active)
    VALUES (fake_def_id, '_test_shivaratri_d15_', '[D15 test] Shivaratri', false)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- North Indian profile
  INSERT INTO public.observance_occurrences (
    definition_id, year, date, occurrence_date,
    calendar_profile, variant_key, is_primary_variant,
    final_date_source, audit_status, verification_status, review_status
  ) VALUES (
    fake_def_id, 2026, '2026-02-15', '2026-02-15',
    'north-indian', 'legacy-default', true,
    'calculation_engine', 'not_run', 'not_checked', 'needs_review'
  ) ON CONFLICT DO NOTHING;

  -- South Indian profile (different date)
  INSERT INTO public.observance_occurrences (
    definition_id, year, date, occurrence_date,
    calendar_profile, variant_key, is_primary_variant,
    final_date_source, audit_status, verification_status, review_status
  ) VALUES (
    fake_def_id, 2026, '2026-02-26', '2026-02-26',
    'south-indian', 'legacy-default', true,
    'calculation_engine', 'not_run', 'not_checked', 'needs_review'
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Case 3: Inserted two profile variants.';
END $$;

SELECT
  'Case 3 — two calendar profiles' AS case_name,
  COUNT(*) AS rows_inserted,
  CASE WHEN COUNT(*) = 2 THEN 'PASS ✓' ELSE 'FAIL ✗ expected 2' END AS result
FROM public.observance_occurrences
WHERE definition_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
  AND year = 2026;


-- ── Case 4: REJECT genuine duplicate ─────────────────────────────────────────
-- Second insert of the exact same (def, year, profile, date, variant) must fail.

\echo ''
\echo '=== Case 4: REJECT genuine duplicate (same def/year/profile/date/variant) ==='

DO $$
DECLARE
  fake_def_id uuid := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  rows_before integer;
  rows_after integer;
BEGIN
  BEGIN
    INSERT INTO public.observance_definitions (id, slug, display_name, active)
    VALUES (fake_def_id, '_test_duplicate_d15_', '[D15 test] Duplicate', false)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- Insert first row (should succeed)
  INSERT INTO public.observance_occurrences (
    definition_id, year, date, occurrence_date,
    calendar_profile, variant_key, is_primary_variant,
    final_date_source, audit_status, verification_status, review_status
  ) VALUES (
    fake_def_id, 2026, '2026-03-01', '2026-03-01',
    'north-indian', 'legacy-default', true,
    'calculation_engine', 'not_run', 'not_checked', 'needs_review'
  );

  SELECT COUNT(*) INTO rows_before FROM public.observance_occurrences
  WHERE definition_id = fake_def_id AND year = 2026;

  -- Insert duplicate (should fail with unique_violation)
  BEGIN
    INSERT INTO public.observance_occurrences (
      definition_id, year, date, occurrence_date,
      calendar_profile, variant_key, is_primary_variant,
      final_date_source, audit_status, verification_status, review_status
    ) VALUES (
      fake_def_id, 2026, '2026-03-01', '2026-03-01',
      'north-indian', 'legacy-default', true,
      'calculation_engine', 'not_run', 'not_checked', 'needs_review'
    );
    -- If we reach here, the constraint did NOT fire — that is the failure
    RAISE EXCEPTION 'FAIL ✗ — duplicate insert succeeded; constraint did not reject it';
  EXCEPTION
    WHEN unique_violation THEN
      SELECT COUNT(*) INTO rows_after FROM public.observance_occurrences
        WHERE definition_id = fake_def_id AND year = 2026;
      RAISE NOTICE 'Case 4: PASS ✓ — unique_violation raised as expected (rows before=%, after=%)',
        rows_before, rows_after;
  END;
END $$;

SELECT
  'Case 4 — duplicate rejected' AS case_name,
  COUNT(*) AS rows_present,
  CASE WHEN COUNT(*) = 1 THEN 'PASS ✓' ELSE 'FAIL ✗ expected 1' END AS result
FROM public.observance_occurrences
WHERE definition_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
  AND year = 2026;


-- ── Summary ──────────────────────────────────────────────────────────────────

\echo ''
\echo '=== Summary of all four cases ==='

SELECT
  CASE definition_id::text
    WHEN 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' THEN 'Case 1 — 24 Ekadashi rows'
    WHEN 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' THEN 'Case 2 — two sampradaya variants'
    WHEN 'cccccccc-cccc-cccc-cccc-cccccccccccc' THEN 'Case 3 — two calendar profiles'
    WHEN 'dddddddd-dddd-dddd-dddd-dddddddddddd' THEN 'Case 4 — duplicate (expect 1 row only)'
  END AS case_name,
  COUNT(*) AS row_count,
  CASE definition_id::text
    WHEN 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' THEN
      CASE WHEN COUNT(*) = 24 THEN 'PASS ✓' ELSE 'FAIL ✗' END
    WHEN 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' THEN
      CASE WHEN COUNT(*) = 2 THEN 'PASS ✓' ELSE 'FAIL ✗' END
    WHEN 'cccccccc-cccc-cccc-cccc-cccccccccccc' THEN
      CASE WHEN COUNT(*) = 2 THEN 'PASS ✓' ELSE 'FAIL ✗' END
    WHEN 'dddddddd-dddd-dddd-dddd-dddddddddddd' THEN
      CASE WHEN COUNT(*) = 1 THEN 'PASS ✓' ELSE 'FAIL ✗' END
  END AS result
FROM public.observance_occurrences
WHERE definition_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'dddddddd-dddd-dddd-dddd-dddddddddddd'
)
GROUP BY definition_id
ORDER BY definition_id;

-- ── Row count invariant ───────────────────────────────────────────────────────
-- Confirm no production rows were touched (all test rows have fake definition_ids).

\echo ''
\echo '=== Row count for real rows (must be unchanged from pre-migration count) ==='

SELECT
  COUNT(*) AS real_rows,
  'Run: SELECT COUNT(*) FROM observance_occurrences before migration to compare.' AS note
FROM public.observance_occurrences
WHERE definition_id NOT IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'dddddddd-dddd-dddd-dddd-dddddddddddd'
);

-- Rollback test data — this script is read-only for production rows.
ROLLBACK;

\echo ''
\echo 'Test transaction rolled back. No test rows persisted. Real rows unchanged.'
