-- Register Pitru Paksha 2026 as an app-facing daily_journey series so it can
-- appear on the Native "coming up" home card, alongside the existing
-- push-notification-only feature in src/app/api/cron/pitru-paksha-reminder.
--
-- Dates for days 1-13 were computed by actually running the app's own
-- existing, already-shipped astronomical engine (src/lib/pitru-paksha.ts,
-- getPitruPakshaDay against REFERENCE_LOCATION_UJJAIN) for civil dates
-- 2026-09-01 through 2026-10-15 -- not hand-typed from memory, not a new
-- calculation. Day 14 (Mahalaya Amavasya) reuses the existing, separately
-- reviewed and already-published 'mahalaya-amavasya' definition/occurrence
-- for 2026 rather than duplicating it; only series-linkage columns are set
-- on that row, and its review/verification/publication status is left
-- completely untouched.
--
-- Days 1-13 are intentionally left UNPUBLISHED (review_status = needs_review,
-- publication_status = withheld_disputed, verification_status = not_checked)
-- pending the same human calendar/Jyotish-literate review gate used
-- elsewhere in this project -- no council or source review of this specific
-- series framing has happened yet, so none is claimed. source_refs is left
-- empty rather than citing a text source that does not exist for this
-- computation; source_provenance names the calculation engine only, matching
-- the existing convention for other not-yet-reviewed calculation_engine rows
-- (e.g. mahalaya-amavasya 2025/2027/2028).

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
  ('pitru-paksha-day-1', 'Pitru Paksha Day 1', 'vrat', 'hindu', 'lunar_tithi', 'lunar_tithi', 'vrat', 'pitru-paksha', '🪔', 'Opening day of Pitru Paksha, the ancestor-remembrance fortnight.', true, false),
  ('pitru-paksha-day-2', 'Pitru Paksha Day 2', 'vrat', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'vrat', 'pitru-paksha', '🪔', 'Second day of Pitru Paksha.', true, false),
  ('pitru-paksha-day-3', 'Pitru Paksha Day 3', 'vrat', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'vrat', 'pitru-paksha', '🪔', 'Third day of Pitru Paksha.', true, false),
  ('pitru-paksha-day-4', 'Pitru Paksha Day 4', 'vrat', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'vrat', 'pitru-paksha', '🪔', 'Fourth day of Pitru Paksha.', true, false),
  ('pitru-paksha-day-5', 'Pitru Paksha Day 5', 'vrat', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'vrat', 'pitru-paksha', '🪔', 'Fifth day of Pitru Paksha.', true, false),
  ('pitru-paksha-day-6', 'Pitru Paksha Day 6', 'vrat', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'vrat', 'pitru-paksha', '🪔', 'Sixth day of Pitru Paksha.', true, false),
  ('pitru-paksha-day-7', 'Pitru Paksha Day 7', 'vrat', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'vrat', 'pitru-paksha', '🪔', 'Seventh day of Pitru Paksha.', true, false),
  ('pitru-paksha-day-8', 'Pitru Paksha Day 8', 'vrat', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'vrat', 'pitru-paksha', '🪔', 'Eighth day of Pitru Paksha.', true, false),
  ('pitru-paksha-day-9', 'Pitru Paksha Day 9', 'vrat', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'vrat', 'pitru-paksha', '🪔', 'Ninth day of Pitru Paksha.', true, false),
  ('pitru-paksha-day-10', 'Pitru Paksha Day 10', 'vrat', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'vrat', 'pitru-paksha', '🪔', 'Tenth day of Pitru Paksha.', true, false),
  ('pitru-paksha-day-11', 'Pitru Paksha Day 11', 'vrat', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'vrat', 'pitru-paksha', '🪔', 'Eleventh day of Pitru Paksha.', true, false),
  ('pitru-paksha-day-12', 'Pitru Paksha Day 12', 'vrat', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'vrat', 'pitru-paksha', '🪔', 'Twelfth day of Pitru Paksha.', true, false),
  ('pitru-paksha-day-13', 'Pitru Paksha Day 13', 'vrat', 'hindu', 'relative_to_other_observance', 'lunar_tithi', 'vrat', 'pitru-paksha', '🪔', 'Thirteenth day of Pitru Paksha.', true, false)
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

with occurrence_specs(slug, occurrence_date, sequence) as (
  values
    ('pitru-paksha-day-1', '2026-09-27'::date, 1),
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
),
resolved as (
  select
    d.id as definition_id,
    s.slug,
    s.occurrence_date,
    s.sequence,
    md5('pitru-paksha|2026|legacy-ujjain|general') as series_instance_key
  from occurrence_specs s
  join public.observance_definitions d on d.slug = s.slug
),
existing as (
  -- distinct on (r.definition_id), not o.definition_id: when no occurrence
  -- row exists yet, o.definition_id is NULL for every candidate row, and
  -- Postgres treats NULLs as equal for DISTINCT ON -- collapsing all
  -- brand-new (no-existing-row) definitions down to a single arbitrary
  -- survivor instead of keeping one row per definition.
  select distinct on (r.definition_id)
    o.id,
    r.definition_id,
    r.slug,
    r.occurrence_date,
    r.sequence,
    r.series_instance_key
  from resolved r
  left join public.observance_occurrences o
    on o.definition_id = r.definition_id
   and o.year = 2026
   and o.calendar_profile = 'legacy-ujjain'
  order by r.definition_id, o.id
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
    review_status = 'needs_review',
    verification_status = 'not_checked',
    audit_status = 'completed',
    publication_status = 'withheld_disputed',
    calculated_by = 'pitru-paksha-engine',
    calculation_version = '1.0.0',
    final_date_source = 'calculation_engine',
    source_provenance = jsonb_build_object(
      'source_name', 'calculation_engine',
      'source_kind', 'curated'
    ),
    source_refs = null,
    computed_latitude = 23.1765,
    computed_longitude = 75.7885,
    computed_timezone = 'Asia/Kolkata',
    rule_version = '1.0.0',
    astronomy_version = '1.0.0',
    day_boundary_version = '1.0.0',
    series_instance_key = e.series_instance_key,
    batch_id = null,
    locked_for_regeneration = false,
    reasons = to_jsonb(array['series:pitru-paksha', 'sequence:' || e.sequence::text, 'pending_calendar_review']),
    diagnostics = to_jsonb(array['computed_via_src_lib_pitru_paksha_ts_getPitruPakshaDay']),
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
  e.series_instance_key,
  null,
  false,
  to_jsonb(array['series:pitru-paksha', 'sequence:' || e.sequence::text, 'pending_calendar_review']),
  to_jsonb(array['computed_via_src_lib_pitru_paksha_ts_getPitruPakshaDay'])
from existing e
where e.id is null;

-- Link the existing, separately reviewed and already-published
-- mahalaya-amavasya 2026 occurrence in as day 14 of this series. Only
-- series-linkage columns are touched; its date, review_status,
-- verification_status and publication_status are left exactly as they are.
update public.observance_occurrences o
set
  series_instance_key = md5('pitru-paksha|2026|legacy-ujjain|general'),
  reasons = to_jsonb(array['series:pitru-paksha', 'sequence:14']),
  updated_at = now()
from public.observance_definitions d
where o.definition_id = d.id
  and d.slug = 'mahalaya-amavasya'
  and o.year = 2026
  and o.series_instance_key is null;
