-- Route the reviewed Raksha Bandhan occurrence to its new dedicated festival
-- content page. The content itself (significance/rituals/mantra) was
-- editorially approved 2026-08-26 (see packages/dharma-rules/src/festivals/
-- festival-content.json, reviewRef "owner-approval-2026-08-26") and the
-- generated native snapshot already ships it as council_reviewed_editorial.
-- This migration only changes the route metadata for the card/link -- it does
-- not touch the occurrence's date, masaName, evaluator flags, or council
-- decision fields.

UPDATE public.observance_definitions
SET
  route_kind = 'festival',
  route_slug = 'raksha-bandhan',
  updated_at = now()
WHERE slug = 'raksha-bandhan';

UPDATE public.observance_occurrences oo
SET
  review_notes = concat_ws(
    E'\n',
    NULLIF(oo.review_notes, ''),
    'Dedicated Raksha Bandhan content page enabled at /festival/raksha-bandhan.'
  ),
  source_provenance = coalesce(oo.source_provenance, '{}'::jsonb) || jsonb_build_object(
    'route_update_migration', '20260826170000_route_raksha_bandhan_to_festival_page',
    'route_slug', 'raksha-bandhan'
  ),
  updated_at = now()
FROM public.observance_definitions od
WHERE oo.definition_id = od.id
  AND od.slug = 'raksha-bandhan'
  AND oo.year = 2026;
