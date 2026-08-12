-- Rollback for 20260811153000_review_queue_variant_identity.
-- Refuse a lossy rollback once the new contract contains data the old schema
-- cannot represent.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.observance_review_queue
    WHERE ambiguity_type = 'engine_error'
  ) THEN
    RAISE EXCEPTION 'Cannot rollback: engine_error review rows exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.observance_review_queue
    GROUP BY definition_id, year, calendar_profile,
             computed_latitude, computed_longitude
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot rollback: multiple review variants share the legacy identity';
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_preserve_review_queue_terminal_state ON public.observance_review_queue;
DROP FUNCTION IF EXISTS public.preserve_review_queue_terminal_state();

ALTER TABLE public.observance_review_queue
  DROP CONSTRAINT IF EXISTS fk_observance_review_queue_spiritual_tradition;

ALTER TABLE public.observance_review_queue
  DROP CONSTRAINT IF EXISTS uq_observance_review_queue_variant_location;

ALTER TABLE public.observance_review_queue
  ADD CONSTRAINT uq_observance_review_queue_location
  UNIQUE (
    definition_id,
    year,
    calendar_profile,
    computed_latitude,
    computed_longitude
  );

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
  DROP COLUMN IF EXISTS spiritual_tradition,
  DROP COLUMN IF EXISTS variant_key,
  DROP COLUMN IF EXISTS source_refs;
