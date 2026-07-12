-- The previous protective migration updated the legacy festivals row after the
-- runtime observance row. The legacy sync trigger intentionally stores only
-- source_name/source_kind back into observance source_provenance. Restore the
-- fuller provenance as the final write.

with target_definition as (
  select id
  from public.observance_definitions
  where slug = 'nag-panchami'
)
update public.observance_occurrences oo
set
  source_provenance = jsonb_build_object(
    'source_kind', 'curated',
    'source_name', 'drikpanchang.com',
    'source_url', 'https://www.drikpanchang.com/festivals/nag-panchami/nag-panchami-date-time.html',
    'note', 'Protected curated override for Nag Panchami 2026'
  ),
  updated_at = now()
from target_definition td
where oo.definition_id = td.id
  and oo.year = 2026;
