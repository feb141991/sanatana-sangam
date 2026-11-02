-- Migration: 20261102150000_unschedule_monitoring_events_purge.sql
-- Status: PREPARED, NOT RECORDED IN MIGRATION HISTORY. Production already has this effect (see STATE), so applying
--   it there is a no-op that records the version. To be applied by the founder.
--
-- PURPOSE:
--   Unschedules the pg_cron job `purge-monitoring-events-daily` that 20261101190000_optimize_notification_indexes_and_cleanup.sql
--   created (00 21 * * *: DELETE FROM public.monitoring_events WHERE timestamp < now() - interval '30 days'). This migration
--   does not touch the two notification purge jobs from the same file, and deletes no data.
--
-- EVIDENCE (production, read-only, 2026-11-01):
--   - The job's first run was cron.job_run_details runid 23500, 21:00:00 UTC: `DELETE 7172`. Before it the table held
--     9,194 rows (data since 2026-05-21, mostly AI-provider events); afterwards 2,027, the oldest from 2026-10-02.
--   - The table is small (about 9 thousand rows in five months), so a retention cap saves nothing yet, while the history
--     is the only record of AI-provider usage over that period. A rollup into a daily summary should come before any
--     raw-row deletion is scheduled again.
--
-- STATE: the job was unscheduled directly in production with `cron.unschedule('purge-monitoring-events-daily')`, at the
--   founder's request, shortly after 21:38 UTC on 2026-11-01, outside migration history. This file brings the repository
--   in line, so a fresh or shadow database built from the migrations does not recreate the job (20261101190000 alone
--   would).
--
-- NOT RECOVERABLE HERE: the 7,172 rows deleted at 21:00 UTC. Neither this migration nor its rollback brings them back.
--
-- IDEMPOTENT: does nothing if the job is already gone, or if pg_cron is not installed.
--
-- ROLLBACK: supabase/rollbacks/20261102150000_unschedule_monitoring_events_purge_rollback.sql re-creates the job exactly
--   as 20261101190000 defined it. That resumes deleting rows older than 30 days at the next 21:00 UTC.

DO $$
BEGIN
  IF to_regclass('cron.job') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-monitoring-events-daily') THEN
      PERFORM cron.unschedule('purge-monitoring-events-daily');
    END IF;
  END IF;
END $$;
