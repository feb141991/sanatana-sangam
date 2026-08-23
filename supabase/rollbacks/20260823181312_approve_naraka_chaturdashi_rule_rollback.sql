DELETE FROM public.golden_fixtures
WHERE case_id = 'naraka-chaturdashi__2026__ujjain_india__north_indian_purnimanta'
  AND reviewed_by = 'Prince Sharma'
  AND reviewed_at = '2026-08-23T00:00:00Z'::timestamptz;

DO $$
DECLARE
  definition_uuid uuid;
BEGIN
  SELECT id INTO definition_uuid
  FROM public.observance_definitions
  WHERE slug = 'naraka-chaturdashi';

  IF definition_uuid IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.observance_occurrences
    WHERE definition_id = definition_uuid
  ) THEN
    UPDATE public.observance_definitions
    SET active = false,
        updated_at = now()
    WHERE id = definition_uuid;
  ELSE
    DELETE FROM public.observance_definitions
    WHERE id = definition_uuid;
  END IF;
END $$;
