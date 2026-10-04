-- Durable, deduplicated delivery queue for first-party transactional and
-- consented engagement email. Queue rows are private operational data; the
-- worker scrubs recipient/payload after terminal delivery or suppression.
begin;

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique check (length(idempotency_key) between 1 and 256),
  recipient_email text,
  recipient_user_id uuid,
  template_key text not null check (template_key in (
    'waitlist_welcome',
    'onboarding_welcome',
    'kul_invite',
    'festival_reminder',
    'account_deletion',
    'new_device_login'
  )),
  email_class text not null check (email_class in ('transactional', 'marketing')),
  marketing_category text check (marketing_category in ('newsletter', 'festivals')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'suppressed', 'dead')),
  priority smallint not null default 50 check (priority between 0 and 100),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 8 check (max_attempts between 1 and 10),
  available_at timestamptz not null default now(),
  locked_until timestamptz,
  locked_by uuid,
  provider_message_id text,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint email_outbox_marketing_category_check check (
    (email_class = 'marketing' and marketing_category is not null)
    or (email_class = 'transactional' and marketing_category is null)
  ),
  constraint email_outbox_active_recipient_check check (
    status not in ('pending', 'processing') or recipient_email is not null
  )
);

create index if not exists idx_email_outbox_pending_due
  on public.email_outbox (priority asc, available_at asc, created_at asc)
  where status = 'pending';
create index if not exists idx_email_outbox_expired_lease
  on public.email_outbox (locked_until asc)
  where status = 'processing';
create index if not exists idx_email_outbox_created_status
  on public.email_outbox (created_at desc, status);

alter table public.email_outbox enable row level security;
revoke all on table public.email_outbox from public, anon, authenticated;
grant select, insert, update on table public.email_outbox to service_role;

-- Store only a keyed digest of provider-suppressed addresses. The HMAC key is
-- held by the server, so this table does not become an enumerable email list.
create table if not exists public.email_suppressions (
  email_hash text primary key check (length(email_hash) = 64),
  reason text not null check (reason in ('hard_bounce', 'complaint', 'manual')),
  provider_event_id text,
  created_at timestamptz not null default now()
);
alter table public.email_suppressions enable row level security;
revoke all on table public.email_suppressions from public, anon, authenticated;
grant select, insert, update on table public.email_suppressions to service_role;

create table if not exists public.email_provider_events (
  event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz not null default now()
);
alter table public.email_provider_events enable row level security;
revoke all on table public.email_provider_events from public, anon, authenticated;
grant select, insert on table public.email_provider_events to service_role;

-- Store only a keyed digest of an installation identifier. A first-seen device
-- is registered and its security email is queued atomically by the RPC below.
create table if not exists public.email_security_devices (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_hash text not null check (length(device_hash) = 64),
  platform text not null check (platform in ('ios', 'android', 'other')),
  first_seen_at timestamptz not null default now(),
  primary key (user_id, device_hash)
);
alter table public.email_security_devices enable row level security;
revoke all on table public.email_security_devices from public, anon, authenticated;
grant select, insert on table public.email_security_devices to service_role;

