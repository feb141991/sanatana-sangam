#!/usr/bin/env bash
set -euo pipefail

SHADOW_DB="shoonaya_mandali_prompts_shadow"

if psql postgres -Atqc "select 1 from pg_database where datname = '${SHADOW_DB}'" | grep -qx 1; then
  echo "Refusing to overwrite existing database: ${SHADOW_DB}" >&2
  exit 1
fi

createdb "${SHADOW_DB}"
cleanup() {
  dropdb --if-exists "${SHADOW_DB}"
}
trap cleanup EXIT

psql -v ON_ERROR_STOP=1 "${SHADOW_DB}" <<'SQL'
create extension if not exists pgcrypto;
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end
$$;
create schema auth;
create function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create table public.profiles (
  id uuid primary key,
  username text not null unique,
  mandali_id uuid
);

create table public.mandalis (
  id uuid primary key
);

create table public.mandali_prompts (
  id uuid primary key default gen_random_uuid(),
  text_en text not null,
  text_hi text,
  text_pa text,
  tradition text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  author_id uuid not null references public.profiles(id),
  mandali_id uuid references public.mandalis(id),
  content text not null,
  type text,
  upvotes integer default 0,
  comment_count integer default 0,
  is_pinned boolean default false,
  event_date timestamptz,
  event_location text,
  client_operation_id uuid
);

alter table public.posts enable row level security;

insert into public.profiles (id, username)
values ('11111111-1111-4111-8111-111111111111', 'shoonaya');

insert into public.mandalis (id)
values ('22222222-2222-4222-8222-222222222222');

update public.profiles
set mandali_id = '22222222-2222-4222-8222-222222222222'
where id = '11111111-1111-4111-8111-111111111111';

insert into public.mandali_prompts (id, text_en)
values ('33333333-3333-4333-8333-333333333333', 'How did practice feel today?');

insert into public.posts (
  id,
  created_at,
  author_id,
  mandali_id,
  content,
  type,
  is_pinned
)
values (
  '44444444-4444-4444-8444-444444444444',
  '2026-09-14T06:00:00Z',
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  'How did practice feel today?',
  'question',
  true
);
SQL

psql -v ON_ERROR_STOP=1 "${SHADOW_DB}" \
  -f supabase/migrations/20260914080014_harden_mandali_prompt_materialization.sql

psql -v ON_ERROR_STOP=1 "${SHADOW_DB}" <<'SQL'
grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant insert, select, update on public.posts to authenticated;

do $$
declare
  materialized_count integer;
begin
  select count(*) into materialized_count
  from public.posts
  where mandali_prompt_id = '33333333-3333-4333-8333-333333333333'
    and mandali_prompt_date = date '2026-09-14';
  if materialized_count <> 1 then
    raise exception 'expected one backfilled prompt, got %', materialized_count;
  end if;

  begin
    insert into public.mandali_prompts (text_en)
    values ('');
    raise exception 'blank prompt unexpectedly succeeded';
  exception
    when check_violation then
      null;
  end;
end
$$;

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

insert into public.posts (author_id, mandali_id, content, type)
values (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  'A normal member post',
  'update'
);

do $$
begin
  begin
    insert into public.posts (
      author_id,
      mandali_id,
      content,
      type,
      mandali_prompt_id,
      mandali_prompt_date
    )
    values (
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      'Spoofed prompt',
      'question',
      '33333333-3333-4333-8333-333333333333',
      date '2026-09-15'
    );
    raise exception 'authenticated prompt spoof unexpectedly succeeded';
  exception
    when insufficient_privilege then
      null;
  end;
end
$$;

reset role;

insert into public.posts (
  author_id,
  mandali_id,
  content,
  type,
  is_pinned,
  mandali_prompt_id,
  mandali_prompt_date
)
values (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  'How did practice feel today?',
  'question',
  true,
  '33333333-3333-4333-8333-333333333333',
  date '2026-09-14'
)
on conflict (mandali_id, mandali_prompt_date) do nothing;

do $$
declare
  materialized_count integer;
begin
  select count(*) into materialized_count
  from public.posts
  where mandali_id = '22222222-2222-4222-8222-222222222222'
    and mandali_prompt_date = date '2026-09-14';
  if materialized_count <> 1 then
    raise exception 'daily uniqueness failed, got % rows', materialized_count;
  end if;

  begin
    delete from public.mandali_prompts
    where id = '33333333-3333-4333-8333-333333333333';
    raise exception 'used prompt deletion unexpectedly succeeded';
  exception
    when restrict_violation then
      null;
  end;
end
$$;
SQL

echo "Mandali prompt shadow verification passed."
