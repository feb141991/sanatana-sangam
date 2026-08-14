UPDATE public.golden_fixtures
SET source = source || jsonb_build_object(
      'ref', 'rashtriya-panchang-saka-1948-p30',
      'citation', 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.30 -- lists both readings for 2026: Yogini Ekadasi (Smarta) at 2026-07-10, Yogini Ekadasi (Vaishnava & Vidhava) at 2026-07-11.'
    ),
    updated_at = now()
WHERE case_id IN (
  'yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__smarta',
  'yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__vaishnava_vidhava'
);

UPDATE public.golden_fixtures
SET source = source || jsonb_build_object(
      'ref', 'rashtriya-panchang-saka-1948-p113',
      'citation', 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.113 -- Vijaya Ekadasi listed at 2027-03-04, one day after tithi 26 first touches sunrise.'
    ),
    updated_at = now()
WHERE case_id = 'vijaya-ekadashi__2027__ujjain_india__north_indian_purnimanta';

UPDATE public.calendar_profiles
SET citation = 'calendar-profiles.md sections 1.2 and 4; Rashtriya Panchang, Saka 1948, Positional Astronomy Centre / India Meteorological Department, pp.30 and 113',
    updated_at = now()
WHERE slug = 'north_indian_purnimanta'
  AND scholarly_status = 'approved';
