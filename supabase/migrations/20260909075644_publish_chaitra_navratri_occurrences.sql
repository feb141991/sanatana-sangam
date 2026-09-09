-- Publish reviewed Chaitra Navratri occurrence anchors now that the canonical
-- rules/content are source-backed and app-facing.
--
-- Scope:
-- - only the existing chaitra-navratri-begins definition
-- - only existing legacy-ujjain occurrences for 2026-2028
-- - no changes to deferred Gupt Navratri, Chintpurni, or other candidates

begin;

update public.observance_definitions
set
  route_kind = 'vrat',
  route_slug = 'chaitra-navratri',
  guarantee_level = 'manual_review_required',
  updated_at = now()
where slug = 'chaitra-navratri-begins';

update public.observance_occurrences oo
set
  publication_status = 'published',
  review_status = 'reviewed',
  verification_status = 'verified',
  verification_confidence = 'high',
  verification_note = 'Approved against canonical Chaitra Navratri source-backed series content and reviewed lunar tithi span rule.',
  reviewed_at = now(),
  verification_run_at = now(),
  final_date_source = 'calculation_engine_reviewed',
  source_provenance = jsonb_build_object(
    'source_kind', 'curated',
    'source_name', 'Rashtriya Panchang + Devi Mahatmya/Navadurga reviewed series content',
    'review_ref', 'council:chaitra-navratri-series-2026-v1'
  ),
  source_refs = jsonb_build_array(
    jsonb_build_object(
      'sourceName', 'Rashtriya Panchang',
      'pageOrSection', 'Chaitra Shukla Pratipada / Chaitra Navratri anchor',
      'tier', 1,
      'confidence', 'high',
      'usagePermitted', 'academic_citation'
    ),
    jsonb_build_object(
      'sourceName', 'Devi Mahatmya / Navadurga reviewed editorial content',
      'pageOrSection', 'Chaitra Navratri nine-day Navadurga sequence',
      'tier', 2,
      'confidence', 'high',
      'usagePermitted', 'internal_governance'
    )
  ),
  review_notes = 'Approved 2026-09-09 for app display as source-backed Chaitra Navratri 9-day series anchor. Previous withheld marker is superseded by canonical rules.json launch_status=included.',
  audit_status = 'completed',
  audit_failure_reason = null,
  last_audited_at = now(),
  locked_for_regeneration = true,
  updated_at = now()
from public.observance_definitions od
where oo.definition_id = od.id
  and od.slug = 'chaitra-navratri-begins'
  and oo.year between 2026 and 2028
  and oo.calendar_profile = 'legacy-ujjain';

commit;
