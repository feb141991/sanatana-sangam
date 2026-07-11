-- Correct Nag Panchami 2026 after the calendar engine selected the first of
-- two Shravana Shukla Panchami candidates in 2026. The matching rule now uses
-- prefer_last_match=true; this migration fixes already-materialized live rows.

with target_definition as (
  select id
  from public.observance_definitions
  where slug = 'nag-panchami'
)
update public.observance_occurrences oo
set
  date = '2026-08-17'::date,
  calculation_version = '1.2.2',
  calculated_by = 'manual_verified_correction_20260711',
  final_date_source = 'calculation_engine_reviewed',
  review_status = 'reviewed',
  verification_status = 'verified',
  verification_confidence = 'high',
  verification_note = 'Corrected to the later Shravana Shukla Panchami candidate for 2026; Drik Panchang lists Nag Panchami on 2026-08-17 for New Delhi.',
  verification_run_at = now(),
  audit_status = 'completed',
  audit_failure_reason = null,
  audit_retry_count = 0,
  last_audited_at = now(),
  suggested_date = null,
  source_provenance = jsonb_build_object(
    'source_name', 'drikpanchang.com',
    'source_kind', 'curated',
    'source_url', 'https://www.drikpanchang.com/festivals/nag-panchami/nag-panchami-date-time.html',
    'note', '2026 Nag Panchami for New Delhi shown as 2026-08-17'
  )
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
  verification_note = 'Corrected to Shravana Shukla Panchami; Drik Panchang lists Nag Panchami on 2026-08-17 for New Delhi.',
  verification_run_at = now(),
  suggested_date = null,
  verification_type = 'lunar_tithi'
where name = 'Nag Panchami'
  and year = 2026;
