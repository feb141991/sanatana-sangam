UPDATE public.golden_fixtures
SET approved = false,
    reviewed_by = NULL,
    reviewed_at = NULL,
    review_notes = NULL,
    source = jsonb_set(
      source,
      '{verifiedBy}',
      to_jsonb('engineering (Tier 1 source; NOT council-ratified -- see approved: false)'::text),
      true
    ),
    updated_at = now()
WHERE case_id IN (
  'vijaya-ekadashi__2027__ujjain_india__north_indian_purnimanta',
  'yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__smarta',
  'yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__vaishnava_vidhava'
)
  AND reviewed_by = 'Prince Sharma'
  AND reviewed_at = '2026-08-14T00:00:00Z'::timestamptz;

UPDATE public.calendar_profiles
SET scholarly_status = '[S] ratification pending',
    citation = 'calendar-profiles.md §4',
    reviewed_by = NULL,
    reviewed_at = NULL,
    effective_from = NULL,
    review_notes = NULL,
    updated_at = now()
WHERE slug = 'north_indian_purnimanta'
  AND reviewed_by = 'Prince Sharma'
  AND reviewed_at = '2026-08-14T00:00:00Z'::timestamptz;

ALTER TABLE public.golden_fixtures
  DROP CONSTRAINT IF EXISTS golden_fixtures_approval_evidence_check;
ALTER TABLE public.calendar_profiles
  DROP CONSTRAINT IF EXISTS calendar_profiles_approval_metadata_check;
ALTER TABLE public.tradition_profiles
  DROP CONSTRAINT IF EXISTS tradition_profiles_approval_metadata_check;

ALTER TABLE public.golden_fixtures
  DROP COLUMN IF EXISTS effective_from;

ALTER TABLE public.calendar_profiles
  DROP COLUMN IF EXISTS reviewed_by,
  DROP COLUMN IF EXISTS reviewed_at,
  DROP COLUMN IF EXISTS effective_from,
  DROP COLUMN IF EXISTS review_notes;

ALTER TABLE public.tradition_profiles
  DROP COLUMN IF EXISTS reviewed_by,
  DROP COLUMN IF EXISTS reviewed_at,
  DROP COLUMN IF EXISTS effective_from,
  DROP COLUMN IF EXISTS review_notes;
