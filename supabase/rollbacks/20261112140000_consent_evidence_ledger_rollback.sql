-- Rollback for 20261112140000_consent_evidence_ledger.sql. WARNING: this drops the ledger, which is the evidence of consent. Export
-- public.consent_events and public.consent_wording first (select * from them) if any real consent has been recorded since it was applied.
-- Consent values on profiles are not touched.
begin;
set local lock_timeout = '5s';

drop trigger if exists profiles_record_consent_changes_ins on public.profiles;
drop trigger if exists profiles_record_consent_changes_upd on public.profiles;
drop function if exists public.record_profile_consent_changes();
alter table public.profiles drop column if exists consent_context_in;

drop function if exists public.verify_consent_chain(uuid);
drop trigger if exists consent_events_no_truncate on public.consent_events;
drop trigger if exists consent_events_no_delete on public.consent_events;
drop trigger if exists consent_events_no_update on public.consent_events;
drop trigger if exists consent_events_chain on public.consent_events;
drop function if exists public.consent_events_block_change();
drop function if exists public.consent_events_chain();
drop function if exists public.consent_event_hash(public.consent_events);
drop table if exists public.consent_events;
drop table if exists public.consent_wording;

commit;
