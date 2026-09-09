-- One immutable calendar-settings snapshot per account. Link possession grants
-- calendar-only reads; it is not a Supabase session or account credential.
create table if not exists public.calendar_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token text not null unique check (token ~ '^[a-f0-9]{64}$'),
  settings jsonb not null check (jsonb_typeof(settings) = 'object'),
  created_at timestamptz not null default now()
);
alter table public.calendar_subscriptions enable row level security;
revoke all on public.calendar_subscriptions from public, anon, authenticated;
grant select, delete on public.calendar_subscriptions to authenticated;
grant all on public.calendar_subscriptions to service_role;
create policy calendar_subscription_owner_read on public.calendar_subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy calendar_subscription_owner_revoke on public.calendar_subscriptions
  for delete to authenticated using ((select auth.uid()) = user_id);
-- Inserts are server-only: clients must not forge the canonical settings.
-- Rollback: drop table public.calendar_subscriptions; (revokes every feed).
