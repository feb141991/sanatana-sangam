-- Rollback for 20260814201500_create_source_references.
-- Drops the source_references table, its indexes, policies, and updated_at trigger function.

DROP TRIGGER IF EXISTS trg_source_references_updated ON public.source_references;
DROP FUNCTION IF EXISTS update_source_references_timestamp();
DROP TABLE IF EXISTS public.source_references CASCADE;
