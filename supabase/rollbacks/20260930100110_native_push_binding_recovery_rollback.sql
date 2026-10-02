-- Prefer a code rollback while retaining these additive columns and receipt
-- evidence. Use this destructive schema rollback ONLY after reverting the new
-- backend, exporting receipt outcomes, and verifying no new client relies on
-- versioned acknowledgements. It intentionally keeps service-only grants.
begin;
drop function if exists public.native_push_monitoring_counts(timestamptz,timestamptz);
drop function if exists public.complete_native_push_receipts(jsonb);
drop function if exists public.prune_native_push_bindings(jsonb);
drop function if exists public.remove_native_push_token(uuid,text,uuid);
drop function if exists public.register_native_push_token(uuid,text,text);
create or replace function public.update_push_token_timestamp()
returns trigger language plpgsql security definer set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;
alter table public.push_tokens drop column if exists binding_version;
drop index if exists public.idx_push_receipts_pending_unresolved;
drop index if exists public.idx_push_receipts_outcome_retention;
alter table public.push_receipts_pending drop constraint if exists push_receipts_pending_status_check;
alter table public.push_receipts_pending
  drop column if exists binding_version, drop column if exists token_hash,
  drop column if exists notification_id, drop column if exists notification_key,
  drop column if exists notification_type, drop column if exists receipt_status,
  drop column if exists receipt_error, drop column if exists prune_status, drop column if exists checked_at;
commit;
