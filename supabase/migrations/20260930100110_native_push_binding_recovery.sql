-- Additive Native push binding versions and durable provider receipt outcomes.
-- Apply before the matching backend. Existing registration RPCs/old clients remain valid.
begin;

alter table public.push_tokens add column if not exists binding_version uuid not null default gen_random_uuid();

-- Includes legacy upsert_push_token writes, so every acknowledged refresh has a
-- new version even if owner, token, platform and transaction timestamp are equal.
create or replace function public.update_push_token_timestamp()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at = now();
  new.binding_version = gen_random_uuid();
  return new;
end;
$$;

create or replace function public.register_native_push_token(p_user_id uuid, p_token text, p_platform text default 'unknown')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_version uuid;
begin
  if p_token is null or length(p_token) > 250 or p_token !~ '^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$' then
    raise exception 'Invalid Expo token';
  end if;
  insert into public.push_tokens (user_id, token, platform, last_seen_at, updated_at)
  values (p_user_id, p_token, p_platform, now(), now())
  on conflict (token) do update set
    user_id = excluded.user_id, platform = excluded.platform, last_seen_at = now(), updated_at = now()
  returning binding_version into v_version;
  return v_version;
end;
$$;

create or replace function public.remove_native_push_token(p_user_id uuid, p_token text, p_binding_version uuid default null)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  -- NULL preserves old Native DELETE compatibility. New Native always supplies
  -- its acknowledged version. Unversioned legacy logout remains best-effort.
  delete from public.push_tokens where user_id = p_user_id and token = p_token
    and (p_binding_version is null or binding_version = p_binding_version);
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

create or replace function public.prune_native_push_bindings(p_bindings jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_removed jsonb;
begin
  if p_bindings is null or jsonb_typeof(p_bindings) <> 'array' or jsonb_array_length(p_bindings) > 1500 then
    raise exception 'Invalid push prune batch';
  end if;
  with removed as (
    delete from public.push_tokens p using jsonb_to_recordset(p_bindings)
      as b(token text, user_id uuid, binding_version uuid)
    where p.token = b.token and p.user_id = b.user_id and p.binding_version = b.binding_version
    returning p.token, p.user_id, p.binding_version
  ) select coalesce(jsonb_agg(to_jsonb(removed)), '[]'::jsonb) into v_removed from removed;
  return v_removed;
end;
$$;

revoke all on function public.register_native_push_token(uuid,text,text) from public, anon, authenticated;
revoke all on function public.remove_native_push_token(uuid,text,uuid) from public, anon, authenticated;
revoke all on function public.prune_native_push_bindings(jsonb) from public, anon, authenticated;
grant execute on function public.register_native_push_token(uuid,text,text) to service_role;
grant execute on function public.remove_native_push_token(uuid,text,uuid) to service_role;
grant execute on function public.prune_native_push_bindings(jsonb) to service_role;

alter table public.push_receipts_pending
  add column if not exists binding_version uuid,
  add column if not exists token_hash text,
  add column if not exists notification_id uuid,
  add column if not exists notification_key text,
  add column if not exists notification_type text not null default 'general',
  add column if not exists receipt_status text not null default 'pending',
  add column if not exists receipt_error text,
  add column if not exists prune_status text,
  add column if not exists checked_at timestamptz;

alter table public.push_receipts_pending add constraint push_receipts_pending_status_check
  check (receipt_status in ('pending','ok','error','expired'));
create index if not exists idx_push_receipts_pending_unresolved
  on public.push_receipts_pending(created_at) where receipt_status = 'pending';
create index if not exists idx_push_receipts_outcome_retention
  on public.push_receipts_pending(checked_at) where receipt_status <> 'pending';

create or replace function public.complete_native_push_receipts(p_results jsonb)
returns integer language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  if p_results is null or jsonb_typeof(p_results) <> 'array' or jsonb_array_length(p_results) > 1500 then
    raise exception 'Invalid push receipt batch';
  end if;
  update public.push_receipts_pending p set
    receipt_status = r.status, receipt_error = left(r.error, 100),
    token_hash = coalesce(p.token_hash, r.token_hash), token = '',
    checked_at = now(), prune_status = r.prune_status
  from jsonb_to_recordset(p_results) as r(ticket_id text, status text, error text, token_hash text, prune_status text)
  where p.ticket_id = r.ticket_id and p.receipt_status = 'pending'
    and r.status in ('ok','error','expired');
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.complete_native_push_receipts(jsonb) from public, anon, authenticated;
grant execute on function public.complete_native_push_receipts(jsonb) to service_role;

-- The existing service-only receipt table becomes a bounded outcome ledger, not
-- another queue. Raw tokens are erased on terminal outcomes; hashes remain for
-- support correlation. The checker enforces 30-day retention. No client grants.
alter table public.push_receipts_pending enable row level security;
revoke all on public.push_receipts_pending from anon, authenticated;
revoke all on public.push_receipts_pending from public;
grant select, insert, update, delete on public.push_receipts_pending to service_role;
comment on column public.push_tokens.binding_version is 'Exact registration generation; provider errors/logout may only remove the version they observed.';
comment on column public.push_receipts_pending.receipt_status is 'pending -> ok/error/expired, retained 30 days; success is provider handoff, not physical display.';

-- Exact same-window counts in one statement, independent of paginated examples
-- or PostgREST's maximum returned rows. Service-only and admin API protected.
create or replace function public.native_push_monitoring_counts(p_since timestamptz, p_until timestamptz)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'activeTokens', (select count(*) from public.push_tokens),
    'pendingReceiptsCount', (select count(*) from public.push_receipts_pending where receipt_status = 'pending'),
    'expoAccepted', count(*) filter (where provider = 'expo' and status = 'sent'),
    'expoFailed', count(*) filter (where provider = 'expo' and status = 'failed'),
    'expoSkipped', count(*) filter (where provider = 'expo' and status = 'skipped'),
    'receiptTrackingFailed', count(*) filter (where provider = 'expo' and status = 'sent' and metadata ->> 'receiptTracking' = 'failed'),
    'legacyAccepted', count(*) filter (where provider = 'onesignal' and status = 'sent'),
    'legacyFailed', count(*) filter (where provider = 'onesignal' and status = 'failed'),
    'legacyUnconfigured', count(*) filter (where provider = 'onesignal' and status = 'unconfigured'),
    'receiptOk', (select count(*) from public.push_receipts_pending where receipt_status = 'ok' and checked_at >= p_since and checked_at < p_until),
    'receiptError', (select count(*) from public.push_receipts_pending where receipt_status = 'error' and checked_at >= p_since and checked_at < p_until),
    'receiptExpired', (select count(*) from public.push_receipts_pending where receipt_status = 'expired' and checked_at >= p_since and checked_at < p_until)
  ) from public.notification_deliveries where created_at >= p_since and created_at < p_until;
$$;
revoke all on function public.native_push_monitoring_counts(timestamptz,timestamptz) from public, anon, authenticated;
grant execute on function public.native_push_monitoring_counts(timestamptz,timestamptz) to service_role;

commit;
