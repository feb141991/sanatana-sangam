-- Protect the curated Nag Panchami 2026 correction from future calendar-engine
-- materialization runs. The date remains 2026-08-17, but the row is now
-- labelled honestly as a curated/manual override instead of an engine-reviewed
-- generated row.

with target_definition as (
  select id
  from public.observance_definitions
  where slug = 'nag-panchami'
)
update public.observance_occurrences oo
set
  final_date_source = 'manual_override',
  manual_date_override = '2026-08-17'::date,
  manual_override_reason = 'Curated verified source: Drik Panchang lists Nag Panchami 2026 for New Delhi on 2026-08-17; protect from regeneration.',
  locked_for_regeneration = true,
  source_provenance = jsonb_build_object(
    'source_kind', 'curated',
    'source_name', 'drikpanchang.com',
    'source_url', 'https://www.drikpanchang.com/festivals/nag-panchami/nag-panchami-date-time.html',
    'note', 'Protected curated override for Nag Panchami 2026'
  ),
  review_status = 'reviewed',
  verification_status = 'verified',
  verification_confidence = 'high',
  verification_note = 'Curated manual override protected after duplicate-candidate engine bug; Drik Panchang lists Nag Panchami on 2026-08-17 for New Delhi.',
  verification_run_at = now(),
  audit_status = 'completed',
  audit_failure_reason = null,
  audit_retry_count = 0,
  last_audited_at = now(),
  updated_at = now()
from target_definition td
where oo.definition_id = td.id
  and oo.year = 2026;

update public.festivals
set
  date = '2026-08-17'::date,
  source_name = 'drikpanchang.com',
  source_kind = 'curated',
  review_status = 'reviewed',
  verification_status = 'verified',
  verification_confidence = 'high',
  verification_note = 'Curated protected date: Shravana Shukla Panchami; Drik Panchang lists Nag Panchami on 2026-08-17 for New Delhi.',
  verification_run_at = now(),
  suggested_date = null,
  verification_type = 'lunar_tithi'
where name = 'Nag Panchami'
  and year = 2026;
