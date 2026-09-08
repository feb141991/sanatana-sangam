-- Dharm Veer: tagline localization + full Punjabi (Gurmukhi) columns
--
-- Two confirmed gaps in the Dharm Veer content model:
-- 1. tagline_local never existed -- the tagline was always shown in English
--    regardless of the reader's language.
-- 2. Punjabi content never existed anywhere in the pipeline. The reader UI
--    (native + web) shows a Punjabi ("ਪੰਜਾਬੀ") toggle label for Sikh heroes,
--    but actually renders Hindi (*_local) underneath -- real content
--    misrepresentation, not just thinness. This adds real *_pa columns so
--    the reader can show genuine Punjabi, keyed to the viewing user's own
--    language preference rather than the hero's tradition (see
--    resolveLocalContentLanguage in readable-preferences.ts, both repos).
--
-- See: src/lib/dharm-veer-generation.ts, src/lib/dharm-veer-db.ts,
-- src/lib/dharm-veer.ts, scripts/backfill-dharm-veer-translations.ts,
-- src/app/(main)/dharm-veer/[id]/DharmVeerClient.tsx,
-- shoonaya-mobile/app/dharm-veer/[id].tsx.

alter table public.dharm_veers
  add column if not exists tagline_local text,
  add column if not exists name_pa text,
  add column if not exists tagline_pa text,
  add column if not exists journey_pa text,
  add column if not exists trial_pa text,
  add column if not exists teaching_pa text,
  add column if not exists moral_pa text,
  add column if not exists legacy_pa text,
  add column if not exists quote_pa text;

comment on column public.dharm_veers.tagline_local is
  'Hindi (Devanagari) rendering of tagline, matching its length/depth -- not a summary. Historically missing; tagline was always shown in English regardless of reader language until this column existed.';
comment on column public.dharm_veers.name_pa is
  'Gurmukhi rendering of name. For Sikh heroes especially this is the canonical script for their name, not a translation nicety.';
comment on column public.dharm_veers.tagline_pa is
  'Punjabi (Gurmukhi) rendering of tagline, matching its length/depth.';
comment on column public.dharm_veers.journey_pa is
  'Punjabi (Gurmukhi) rendering of journey, matching its length/depth -- not a summary. Populated by generateGroundedDharmVeerContent for new rows and scripts/backfill-dharm-veer-translations.ts for existing rows.';
comment on column public.dharm_veers.trial_pa is
  'Punjabi (Gurmukhi) rendering of trial, matching its length/depth.';
comment on column public.dharm_veers.teaching_pa is
  'Punjabi (Gurmukhi) rendering of teaching, matching its length/depth.';
comment on column public.dharm_veers.moral_pa is
  'Punjabi (Gurmukhi) rendering of moral, matching its length/depth.';
comment on column public.dharm_veers.legacy_pa is
  'Punjabi (Gurmukhi) rendering of legacy, matching its length/depth.';
comment on column public.dharm_veers.quote_pa is
  'Punjabi (Gurmukhi) rendering of quote, when quote is non-empty.';
