-- Phase B (location-aware materialization): extend the identity of an
-- observance_occurrences row to include WHERE it was computed, not just
-- which definition/year/profile/variant it's for.
--
-- Festival civil dates depend on sunrise/moonrise timing, which is
-- location-dependent -- the same (definition, year, calendar_profile,
-- variant_key) can legitimately resolve to a different civil date at a
-- different location. The prior uq_observance_occurrences_instance
-- constraint (added in 20260804030000) didn't include location at all,
-- so a second location's date for the same key would have silently
-- overwritten the first. This has been harmless so far because every
-- existing row was computed at the same hardcoded Ujjain location.
--
-- Follows the precedent already set by observance_materialisation_batches
-- (20260811090000), which already keys on computed_latitude/longitude/
-- timezone with NULLS NOT DISTINCT. Reuses the existing computed_latitude/
-- computed_longitude/computed_timezone columns on this table (already
-- present, already populated on every row) rather than adding parallel
-- location_bucket_* columns, which would create two competing sources of
-- truth for "where was this computed" on the same row.
--
-- Backfill is a genuine no-op: every existing row already shares the
-- identical (23.1765, 75.7885, 'Asia/Kolkata') triple, so adding these
-- three non-null columns to the key can only narrow future collisions,
-- never merge anything that exists today.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_observance_occurrences_instance'
      AND conrelid = 'public.observance_occurrences'::regclass
  ) THEN
    ALTER TABLE public.observance_occurrences
      DROP CONSTRAINT uq_observance_occurrences_instance;
  END IF;
END $$;

DROP INDEX IF EXISTS public.uq_observance_occurrences_instance;

CREATE UNIQUE INDEX uq_observance_occurrences_instance
  ON public.observance_occurrences (
    definition_id, year, calendar_profile, occurrence_date, variant_key,
    computed_latitude, computed_longitude, computed_timezone
  ) NULLS NOT DISTINCT;
