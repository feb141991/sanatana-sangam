-- Notification tap tracking: one row per tap on a push notification, so that "did it help?" can be measured.
--
-- WRITTEN, NOT APPLIED. Plan agreed with the founder 2026-11-07/08. Before this, nothing recorded that a
-- notification was tapped and every in-app "read" rate was 0%, so no change to the notification cadence
-- could be judged.
--
-- WHAT IS STORED (and what is not)
--   user, the notification's key, its type, when it was tapped, whether the app was already running, app
--   version and platform. NOT stored: title, body, URL, route, content, location, or any client-chosen text.
--   The type and the send time are NOT taken from the client: they are read from our own send log
--   (notification_deliveries). A tap whose key does not match a push actually sent to THAT account records
--   nothing, so a key cannot be invented, replayed across accounts or attributed to the wrong person.
--   Retained 90 days (daily purge), deleted with the account (ON DELETE CASCADE) and when consent is withdrawn.
--
-- CONSENT (decision pending; this file fails closed)
--   notification_tap_recording_allowed() is the single place the rule lives. As written it follows the
--   existing product-analytics rule: the account must have opted in (profiles.consent_product_analytics, default
--   false) and, for any notification that could reveal religious practice, also consent_religious_data.
--   On 2026-11-10 NO account (0 of 32) had opted in to product analytics, so as written this records nothing
--   until people opt in. Changing the rule is a one-function change; see docs/notifications/NOTIFICATION_TAP_TRACKING.md.
--
-- ROC pre-flight (AGENTS.md section 4)
--   1. Function overload trap (PGRST203): every function here is a NEW name; no existing signature is touched or
--      redefined. A self-check at the end counts one definition per name.
--   2. Caller contract: no existing caller. record_notification_tap is called only by the new route
--      /api/native/notification-taps. The push payload gains a notificationKey field in the same release; apps
--      and backends of either age keep working (an app without the key sends nothing; a backend without the route
--      answers 404 and the app keeps the tap until it ages out).
--   3. User data / opt-outs: creates a table; updates no existing row and changes no column default.
--   4. Locks: CREATE TABLE and CREATE TRIGGER on profiles (brief SHARE ROW EXCLUSIVE on a small table). No data scan.
--   5. Rollback: supabase/rollbacks/20261111100000_notification_tap_tracking_rollback.sql (drops the table and the
--      data in it).
--   RLS: enabled and forced, no policy; only the service role and SECURITY DEFINER functions can reach the table.
--   Privileges: all functions revoked from public/anon; record_notification_tap alone is granted to authenticated.

create table if not exists public.notification_taps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_event_id uuid not null,
  notification_key text not null check (char_length(notification_key) between 1 and 200),
  notification_type text not null check (notification_type ~ '^[a-z0-9_]{1,64}$'),
  tapped_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  launch_state text not null check (launch_state in ('cold_start', 'running')),
  app_version text check (app_version is null or (char_length(app_version) <= 32 and app_version ~ '^\d+\.\d+\.\d+([+-][A-Za-z0-9.-]+)?$')),
  platform text check (platform is null or platform in ('ios', 'android')),
  constraint notification_taps_client_event_key unique (user_id, client_event_id)
);

comment on table public.notification_taps is
  'One row per tap on a push notification the app sent this account. No title, body, URL or content. Type and send time come from notification_deliveries, not the client. Consent-gated (see notification_tap_recording_allowed). Retained 90 days; cascades on account deletion; purged when consent is withdrawn.';
comment on column public.notification_taps.launch_state is
  'cold_start: the tap launched the app. running: the app was already running (foreground or background).';

create index if not exists notification_taps_recorded_idx on public.notification_taps (recorded_at);
create index if not exists notification_taps_type_tapped_idx on public.notification_taps (notification_type, tapped_at desc);

alter table public.notification_taps enable row level security;
alter table public.notification_taps force row level security;
revoke all on table public.notification_taps from public, anon, authenticated;
grant all on table public.notification_taps to service_role;

-- Types that cannot reveal religious practice: another person's action, or our own account/security notices.
-- Anything else, and any type we have never heard of, is treated as revealing practice.
create or replace function public.notification_tap_type_reveals_practice(p_notification_type text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select not (coalesce(p_notification_type, '') = any(array[
    'connection_request', 'connection_accepted', 'connection_rejected', 'connection_cancelled',
    'post_reaction', 'comment_reaction', 'mandali_comment', 'user_blocked', 'content_reported',
    'security', 'account'
  ]::text[]));
$$;

-- THE consent rule for tap tracking. Fails closed: no profile row, a null, or a missing consent is "not allowed".
create or replace function public.notification_tap_recording_allowed(p_user_id uuid, p_notification_type text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select profile.consent_product_analytics is true
       and (
         not public.notification_tap_type_reveals_practice(p_notification_type)
         or profile.consent_religious_data is true
       )
    from public.profiles as profile
    where profile.id = p_user_id
  ), false);
