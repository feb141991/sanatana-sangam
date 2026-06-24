-- Route the approved Nirjala Ekadashi occurrence to its dedicated guidance page.
--
-- The previous approval migration intentionally reused /vrat/ekadashi while the
-- named content page did not exist. This follow-up keeps the reviewed date and
-- audit state intact, and only changes the route slug for cards/notifications.

UPDATE public.observance_definitions
SET
  route_kind = 'vrat',
  route_slug = 'nirjala-ekadashi',
  updated_at = now()
WHERE slug = 'nirjala-ekadashi';

UPDATE public.observance_occurrences oo
SET
  review_notes = concat_ws(
    E'\n',
    NULLIF(oo.review_notes, ''),
    'Dedicated Nirjala Ekadashi guidance page enabled at /vrat/nirjala-ekadashi.'
  ),
  source_provenance = coalesce(oo.source_provenance, '{}'::jsonb) || jsonb_build_object(
    'route_update_migration', '20260624203423_route_nirjala_ekadashi_to_dedicated_vrat_page',
    'route_slug', 'nirjala-ekadashi'
  ),
  updated_at = now()
FROM public.observance_definitions od
WHERE oo.definition_id = od.id
  AND od.slug = 'nirjala-ekadashi'
  AND oo.year = 2026;
