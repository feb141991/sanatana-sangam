-- ROLLBACK for 20260811090000_materialisation_identity_and_completeness.sql
-- Drop indexes on observance_occurrences
DROP INDEX IF EXISTS public.idx_observance_occurrences_batch;
DROP INDEX IF EXISTS public.idx_observance_occurrences_series_instance;
-- Remove FK column first (references the batches table)
ALTER TABLE public.observance_occurrences
  DROP COLUMN IF EXISTS batch_id,
  DROP COLUMN IF EXISTS series_instance_key;
-- Drop the batches table (RLS/indexes/constraints cascade)
DROP TABLE IF EXISTS public.observance_materialisation_batches CASCADE;
