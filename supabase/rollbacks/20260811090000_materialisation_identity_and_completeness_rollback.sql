-- Rollback for 20260811090000_materialisation_identity_and_completeness.
--
-- Lives in supabase/rollbacks/, NOT supabase/migrations/. It previously sat in
-- the migrations directory sharing the forward migration's timestamp, where the
-- CLI would have either rejected the duplicate version or run the DROPs as a
-- forward migration. Naming matches the four sibling rollbacks already here.
--
-- Exists because the shadow acceptance list requires proving the schema can be
-- restored, and a rollback nobody has executed is a rollback nobody knows works.
-- Applied and verified against the shadow database: schema checksum before the
-- UP migration must equal the checksum after this DOWN.
--
-- Order matters -- the FK from occurrences to batches is dropped with its column
-- before the batches table goes, or the DROP TABLE fails.

DROP INDEX IF EXISTS public.idx_observance_occurrences_series_instance;
DROP INDEX IF EXISTS public.idx_observance_occurrences_batch;

ALTER TABLE public.observance_occurrences
  DROP COLUMN IF EXISTS batch_id;

ALTER TABLE public.observance_occurrences
  DROP COLUMN IF EXISTS series_instance_key;

DROP INDEX IF EXISTS public.idx_observance_materialisation_batches_lookup;
DROP INDEX IF EXISTS public.uq_observance_materialisation_batches_identity;

DROP TABLE IF EXISTS public.observance_materialisation_batches;
