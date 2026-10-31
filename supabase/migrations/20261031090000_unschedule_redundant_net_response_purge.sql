-- Migration: 20261031090000_unschedule_redundant_net_response_purge.sql
-- Status: PREPARED, NOT APPLIED. To be applied by the founder.
--
-- PURPOSE:
--   Unschedules the pg_cron job `purge-net-http-response-daily` that 20261030120000_purge_cron_and_net_history.sql
--   created (and applied on 2026-10-31). It deletes nothing and competes with pg_net's own cleanup.
--
-- EVIDENCE (production, read-only, 2026-10-31, after 20261030120000 was applied):
--   - Before that migration `net._http_response` held 132 rows, none older than 7 days; the oldest was about 20 hours
--     old. After its one-off backlog DELETE it held 103. The job's filter (`created < now() - interval '7 days'`) can
--     only match rows that pg_net has already failed to prune for a week.
--   - pg_net prunes by itself: `pg_net.ttl` = 6 hours, `pg_net.batch_size` = 200. That background cleanup is the
--     `DELETE FROM net._http_response` statement that took up to 73 s and was 41% of all database query time in the
--     2026-10-29/30 stall evidence. A second daily DELETE on the same table adds lock and vacuum work for no benefit.
--   - The relation is 22 MB for about 100 live rows. That is table bloat, which DELETE does not return to the operating
--     system; neither job addresses it. If it matters, a one-off VACUUM FULL in a quiet minute (not a migration, it
--     cannot run inside a transaction and takes an exclusive lock) or a lower `pg_net.ttl` is the lever.
--
-- WHAT STAYS: `purge-cron-job-run-details-daily` (03:15 UTC). It is evidence-backed: cron.job_run_details went from
--   22,386 rows (12 MB) to 3,895 once the 7-day window was applied.
--
-- IDEMPOTENT: does nothing if the job is already gone. No data is touched.
--
-- ROLLBACK: supabase/rollbacks/20261031090000_unschedule_redundant_net_response_purge_rollback.sql re-creates the job
--   exactly as 20261030120000 defined it.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-net-http-response-daily') THEN
    PERFORM cron.unschedule('purge-net-http-response-daily');
  END IF;
END $$;
