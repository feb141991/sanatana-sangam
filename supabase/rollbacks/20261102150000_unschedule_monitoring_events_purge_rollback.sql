-- Rollback for 20261102150000_unschedule_monitoring_events_purge.sql
-- Status: PREPARED, NOT APPLIED.
--
-- Re-creates `purge-monitoring-events-daily` exactly as 20261101190000_optimize_notification_indexes_and_cleanup.sql
-- defined it (21:00 UTC daily, rows older than 30 days). cron.schedule replaces a job of the same name, so this is
-- idempotent.
--
-- WARNING: once scheduled, the next 21:00 UTC run deletes every monitoring_events row older than 30 days. Rows deleted
-- earlier (7,172 at 21:00 UTC on 2026-11-01) are not restored by this file.

DO $rollback$
BEGIN
  IF to_regclass('cron.job') IS NOT NULL THEN
    PERFORM cron.schedule(
      'purge-monitoring-events-daily',
      '00 21 * * *',
      $cmd$DELETE FROM public.monitoring_events WHERE timestamp < now() - interval '30 days'$cmd$
    );
  END IF;
END;
$rollback$;
