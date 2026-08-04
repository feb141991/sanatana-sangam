-- ─────────────────────────────────────────────────────────────────────────────
-- Shoonaya — Defect D15 / Tracker 3.4 Migration (amended):
-- Qualify observance_occurrences with calendar_profile, variant_key,
-- and occurrence_date as instance discriminator.
--
-- Amendment history:
--   v1 (2026-08-04): Added calendar_profile, variant_key, provenance, location
--     columns; constraint UNIQUE (definition_id, year, calendar_profile,
--     variant_key). DEFECT: one row per definition per year per variant —
--     structurally prevents 24 Ekadashi rows for one definition in one year.
--   v2 (2026-08-04): Adds occurrence_date text as explicit instance
--     discriminator. New constraint: UNIQUE (definition_id, year,
--     calendar_profile, occurrence_date, variant_key).
--
-- Design note — why occurrence_date, not an ordinal:
--   - For recurring vratas, the civil date IS the instance identity.
--     Ekadashi-2026-02-12 is a unique instance; an ordinal "instance 3" is
--     opaque and requires renumbering on partial re-materialisation.
--   - occurrence_date is derived from the existing `date` column; no new
--     information is introduced.
--   - If a date is corrected, the old date row is deleted and replaced with
--     the corrected date row — correct behaviour for a materialized view.
--   - Trade-off (stated explicitly): a date correction changes the key.
--     This is intentional: the old date never existed per the corrected engine.
--   - variant_key remains on the TRADITION axis only (Smarta / Vaishnava).
--     occurrence_date is on the INSTANCE axis. They are orthogonal.
--
-- Required constraint behaviour (verified by scripts/test-d15-constraint.sql):
--   ACCEPT  24 ekadashi rows, same definition, same year, same profile
--   ACCEPT  same ekadashi instance on two dates for two sampradayas (variant_key)
--   ACCEPT  same festival on two dates for two calendar profiles
--   REJECT  genuine duplicate: same (definition, year, profile, date, variant)
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. ADD NEW COLUMNS (ALL NULLABLE & ADDITIVE) ──────────────────────────────

-- Variant identity
ALTER TABLE public.observance_occurrences
  ADD COLUMN IF NOT EXISTS calendar_profile text,
  ADD COLUMN IF NOT EXISTS spiritual_tradition text,
  ADD COLUMN IF NOT EXISTS variant_key text,
  ADD COLUMN IF NOT EXISTS is_primary_variant boolean;

-- Instance discriminator (D15 amendment — see design note above)
-- Mirrors the `date` column value; kept separate so the constraint key is
-- explicit and auditable independently of the mutable `date` field.
-- NOT NULL enforced via constraint below after backfill.
ALTER TABLE public.observance_occurrences
  ADD COLUMN IF NOT EXISTS occurrence_date text;

-- Provenance (AGENTS.md Rule 6)
ALTER TABLE public.observance_occurrences
  ADD COLUMN IF NOT EXISTS rule_version text,
  ADD COLUMN IF NOT EXISTS astronomy_version text,
  ADD COLUMN IF NOT EXISTS day_boundary_version text,
  ADD COLUMN IF NOT EXISTS reasons jsonb,
  ADD COLUMN IF NOT EXISTS source_refs jsonb,
  ADD COLUMN IF NOT EXISTS diagnostics jsonb;

-- Computed location
ALTER TABLE public.observance_occurrences
  ADD COLUMN IF NOT EXISTS computed_latitude double precision,
  ADD COLUMN IF NOT EXISTS computed_longitude double precision,
  ADD COLUMN IF NOT EXISTS computed_timezone text;


-- ── 2. BACKFILL EXISTING ROWS WITH HONEST LEGACY PROVENANCE ──────────────────
-- Backfill existing rows as computed at Ujjain with no profile ('legacy-ujjain').
-- Do NOT backfill as 'north-indian' or any real profile, which would launder
-- un-qualified data as qualified data.
-- occurrence_date is backfilled from the existing `date` column.

