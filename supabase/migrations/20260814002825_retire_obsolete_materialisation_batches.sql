-- Give intentionally removed materialisation identities an auditable terminal
-- state. A failed or partial batch means "this identity was expected but did
-- not complete" and must keep a profile family fail-closed. A retired batch
-- means "a complete catalog run proves this identity is no longer expected"
-- and must not poison the current family forever.

ALTER TABLE public.observance_materialisation_batches
  ADD COLUMN IF NOT EXISTS retired_at timestamptz,
  ADD COLUMN IF NOT EXISTS retirement_reason text;

ALTER TABLE public.observance_materialisation_batches
  DROP CONSTRAINT IF EXISTS observance_materialisation_batches_status_check;

ALTER TABLE public.observance_materialisation_batches
  ADD CONSTRAINT observance_materialisation_batches_status_check
    CHECK (status IN ('complete', 'partial', 'failed', 'retired'));

ALTER TABLE public.observance_materialisation_batches
  ADD CONSTRAINT observance_materialisation_batches_retired_has_audit
    CHECK (
      status <> 'retired'
      OR (
        retired_at IS NOT NULL
        AND coalesce(length(btrim(retirement_reason)), 0) > 0
        AND completed_at IS NULL
      )
    );

COMMENT ON COLUMN public.observance_materialisation_batches.retired_at IS
  'When a complete-family reconciliation proved this materialisation identity is no longer expected.';

COMMENT ON COLUMN public.observance_materialisation_batches.retirement_reason IS
  'Required audit reason for retiring an obsolete identity. Retirement is never inferred from a partial run.';

-- D32 was explicitly rolled back on 2026-08-12. Its 306 occurrence rows were
-- deleted and the matching batches were retained as failed audit records. They
-- are not incomplete current work: they are known-obsolete identities from a
-- rejected materialisation design. Retire only that uniquely tagged, unlinked
-- set; the unrelated partial legacy batches remain fail-closed for diagnosis.
UPDATE public.observance_materialisation_batches AS batch
SET
  status = 'retired',
  retired_at = now(),
  retirement_reason = 'D32 rollback: obsolete per-profile month-system materialisation identity; occurrence rows removed 2026-08-12.',
  completed_at = NULL,
  updated_at = now()
WHERE batch.status = 'failed'
  AND batch.failure_reason LIKE 'D32 per-profile month-system materialization was conceptually wrong%'
  AND NOT EXISTS (
    SELECT 1
    FROM public.observance_occurrences AS occurrence
    WHERE occurrence.batch_id = batch.id
  );
