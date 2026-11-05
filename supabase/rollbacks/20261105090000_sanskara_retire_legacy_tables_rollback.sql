-- Rollback for 20261105090000_sanskara_retire_legacy_tables.sql.
-- Recreates the three legacy tables exactly as they were in production on 2026-11-05 (columns, defaults, constraints, indexes, row-level
-- security, policies and grants) and restores the public catalogue from the archive table. The user tables come back EMPTY, as they were: the
-- migration refuses to run if they hold rows. The archive table is left in place (drop it only by explicit decision).
begin;
set local lock_timeout = '5s';

do $$
begin
  if to_regclass('public.sanskars_catalogue_archive_20261105') is null then
    raise exception 'the archive table is missing; the catalogue cannot be restored' using errcode = 'P0001';
  end if;
end $$;

create table public.sanskars (
  id uuid not null default gen_random_uuid(),
  slug text not null,
  sequence_number integer not null,
  name text not null,
  name_sanskrit text,
  name_meaning text,
  life_stage text not null,
  typical_age text,
  significance text not null,
  presiding_deity text,
  key_mantras text[],
  samagri text[],
  vidhi_steps jsonb not null,
  duration_hours double precision,
  priest_required boolean default true,
  can_self_perform boolean default false,
  notes text,
  constraint sanskars_pkey primary key (id),
  constraint sanskars_slug_key unique (slug),
  constraint sanskars_life_stage_check check (life_stage = any (array['prenatal','birth','infancy','childhood','education','adulthood','marriage','elder','death']))
);

create table public.user_sanskars (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  sanskar_id uuid not null,
  beneficiary_name text,
  beneficiary_dob date,
  status text default 'planned',
  scheduled_date date,
  completed_date date,
  priest_name text,
  location text,
  notes text,
  family_members text[],
  created_at timestamptz default now(),
  constraint user_sanskars_pkey primary key (id),
  constraint user_sanskars_status_check check (status = any (array['planned','in_progress','completed'])),
  constraint user_sanskars_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade,
  constraint user_sanskars_sanskar_id_fkey foreign key (sanskar_id) references public.sanskars(id)
);
create index idx_user_sanskars_user on public.user_sanskars using btree (user_id);
create index idx_user_sanskars_sanskar on public.user_sanskars using btree (sanskar_id);

create table public.user_sanskaras (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  sanskara_id text not null,
  completed_date date,
  notes text,
  performed_by text,
  location text,
  created_at timestamptz default now(),
  kul_member_id uuid,
  expected_date date,
  constraint user_sanskaras_pkey primary key (id),
  constraint user_sanskaras_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade,
  constraint user_sanskaras_user_sanskara_unique unique (user_id, sanskara_id),
  constraint user_sanskaras_kul_member_id_fkey foreign key (kul_member_id) references public.kul_family_members(id) on delete set null,
  constraint user_sanskaras_member_unique unique (user_id, kul_member_id, sanskara_id)
);
create index idx_user_sanskaras_user on public.user_sanskaras using btree (user_id);
create index idx_user_sanskaras_member on public.user_sanskaras using btree (kul_member_id) where (kul_member_id is not null);

-- Restore the catalogue exactly as archived (every column, including ids).
insert into public.sanskars select * from public.sanskars_catalogue_archive_20261105;

alter table public.sanskars enable row level security;
alter table public.user_sanskars enable row level security;
alter table public.user_sanskaras enable row level security;
create policy "Sanskars are public" on public.sanskars for select to public using (true);
create policy "Users manage own sanskars" on public.user_sanskars for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Users manage own sanskaras" on public.user_sanskaras for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Grants as they were (Supabase defaults for these tables).
grant all on public.sanskars, public.user_sanskars, public.user_sanskaras to anon, authenticated, service_role;

commit;
