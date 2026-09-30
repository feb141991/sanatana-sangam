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
  d.id,
  2026,
  s.occurrence_date,
  s.occurrence_date,
  'legacy-ujjain',
  null,
  'legacy-default',
  true,
  'needs_review',
  'not_checked',
  'completed',
  'withheld_disputed',
  'pitru-paksha-engine',
  '1.0.0',
  'calculation_engine',
  jsonb_build_object(
    'source_name', 'calculation_engine',
    'source_kind', 'curated'
  ),
  null,
  23.1765,
  75.7885,
  'Asia/Kolkata',
  '1.0.0',
  '1.0.0',
  '1.0.0',
  md5('pitru-paksha|2026|legacy-ujjain|general'),
  null,
  false,
  to_jsonb(array['series:pitru-paksha', 'sequence:' || s.sequence::text, 'pending_calendar_review']),
  to_jsonb(array['computed_via_src_lib_pitru_paksha_ts_getPitruPakshaDay', 'corrective_migration_20260930130000'])
from (
  values
    ('pitru-paksha-day-2', '2026-09-28'::date, 2),
    ('pitru-paksha-day-3', '2026-09-29'::date, 3),
    ('pitru-paksha-day-4', '2026-09-30'::date, 4),
    ('pitru-paksha-day-5', '2026-10-01'::date, 5),
    ('pitru-paksha-day-6', '2026-10-02'::date, 6),
    ('pitru-paksha-day-7', '2026-10-03'::date, 7),
    ('pitru-paksha-day-8', '2026-10-04'::date, 8),
    ('pitru-paksha-day-9', '2026-10-05'::date, 9),
    ('pitru-paksha-day-10', '2026-10-06'::date, 10),
    ('pitru-paksha-day-11', '2026-10-07'::date, 11),
    ('pitru-paksha-day-12', '2026-10-08'::date, 12),
    ('pitru-paksha-day-13', '2026-10-09'::date, 13)
) as s(slug, occurrence_date, sequence)
join public.observance_definitions d on d.slug = s.slug
where not exists (
  select 1 from public.observance_occurrences o
  where o.definition_id = d.id and o.year = 2026
);
