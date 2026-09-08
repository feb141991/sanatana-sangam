-- Approve and publish 2026 app-facing multi-day series rows for:
-- - Ganeshotsav, anchored to reviewed Ganesh Chaturthi
-- - Chhath Puja, anchored to reviewed Surya Shashthi / Chhat Bihar
--
-- These rows intentionally use spiritual_tradition = NULL to match the
-- existing general Hindu occurrence convention in this project.

insert into public.observance_definitions (
  slug,
  display_name,
  kind,
  tradition,
  calendar_rule_type,
  verification_type,
  route_kind,
  route_slug,
  emoji,
  description,
  active,
  is_shared
)
values
  ('dussehra', 'Vijayadashami / Dussehra', 'major', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'vrat', 'sharad-navratri', '🪔', 'Victory of dharma, observed as Vijayadashami and Dussehra.', true, false),
  ('ganeshotsav-day-2', 'Ganeshotsav Day 2', 'major', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'festival', 'ganesh-chaturthi', '🐘', 'Second day of Ganeshotsav.', true, false),
  ('ganeshotsav-day-3', 'Ganeshotsav Day 3', 'major', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'festival', 'ganesh-chaturthi', '🐘', 'Third day of Ganeshotsav.', true, false),
  ('ganeshotsav-day-4', 'Ganeshotsav Day 4', 'major', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'festival', 'ganesh-chaturthi', '🐘', 'Fourth day of Ganeshotsav.', true, false),
  ('ganeshotsav-day-5', 'Ganeshotsav Day 5', 'major', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'festival', 'ganesh-chaturthi', '🐘', 'Fifth day of Ganeshotsav.', true, false),
  ('ganeshotsav-day-6', 'Ganeshotsav Day 6', 'major', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'festival', 'ganesh-chaturthi', '🐘', 'Sixth day of Ganeshotsav.', true, false),
  ('ganeshotsav-day-7', 'Ganeshotsav Day 7', 'major', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'festival', 'ganesh-chaturthi', '🐘', 'Seventh day of Ganeshotsav.', true, false),
  ('ganeshotsav-day-8', 'Ganeshotsav Day 8', 'major', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'festival', 'ganesh-chaturthi', '🐘', 'Eighth day of Ganeshotsav.', true, false),
  ('ganeshotsav-day-9', 'Ganeshotsav Day 9', 'major', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'festival', 'ganesh-chaturthi', '🐘', 'Ninth day of Ganeshotsav.', true, false),
  ('ganeshotsav-day-10', 'Ganeshotsav Day 10', 'major', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'festival', 'ganesh-chaturthi', '🐘', 'Tenth day of Ganeshotsav.', true, false),
  ('anant-chaturdashi-ganesh-visarjan', 'Anant Chaturdashi / Ganesh Visarjan', 'major', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'festival', 'ganesh-chaturthi', '🐘', 'Concluding Ganeshotsav day associated with Ganesh Visarjan.', true, false),
  ('chhath-nahay-khay', 'Chhath Day 1 - Nahay Khay', 'regional', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'festival', 'chhath-puja', '☀️', 'Opening day of Chhath Puja.', true, false),
  ('chhath-kharna', 'Chhath Day 2 - Kharna', 'regional', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'festival', 'chhath-puja', '☀️', 'Second day of Chhath Puja.', true, false),
  ('chhath-puja', 'Chhath Puja', 'regional', 'hindu', 'lunar_tithi', 'lunar_tithi', 'festival', 'chhath-puja', '☀️', 'Surya Shashthi / Chhath Puja.', true, false),
  ('chhath-usha-arghya', 'Chhath Day 4 - Usha Arghya', 'regional', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'festival', 'chhath-puja', '☀️', 'Concluding morning of Chhath Puja.', true, false)
on conflict (slug) do update set
  display_name = excluded.display_name,
  kind = excluded.kind,
  tradition = excluded.tradition,
  calendar_rule_type = excluded.calendar_rule_type,
  verification_type = excluded.verification_type,
  route_kind = excluded.route_kind,
  route_slug = excluded.route_slug,
  emoji = excluded.emoji,
  description = excluded.description,
  active = excluded.active,
  is_shared = excluded.is_shared,
  updated_at = now();

