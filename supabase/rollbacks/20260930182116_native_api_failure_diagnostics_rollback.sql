select cron.unschedule(jobid)
from cron.job
where jobname = 'purge-native-api-diagnostic-events-daily';

drop table if exists public.native_api_diagnostic_events;
