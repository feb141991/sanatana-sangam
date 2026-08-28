begin;

create table if not exists public.observance_content_sources (
  id uuid primary key default gen_random_uuid(),
  definition_id uuid not null references public.observance_definitions(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  author text,
  source_url text not null check (source_url ~ '^https://'),
  citation text not null check (length(trim(citation)) > 0),
  source_tier smallint not null check (source_tier between 1 and 5),
  rights_status text not null check (rights_status in ('public_domain', 'licensed', 'rights_cleared', 'citation_only')),
  excerpt text not null check (length(trim(excerpt)) > 0),
  language text not null default 'en',
  approved boolean not null default false,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (definition_id, source_url, citation)
);

create table if not exists public.observance_story_versions (
  id uuid primary key default gen_random_uuid(),
  definition_id uuid not null references public.observance_definitions(id) on delete cascade,
  version integer not null check (version > 0),
  status text not null default 'draft' check (status in ('draft', 'needs_review', 'approved', 'published', 'rejected', 'archived')),
  generation_provider text check (generation_provider in ('sarvam', 'human', 'legacy_curated')),
  generation_model text,
  prompt_version text,
  generation_metadata jsonb not null default '{}'::jsonb,
  review_notes text,
  reviewed_by text,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (definition_id, version),
  check ((status <> 'published') or (reviewed_at is not null and published_at is not null))
);

create unique index if not exists observance_story_one_published_per_definition
  on public.observance_story_versions (definition_id)
  where status = 'published';

create table if not exists public.observance_story_translations (
  id uuid primary key default gen_random_uuid(),
  story_version_id uuid not null references public.observance_story_versions(id) on delete cascade,
  language text not null check (language in ('en', 'hi', 'pa')),
  teaser text not null check (length(trim(teaser)) > 0),
  origin text not null check (length(trim(origin)) > 0),
  significance text not null check (length(trim(significance)) > 0),
  rituals jsonb not null default '[]'::jsonb check (jsonb_typeof(rituals) = 'array'),
  verse jsonb check (verse is null or jsonb_typeof(verse) = 'object'),
  personal_practice text not null check (length(trim(personal_practice)) > 0),
  review_status text not null default 'draft' check (review_status in ('draft', 'needs_review', 'approved', 'rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_version_id, language)
);

create table if not exists public.observance_story_source_links (
  story_version_id uuid not null references public.observance_story_versions(id) on delete cascade,
  source_id uuid not null references public.observance_content_sources(id) on delete restrict,
  supported_sections text[] not null default '{}',
  retrieved_chunk_id text,
  created_at timestamptz not null default now(),
  primary key (story_version_id, source_id)
);

create table if not exists public.observance_artwork (
  id uuid primary key default gen_random_uuid(),
  definition_id uuid not null references public.observance_definitions(id) on delete cascade,
  story_version_id uuid not null references public.observance_story_versions(id) on delete cascade,
  kind text not null check (kind in ('card', 'reader_hero', 'share')),
  version integer not null check (version > 0),
  uri text not null check (uri ~ '^https://'),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  focal_x numeric not null default 0.5 check (focal_x between 0 and 1),
  focal_y numeric not null default 0.5 check (focal_y between 0 and 1),
  alt_text jsonb not null default '{}'::jsonb check (jsonb_typeof(alt_text) = 'object'),
  generation_provider text,
  prompt_version text,
  review_status text not null default 'draft' check (review_status in ('draft', 'needs_review', 'approved', 'rejected', 'archived')),
  cultural_review_notes text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_version_id, kind, version)
);

create table if not exists public.observance_share_templates (
  id uuid primary key default gen_random_uuid(),
  definition_id uuid not null references public.observance_definitions(id) on delete cascade,
  story_version_id uuid not null references public.observance_story_versions(id) on delete cascade,
  version integer not null check (version > 0),
  language text not null check (language in ('en', 'hi', 'pa')),
  audience text not null check (audience in ('sibling', 'family', 'teacher', 'community', 'friend', 'neutral')),
  cta text not null check (length(trim(cta)) > 0),
  title text not null check (length(trim(title)) > 0),
  message text not null check (length(trim(message)) > 0),
  review_status text not null default 'draft' check (review_status in ('draft', 'needs_review', 'approved', 'rejected', 'archived')),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_version_id, language, audience)
);

create table if not exists public.observance_content_audit_log (
  id bigint generated always as identity primary key,
  action text not null,
  entity_type text not null,
  entity_id text,
  actor text not null default 'admin',
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists observance_content_sources_definition_idx on public.observance_content_sources(definition_id, approved);
create index if not exists observance_story_versions_definition_idx on public.observance_story_versions(definition_id, status, version desc);
create index if not exists observance_artwork_definition_idx on public.observance_artwork(definition_id, story_version_id, review_status, kind);
create index if not exists observance_share_templates_definition_idx on public.observance_share_templates(definition_id, story_version_id, review_status, language);
create index if not exists observance_content_audit_entity_idx on public.observance_content_audit_log(entity_type, entity_id, created_at desc);

alter table public.observance_content_sources enable row level security;
alter table public.observance_content_sources force row level security;
alter table public.observance_story_versions enable row level security;
alter table public.observance_story_versions force row level security;
alter table public.observance_story_translations enable row level security;
alter table public.observance_story_translations force row level security;
alter table public.observance_story_source_links enable row level security;
alter table public.observance_story_source_links force row level security;
alter table public.observance_artwork enable row level security;
alter table public.observance_artwork force row level security;
alter table public.observance_share_templates enable row level security;
alter table public.observance_share_templates force row level security;
alter table public.observance_content_audit_log enable row level security;
alter table public.observance_content_audit_log force row level security;

revoke all on public.observance_content_sources from public, anon, authenticated;
revoke all on public.observance_story_versions from public, anon, authenticated;
revoke all on public.observance_story_translations from public, anon, authenticated;
revoke all on public.observance_story_source_links from public, anon, authenticated;
revoke all on public.observance_artwork from public, anon, authenticated;
revoke all on public.observance_share_templates from public, anon, authenticated;
revoke all on public.observance_content_audit_log from public, anon, authenticated;

grant all on public.observance_content_sources to service_role;
grant all on public.observance_story_versions to service_role;
grant all on public.observance_story_translations to service_role;
grant all on public.observance_story_source_links to service_role;
grant all on public.observance_artwork to service_role;
grant all on public.observance_share_templates to service_role;
grant all on public.observance_content_audit_log to service_role;
grant usage, select on sequence public.observance_content_audit_log_id_seq to service_role;

commit;
