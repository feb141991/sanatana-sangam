-- Optional, first-party Native product analytics. The client may submit only
-- the fixed event vocabulary enforced by the API; it never sends route names,
-- spiritual content, mood values, profile fields, or client timestamps. Rows
-- are one event per signed-in user per UTC day and cascade on account deletion.
alter table public.profiles
  add column if not exists consent_product_analytics boolean not null default false;

comment on column public.profiles.consent_product_analytics is
  'Explicit opt-in to coarse first-party product measurement. Separate from activity-personalization and religious-data consent.';

create table public.native_product_analytics_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null check (event_name in (
    'app_opened', 'practice_started', 'practice_completed',
    'progressive_profiling'
  )),
  event_date date not null,
  app_version text,
  platform text check (platform is null or platform in ('ios', 'android')),
  primary key (user_id, event_name, event_date)
);

comment on table public.native_product_analytics_daily is
  'Consent-gated Native product measurement, one allowlisted event per user/event/UTC-day. No route, content, prompt key, location, mood, or tradition data. Retained for 90 days; rows cascade on account deletion.';

create index native_product_analytics_date_event_idx
  on public.native_product_analytics_daily (event_date desc, event_name);

alter table public.native_product_analytics_daily enable row level security;
alter table public.native_product_analytics_daily force row level security;
revoke all on table public.native_product_analytics_daily from public, anon, authenticated;
grant all on table public.native_product_analytics_daily to service_role;

create or replace function public.purge_native_product_analytics_on_consent_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.consent_product_analytics is true and new.consent_product_analytics is false then
    delete from public.native_product_analytics_daily where user_id = new.id;
  elsif old.consent_religious_data is true and new.consent_religious_data is false then
    delete from public.native_product_analytics_daily
    where user_id = new.id and event_name in ('practice_started', 'practice_completed');
  end if;
  return new;
end;
$$;

revoke all on function public.purge_native_product_analytics_on_consent_change() from public, anon, authenticated;
drop trigger if exists purge_native_product_analytics_on_consent_change on public.profiles;
create trigger purge_native_product_analytics_on_consent_change
  after update of consent_product_analytics, consent_religious_data on public.profiles
  for each row execute function public.purge_native_product_analytics_on_consent_change();

-- Serialize event acceptance with withdrawal by locking the consent row. A
-- request that races with withdrawal either commits first and is then deleted,
-- or observes consent=false and records nothing.
create or replace function public.record_native_product_analytics(
  p_events text[],
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
  v_religious_consent boolean;
  v_event text;
  v_inserted integer;
  v_total integer := 0;
  v_practice_consent_required boolean := false;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_events is null or cardinality(p_events) < 1 or cardinality(p_events) > 10
     or exists (select 1 from unnest(p_events) as e(event_name) where event_name is null or event_name not in (
       'app_opened', 'practice_started', 'practice_completed',
       'progressive_profiling'
     )) then
    raise exception 'Invalid product analytics events' using errcode = '22023';
  end if;
  if p_platform is not null and p_platform not in ('ios', 'android') then
    raise exception 'Invalid product analytics platform' using errcode = '22023';
  end if;
  if p_app_version is not null and (length(p_app_version) > 32 or p_app_version !~ '^\d+\.\d+\.\d+([+-][A-Za-z0-9.-]+)?$') then
    raise exception 'Invalid product analytics app version' using errcode = '22023';
  end if;

  select consent_product_analytics, consent_religious_data
  into v_consent, v_religious_consent
  from public.profiles where id = v_user_id for update;
  if coalesce(v_consent, false) is not true then
    return jsonb_build_object('accepted', 0, 'consentRequired', true, 'religiousConsentRequired', false);
  end if;

  foreach v_event in array (select array_agg(distinct event_name) from unnest(p_events) as e(event_name)) loop
    if v_event in ('practice_started', 'practice_completed') and coalesce(v_religious_consent, false) is not true then
      v_practice_consent_required := true;
      continue;
    end if;
    insert into public.native_product_analytics_daily (user_id, event_name, event_date, app_version, platform)
    values (v_user_id, v_event, (now() at time zone 'utc')::date, p_app_version, p_platform)
    on conflict (user_id, event_name, event_date) do nothing;
    get diagnostics v_inserted = row_count;
    v_total := v_total + v_inserted;
  end loop;
  return jsonb_build_object(
    'accepted', v_total,
    'consentRequired', false,
    'religiousConsentRequired', v_practice_consent_required
  );
end;
$$;

create or replace function public.withdraw_native_product_analytics()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing integer := 0;
  v_deleted integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  perform 1 from public.profiles where id = v_user_id for update;
  select count(*)::integer into v_existing
  from public.native_product_analytics_daily where user_id = v_user_id;
  update public.profiles set consent_product_analytics = false where id = v_user_id;
  delete from public.native_product_analytics_daily where user_id = v_user_id;
  get diagnostics v_deleted = row_count;
  return greatest(v_existing, v_deleted);
end;
$$;

-- Admin reporting exposes counts only; small cohorts are suppressed so an
-- event/day cell never reveals a tiny group or lets an operator inspect users.
create or replace function public.get_native_product_analytics_summary(p_days integer default 28)
returns table(event_name text, event_date date, opted_in_accounts integer)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_days is null or p_days < 1 or p_days > 90 then
    raise exception 'p_days must be between 1 and 90' using errcode = '22023';
  end if;
  return query
    select analytics.event_name, analytics.event_date, count(*)::integer
    from public.native_product_analytics_daily analytics
    where analytics.event_date >= (timezone('utc', now()))::date - (p_days - 1)
    group by analytics.event_name, analytics.event_date
    having count(distinct analytics.user_id) >= 20
    order by analytics.event_date desc, analytics.event_name;
end;
$$;

revoke all on function public.record_native_product_analytics(text[], text, text) from public, anon;
revoke all on function public.withdraw_native_product_analytics() from public, anon;
revoke all on function public.get_native_product_analytics_summary(integer) from public, anon, authenticated;
grant execute on function public.record_native_product_analytics(text[], text, text) to authenticated;
grant execute on function public.withdraw_native_product_analytics() to authenticated;
grant execute on function public.get_native_product_analytics_summary(integer) to service_role;

do $$
declare
  v_job_id bigint;
begin
  for v_job_id in select jobid from cron.job where jobname = 'purge-native-product-analytics-daily' loop
    perform cron.unschedule(v_job_id);
  end loop;
end;
$$;

select cron.schedule(
  'purge-native-product-analytics-daily',
  '47 3 * * *',
  $$delete from public.native_product_analytics_daily where event_date < (timezone('utc', now()))::date - 90$$
);
