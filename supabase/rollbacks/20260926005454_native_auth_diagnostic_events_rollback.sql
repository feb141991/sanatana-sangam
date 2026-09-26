-- Rollback for 20260926005454_native_auth_diagnostic_events.sql.
select cron.unschedule('purge-native-auth-diagnostic-events-daily');
drop table if exists public.native_auth_diagnostic_events;
