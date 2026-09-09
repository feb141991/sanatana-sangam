-- Withhold stale cross-profile rows when an equivalent reviewed occurrence is
-- already published for the same definition/year/date.
--
-- This is intentionally conservative: it does not collapse genuine alternate
-- dates across profiles. It only removes lower-quality duplicates that point to
-- the exact same civil date as an approved reviewed row.

with reviewed_winners as (
  select
    definition_id,
    year,
    date
  from public.observance_occurrences
  where publication_status = 'published'
    and review_status = 'reviewed'
    and verification_status = 'verified'
    and audit_status = 'completed'
  group by definition_id, year, date
),
stale_duplicates as (
  select occurrence.id
  from public.observance_occurrences occurrence
  join reviewed_winners winner
    on winner.definition_id = occurrence.definition_id
   and winner.year = occurrence.year
   and winner.date = occurrence.date
  where occurrence.publication_status = 'published'
    and (
      occurrence.review_status is distinct from 'reviewed'
      or occurrence.verification_status is distinct from 'verified'
      or occurrence.audit_status is distinct from 'completed'
    )
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
    'Withheld by 20260909080527_withhold_cross_profile_reviewed_occurrence_duplicates: reviewed equivalent occurrence already published for this definition/year/date.'
  ),
  diagnostics = (
    select jsonb_agg(distinct to_jsonb(diagnostic.value))
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(coalesce(occurrence.diagnostics, '[]'::jsonb)) = 'array'
          then coalesce(occurrence.diagnostics, '[]'::jsonb)
        else '[]'::jsonb
      end
      || '["withheld_cross_profile_reviewed_duplicate_20260909"]'::jsonb
    ) as diagnostic(value)
  ),
  updated_at = now()
from stale_duplicates
where stale_duplicates.id = occurrence.id;
