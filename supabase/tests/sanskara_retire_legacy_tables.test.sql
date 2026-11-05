-- Integration test for 20261105090000_sanskara_retire_legacy_tables.sql and its rollback.
-- Run from the repository root on an EMPTY scratch database (it creates auth.users and public.kul_family_members stand-ins and the three legacy
-- tables itself), with ON_ERROR_STOP on:   psql -v ON_ERROR_STOP=1 -d <scratch> -f supabase/tests/sanskara_retire_legacy_tables.test.sql
-- The migration and rollback are run with \i because each is its own transaction. One step is expected to fail and turns the flag off around it.
create schema if not exists auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
create table public.kul_family_members (id uuid primary key);

create function public._ok(p_label text, p_cond boolean) returns void language plpgsql as $$
begin if p_cond is not true then raise exception 'FAIL %', p_label using errcode = 'P0004'; end if; end $$;

-- The legacy tables as production had them (2026-11-05), with a 3-row catalogue standing in for the 16.
create table public.sanskars (
  id uuid not null default gen_random_uuid(), slug text not null, sequence_number integer not null, name text not null, name_sanskrit text,
  name_meaning text, life_stage text not null, typical_age text, significance text not null, presiding_deity text, key_mantras text[], samagri text[],
  vidhi_steps jsonb not null, duration_hours double precision, priest_required boolean default true, can_self_perform boolean default false, notes text,
  constraint sanskars_pkey primary key (id), constraint sanskars_slug_key unique (slug),
  constraint sanskars_life_stage_check check (life_stage = any (array['prenatal','birth','infancy','childhood','education','adulthood','marriage','elder','death'])));
create table public.user_sanskars (
  id uuid not null default gen_random_uuid(), user_id uuid not null, sanskar_id uuid not null, beneficiary_name text, beneficiary_dob date,
  status text default 'planned', scheduled_date date, completed_date date, priest_name text, location text, notes text, family_members text[],
  created_at timestamptz default now(), constraint user_sanskars_pkey primary key (id),
  constraint user_sanskars_status_check check (status = any (array['planned','in_progress','completed'])),
  constraint user_sanskars_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade,
  constraint user_sanskars_sanskar_id_fkey foreign key (sanskar_id) references public.sanskars(id));
create table public.user_sanskaras (
  id uuid not null default gen_random_uuid(), user_id uuid not null, sanskara_id text not null, completed_date date, notes text, performed_by text,
  location text, created_at timestamptz default now(), kul_member_id uuid, expected_date date, constraint user_sanskaras_pkey primary key (id),
  constraint user_sanskaras_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade,
  constraint user_sanskaras_user_sanskara_unique unique (user_id, sanskara_id),
  constraint user_sanskaras_kul_member_id_fkey foreign key (kul_member_id) references public.kul_family_members(id) on delete set null,
  constraint user_sanskaras_member_unique unique (user_id, kul_member_id, sanskara_id));
alter table public.sanskars enable row level security;
create policy "Sanskars are public" on public.sanskars for select to public using (true);
insert into public.sanskars (slug, sequence_number, name, name_sanskrit, life_stage, significance, vidhi_steps, key_mantras, duration_hours, notes) values
  ('a', 1, 'A', 'ए', 'prenatal', 'sig a', '[{"step":1,"title":"t","description":"d"}]', array['m1','m2'], 2.5, null),
  ('b', 2, 'B', null, 'birth', 'sig b', '[]', null, null, 'n'),
  ('c', 3, 'C', 'सी', 'death', 'sig c', '[{"step":1}]', array['x'], 1, null);
create temp table _before as select * from public.sanskars;

-- 1. A single row in either user table stops the migration, and nothing changes.
insert into auth.users (id) values ('00000000-0000-4000-8000-000000000001');
insert into public.user_sanskaras (user_id, sanskara_id) values ('00000000-0000-4000-8000-000000000001', 's1');
\set ON_ERROR_STOP off
\i supabase/migrations/20261105090000_sanskara_retire_legacy_tables.sql
rollback;
\set ON_ERROR_STOP on
select public._ok('refused with a row in user_sanskaras: all three tables remain',
  to_regclass('public.user_sanskaras') is not null and to_regclass('public.user_sanskars') is not null and to_regclass('public.sanskars') is not null);
