-- Rollback for 20261112120000_drop_legacy_device_tokens.sql: recreates the retired table, indexes, policy, trigger and both functions as
-- they were in production on 2026-11-12. The table was empty, so no data is lost by the migration or needs restoring.
-- Grants: the original table carried Supabase's default grants to anon, authenticated and service_role. They are restored for
-- authenticated and service_role only; anon gets nothing (it never needed table access, and RLS denied it anyway).
begin;
set local lock_timeout = '5s';

create or replace function public.update_device_token_timestamp()
returns trigger
language plpgsql
set search_path to 'public'
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

create table public.device_tokens (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  player_id text not null,
  platform text not null default 'web',
  is_active boolean not null default true,
  registered_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint device_tokens_pkey primary key (id),
  constraint device_tokens_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade
);

create unique index idx_device_tokens_player on public.device_tokens using btree (player_id);
create index idx_device_tokens_user on public.device_tokens using btree (user_id) where (is_active = true);

alter table public.device_tokens enable row level security;
create policy "Users manage own device tokens" on public.device_tokens
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create trigger trg_device_tokens_updated before update on public.device_tokens
  for each row execute function public.update_device_token_timestamp();

grant select, insert, update, delete on public.device_tokens to authenticated;
grant all on public.device_tokens to service_role;

create or replace function public.upsert_device_token(p_user_id uuid, p_player_id text, p_platform text default 'web')
returns void
language plpgsql
set search_path to 'public'
as $fn$
begin
  insert into device_tokens (user_id, player_id, platform, is_active)
  values (p_user_id, p_player_id, p_platform, true)
  on conflict (player_id) do update
    set user_id    = excluded.user_id,
        platform   = excluded.platform,
        is_active  = true,
        updated_at = now();
end;
$fn$;
grant execute on function public.upsert_device_token(uuid, text, text) to authenticated, service_role;

commit;
