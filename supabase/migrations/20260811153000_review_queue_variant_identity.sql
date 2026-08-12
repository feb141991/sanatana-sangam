-- Preserve variant identity for unresolved calendar results.
--
-- The original review-queue key stopped at definition/year/profile/location.
-- Two unresolved sampradaya variants at the same place therefore conflicted,
-- and the later upsert silently replaced the earlier council question.  A
-- review row must retain the same tradition/variant axes as a materialised
-- occurrence even though it has no confirmed civil date.

ALTER TABLE public.observance_review_queue
  ADD COLUMN IF NOT EXISTS spiritual_tradition text,
  ADD COLUMN IF NOT EXISTS variant_key text,
  ADD COLUMN IF NOT EXISTS source_refs jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Existing evaluator rows recorded the variant in evaluator_details.ruleId.
-- Keep an explicit sentinel only where that historical payload is absent.
UPDATE public.observance_review_queue
SET variant_key = COALESCE(
  NULLIF(variant_key, ''),
  NULLIF(evaluator_details ->> 'ruleId', ''),
  'legacy-default'
)
WHERE variant_key IS NULL OR variant_key = '';

ALTER TABLE public.observance_review_queue
  ALTER COLUMN variant_key SET NOT NULL;

ALTER TABLE public.observance_review_queue
  DROP CONSTRAINT IF EXISTS uq_observance_review_queue_location;

ALTER TABLE public.observance_review_queue
  ADD CONSTRAINT uq_observance_review_queue_variant_location
  UNIQUE NULLS NOT DISTINCT (
    definition_id,
    year,
    calendar_profile,
    computed_latitude,
    computed_longitude,
    spiritual_tradition,
    variant_key
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_observance_review_queue_spiritual_tradition'
      AND conrelid = 'public.observance_review_queue'::regclass
  ) THEN
    ALTER TABLE public.observance_review_queue
      ADD CONSTRAINT fk_observance_review_queue_spiritual_tradition
      FOREIGN KEY (spiritual_tradition)
      REFERENCES public.tradition_profiles(slug);
  END IF;
END $$;

-- `engine_error` is emitted only by external review, never by the evaluator,
-- but the application contract already supports it.  The prior database CHECK
-- omitted it, so a reviewer could not persist that state.
ALTER TABLE public.observance_review_queue
  DROP CONSTRAINT IF EXISTS observance_review_queue_ambiguity_type_check;

ALTER TABLE public.observance_review_queue
  ADD CONSTRAINT observance_review_queue_ambiguity_type_check
  CHECK (ambiguity_type IN (
    'no_qualified_date',
    'multiple_qualified_dates',
    'vrddhi_tithi',
    'disputed_ratification',
    'engine_error'
  ));

CREATE OR REPLACE FUNCTION public.preserve_review_queue_terminal_state()
RETURNS trigger AS $$
BEGIN
  -- Materialiser reruns always propose pending_review. Preserve an existing
  -- council decision from that mechanical reset, while still allowing a
  -- reviewer to correct approved <-> rejected explicitly.
  IF OLD.review_status IN ('approved', 'rejected')
     AND NEW.review_status = 'pending_review' THEN
    NEW.review_status := OLD.review_status;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.review_notes := OLD.review_notes;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_preserve_review_queue_terminal_state ON public.observance_review_queue;

CREATE TRIGGER trg_preserve_review_queue_terminal_state
  BEFORE UPDATE ON public.observance_review_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.preserve_review_queue_terminal_state();

COMMENT ON COLUMN public.observance_review_queue.variant_key IS
  'Stable evaluator variant identity. Distinct unresolved variants must never overwrite one another.';

COMMENT ON COLUMN public.observance_review_queue.spiritual_tradition IS
  'Optional sampradaya/tradition profile associated with this unresolved variant.';

COMMENT ON COLUMN public.observance_review_queue.source_refs IS
  'Typed SourceReference array for governance and disclosure.';
