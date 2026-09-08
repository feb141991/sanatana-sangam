-- Keep observance_occurrences canonical for generated calendar rows.
--
-- The legacy festivals table has UNIQUE(name, year), so it cannot safely mirror
-- generated observance rows once the canonical calendar can hold multiple rows
-- for the same display name/year across profiles, variants, recurring vrats, or
-- reviewed engine outputs. A materialization run was failing on
-- festivals_name_year_unique because generated major rows were still being
-- mirrored into festivals.

create or replace function public.sync_occurrence_to_festival() returns trigger
  language plpgsql
  set search_path to 'public', 'pg_temp'
as $$
declare
  v_def public.observance_definitions%rowtype;
begin
  if pg_trigger_depth() > 1 then
    if tg_op = 'DELETE' then
      return old;
    else
      return new;
    end if;
  end if;

  if tg_op = 'DELETE' then
    delete from public.festivals where id = old.id;
    return old;
  end if;

  -- festivals only represents legacy manually curated dates.
  if new.calendar_profile is distinct from 'legacy-ujjain' then
    delete from public.festivals where id = new.id;
    return new;
  end if;

  select * into v_def
  from public.observance_definitions
  where id = new.definition_id;

  if not found then
    raise exception 'Observance definition with ID % not found', new.definition_id;
  end if;

  -- Engine-generated rows are served directly from observance_occurrences.
  -- Mirroring them into festivals can collide on (name, year), and can also
  -- overwrite manually reviewed legacy festival dates.
  if new.final_date_source in ('calculation_engine', 'calculation_engine_reviewed') then
    delete from public.festivals where id = new.id;
    return new;
  end if;

  insert into public.festivals (
    id,
    name,
    date,
    emoji,
    description,
    type,
    year,
    tradition,
    is_shared,
    source_name,
    source_kind,
    review_status,
    reviewed_at,
    review_notes,
    verification_status,
    verification_confidence,
    verification_note,
    suggested_date,
    verification_run_at,
    verification_type
  ) values (
    new.id,
    v_def.display_name,
    new.date,
    v_def.emoji,
    coalesce(v_def.description, ''),
    coalesce(v_def.kind, 'major'),
    new.year,
    v_def.tradition,
    v_def.is_shared,
    new.source_provenance->>'source_name',
    new.source_provenance->>'source_kind',
    new.review_status,
    new.reviewed_at,
    new.review_notes,
    new.verification_status,
    new.verification_confidence,
    new.verification_note,
    new.suggested_date,
    new.verification_run_at,
    v_def.verification_type
  )
  on conflict (name, year) do update set
    date = excluded.date,
    emoji = excluded.emoji,
    description = excluded.description,
    type = excluded.type,
    tradition = excluded.tradition,
    is_shared = excluded.is_shared,
    source_name = excluded.source_name,
    source_kind = excluded.source_kind,
    review_status = excluded.review_status,
    reviewed_at = excluded.reviewed_at,
    review_notes = excluded.review_notes,
    verification_status = excluded.verification_status,
    verification_confidence = excluded.verification_confidence,
    verification_note = excluded.verification_note,
    suggested_date = excluded.suggested_date,
    verification_run_at = excluded.verification_run_at,
    verification_type = excluded.verification_type;

  return new;
end;
$$;

-- Withhold exact duplicate published recurring/vrat occurrences. This keeps the
-- highest-confidence row per canonical occurrence identity and removes repeated
-- legacy_seed rows from app-visible queries without deleting audit history.
with ranked as (
  select
    occurrence.id,
    row_number() over (
      partition by
        occurrence.definition_id,
        occurrence.year,
        occurrence.date,
        occurrence.calendar_profile,
        coalesce(occurrence.variant_key, 'legacy-default')
      order by
        case
          when occurrence.review_status = 'reviewed'
            and occurrence.verification_status = 'verified'
            and occurrence.audit_status = 'completed'
          then 0
          else 1
        end,
        case when coalesce(occurrence.locked_for_regeneration, false) then 0 else 1 end,
        case when occurrence.series_instance_key is not null then 0 else 1 end,
        occurrence.updated_at desc nulls last,
        occurrence.created_at desc nulls last,
        occurrence.id
    ) as duplicate_rank
  from public.observance_occurrences occurrence
  join public.observance_definitions definition
    on definition.id = occurrence.definition_id
  where occurrence.publication_status = 'published'
    and definition.kind = 'vrat'
)
update public.observance_occurrences occurrence
set
  publication_status = 'withheld_disputed',
  audit_status = 'completed',
  audit_failure_reason = null,
  audit_retry_count = 0,
  last_audited_at = now(),
  review_notes = concat_ws(
    E'\n',
    nullif(occurrence.review_notes, ''),
    'Withheld by 20260908154155_fix_legacy_festival_sync_and_recurring_duplicates: duplicate published recurring occurrence identity.'
  ),
  diagnostics = (
    select jsonb_agg(distinct to_jsonb(diagnostic.value))
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(coalesce(occurrence.diagnostics, '[]'::jsonb)) = 'array'
          then coalesce(occurrence.diagnostics, '[]'::jsonb)
        else '[]'::jsonb
      end
      || '["withheld_duplicate_recurring_occurrence_cleanup_20260908"]'::jsonb
    ) as diagnostic(value)
  ),
  updated_at = now()
from ranked
where ranked.id = occurrence.id
  and ranked.duplicate_rank > 1;
