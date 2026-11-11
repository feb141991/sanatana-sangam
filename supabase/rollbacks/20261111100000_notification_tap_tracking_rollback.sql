-- Rollback for 20261111100000_notification_tap_tracking.sql.
-- Drops the daily purge, the consent-change trigger, every function and the table. THE TAP ROWS ARE DELETED with
-- the table (there is nothing else to restore them from; they hold no content and are kept 90 days).
-- It also drops profiles.consent_notification_taps (the people's opt-ins are lost with it; they are re-asked in Settings).
-- Nothing else is touched: product analytics and notification_deliveries are unchanged.
-- Deploy a backend without the /api/native/notification-taps route first (or leave it: it answers 503 once the
-- function is gone, and the app keeps the tap until it ages out).

do $$
declare
  v_job_id bigint;
begin
  for v_job_id in select jobid from cron.job where jobname = 'purge-notification-taps-daily' loop
    perform cron.unschedule(v_job_id);
  end loop;
end;
$$;

drop trigger if exists purge_notification_taps_on_consent_change on public.profiles;
drop function if exists public.get_notification_tap_summary(integer, integer);
drop function if exists public.record_notification_tap(uuid, text, timestamptz, text, text, text);
drop function if exists public.purge_notification_taps_on_consent_change();
drop function if exists public.notification_tap_recording_allowed(uuid, text);
drop function if exists public.notification_tap_type_reveals_practice(text);
drop table if exists public.notification_taps;
alter table public.profiles drop column if exists consent_notification_taps;

do $check$
begin
  if to_regclass('public.notification_taps') is not null then
    raise exception 'rollback left notification_taps behind';
  end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname in (
               'notification_tap_type_reveals_practice', 'notification_tap_recording_allowed',
               'record_notification_tap', 'purge_notification_taps_on_consent_change', 'get_notification_tap_summary')) then
    raise exception 'rollback left a tap tracking function behind';
  end if;
  if exists (select 1 from pg_trigger where tgname = 'purge_notification_taps_on_consent_change' and not tgisinternal) then
    raise exception 'rollback left the consent-change trigger behind';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'consent_notification_taps') then
    raise exception 'rollback left profiles.consent_notification_taps behind';
  end if;
  -- The existing product analytics machinery must be untouched.
  if to_regclass('public.native_product_analytics_daily') is null then
    raise exception 'rollback must not touch product analytics';
  end if;
end
$check$;
