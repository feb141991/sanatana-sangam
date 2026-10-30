-- Rollback for 20261030120000_purge_cron_and_net_history.sql
-- Status: PREPARED, NOT APPLIED.
--
-- Unschedules both recurring maintenance jobs idempotently.
-- Note: Already-purged rows cannot and should not be restored.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-cron-job-run-details-daily') THEN
    PERFORM cron.unschedule('purge-cron-job-run-details-daily');
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-net-http-response-daily') THEN
    PERFORM cron.unschedule('purge-net-http-response-daily');
  END IF;
END $$;
