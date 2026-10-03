-- Ledger of account-deletion emails, so each one is sent at most once per
-- deletion request: the confirmation when deletion is scheduled, and the
-- reminders 7 days and 1 day before the purge (sent by the daily
-- purge-deleted-accounts cron, which runs whether or not the Vercel Workflow
-- runtime is enabled).
--
-- A sender claims a row (insert ... on conflict do nothing) before sending and
-- removes its claim if the provider refuses, so concurrent or repeated cron
-- runs cannot double-send and a failed send is retried on the next run. A
-- cancelled-then-re-requested deletion has a new deletion_requested_at and so
-- gets its own notices.
--
-- RLS: enabled with no policies -- only the service role (cron, request route)
-- reads or writes it. Rows cascade with the auth user, so the purge removes
-- them. No PII beyond the user id.
--
-- Rollback guidance: supabase/rollbacks/20261003150400_account_deletion_notices_rollback.sql
-- drops the table (the ledger only; nothing else depends on it).

begin;

create table if not exists public.account_deletion_notices (
  user_id uuid not null references auth.users (id) on delete cascade,
  deletion_requested_at timestamptz not null,
  kind text not null check (kind in ('scheduled', 'reminder_7d', 'reminder_1d')),
  sent_at timestamptz not null default now(),
  primary key (user_id, deletion_requested_at, kind)
);

alter table public.account_deletion_notices enable row level security;
revoke all on table public.account_deletion_notices from public, anon, authenticated;
grant select, insert, delete on table public.account_deletion_notices to service_role;

commit;
