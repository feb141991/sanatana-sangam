-- Rollback for 20261004113946_email_outbox_delivery.sql.
-- Drops only the new queue, suppression/event ledgers and onboarding trigger.
-- Any queued email is intentionally discarded by this rollback.
begin;

drop trigger if exists enqueue_onboarding_welcome_email on public.profiles;
drop trigger if exists enqueue_account_deletion_email on public.profiles;
drop function if exists public.enqueue_onboarding_welcome_email();
drop function if exists public.enqueue_account_deletion_email();
drop function if exists public.process_resend_email_suppression_event(text, text, text, text[]);
drop function if exists public.register_email_security_device(uuid, text, text);
drop function if exists public.claim_email_outbox(uuid, integer, integer);
drop table if exists public.email_security_devices;
drop table if exists public.email_provider_events;
drop table if exists public.email_suppressions;
drop table if exists public.email_outbox;

commit;
