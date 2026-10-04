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
