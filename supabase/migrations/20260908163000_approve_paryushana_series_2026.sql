-- Approve and publish the 2026 Shvetambara Paryushana Parva 8-day series.
--
-- Scope is intentionally narrow:
-- - canonical legacy-ujjain profile only
-- - 2026 only
-- - Paryushana Day 1 through Samvatsari Day 8
-- - stale one-row legacy Paryushana occurrence is withheld so it cannot compete
--   with the reviewed child-series cards.

do $$
declare
  v_series_key text := md5('paryushana-parva|2026|legacy-ujjain|ujjain');
  v_source_refs jsonb := jsonb_build_array(
    jsonb_build_object(
      'sourceName', 'Jain calendar cross-check',
      'pageOrSection', 'Paryushana Parva 2026, Shvetambara 8-day span',
      'tier', 3,
      'url', 'https://www.drikpanchang.com/jain/paryushan/paryushan-parva-date-time.html',
      'usagePermitted', 'date_verification'
    ),
    jsonb_build_object(
      'sourceName', 'Shoonaya calendar council review',
      'pageOrSection', 'Paryushana Parva 2026 approved span: 2026-09-08 through 2026-09-15',
      'tier', 2,
      'usagePermitted', 'internal_governance'
    )
  );
begin
  insert into public.observance_definitions (
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
  values
    ('paryushana-day-2', 'Paryushana Day 2', 'major', 'jain', 'relative_to_other_observance', 'historical_commemoration', 'festival', 'paryushana-parva', null, true, '🤲', 'Second day of the Shvetambara Jain Paryushana Parva observance.', false),
    ('paryushana-day-3', 'Paryushana Day 3', 'major', 'jain', 'relative_to_other_observance', 'historical_commemoration', 'festival', 'paryushana-parva', null, true, '🤲', 'Third day of the Shvetambara Jain Paryushana Parva observance.', false),
    ('paryushana-day-4', 'Paryushana Day 4', 'major', 'jain', 'relative_to_other_observance', 'historical_commemoration', 'festival', 'paryushana-parva', null, true, '🤲', 'Fourth day of the Shvetambara Jain Paryushana Parva observance.', false),
    ('paryushana-day-5', 'Paryushana Day 5', 'major', 'jain', 'relative_to_other_observance', 'historical_commemoration', 'festival', 'paryushana-parva', null, true, '🤲', 'Fifth day of the Shvetambara Jain Paryushana Parva observance.', false),
    ('paryushana-day-6', 'Paryushana Day 6', 'major', 'jain', 'relative_to_other_observance', 'historical_commemoration', 'festival', 'paryushana-parva', null, true, '🤲', 'Sixth day of the Shvetambara Jain Paryushana Parva observance.', false),
    ('paryushana-day-7', 'Paryushana Day 7', 'major', 'jain', 'relative_to_other_observance', 'historical_commemoration', 'festival', 'paryushana-parva', null, true, '🤲', 'Seventh day of the Shvetambara Jain Paryushana Parva observance.', false)
  on conflict (slug) do update set
    display_name = excluded.display_name,
    kind = excluded.kind,
    tradition = excluded.tradition,
    calendar_rule_type = excluded.calendar_rule_type,
    verification_type = excluded.verification_type,
    route_kind = excluded.route_kind,
    route_slug = excluded.route_slug,
    active = excluded.active,
    emoji = excluded.emoji,
    description = excluded.description,
    updated_at = now();

  update public.observance_definitions
  set
    route_kind = 'festival',
    route_slug = 'paryushana-parva',
    updated_at = now()
  where slug in ('paryushana-parva-begins', 'samvatsari-paryushana-ends');

  update public.observance_occurrences oo
  set
    publication_status = 'withheld_disputed',
    review_status = 'needs_review',
    verification_status = 'mismatch',
    audit_status = 'completed',
    audit_failure_reason = 'Superseded by reviewed 2026 Shvetambara Paryushana child-series span, 2026-09-08 through 2026-09-15.',
    reviewed_at = now(),
    review_notes = 'Withheld to avoid conflicting with approved Paryushana 2026 begin/end child series.',
    updated_at = now()
  from public.observance_definitions od
  where oo.definition_id = od.id
    and od.slug = 'paryushana-parva'
    and oo.year = 2026
    and oo.calendar_profile = 'legacy-ujjain';

  with approved_rows(slug, day_date, sequence) as (
    values
      ('paryushana-parva-begins', '2026-09-08'::date, 1),
      ('paryushana-day-2', '2026-09-09'::date, 2),
      ('paryushana-day-3', '2026-09-10'::date, 3),
      ('paryushana-day-4', '2026-09-11'::date, 4),
      ('paryushana-day-5', '2026-09-12'::date, 5),
      ('paryushana-day-6', '2026-09-13'::date, 6),
      ('paryushana-day-7', '2026-09-14'::date, 7),
      ('samvatsari-paryushana-ends', '2026-09-15'::date, 8)
  )
  insert into public.observance_occurrences (
    definition_id,
    year,
    date,
    occurrence_date,
    calculation_version,
    calculated_by,
    verification_status,
    verification_note,
    review_status,
    source_provenance,
    verification_confidence,
    verification_run_at,
    reviewed_at,
    review_notes,
    locked_for_regeneration,
    final_date_source,
    audit_status,
    last_audited_at,
    calendar_profile,
    spiritual_tradition,
    variant_key,
    is_primary_variant,
    rule_version,
    astronomy_version,
    day_boundary_version,
    reasons,
    source_refs,
    diagnostics,
    computed_latitude,
    computed_longitude,
    computed_timezone,
    publication_status,
    series_instance_key
  )
  select
    od.id,
    2026,
    ar.day_date,
    ar.day_date::text,
    'paryushana-series-2026-v1',
    'council_reviewed_materialization',
    'verified',
    'Approved 2026 Shvetambara Paryushana span: Day 1 on 2026-09-08 through Samvatsari on 2026-09-15.',
    'reviewed',
    jsonb_build_object(
      'source_kind', 'curated',
      'source_name', 'Shoonaya calendar council',
      'source_url', 'https://www.drikpanchang.com/jain/paryushan/paryushan-parva-date-time.html'
    ),
    'high',
    now(),
    now(),
    'Approved for app display as the 2026 Shvetambara Paryushana 8-day series.',
    true,
    'calculation_engine_reviewed',
    'completed',
    now(),
    'legacy-ujjain',
    null,
    'legacy-default',
    true,
    'paryushana-series-2026-v1',
    'manual-council-review',
    'ujjain-canonical',
    jsonb_build_array(
      jsonb_build_object('code', 'paryushana_2026_series_child', 'sequence', ar.sequence)
    ),
    v_source_refs,
    jsonb_build_array(),
    23.1765,
    75.7885,
    'Asia/Kolkata',
    'published',
    v_series_key
  from approved_rows ar
  join public.observance_definitions od on od.slug = ar.slug
  on conflict on constraint uq_observance_occurrences_instance do update set
    date = excluded.date,
    calculation_version = excluded.calculation_version,
    calculated_by = excluded.calculated_by,
    verification_status = excluded.verification_status,
    verification_note = excluded.verification_note,
    review_status = excluded.review_status,
    source_provenance = excluded.source_provenance,
    verification_confidence = excluded.verification_confidence,
    verification_run_at = excluded.verification_run_at,
    reviewed_at = excluded.reviewed_at,
    review_notes = excluded.review_notes,
    locked_for_regeneration = excluded.locked_for_regeneration,
    final_date_source = excluded.final_date_source,
    audit_status = excluded.audit_status,
    last_audited_at = excluded.last_audited_at,
    is_primary_variant = excluded.is_primary_variant,
    rule_version = excluded.rule_version,
    astronomy_version = excluded.astronomy_version,
    day_boundary_version = excluded.day_boundary_version,
    reasons = excluded.reasons,
    source_refs = excluded.source_refs,
    diagnostics = excluded.diagnostics,
    publication_status = excluded.publication_status,
    series_instance_key = excluded.series_instance_key,
    updated_at = now();
end $$;
