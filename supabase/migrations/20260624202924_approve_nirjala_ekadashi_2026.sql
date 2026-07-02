-- Approve Nirjala Ekadashi for 2026 Home/Panchang/notification surfaces.
--
-- This intentionally creates a named observance instead of relying only on the
-- generic recurring Ekadashi candidate row. Generic Ekadashi rows remain
-- candidate-generated until reviewed; this specific high-signal vrat is
-- source-reviewed for June 25, 2026.

WITH definition AS (
  INSERT INTO public.observance_definitions (
    slug,
    display_name,
    kind,
    tradition,
    calendar_rule_type,
    verification_type,
    route_kind,
    route_slug,
    region,
    active,
    emoji,
    description,
    is_shared
  )
  VALUES (
    'nirjala-ekadashi',
    'Nirjala Ekadashi',
    'vrat',
    'hindu',
    'lunar_tithi',
    'lunar_tithi',
    'vrat',
    'ekadashi',
    NULL,
    true,
    '🌿',
    'Nirjala Ekadashi, the austere waterless Ekadashi fast dedicated to Lord Vishnu, observed according to capacity and sampradaya guidance.',
    false
  )
  ON CONFLICT (slug)
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    kind = EXCLUDED.kind,
    tradition = EXCLUDED.tradition,
    calendar_rule_type = EXCLUDED.calendar_rule_type,
    verification_type = EXCLUDED.verification_type,
    route_kind = EXCLUDED.route_kind,
    route_slug = EXCLUDED.route_slug,
    region = EXCLUDED.region,
    active = EXCLUDED.active,
    emoji = EXCLUDED.emoji,
    description = EXCLUDED.description,
    is_shared = EXCLUDED.is_shared,
    updated_at = now()
  RETURNING id
),
updated AS (
  UPDATE public.observance_occurrences oo
  SET
    date = '2026-06-25'::date,
    manual_date_override = '2026-06-25'::date,
    manual_override_reason = 'Nirjala Ekadashi 2026 approved from Shoonaya admin calendar review',
    review_status = 'reviewed',
    verification_status = 'verified',
    verification_confidence = 'high',
    verification_note = 'Nirjala Ekadashi 2026 reviewed for Jyeshtha Shukla Ekadashi / Bhimseni Ekadashi listing; route currently reuses the generic Ekadashi vrat guidance.',
    audit_status = 'completed',
    audit_failure_reason = NULL,
    audit_retry_count = 0,
    final_date_source = 'manual_override',
    source_provenance = jsonb_build_object(
      'source_kind', 'curated',
      'source_name', 'Shoonaya admin calendar review',
      'source_migration', '20260624202924_approve_nirjala_ekadashi_2026',
      'source_note', 'Approved named occurrence for June 25, 2026; generic recurring Ekadashi remains candidate-only unless separately reviewed.'
    ),
    reviewed_at = now(),
    verification_run_at = now(),
    last_audited_at = now(),
    review_notes = 'Approved for Home countdown, Panchang card, and reviewed notification source gate.',
    updated_at = now()
  FROM definition d
  WHERE oo.definition_id = d.id
    AND oo.year = 2026
  RETURNING oo.id
)
INSERT INTO public.observance_occurrences (
  definition_id,
  year,
  date,
  calculation_version,
  calculated_by,
  manual_date_override,
  manual_override_reason,
  locked_for_regeneration,
  final_date_source,
  audit_status,
  audit_failure_reason,
  audit_retry_count,
  last_audited_at,
  verification_status,
  verification_note,
  suggested_date,
  review_status,
  source_provenance,
  verification_confidence,
  verification_run_at,
  reviewed_at,
  review_notes
)
SELECT
  d.id,
  2026,
  '2026-06-25'::date,
  'admin-reviewed-named-observance',
  'admin_review',
  '2026-06-25'::date,
  'Nirjala Ekadashi 2026 approved from Shoonaya admin calendar review',
  false,
  'manual_override',
  'completed',
  NULL,
  0,
  now(),
  'verified',
  'Nirjala Ekadashi 2026 reviewed for Jyeshtha Shukla Ekadashi / Bhimseni Ekadashi listing; route currently reuses the generic Ekadashi vrat guidance.',
  NULL,
  'reviewed',
  jsonb_build_object(
    'source_kind', 'curated',
    'source_name', 'Shoonaya admin calendar review',
    'source_migration', '20260624202924_approve_nirjala_ekadashi_2026',
    'source_note', 'Approved named occurrence for June 25, 2026; generic recurring Ekadashi remains candidate-only unless separately reviewed.'
  ),
  'high',
  now(),
  now(),
  'Approved for Home countdown, Panchang card, and reviewed notification source gate.'
FROM definition d
WHERE NOT EXISTS (SELECT 1 FROM updated);
