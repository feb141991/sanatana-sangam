-- Rollback for 20261106090000_email_consent_ledger.sql.
-- Drops the ledger, both profile triggers and all three functions, and restores the previous column default (true) for email_festivals.
-- It does NOT turn festival e-mail back ON for any existing profile: nobody ever chose it, and the previous values were only the default.
-- The ledger's history is lost; export it first if it matters (select * from public.email_consent_events).
begin;
set local lock_timeout = '5s';

drop trigger if exists profiles_log_email_consent_update on public.profiles;
drop trigger if exists profiles_log_email_consent_insert on public.profiles;
drop function if exists public.set_email_consent(uuid, text, boolean, text, text, text, text);
drop function if exists public.log_email_consent_change();
drop table if exists public.email_consent_events;
drop function if exists public.email_consent_events_immutable();

alter table public.profiles alter column email_festivals set default true;

commit;