-- A verified provider event and its suppression records commit atomically. The
-- endpoint passes HMACs only; no raw recipient address is retained here.
create or replace function public.process_resend_email_suppression_event(
  p_event_id text,
  p_event_type text,
  p_suppression_reason text default null,
  p_email_hashes text[] default '{}'
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inserted_event text;
  v_email_hash text;
begin
  if p_event_id is null or length(p_event_id) < 1 or length(p_event_id) > 256 then
    raise exception 'invalid email event id';
  end if;
  if p_event_type is null or length(p_event_type) < 1 or length(p_event_type) > 120 then
    raise exception 'invalid email event type';
  end if;
  if p_suppression_reason not in ('hard_bounce', 'complaint') then
    if p_suppression_reason is not null then raise exception 'invalid suppression reason'; end if;
  end if;

  insert into public.email_provider_events (event_id, event_type)
  values (p_event_id, p_event_type)
  on conflict (event_id) do nothing
  returning event_id into v_inserted_event;

  if v_inserted_event is null then return false; end if;

  if p_suppression_reason is not null then
    foreach v_email_hash in array coalesce(p_email_hashes, '{}') loop
      if v_email_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid recipient digest'; end if;
      insert into public.email_suppressions as existing (email_hash, reason, provider_event_id)
      values (v_email_hash, p_suppression_reason, p_event_id)
      on conflict (email_hash) do update
        set reason = case when existing.reason = 'manual'
                          then 'manual' else excluded.reason end,
            provider_event_id = case when existing.reason = 'manual'
                                     then existing.provider_event_id
                                     else excluded.provider_event_id end;
    end loop;
  end if;

  return true;
end;
$$;
revoke all on function public.process_resend_email_suppression_event(text, text, text, text[]) from public, anon, authenticated;
grant execute on function public.process_resend_email_suppression_event(text, text, text, text[]) to service_role;

-- A new app installation can report sign-in once; this RPC makes the device
-- insert and outbox enqueue one transaction. Device names/IPs are deliberately
-- omitted; only broad OS family is included in the account-security message.
create or replace function public.register_email_security_device(
  p_user_id uuid,
  p_device_hash text,
  p_platform text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_name text;
  v_inserted_hash text;
  v_platform_label text;
  v_recent_new_devices integer;
begin
  if p_user_id is null or p_device_hash is null or p_device_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid device registration';
  end if;
  if p_platform is null or p_platform not in ('ios', 'android', 'other') then
    raise exception 'invalid device platform';
  end if;

  select auth_user.email into v_email
    from auth.users as auth_user
   where auth_user.id = p_user_id;
  if v_email is null then return false; end if;

  -- Serialize a user's registrations while enforcing an account-level
  -- notification ceiling against clients submitting many random IDs.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  select count(*) into v_recent_new_devices
    from public.email_security_devices as device
   where device.user_id = p_user_id
     and device.first_seen_at > now() - interval '24 hours';

  if v_recent_new_devices >= 5 then return false; end if;

  insert into public.email_security_devices (user_id, device_hash, platform)
  values (p_user_id, p_device_hash, p_platform)
  on conflict (user_id, device_hash) do nothing
  returning device_hash into v_inserted_hash;

  if v_inserted_hash is null then return false; end if;
  select nullif(btrim(profile.full_name), '') into v_name
    from public.profiles as profile
   where profile.id = p_user_id;

  v_platform_label := case p_platform
    when 'ios' then 'an iOS device'
    when 'android' then 'an Android device'
    else 'a device'
  end;

  insert into public.email_outbox (
    idempotency_key, recipient_email, recipient_user_id, template_key,
    email_class, payload, priority
  ) values (
    'new-device:' || p_user_id::text || ':' || p_device_hash,
    lower(v_email), p_user_id, 'new_device_login', 'transactional',
    jsonb_build_object(
      'subject', 'New sign-in to your Shoonaya account',
      'shloka', '',
      'meaning', '',
      'title', coalesce('Hello ' || v_name, 'New sign-in detected'),
      'body', 'A sign-in to your Shoonaya account was made from ' || v_platform_label || ' at ' || to_char(now() at time zone 'UTC', 'DD Mon YYYY HH24:MI') || ' UTC. If this was you, no action is needed. If you do not recognize it, secure your account by changing your password and reviewing your sign-in methods.',
      'ctaText', 'Review account security',
      'ctaUrl', 'https://www.shoonaya.com/settings'
    ),
    10
  ) on conflict (idempotency_key) do nothing;

  return true;
end;
$$;
revoke all on function public.register_email_security_device(uuid, text, text) from public, anon, authenticated;
grant execute on function public.register_email_security_device(uuid, text, text) to service_role;

-- Workers claim with SKIP LOCKED, so overlapping Vercel invocations never
-- own the same active row. Expired leases are recoverable after process death.
create or replace function public.claim_email_outbox(
  p_worker_id uuid,
  p_limit integer default 20,
  p_lease_seconds integer default 120
)
returns setof public.email_outbox
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 100);
  v_lease_seconds integer := least(greatest(coalesce(p_lease_seconds, 120), 30), 300);
begin
  if p_worker_id is null then
    raise exception 'worker id is required';
  end if;

  -- Resend retains idempotency keys for 24 hours. Stop retrying after 23h so a
  -- very delayed retry cannot cross that provider-side dedupe window.
  update public.email_outbox as outbox
     set status = 'dead',
         recipient_email = null,
         recipient_user_id = null,
         payload = '{}'::jsonb,
         last_error_code = 'idempotency_window_expired',
         locked_until = null,
         locked_by = null,
         updated_at = now()
   where outbox.status in ('pending', 'processing')
     and outbox.created_at <= now() - interval '23 hours'
     and (outbox.status = 'pending' or outbox.locked_until <= now());

  update public.email_outbox as outbox
     set status = 'dead',
         recipient_email = null,
         recipient_user_id = null,
         payload = '{}'::jsonb,
         last_error_code = 'attempts_exhausted',
         locked_until = null,
         locked_by = null,
         updated_at = now()
   where outbox.status in ('pending', 'processing')
     and outbox.attempt_count >= outbox.max_attempts
     and (outbox.status = 'pending' or outbox.locked_until <= now());

  return query
  with candidates as (
    select outbox.id
      from public.email_outbox as outbox
     where (
       (outbox.status = 'pending' and outbox.available_at <= now())
       or (outbox.status = 'processing' and outbox.locked_until <= now())
     )
       and outbox.attempt_count < outbox.max_attempts
       and outbox.created_at > now() - interval '23 hours'
     order by outbox.priority asc, outbox.available_at asc, outbox.created_at asc
     limit v_limit
     for update skip locked
  )
  update public.email_outbox as outbox
     set status = 'processing',
         attempt_count = outbox.attempt_count + 1,
         locked_until = now() + make_interval(secs => v_lease_seconds),
         locked_by = p_worker_id,
         updated_at = now()
    from candidates
   where outbox.id = candidates.id
  returning outbox.*;
end;
$$;

revoke all on function public.claim_email_outbox(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.claim_email_outbox(uuid, integer, integer) to service_role;

-- Enqueue the post-onboarding welcome in the same transaction as the profile
-- transition. This avoids losing the email if the API process exits after its
-- profile update and before a second network write.
create or replace function public.enqueue_onboarding_welcome_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
begin
  if new.onboarding_completed is true and old.onboarding_completed is distinct from true then
    select lower(auth_user.email)
      into v_email
      from auth.users as auth_user
     where auth_user.id = new.id
       and auth_user.email is not null;

    if v_email is not null then
      insert into public.email_outbox (
        idempotency_key,
        recipient_email,
        recipient_user_id,
        template_key,
        email_class,
        payload,
        priority
      ) values (
        'onboarding-welcome:' || new.id::text,
        v_email,
        new.id,
        'onboarding_welcome',
        'transactional',
        jsonb_build_object(
          'name', nullif(btrim(new.full_name), ''),
          'tradition', new.tradition
        ),
        20
      ) on conflict (idempotency_key) do nothing;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enqueue_onboarding_welcome_email() from public, anon, authenticated;
drop trigger if exists enqueue_onboarding_welcome_email on public.profiles;
create trigger enqueue_onboarding_welcome_email
  after update of onboarding_completed on public.profiles
  for each row
  execute function public.enqueue_onboarding_welcome_email();

-- A deletion request and its confirmation enter the durable queue in the same
-- transaction. The worker rechecks that this exact request is still active
-- before delivery, so a cancelled or superseded request is suppressed.
create or replace function public.enqueue_account_deletion_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
begin
  if new.is_deleting is true
    and new.deletion_requested_at is not null
    and (old.is_deleting is distinct from true or old.deletion_requested_at is distinct from new.deletion_requested_at)
  then
    select lower(auth_user.email)
      into v_email
      from auth.users as auth_user
     where auth_user.id = new.id
       and auth_user.email is not null;

    if v_email is not null then
      insert into public.email_outbox (
        idempotency_key, recipient_email, recipient_user_id, template_key,
        email_class, payload, priority
      ) values (
        'account-deletion:' || new.id::text || ':' || to_char(new.deletion_requested_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') || ':scheduled',
        v_email,
        new.id,
        'account_deletion',
        'transactional',
        jsonb_build_object('kind', 'scheduled', 'deletionRequestedAt', new.deletion_requested_at),
        10
      ) on conflict (idempotency_key) do nothing;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enqueue_account_deletion_email() from public, anon, authenticated;
drop trigger if exists enqueue_account_deletion_email on public.profiles;
create trigger enqueue_account_deletion_email
  after update of is_deleting, deletion_requested_at on public.profiles
  for each row
  execute function public.enqueue_account_deletion_email();

commit;