with occurrence_specs(slug, occurrence_date, sequence, series_key) as (
  values
    ('ganesh-chaturthi', '2026-09-14'::date, 1, 'ganeshotsav'),
    ('ganeshotsav-day-2', '2026-09-15'::date, 2, 'ganeshotsav'),
    ('ganeshotsav-day-3', '2026-09-16'::date, 3, 'ganeshotsav'),
    ('ganeshotsav-day-4', '2026-09-17'::date, 4, 'ganeshotsav'),
    ('ganeshotsav-day-5', '2026-09-18'::date, 5, 'ganeshotsav'),
    ('ganeshotsav-day-6', '2026-09-19'::date, 6, 'ganeshotsav'),
    ('ganeshotsav-day-7', '2026-09-20'::date, 7, 'ganeshotsav'),
    ('ganeshotsav-day-8', '2026-09-21'::date, 8, 'ganeshotsav'),
    ('ganeshotsav-day-9', '2026-09-22'::date, 9, 'ganeshotsav'),
    ('ganeshotsav-day-10', '2026-09-23'::date, 10, 'ganeshotsav'),
    ('anant-chaturdashi-ganesh-visarjan', '2026-09-24'::date, 11, 'ganeshotsav'),
    ('chhath-nahay-khay', '2026-11-13'::date, 1, 'chhath-puja-four-days'),
    ('chhath-kharna', '2026-11-14'::date, 2, 'chhath-puja-four-days'),
    ('chhath-puja', '2026-11-15'::date, 3, 'chhath-puja-four-days'),
    ('chhath-usha-arghya', '2026-11-16'::date, 4, 'chhath-puja-four-days')
),
resolved as (
  select
    d.id as definition_id,
    s.slug,
    s.occurrence_date,
    s.sequence,
    s.series_key,
    md5(s.series_key || '|2026|legacy-ujjain|general') as series_instance_key
  from occurrence_specs s
  join public.observance_definitions d on d.slug = s.slug
),
existing as (
  select distinct on (o.definition_id)
    o.id,
    r.definition_id,
    r.slug,
    r.occurrence_date,
    r.sequence,
    r.series_key,
    r.series_instance_key
  from resolved r
  left join public.observance_occurrences o
    on o.definition_id = r.definition_id
   and o.year = 2026
   and o.calendar_profile = 'legacy-ujjain'
  order by o.definition_id, o.id
),
updated as (
  update public.observance_occurrences o
  set
    date = e.occurrence_date,
    occurrence_date = e.occurrence_date,
    calendar_profile = 'legacy-ujjain',
    spiritual_tradition = null,
    variant_key = 'legacy-default',
    is_primary_variant = true,
    review_status = 'reviewed',
    verification_status = 'verified',
    audit_status = 'completed',
    publication_status = 'published',
    calculated_by = 'series-rules-2026-09-08',
    calculation_version = 'series-rules-v1',
    final_date_source = 'calculation_engine_reviewed',
    source_provenance = jsonb_build_object(
      'source_name', 'Rashtriya Panchang Saka 1948 + reviewed series rule',
      'source_kind', 'curated'
    ),
    source_refs = jsonb_build_array(jsonb_build_object(
      'sourceName', 'Rashtriya Panchang Saka 1948',
      'pageOrSection', case when e.series_key = 'ganeshotsav' then 'Ganesh Chaturthi anchor, Bhadrapada Shukla Chaturthi' else 'Surya Shashthi / Chhat Bihar anchor' end,
      'tier', 1,
      'confidence', 'high',
      'usagePermitted', 'academic_citation'
    )),
    computed_latitude = 23.1765,
    computed_longitude = 75.7885,
    computed_timezone = 'Asia/Kolkata',
    rule_version = '1.0.0',
    astronomy_version = '1.0.0',
    day_boundary_version = '1.0.0',
    series_instance_key = e.series_instance_key,
    batch_id = null,
    locked_for_regeneration = true,
    reasons = array['series:' || e.series_key, 'sequence:' || e.sequence::text],
    diagnostics = null,
    updated_at = now()
  from existing e
  where e.id is not null
    and o.id = e.id
  returning o.id
)
insert into public.observance_occurrences (
  definition_id,
  year,
  date,
  occurrence_date,
  calendar_profile,
  spiritual_tradition,
  variant_key,
  is_primary_variant,
  review_status,
  verification_status,
  audit_status,
  publication_status,
  calculated_by,
  calculation_version,
  final_date_source,
  source_provenance,
  source_refs,
  computed_latitude,
  computed_longitude,
  computed_timezone,
  rule_version,
  astronomy_version,
  day_boundary_version,
  series_instance_key,
  batch_id,
  locked_for_regeneration,
  reasons,
  diagnostics
)
select
  e.definition_id,
  2026,
  e.occurrence_date,
  e.occurrence_date,
  'legacy-ujjain',
  null,
  'legacy-default',
  true,
  'reviewed',
  'verified',
  'completed',
  'published',
  'series-rules-2026-09-08',
  'series-rules-v1',
  'calculation_engine_reviewed',
  jsonb_build_object(
    'source_name', 'Rashtriya Panchang Saka 1948 + reviewed series rule',
    'source_kind', 'curated'
  ),
  jsonb_build_array(jsonb_build_object(
    'sourceName', 'Rashtriya Panchang Saka 1948',
    'pageOrSection', case when e.series_key = 'ganeshotsav' then 'Ganesh Chaturthi anchor, Bhadrapada Shukla Chaturthi' else 'Surya Shashthi / Chhat Bihar anchor' end,
    'tier', 1,
    'confidence', 'high',
    'usagePermitted', 'academic_citation'
  )),
  23.1765,
  75.7885,
  'Asia/Kolkata',
  '1.0.0',
  '1.0.0',
  '1.0.0',
  e.series_instance_key,
  null,
  true,
  array['series:' || e.series_key, 'sequence:' || e.sequence::text],
  null
from existing e
where e.id is null;

update public.observance_occurrences o
set
  publication_status = 'withheld_disputed',
  audit_status = 'completed',
  diagnostics = array['withheld_stale_unreviewed_duplicate_after_ganeshotsav_series_approval'],
  updated_at = now()
from public.observance_definitions d
where o.definition_id = d.id
  and d.slug = 'ganesh-chaturthi'
  and o.year = 2026
  and o.date = '2026-09-14'::date
  and o.review_status is null
  and o.series_instance_key is null;
