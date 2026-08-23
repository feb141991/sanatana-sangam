-- Calendar Advisory Council decision: Naraka Chaturdashi Purvarunodaya rule.
-- Approved by Prince Sharma on 2026-08-23.
--
-- This migration registers the canonical definition and the sourced Ujjain
-- golden fixture. It deliberately does NOT insert an occurrence date. The
-- evaluator/materialiser remains the only producer of calculated occurrence
-- rows, and local users are resolved against their own coordinates/timezone.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.observance_definitions
    WHERE slug = 'naraka-chaturdashi'
  ) THEN
    RAISE EXCEPTION
      'naraka-chaturdashi already exists; review the existing row instead of overwriting it';
  END IF;

  INSERT INTO public.observance_definitions (
    slug,
    display_name,
    emoji,
    kind,
    tradition,
    calendar_rule_type,
    verification_type,
    route_kind,
    route_slug,
    active,
    is_shared,
    region,
    description
  ) VALUES (
    'naraka-chaturdashi',
    'Naraka Chaturdashi',
    '🪔',
    'major',
    'hindu',
    'lunar_tithi',
    'lunar_tithi',
    NULL,
    NULL,
    true,
    false,
    NULL,
    'Krishna Chaturdashi assigned by the council-ratified full Purvarunodaya window rule.'
  );
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.golden_fixtures
    WHERE case_id = 'naraka-chaturdashi__2026__ujjain_india__north_indian_purnimanta'
  ) THEN
    RAISE EXCEPTION
      'Naraka Chaturdashi golden fixture already exists; review it instead of overwriting it';
  END IF;

  INSERT INTO public.golden_fixtures (
    case_id,
    festival_id,
    year,
    location,
    profile,
    expected,
    tolerance,
    source,
    reasoning,
    approved,
    reviewed_by,
    reviewed_at,
    effective_from,
    review_notes
  ) VALUES (
    'naraka-chaturdashi__2026__ujjain_india__north_indian_purnimanta',
    'naraka-chaturdashi',
    2026,
    '{"tz":"Asia/Kolkata","lat":23.1765,"lon":75.7885,"label":"Ujjain, India"}'::jsonb,
    '{"calendar":"north_indian_purnimanta","tradition":"unspecified"}'::jsonb,
    '{"civilDate":"2026-11-08"}'::jsonb,
    '{"windowMinutes":2}'::jsonb,
    jsonb_build_object(
      'ref', 'rashtriya-panchang-saka-1948-index-55-printed-p7',
      'tier', 1,
      'citation', 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, printed p.7, Index #55 -- Naraka Chaturdasi (Purvarunodaya) at 2026-11-08.',
      'verifiedBy', 'Engineering source verification; council decision approved by Prince Sharma on 2026-08-23.',
      'verifiedOn', '2026-08-23'
    ),
    'Rashtriya Panchang identifies Naraka Chaturdashi with Purvarunodaya. Council decision 2026-08-23 assigns the local civil date when Krishna Chaturdashi prevails throughout sunrise minus 96 minutes through sunrise. The evaluator reproduces the sourced Ujjain date.',
    true,
    'Prince Sharma',
    '2026-08-23T00:00:00Z'::timestamptz,
    '2026-08-23'::date,
    'Council approval covers the full-window Purvarunodaya day-assignment rule and this exact Ujjain 2026 fixture. It does not authorize Ujjain as a silent fallback for local users.'
  );
END $$;

DO $$
DECLARE
  definition_count integer;
  fixture_count integer;
BEGIN
  SELECT COUNT(*) INTO definition_count
  FROM public.observance_definitions
  WHERE slug = 'naraka-chaturdashi' AND active = true;

  SELECT COUNT(*) INTO fixture_count
  FROM public.golden_fixtures
  WHERE case_id = 'naraka-chaturdashi__2026__ujjain_india__north_indian_purnimanta'
    AND approved = true
    AND expected ->> 'civilDate' = '2026-11-08'
    AND source ->> 'tier' = '1';

  IF definition_count <> 1 OR fixture_count <> 1 THEN
    RAISE EXCEPTION
      'Naraka approval expected one active definition and one approved Tier-1 fixture; found definition %, fixture %',
      definition_count,
      fixture_count;
  END IF;
END $$;
