-- Calendar Advisory Council decision batch 0, recorded at the product owner's
-- explicit instruction on 2026-08-14.
--
-- Scope is deliberately narrow:
--   * three evidence-complete Tier-1 golden fixtures;
--   * the Layer-B north_indian_purnimanta profile used by those fixtures.
--
-- This does not approve empty fixture scaffolds or any full tradition profile.

ALTER TABLE public.golden_fixtures
  ADD COLUMN IF NOT EXISTS effective_from date;

ALTER TABLE public.calendar_profiles
  ADD COLUMN IF NOT EXISTS reviewed_by text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS effective_from date,
  ADD COLUMN IF NOT EXISTS review_notes text;

ALTER TABLE public.tradition_profiles
  ADD COLUMN IF NOT EXISTS reviewed_by text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS effective_from date,
  ADD COLUMN IF NOT EXISTS review_notes text;

ALTER TABLE public.golden_fixtures
  DROP CONSTRAINT IF EXISTS golden_fixtures_approval_evidence_check;

ALTER TABLE public.golden_fixtures
  ADD CONSTRAINT golden_fixtures_approval_evidence_check CHECK (
    approved = false OR (
      expected IS NOT NULL
      AND source ->> 'tier' IN ('1', '2', '3', '4')
      AND NULLIF(BTRIM(reviewed_by), '') IS NOT NULL
      AND reviewed_at IS NOT NULL
      AND effective_from IS NOT NULL
    )
  );

ALTER TABLE public.calendar_profiles
  DROP CONSTRAINT IF EXISTS calendar_profiles_approval_metadata_check;

ALTER TABLE public.calendar_profiles
  ADD CONSTRAINT calendar_profiles_approval_metadata_check CHECK (
    scholarly_status <> 'approved' OR (
      NULLIF(BTRIM(reviewed_by), '') IS NOT NULL
      AND reviewed_at IS NOT NULL
      AND effective_from IS NOT NULL
      AND NULLIF(BTRIM(review_notes), '') IS NOT NULL
    )
  );

ALTER TABLE public.tradition_profiles
  DROP CONSTRAINT IF EXISTS tradition_profiles_approval_metadata_check;

ALTER TABLE public.tradition_profiles
  ADD CONSTRAINT tradition_profiles_approval_metadata_check CHECK (
    scholarly_status <> 'approved' OR (
      NULLIF(BTRIM(reviewed_by), '') IS NOT NULL
      AND reviewed_at IS NOT NULL
      AND effective_from IS NOT NULL
      AND NULLIF(BTRIM(review_notes), '') IS NOT NULL
    )
  );

DO $$
DECLARE
  eligible_count integer;
  updated_count integer;
BEGIN
  SELECT COUNT(*)
  INTO eligible_count
  FROM public.golden_fixtures
  WHERE case_id IN (
    'vijaya-ekadashi__2027__ujjain_india__north_indian_purnimanta',
    'yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__smarta',
    'yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__vaishnava_vidhava'
  )
    AND expected IS NOT NULL
    AND source ->> 'tier' = '1';

  IF eligible_count <> 3 THEN
    RAISE EXCEPTION
      'Council batch 0 requires exactly 3 evidence-complete Tier-1 fixtures; found %',
      eligible_count;
  END IF;

  UPDATE public.golden_fixtures
  SET approved = true,
      reviewed_by = 'Prince Sharma',
      reviewed_at = '2026-08-14T00:00:00Z'::timestamptz,
      effective_from = '2026-08-14'::date,
      review_notes = 'Calendar Advisory Council decision batch 0. Explicit product-owner approval. Approval is limited to this exact fixture, location, profile, year, and variant.',
      source = jsonb_set(
        source,
        '{verifiedBy}',
        to_jsonb('Engineering source verification; council decision batch 0 approved by Prince Sharma on 2026-08-14.'::text),
        true
      ),
      updated_at = now()
  WHERE case_id IN (
    'vijaya-ekadashi__2027__ujjain_india__north_indian_purnimanta',
    'yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__smarta',
    'yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__vaishnava_vidhava'
  );

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count <> 3 THEN
    RAISE EXCEPTION 'Council batch 0 expected to approve 3 fixtures; updated %', updated_count;
  END IF;
END $$;

UPDATE public.calendar_profiles
SET scholarly_status = 'approved',
    reviewed_by = 'Prince Sharma',
    reviewed_at = '2026-08-14T00:00:00Z'::timestamptz,
    effective_from = '2026-08-14'::date,
    review_notes = 'Calendar Advisory Council decision batch 0. Approval covers the Layer-B North Indian purnimanta month-system profile used by the three approved Ujjain fixtures; it does not approve Layer-C tradition methods.',
    citation = 'calendar-profiles.md sections 1.2 and 4; Rashtriya Panchang, Saka 1948, Positional Astronomy Centre / India Meteorological Department, pp.30 and 113',
    updated_at = now()
WHERE slug = 'north_indian_purnimanta'
  AND month_system = 'purnimanta';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.calendar_profiles
    WHERE slug = 'north_indian_purnimanta'
      AND scholarly_status = 'approved'
      AND reviewed_by = 'Prince Sharma'
      AND effective_from = '2026-08-14'::date
  ) THEN
    RAISE EXCEPTION 'North Indian purnimanta pilot profile approval was not recorded';
  END IF;
END $$;

COMMENT ON COLUMN public.golden_fixtures.effective_from IS
  'First date on which a council-approved fixture may govern materialisation.';
COMMENT ON COLUMN public.calendar_profiles.reviewed_by IS
  'Human decision owner for a ratified scholarly profile; engineering agents may not populate this field autonomously.';
COMMENT ON COLUMN public.tradition_profiles.reviewed_by IS
  'Human decision owner for a ratified scholarly profile; engineering agents may not populate this field autonomously.';