$$;

-- Record one tap. Identity comes from the session (auth.uid()), never from the request. Serialised with a
-- consent withdrawal by locking the consent row, exactly as record_native_product_analytics does.
create or replace function public.record_notification_tap(
  p_client_event_id uuid,
  p_notification_key text,
  p_tapped_at timestamptz,
  p_launch_state text,
  p_app_version text default null,
  p_platform text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_consent boolean;
  v_type text;
  v_sent_at timestamptz;
  v_tapped_at timestamptz;
  v_inserted integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_client_event_id is null
     or p_notification_key is null or char_length(p_notification_key) not between 1 and 200
     or p_launch_state is null or p_launch_state not in ('cold_start', 'running') then
    raise exception 'Invalid notification tap' using errcode = '22023';
  end if;
  if p_platform is not null and p_platform not in ('ios', 'android') then
    raise exception 'Invalid notification tap platform' using errcode = '22023';
  end if;
  if p_app_version is not null and (char_length(p_app_version) > 32 or p_app_version !~ '^\d+\.\d+\.\d+([+-][A-Za-z0-9.-]+)?$') then
    raise exception 'Invalid notification tap app version' using errcode = '22023';
  end if;

  select profile.consent_product_analytics into v_consent
  from public.profiles as profile where profile.id = v_user_id for update;
  if coalesce(v_consent, false) is not true then
    return jsonb_build_object('accepted', 0, 'consentRequired', true, 'religiousConsentRequired', false, 'unmatched', false);
  end if;

  -- The server's own record of what it sent THIS account. The type and send time come from here.
  select delivery.type, min(delivery.created_at) over ()
  into v_type, v_sent_at
  from public.notification_deliveries as delivery
  where delivery.user_id = v_user_id
    and delivery.notification_key = p_notification_key
    and delivery.channel = 'push'
    and delivery.status = 'sent'
    and delivery.dry_run is not true
  order by delivery.created_at asc
  limit 1;
  if v_type is null then
    return jsonb_build_object('accepted', 0, 'consentRequired', false, 'religiousConsentRequired', false, 'unmatched', true);
  end if;

  if not public.notification_tap_recording_allowed(v_user_id, v_type) then
    return jsonb_build_object('accepted', 0, 'consentRequired', false, 'religiousConsentRequired', true, 'unmatched', false);
  end if;

  -- A device clock is not trusted. A tap cannot be in the future (clamped to now: an upper bound is always safe).
  -- A tap stamped more than ten minutes BEFORE the send it answers is impossible; recording it would invent a
  -- zero-latency tap, so it is refused, not clamped. Small skew inside ten minutes is clamped up to the send
  -- time. A tap older than a week is stale.
  v_tapped_at := least(coalesce(p_tapped_at, now()), now());
  if v_tapped_at < v_sent_at - interval '10 minutes' or v_tapped_at < now() - interval '7 days' then
    return jsonb_build_object('accepted', 0, 'consentRequired', false, 'religiousConsentRequired', false, 'unmatched', true);
  end if;
  v_tapped_at := greatest(v_tapped_at, v_sent_at);

  insert into public.notification_taps (
    user_id, client_event_id, notification_key, notification_type, tapped_at, launch_state, app_version, platform
  ) values (
    v_user_id, p_client_event_id, p_notification_key, v_type, v_tapped_at, p_launch_state, p_app_version, p_platform
  ) on conflict (user_id, client_event_id) do nothing;
  get diagnostics v_inserted = row_count;

  return jsonb_build_object('accepted', v_inserted, 'consentRequired', false, 'religiousConsentRequired', false, 'unmatched', false);
end;
$$;

-- Withdrawing consent deletes the history it covered. Mirrors purge_native_product_analytics_on_consent_change,
-- as a separate trigger so that function is left exactly as it is.
create or replace function public.purge_notification_taps_on_consent_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.consent_product_analytics is true and new.consent_product_analytics is false then
    delete from public.notification_taps where user_id = new.id;
  elsif old.consent_religious_data is true and new.consent_religious_data is false then
    delete from public.notification_taps
    where user_id = new.id and public.notification_tap_type_reveals_practice(notification_type);
  end if;
  return new;
end;
$$;

drop trigger if exists purge_notification_taps_on_consent_change on public.profiles;
create trigger purge_notification_taps_on_consent_change
  after update of consent_product_analytics, consent_religious_data on public.profiles
  for each row execute function public.purge_notification_taps_on_consent_change();

-- Counts only, for the operator. A row appears only when at least p_min_recipients accounts were sent that
-- type in the window, so a cell never describes a handful of people. Sends are counted only for accounts whose
-- taps COULD have been recorded (same consent rule), otherwise the rate would be deflated by people who never
-- opted in. Limitation: consent is read now, not as of each send.
create or replace function public.get_notification_tap_summary(
  p_days integer default 28,
  p_min_recipients integer default 5
)
returns table(
  notification_type text,
  notifications_sent integer,
  recipient_accounts integer,
  taps integer,
  tapping_accounts integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_days is null or p_days < 1 or p_days > 90 then
    raise exception 'p_days must be between 1 and 90' using errcode = '22023';
  end if;
  if p_min_recipients is null or p_min_recipients < 5 then
    raise exception 'p_min_recipients must be at least 5' using errcode = '22023';
  end if;
  return query
    with window_start as (select now() - make_interval(days => p_days) as at),
    eligible as (
      select distinct delivery.user_id, delivery.type as notification_type, delivery.notification_key
      from public.notification_deliveries as delivery, window_start
      where delivery.channel = 'push'
        and delivery.status = 'sent'
        and delivery.dry_run is not true
        and delivery.created_at >= window_start.at
        and public.notification_tap_recording_allowed(delivery.user_id, delivery.type)
    ),
    sent as (
      select e.notification_type,
             count(*)::integer as notifications_sent,
             count(distinct e.user_id)::integer as recipient_accounts
      from eligible as e group by e.notification_type
    ),
    tapped as (
      select tap.notification_type,
             count(*)::integer as taps,
             count(distinct tap.user_id)::integer as tapping_accounts
      from public.notification_taps as tap, window_start
      where tap.tapped_at >= window_start.at
      group by tap.notification_type
    )
    select s.notification_type, s.notifications_sent, s.recipient_accounts,
           coalesce(t.taps, 0), coalesce(t.tapping_accounts, 0)
    from sent as s
    left join tapped as t using (notification_type)
    where s.recipient_accounts >= p_min_recipients
    order by s.notifications_sent desc, s.notification_type;
end;
$$;

revoke all on function public.notification_tap_type_reveals_practice(text) from public, anon, authenticated;
revoke all on function public.notification_tap_recording_allowed(uuid, text) from public, anon, authenticated;
revoke all on function public.record_notification_tap(uuid, text, timestamptz, text, text, text) from public, anon;
revoke all on function public.purge_notification_taps_on_consent_change() from public, anon, authenticated;
revoke all on function public.get_notification_tap_summary(integer, integer) from public, anon, authenticated;
grant execute on function public.notification_tap_type_reveals_practice(text) to service_role;
grant execute on function public.notification_tap_recording_allowed(uuid, text) to service_role;
grant execute on function public.record_notification_tap(uuid, text, timestamptz, text, text, text) to authenticated;
grant execute on function public.get_notification_tap_summary(integer, integer) to service_role;

-- 90-day retention. 21:45 UTC is free in pg_cron and in vercel.json (the other daily purges sit between 19:15 and 21:30).
do $$
declare
  v_job_id bigint;
begin
  for v_job_id in select jobid from cron.job where jobname = 'purge-notification-taps-daily' loop
    perform cron.unschedule(v_job_id);
  end loop;
end;
$$;

select cron.schedule(
  'purge-notification-taps-daily',
  '45 21 * * *',
  $$delete from public.notification_taps where recorded_at < now() - interval '90 days'$$
);

-- Self-check: exactly one definition of each function (no overload), the table is locked down, and the consent
-- rule fails closed. Any failure rolls the migration back.
do $check$
declare
  v_name text;
  v_count integer;
begin
  foreach v_name in array array[
    'notification_tap_type_reveals_practice', 'notification_tap_recording_allowed', 'record_notification_tap',
    'purge_notification_taps_on_consent_change', 'get_notification_tap_summary'
  ] loop
    select count(*) into v_count
    from pg_proc as p join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = v_name;
    if v_count <> 1 then
      raise exception 'tap tracking self-check: % has % definitions, expected 1', v_name, v_count;
    end if;
  end loop;

  if not (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.notification_taps'::regclass) then
    raise exception 'tap tracking self-check: notification_taps must have enabled and forced RLS';
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notification_taps') then
    raise exception 'tap tracking self-check: notification_taps must have no user-facing policy';
  end if;
  if has_table_privilege('authenticated', 'public.notification_taps', 'select')
     or has_table_privilege('anon', 'public.notification_taps', 'select') then
    raise exception 'tap tracking self-check: notification_taps must not be readable by app roles';
  end if;
  if public.notification_tap_recording_allowed('00000000-0000-0000-0000-000000000000', 'quiz') is not false
     or public.notification_tap_recording_allowed(null, 'quiz') is not false then
    raise exception 'tap tracking self-check: the consent rule must fail closed for an unknown account';
  end if;
  if public.notification_tap_type_reveals_practice('quiz') is not true
     or public.notification_tap_type_reveals_practice('something_new') is not true
     or public.notification_tap_type_reveals_practice(null) is not true
     or public.notification_tap_type_reveals_practice('post_reaction') is not false then
    raise exception 'tap tracking self-check: practice classification is wrong';
  end if;
end
$check$;
