-- Rollback Migration for 20260804030000_observance_occurrences_variant_qualification.sql (v2)
-- Restores the original single-occurrence unique constraint (definition_id, year)
-- and drops all variant qualification columns including occurrence_date.
--
-- CAUTION: This rollback deletes duplicate rows before restoring the single-occurrence
-- constraint. Any rows beyond the first per (definition_id, year) are discarded.
-- Do not run against production without confirming no recurring vrat rows exist.

-- 1. Drop the instance-aware constraint (v2).
ALTER TABLE public.observance_occurrences
  DROP CONSTRAINT IF EXISTS uq_observance_occurrences_instance;

-- 2. Drop the v1 constraint if it somehow still exists.
ALTER TABLE public.observance_occurrences
  DROP CONSTRAINT IF EXISTS uq_observance_occurrences_variant;

-- 3. Remove any duplicate rows before restoring the single-occurrence constraint.
--    Keep the row with the smallest id per (definition_id, year).
DELETE FROM public.observance_occurrences a
USING public.observance_occurrences b
WHERE a.id > b.id
  AND a.definition_id = b.definition_id
  AND a.year = b.year;

-- 4. Restore the pre-D15 single-occurrence constraint.
--    Name matches the pre-migration schema.
ALTER TABLE public.observance_occurrences
  ADD CONSTRAINT uq_observance_definition_date UNIQUE (definition_id, year);

-- 5. Drop all variant qualification columns added by this migration.
ALTER TABLE public.observance_occurrences
  DROP COLUMN IF EXISTS calendar_profile,
  DROP COLUMN IF EXISTS spiritual_tradition,
  DROP COLUMN IF EXISTS variant_key,
  DROP COLUMN IF EXISTS is_primary_variant,
  DROP COLUMN IF EXISTS occurrence_date,
  DROP COLUMN IF EXISTS rule_version,
  DROP COLUMN IF EXISTS astronomy_version,
  DROP COLUMN IF EXISTS day_boundary_version,
  DROP COLUMN IF EXISTS reasons,
  DROP COLUMN IF EXISTS source_refs,
  DROP COLUMN IF EXISTS diagnostics,
  DROP COLUMN IF EXISTS computed_latitude,
  DROP COLUMN IF EXISTS computed_longitude,
  DROP COLUMN IF EXISTS computed_timezone;
