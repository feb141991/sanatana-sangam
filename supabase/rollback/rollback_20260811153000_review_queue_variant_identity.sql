-- ROLLBACK for 20260811153000_review_queue_variant_identity.sql
-- Order: drop trigger/function, restore old constraint, drop new constraint, drop columns.

DROP TRIGGER IF EXISTS trg_preserve_review_queue_terminal_state ON public.observance_review_queue;
DROP FUNCTION IF EXISTS public.preserve_review_queue_terminal_state();

ALTER TABLE public.observance_review_queue
  DROP CONSTRAINT IF EXISTS uq_observance_review_queue_variant_location;

ALTER TABLE public.observance_review_queue
  DROP CONSTRAINT IF EXISTS observance_review_queue_ambiguity_type_check;

ALTER TABLE public.observance_review_queue
  ADD CONSTRAINT observance_review_queue_ambiguity_type_check
  CHECK (ambiguity_type IN (
    'no_qualified_date',
    'multiple_qualified_dates',
    'vrddhi_tithi',
    'disputed_ratification'
  ));

ALTER TABLE public.observance_review_queue
  DROP CONSTRAINT IF EXISTS fk_observance_review_queue_spiritual_tradition;

-- Restore the original unique constraint
ALTER TABLE public.observance_review_queue
  ADD CONSTRAINT uq_observance_review_queue_location
  UNIQUE (definition_id, year, calendar_profile, computed_latitude, computed_longitude);

-- Drop columns last (variant_key was set NOT NULL; removal is fine on rollback)
ALTER TABLE public.observance_review_queue
  DROP COLUMN IF EXISTS source_refs,
  DROP COLUMN IF EXISTS variant_key,
  DROP COLUMN IF EXISTS spiritual_tradition;