select public._ok('and no archive was created', to_regclass('public.sanskars_catalogue_archive_20261105') is null);
select public._ok('and the person''s row is still there', (select count(*) from public.user_sanskaras) = 1);
delete from public.user_sanskaras;

insert into public.user_sanskars (user_id, sanskar_id) select '00000000-0000-4000-8000-000000000001', id from public.sanskars limit 1;
\set ON_ERROR_STOP off
\i supabase/migrations/20261105090000_sanskara_retire_legacy_tables.sql
rollback;
\set ON_ERROR_STOP on
select public._ok('refused with a row in user_sanskars too', to_regclass('public.user_sanskars') is not null and (select count(*) from public.user_sanskars) = 1);
delete from public.user_sanskars;

-- 2. Empty user tables: it runs.
\i supabase/migrations/20261105090000_sanskara_retire_legacy_tables.sql
select public._ok('the three tables are gone', to_regclass('public.user_sanskaras') is null and to_regclass('public.user_sanskars') is null and to_regclass('public.sanskars') is null);
select public._ok('the archive holds the catalogue unmodified', (select count(*) from public.sanskars_catalogue_archive_20261105) = 3
  and not exists (select 1 from (select * from _before except select * from public.sanskars_catalogue_archive_20261105) x)
  and not exists (select 1 from (select * from public.sanskars_catalogue_archive_20261105 except select * from _before) x));
select public._ok('the archive has row-level security on and forced', (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.sanskars_catalogue_archive_20261105'::regclass));
select public._ok('and no policy', not exists (select 1 from pg_policies where tablename = 'sanskars_catalogue_archive_20261105'));
select public._ok('and no grant to anon, authenticated or public',
  not has_table_privilege('anon', 'public.sanskars_catalogue_archive_20261105', 'select')
  and not has_table_privilege('authenticated', 'public.sanskars_catalogue_archive_20261105', 'select'));

-- 3. Rollback restores everything.
\i supabase/rollbacks/20261105090000_sanskara_retire_legacy_tables_rollback.sql
select public._ok('rollback: tables are back', to_regclass('public.user_sanskaras') is not null and to_regclass('public.user_sanskars') is not null and to_regclass('public.sanskars') is not null);
select public._ok('rollback: the catalogue is identical to before', (select count(*) from public.sanskars) = 3
  and not exists (select 1 from (select * from _before except select * from public.sanskars) x));
select public._ok('rollback: user tables are empty', (select count(*) from public.user_sanskaras) = 0 and (select count(*) from public.user_sanskars) = 0);
select public._ok('rollback: constraints are back', (select count(*) from pg_constraint where conrelid in ('public.sanskars'::regclass, 'public.user_sanskars'::regclass, 'public.user_sanskaras'::regclass) and contype in ('p','u','f','c')) = 12);
select public._ok('rollback: row-level security and policies are back', (select count(*) from pg_policies where tablename in ('sanskars','user_sanskars','user_sanskaras')) = 3
  and (select bool_and(relrowsecurity) from pg_class where oid in ('public.sanskars'::regclass, 'public.user_sanskars'::regclass, 'public.user_sanskaras'::regclass)));
select public._ok('rollback: the foreign key to the catalogue works', (select count(*) from pg_constraint where conname = 'user_sanskars_sanskar_id_fkey') = 1);
select public._ok('rollback: the archive is left in place', to_regclass('public.sanskars_catalogue_archive_20261105') is not null);

-- 4. And it can be applied again after a rollback (the archive already exists, so drop it first, as a person would).
drop table public.sanskars_catalogue_archive_20261105;
\i supabase/migrations/20261105090000_sanskara_retire_legacy_tables.sql
select public._ok('re-applied', to_regclass('public.sanskars') is null and (select count(*) from public.sanskars_catalogue_archive_20261105) = 3);

do $$ begin raise notice 'ALL LEGACY RETIREMENT ASSERTIONS PASSED'; end $$;
