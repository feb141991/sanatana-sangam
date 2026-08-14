-- Rollback for 20260814002825_retire_obsolete_materialisation_batches.
-- Retired audit rows become failed again before the retired-only columns and
-- status value are removed. Occurrence rows and dates are never touched.

ALTER TABLE public.observance_materialisation_batches
  DROP CONSTRAINT IF EXISTS observance_materialisation_batches_retired_has_audit;

ALTER TABLE public.observance_materialisation_batches
  DROP CONSTRAINT IF EXISTS observance_materialisation_batches_status_check;

UPDATE public.observance_materialisation_batches
SET
  status = 'failed',
  failure_reason = concat_ws(
    ' | ',
    failure_reason,
    'Retirement rolled back: ' || coalesce(retirement_reason, 'reason unavailable')
  ),
  completed_at = NULL,
  updated_at = now()
WHERE status = 'retired';

ALTER TABLE public.observance_materialisation_batches
  DROP COLUMN IF EXISTS retirement_reason,
  DROP COLUMN IF EXISTS retired_at;

ALTER TABLE public.observance_materialisation_batches
  ADD CONSTRAINT observance_materialisation_batches_status_check
    CHECK (status IN ('complete', 'partial', 'failed'));
