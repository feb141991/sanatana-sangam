alter table public.profiles
  add column if not exists app_language text not null default 'en',
  add column if not exists scripture_script text not null default 'original',
  add column if not exists show_transliteration boolean not null default true,
  add column if not exists meaning_language text not null default 'en';
