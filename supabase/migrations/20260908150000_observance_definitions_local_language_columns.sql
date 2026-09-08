-- Observance definitions: Hindi/Punjabi name + description columns
--
-- Confirmed gap: SacredDaysCard (native Home) renders every festival/vrat
-- name and description in English only, regardless of the viewer's own
-- language preference. The `lang` prop the card receives is used only for
-- its "in N days" chip text -- `display_name`/`description` never had a
-- localized counterpart anywhere in the pipeline (rules.json, this table,
-- or the API response), unlike dharm_veers which already got this treatment
-- in 20260908120000_dharm_veer_local_language_columns.sql.
--
-- Same naming convention as dharm_veers: `_local` for Hindi (Devanagari),
-- `_pa` for Punjabi (Gurmukhi). Nullable and additive-only -- existing rows
-- keep rendering in English via the same fallback chain used elsewhere
-- (pa -> hi -> en) until content is backfilled.
--
-- See: packages/dharma-rules/src/festivals/rules.json,
-- packages/dharma-rules/src/festivals/rules.schema.json,
-- src/lib/calendar/rules.ts, scripts/seed-observance-definitions.ts,
-- src/lib/calendar/observance-formatter.ts,
-- src/lib/calendar/occurrence-reader.ts,
-- src/app/api/native/home-summary/route.ts,
-- shoonaya-mobile/lib/sacred-days-deck.ts,
-- shoonaya-mobile/components/home/SacredDaysCard.tsx.

alter table public.observance_definitions
  add column if not exists display_name_local text,
  add column if not exists display_name_pa text,
  add column if not exists description_local text,
  add column if not exists description_pa text;

comment on column public.observance_definitions.display_name_local is
  'Hindi (Devanagari) rendering of display_name. Historically missing; the name was always shown in English regardless of reader language until this column existed.';
comment on column public.observance_definitions.display_name_pa is
  'Punjabi (Gurmukhi) rendering of display_name.';
comment on column public.observance_definitions.description_local is
  'Hindi (Devanagari) rendering of description, matching its brevity/register -- a short factual caption, not an expanded biography.';
comment on column public.observance_definitions.description_pa is
  'Punjabi (Gurmukhi) rendering of description, matching its brevity/register.';
