-- ─────────────────────────────────────────────────────────────────────────────
-- Shoonaya — Defect D15 / Tracker 3.4 Migration:
-- Qualify observance_occurrences with calendar_profile and variant_key.
--
-- Background:
-- observance_occurrences previously enforced uniqueness on (definition_id, date),
-- which structurally prevented storing multiple variants (e.g. Smarta vs Vaishnava
-- Janmashtami) or multiple calendar profiles (Purnimanta vs Amanta) for the same
-- observance in a given year.
--
-- This migration adds variant identity, provenance, and computed location columns,
-- backfills existing rows as 'legacy-ujjain' (honest, non-laundered label), adds the
-- new variant uniqueness constraint, and drops the old constraint.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. ADD NEW COLUMNS (ALL NULLABLE & ADDITIVE) ──────────────────────────────

-- Variant identity
ALTER TABLE public.observance_occurrences
  ADD COLUMN IF NOT EXISTS calendar_profile text,
  ADD COLUMN IF NOT EXISTS spiritual_tradition text,
  ADD COLUMN IF NOT EXISTS variant_key text,
  ADD COLUMN IF NOT EXISTS is_primary_variant boolean;

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

UPDATE public.observance_occurrences
SET
  calendar_profile   = 'legacy-ujjain',
  variant_key        = COALESCE(variant_key, 'legacy-default'),
  computed_latitude  = COALESCE(computed_latitude, 23.1765),
  computed_longitude = COALESCE(computed_longitude, 75.7885),
  computed_timezone  = COALESCE(computed_timezone, 'Asia/Kolkata'),
  is_primary_variant = COALESCE(is_primary_variant, true)
WHERE calendar_profile IS NULL;


-- ── 3. ADD NEW VARIANT UNIQUENESS CONSTRAINT (ADDITIVE FIRST) ─────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_observance_occurrences_variant'
      AND conrelid = 'public.observance_occurrences'::regclass
  ) THEN
    ALTER TABLE public.observance_occurrences
      ADD CONSTRAINT uq_observance_occurrences_variant
      UNIQUE (definition_id, year, calendar_profile, variant_key);
  END IF;
END $$;


-- ── 4. DROP OLD SINGLE-OCCURRENCE UNIQUE CONSTRAINT ───────────────────────────
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