UPDATE public.observance_occurrences
SET
  calendar_profile   = 'legacy-ujjain',
  variant_key        = COALESCE(variant_key, 'legacy-default'),
  occurrence_date    = COALESCE(occurrence_date, date::text),
  computed_latitude  = COALESCE(computed_latitude, 23.1765),
  computed_longitude = COALESCE(computed_longitude, 75.7885),
  computed_timezone  = COALESCE(computed_timezone, 'Asia/Kolkata'),
  is_primary_variant = COALESCE(is_primary_variant, true)
WHERE calendar_profile IS NULL;

-- Backfill occurrence_date for any rows that already had calendar_profile set
-- (idempotency: v1 rows may have calendar_profile but no occurrence_date).
UPDATE public.observance_occurrences
SET occurrence_date = date::text
WHERE occurrence_date IS NULL;

-- Now that all rows are backfilled, enforce NOT NULL.
ALTER TABLE public.observance_occurrences
  ALTER COLUMN occurrence_date SET NOT NULL;


-- ── 3. DROP OLD CONSTRAINTS (ADDITIVE → REPLACE SEQUENCE) ─────────────────────

-- Drop v1 constraint if it was already added (idempotent amendment).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_observance_occurrences_variant'
      AND conrelid = 'public.observance_occurrences'::regclass
  ) THEN
    ALTER TABLE public.observance_occurrences
      DROP CONSTRAINT uq_observance_occurrences_variant;
  END IF;
END $$;

-- Drop the original single-occurrence constraint.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_observance_definition_date'
      AND conrelid = 'public.observance_occurrences'::regclass
  ) THEN
    ALTER TABLE public.observance_occurrences
      DROP CONSTRAINT uq_observance_definition_date;
  END IF;
END $$;

-- Drop the old (year-only) constraint if it exists (from pre-D15 schema).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_observance_occurrences_def_year'
      AND conrelid = 'public.observance_occurrences'::regclass
  ) THEN
    ALTER TABLE public.observance_occurrences
      DROP CONSTRAINT uq_observance_occurrences_def_year;
  END IF;
END $$;


-- ── 4. ADD CORRECTED INSTANCE-AWARE UNIQUENESS CONSTRAINT ─────────────────────
-- Keys: (definition_id, year, calendar_profile, occurrence_date, variant_key)
--
-- This permits:
--   - 24 Ekadashi rows: same (def, year, profile, variant) but different occurrence_date
--   - Smarta vs Vaishnava on different dates: same (def, year, profile, occurrence_date)
--     but different variant_key
--   - Two calendar profiles, same festival, different dates: same (def, year, variant)
--     but different (calendar_profile, occurrence_date)
-- And rejects:
--   - True duplicate: same (def, year, profile, date, variant) → unique violation

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_observance_occurrences_instance'
      AND conrelid = 'public.observance_occurrences'::regclass
  ) THEN
    ALTER TABLE public.observance_occurrences
      ADD CONSTRAINT uq_observance_occurrences_instance
      UNIQUE (definition_id, year, calendar_profile, occurrence_date, variant_key);
  END IF;
END $$;


-- ── 5. RLS CONFIRMATION ───────────────────────────────────────────────────────
-- RLS is already enabled on this table (step2_constraints_policies.sql:5775).
-- Existing policies (inherited by new columns):
--   SELECT: "Anyone can read observance_occurrences" → USING (true)
--   INSERT/UPDATE/DELETE: no anon/authenticated policy → blocked for non-service_role
--   service_role: bypasses RLS → full access (GRANT ALL)
--
-- The new columns (occurrence_date, calendar_profile, variant_key) are fully
-- covered by the existing SELECT policy and are NOT writable by end users.
-- No new policy is required. No data leaks through the new columns.
-- This comment is the RLS audit trail required by the task.
--
-- If a future task makes occurrence_date or calendar_profile user-visible in a
-- per-user context (e.g. per-profile calendar), a row-filtering policy
-- WHERE calendar_profile = current_setting('app.calendar_profile', true)
-- should be added at that point, not now (premature policy = security theater).

-- ── End of migration ──────────────────────────────────────────────────────────
