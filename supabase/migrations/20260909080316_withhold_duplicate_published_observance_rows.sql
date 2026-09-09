-- Withhold duplicate published occurrence rows that share the same app-facing
-- identity. This prevents legacy seed rows from competing with reviewed
-- materialized rows in Home/Sacred Days/calendar/notification queries.
--
-- The highest-quality row remains published:
-- 1. reviewed + verified + completed
-- 2. locked rows
-- 3. rows that belong to a series_instance_key
-- 4. most recently updated/created row

with ranked as (
  select
    occurrence.id,
    row_number() over (
      partition by
        occurrence.definition_id,
        occurrence.year,
        occurrence.date,
        coalesce(occurrence.calendar_profile, 'legacy-ujjain'),
        coalesce(occurrence.spiritual_tradition, ''),
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
  where occurrence.publication_status = 'published'
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
    'Withheld by 20260909080316_withhold_duplicate_published_observance_rows: duplicate published occurrence identity.'
  ),
  diagnostics = (
    select jsonb_agg(distinct to_jsonb(diagnostic.value))
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(coalesce(occurrence.diagnostics, '[]'::jsonb)) = 'array'
          then coalesce(occurrence.diagnostics, '[]'::jsonb)
        else '[]'::jsonb
      end
      || '["withheld_duplicate_published_observance_20260909"]'::jsonb
    ) as diagnostic(value)
  ),
  updated_at = now()
from ranked
where ranked.id = occurrence.id
  and ranked.duplicate_rank > 1;
