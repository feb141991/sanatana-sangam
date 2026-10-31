-- Rollback for 20261031090000_unschedule_redundant_net_response_purge.sql
-- Status: PREPARED, NOT APPLIED.
--
-- Re-creates `purge-net-http-response-daily` exactly as 20261030120000_purge_cron_and_net_history.sql defined it
-- (03:20 UTC daily, rows older than 7 days). cron.schedule replaces a job of the same name, so this is idempotent.
-- Note the job deletes nothing today: see the migration header for why it was removed.

SELECT cron.schedule(
  'purge-net-http-response-daily',
  '20 3 * * *',
  $$DELETE FROM net._http_response WHERE created < now() - interval '7 days'$$
);
