-- Restore only this migration's marked rows from their captured pre-approval state.
-- Dates, occurrence IDs, series linkage and other locations/years are never touched.
-- Run only after reviewing that no later review has superseded this approval.
begin;
with backups as (
 select id, source_provenance->'pitru_approval_20260930013837'->'before_state' as before_state
 from public.observance_occurrences
 where source_provenance ? 'pitru_approval_20260930013837'
   and diagnostics @> '["approved_pitru_journey_20260930013837"]'::jsonb
)
update public.observance_occurrences o set
  review_status=b.before_state->>'review_status',
  verification_status=b.before_state->>'verification_status',
  publication_status=b.before_state->>'publication_status',
  final_date_source=b.before_state->>'final_date_source',
  source_refs=nullif(b.before_state->'source_refs','null'::jsonb),
  source_provenance=b.before_state->'source_provenance',
  reviewed_at=(b.before_state->>'reviewed_at')::timestamptz,
  review_notes=b.before_state->>'review_notes',
  locked_for_regeneration=(b.before_state->>'locked_for_regeneration')::boolean,
  reasons=nullif(b.before_state->'reasons','null'::jsonb),
  diagnostics=nullif(b.before_state->'diagnostics','null'::jsonb),
  updated_at=(b.before_state->>'updated_at')::timestamptz
from backups b where o.id=b.id;
commit;
