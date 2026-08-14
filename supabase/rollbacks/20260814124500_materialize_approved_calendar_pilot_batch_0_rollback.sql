-- Operational rollback for the original council batch-0 run. New manifests
-- use `npm run calendar:approved-fixtures:rollback:commit`.
-- Delete only rows owned by this exact pilot and preserve failed batch records
-- as an audit trail.

DELETE FROM public.observance_occurrences
WHERE calculated_by = 'approved-golden-pilot-v1'
  AND source_provenance ->> 'caseId' IN (
    'vijaya-ekadashi__2027__ujjain_india__north_indian_purnimanta',
    'yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__smarta',
    'yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__vaishnava_vidhava'
  );

UPDATE public.observance_materialisation_batches
SET status = 'failed',
    produced_row_count = 0,
    completed_at = NULL,
    failure_reason = 'Approved calendar pilot batch 0 was operationally rolled back.',
    updated_at = now()
WHERE engine_version = 'approved-golden-pilot-1.0.0'
  AND calendar_profile = 'north_indian_purnimanta'
  AND year IN (2026, 2027);
