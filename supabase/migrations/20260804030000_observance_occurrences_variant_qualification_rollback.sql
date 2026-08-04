-- Rollback Migration for 20260804030000_observance_occurrences_variant_qualification.sql
-- Restores unique constraint (definition_id, year) and drops variant qualification columns.

ALTER TABLE observance_occurrences DROP CONSTRAINT IF EXISTS uq_observance_occurrences_variant;

-- If duplicate occurrences exist per definition_id and year, keep only one before restoring the single-occurrence unique constraint
DELETE FROM observance_occurrences a USING observance_occurrences b
WHERE a.id > b.id
  AND a.definition_id = b.definition_id
  AND a.year = b.year;

ALTER TABLE observance_occurrences
  ADD CONSTRAINT uq_observance_occurrences_def_year UNIQUE (definition_id, year);

ALTER TABLE observance_occurrences
  DROP COLUMN IF EXISTS calendar_profile,
  DROP COLUMN IF EXISTS spiritual_tradition,
  DROP COLUMN IF EXISTS variant_key,
  DROP COLUMN IF EXISTS is_primary_variant,
  DROP COLUMN IF EXISTS rule_version,
  DROP COLUMN IF EXISTS astronomy_version,
  DROP COLUMN IF EXISTS day_boundary_version,
  DROP COLUMN IF EXISTS reasons,
  DROP COLUMN IF EXISTS source_refs,
  DROP COLUMN IF EXISTS diagnostics,
  DROP COLUMN IF EXISTS computed_latitude,
  DROP COLUMN IF EXISTS computed_longitude,
  DROP COLUMN IF EXISTS computed_timezone;
