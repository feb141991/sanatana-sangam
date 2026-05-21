-- ─────────────────────────────────────────────────────────────────────────────
-- Shoonaya — Migration v70 (Observance operational guardrails)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.observance_occurrences
  ADD COLUMN IF NOT EXISTS manual_date_override date,
  ADD COLUMN IF NOT EXISTS manual_override_reason text,
  ADD COLUMN IF NOT EXISTS locked_for_regeneration boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS final_date_source text DEFAULT 'legacy_seed' NOT NULL,
  ADD COLUMN IF NOT EXISTS audit_status text DEFAULT 'not_run' NOT NULL,
  ADD COLUMN IF NOT EXISTS audit_failure_reason text,
  ADD COLUMN IF NOT EXISTS audit_retry_count integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS last_audited_at timestamptz;

ALTER TABLE public.observance_occurrences
  DROP CONSTRAINT IF EXISTS observance_occurrences_final_date_source_check,
  ADD CONSTRAINT observance_occurrences_final_date_source_check CHECK (
    final_date_source IN (
      'legacy_seed',
      'manual_override',
      'calculation_engine',
      'calculation_engine_reviewed',
      'fallback'
    )
  );

ALTER TABLE public.observance_occurrences
  DROP CONSTRAINT IF EXISTS observance_occurrences_audit_status_check,
  ADD CONSTRAINT observance_occurrences_audit_status_check CHECK (
    audit_status IN ('not_run', 'completed', 'failed', 'skipped')
  );

CREATE INDEX IF NOT EXISTS idx_observance_occurrences_final_date_source
  ON public.observance_occurrences (final_date_source);

CREATE INDEX IF NOT EXISTS idx_observance_occurrences_locked
  ON public.observance_occurrences (locked_for_regeneration);

CREATE INDEX IF NOT EXISTS idx_observance_occurrences_audit_status
  ON public.observance_occurrences (audit_status);

UPDATE public.observance_occurrences
SET
  final_date_source = COALESCE(final_date_source, 'legacy_seed'),
  audit_status = COALESCE(audit_status, 'not_run'),
  audit_retry_count = COALESCE(audit_retry_count, 0),
  locked_for_regeneration = COALESCE(locked_for_regeneration, false)
WHERE true;
