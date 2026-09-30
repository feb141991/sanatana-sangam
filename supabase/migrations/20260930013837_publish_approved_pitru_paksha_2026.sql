-- Founder explicitly approved these dates and editorial content on 2026-09-30.
-- Evidence/scope: docs/reviews/PITRU_PAKSHA_2026_PUBLICATION.md.
-- Publish only the 13 known Ujjain civil-journey rows. Mahalaya remains the
-- existing approved Day 14: preserve its date, statuses, locks and audit notes.
-- No table/function/policy/grant changes. Existing public-content RLS remains.
-- Each touched row carries its prior state for the scoped rollback.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
create temporary table pitru_approved_targets on commit drop as
select o.id, s.sequence, (date '2026-09-27' + s.sequence - 1) as expected_date
from generate_series(1,14) s(sequence)
join public.observance_definitions d on d.slug = case when s.sequence=14 then 'mahalaya-amavasya' else 'pitru-paksha-day-' || s.sequence end
join public.observance_occurrences o on o.definition_id=d.id
where o.year=2026 and o.calendar_profile='legacy-ujjain'
  and o.spiritual_tradition is null and o.variant_key='legacy-default'
  and o.computed_latitude=23.1765 and o.computed_longitude=75.7885
  and o.computed_timezone='Asia/Kolkata';
do $approval$
declare total integer; tagged integer; valid integer;
begin
  perform 1 from public.observance_occurrences o join pitru_approved_targets t using(id) for update of o;
  select count(*) into total from pitru_approved_targets;
  if total <> 14 or (select count(distinct sequence) from pitru_approved_targets) <> 14 then
    raise exception 'Pitru publication expected exactly 14 distinct Ujjain journey rows, got %', total;
  end if;
  select count(*) into valid from public.observance_occurrences o join pitru_approved_targets t using(id)
    where o.date=t.expected_date and o.occurrence_date=t.expected_date::text
      and o.series_instance_key=md5('pitru-paksha|2026|legacy-ujjain|general')
      and o.manual_date_override is null and o.audit_status='completed';
  if valid <> 14 then raise exception 'Pitru dates/context changed since approval'; end if;
  select count(*) into tagged from public.observance_occurrences o join pitru_approved_targets t using(id)
    where o.source_provenance ? 'pitru_approval_20260930013837';
  if tagged=14 then
    select count(*) into valid from public.observance_occurrences o join pitru_approved_targets t using(id)
      where o.publication_status='published' and o.review_status='reviewed' and o.verification_status='verified';
    if valid <> 14 then raise exception 'Approved Pitru rows changed; refusing to re-publish'; end if;
    return;
  end if;
  if tagged <> 0 then raise exception 'Partial Pitru approval marker; refusing overwrite'; end if;
  select count(*) into valid from public.observance_occurrences o join pitru_approved_targets t using(id)
    where t.sequence<14 and o.review_status='needs_review'
      and o.verification_status='not_checked' and o.publication_status='withheld_disputed'
      and o.calculated_by='pitru-paksha-engine' and o.calculation_version='1.0.0'
      and o.final_date_source='calculation_engine' and not o.locked_for_regeneration;
  if valid <> 13 then raise exception 'Expected 13 unchanged, withheld engine rows, got %',valid; end if;
  if not exists(select 1 from public.observance_occurrences o join pitru_approved_targets t using(id)
    where t.sequence=14 and o.review_status='reviewed' and o.verification_status='verified'
      and o.publication_status='published') then raise exception 'Existing Mahalaya approval changed'; end if;

  update public.observance_occurrences o set
    source_provenance=o.source_provenance || jsonb_build_object('pitru_approval_20260930013837', jsonb_build_object(
      'review_ref','founder:pitru-paksha-2026-20260930',
      'scope','2026 legacy-ujjain civil remembrance journey; not a Shraddha tithi timetable',
      'before_state', jsonb_build_object(
      'review_status', o.review_status,
      'verification_status', o.verification_status,
      'publication_status', o.publication_status,
      'final_date_source', o.final_date_source,
      'source_refs', o.source_refs,
      'source_provenance', o.source_provenance,
      'reviewed_at', o.reviewed_at,
      'review_notes', o.review_notes,
      'locked_for_regeneration', o.locked_for_regeneration,
      'reasons', o.reasons,
      'diagnostics', o.diagnostics,
      'updated_at', o.updated_at))),
    source_refs=coalesce(o.source_refs,'[]'::jsonb) || '[{"sourceName": "Thanjavur Panchangam 2026–2027 (London edition)", "publisher": "Thanjavur Panchangam; hosted by Uttaradi Math", "pageOrSection": "Ashvina: Paksha masa, September 27 to October 10", "tier": 3, "region": "London", "scholarNotes": "Independent civil-journey range corroboration only; not authority for Ujjain ritual times or universal location dates.", "usagePermitted": "academic_citation", "url": "https://cdn.umath.in/panchanga-2026-2027/pdf/london_2026_2027.pdf"}]'::jsonb,
    review_status=case when t.sequence<14 then 'reviewed' else o.review_status end,
    verification_status=case when t.sequence<14 then 'verified' else o.verification_status end,
    publication_status='published',
    final_date_source=case when t.sequence<14 then 'calculation_engine_reviewed' else o.final_date_source end,
    reviewed_at=case when t.sequence<14 then now() else o.reviewed_at end,
    review_notes=case when t.sequence<14 then concat_ws(E'\n',nullif(o.review_notes,''),
      'Founder source/date approval: founder:pitru-paksha-2026-20260930. Day numbers count civil journey days, not Shraddha tithis.') else o.review_notes end,
    locked_for_regeneration=case when t.sequence<14 then true else o.locked_for_regeneration end,
    reasons=case when t.sequence<14 then coalesce(o.reasons,'[]'::jsonb)-'pending_calendar_review' else o.reasons end,
    diagnostics=coalesce(o.diagnostics,'[]'::jsonb) || jsonb_build_array('approved_pitru_journey_20260930013837'),
    updated_at=now()
  from pitru_approved_targets t where o.id=t.id;
  get diagnostics valid = row_count;
  if valid <> 14 then raise exception 'Pitru publication expected 14 metadata updates, got %',valid; end if;
end $approval$;
commit;
