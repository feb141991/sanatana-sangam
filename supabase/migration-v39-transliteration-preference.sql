-- Add transliteration_language to public.profiles
alter table public.profiles
  add column if not exists transliteration_language text not null default 'en';

-- Add comment for documentation
comment on column public.profiles.transliteration_language is 'Preferred script for transliteration (en for Roman, hi for Devanagari)';
