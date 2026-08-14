-- Correct page references for council-approved calendar pilot fixtures.
--
-- The earlier intake used PDF file-page positions as though they were the
-- publication's printed page numbers. The dates and approvals do not change.

UPDATE public.golden_fixtures
SET source = source || jsonb_build_object(
      'ref', 'rashtriya-panchang-saka-1948-printed-p29-pdf-p49',
      'citation', 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, printed p.29 (PDF file page 49) -- lists Yogini Ekadasi (Smarta) at 2026-07-10.'
    ),
    updated_at = now()
WHERE case_id = 'yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__smarta';

UPDATE public.golden_fixtures
SET source = source || jsonb_build_object(
      'ref', 'rashtriya-panchang-saka-1948-printed-p30-pdf-p50',
      'citation', 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, printed p.30 (PDF file page 50) -- lists Yogini Ekadasi (Vaishnava & Vidhava) at 2026-07-11.'
    ),
    updated_at = now()
WHERE case_id = 'yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__vaishnava_vidhava';

UPDATE public.golden_fixtures
SET source = source || jsonb_build_object(
      'ref', 'rashtriya-panchang-saka-1948-printed-p92-pdf-p112',
      'citation', 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, printed p.92 (PDF file page 112) -- lists Vijaya Ekadasi at 2027-03-04 after Ekadasi ahoratra on 2027-03-03.'
    ),
    updated_at = now()
WHERE case_id = 'vijaya-ekadashi__2027__ujjain_india__north_indian_purnimanta';

UPDATE public.calendar_profiles
SET citation = 'calendar-profiles.md sections 1.2 and 4; Rashtriya Panchang, Saka 1948, printed pp.29, 30, and 92 (PDF file pages 49, 50, and 112)',
    updated_at = now()
WHERE slug = 'north_indian_purnimanta'
  AND scholarly_status = 'approved';

DO $$
DECLARE
  corrected_count integer;
BEGIN
  SELECT COUNT(*) INTO corrected_count
  FROM public.golden_fixtures
  WHERE approved = true
    AND case_id IN (
      'vijaya-ekadashi__2027__ujjain_india__north_indian_purnimanta',
      'yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__smarta',
      'yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__vaishnava_vidhava'
    )
    AND source ->> 'ref' LIKE 'rashtriya-panchang-saka-1948-printed-%';

  IF corrected_count <> 3 THEN
    RAISE EXCEPTION 'Expected 3 approved pilot citations to be corrected; found %', corrected_count;
  END IF;
END $$;
