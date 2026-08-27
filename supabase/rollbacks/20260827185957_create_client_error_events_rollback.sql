select cron.unschedule('purge-client-error-events-daily')
where exists (
  select 1 from cron.job where jobname = 'purge-client-error-events-daily'
);

drop table if exists public.client_error_events;
