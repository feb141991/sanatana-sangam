-- Migration: 20261030120000_purge_cron_and_net_history.sql
-- Status: PREPARED, NOT APPLIED. To be applied by the founder.
--
-- PURPOSE:
--   Schedules recurring daily maintenance jobs in pg_cron to prune stale execution history
--   from `cron.job_run_details` and stale HTTP responses from `net._http_response`. Also performs
--   an initial backlog purge of rows older than the retention threshold.
--
-- EVIDENCE & RATIONALE:
--   1. `cron.job_run_details` has accumulated over 22,000 rows since April 2026 without any cleanup.
--      pg_cron does not prune its run logs automatically. Frequent jobs (such as notification-dispatch
--      and candidate-resolver running every 10 minutes) add hundreds of rows daily, bloating table pages
--      and increasing vacuum overhead.
--   2. `net._http_response` stores response headers and full response bodies for asynchronous HTTP requests
--      initiated via pg_net (net.http_get calls by notification-dispatch, candidate-resolver, social pipeline,
--      daily quiz push, etc.). While pg_net has a background worker TTL (pg_net.ttl, default 6 hours), in
--      production instances with heavy traffic or idle periods, response bodies can linger. An explicit daily
--      cleanup guarantees that response bodies never accumulate unbounded.
--
-- PROPOSED RETENTION POLICY:
--   - Proposed value: 7 days (conservative alternative: 14 days, subject to founder review).
--   - Why 7 days:
--     * 7 days fully covers a weekly operational cycle, allowing operators to inspect recent cron failures,
--       timeouts, and retry cascades across weekends and weekly cadences.
--     * At ~350 cron runs/day, 7 days bounds cron.job_run_details to ~2,500 rows (down from 22,000+).
--     * For cron.job_run_details, the filter uses `COALESCE(end_time, start_time) < now() - interval '7 days'`
--       so that ungracefully terminated or crashed jobs where end_time remained NULL are not leaked indefinitely.
--     * For net._http_response, the filter uses `created < now() - interval '7 days'`.
--
-- PRIVILEGE & RLS REVIEW:
--   - `cron.job_run_details` is in schema `cron` (owned by postgres).
--   - `net._http_response` is in schema `net` (owned by supabase_admin).
--   - Neither table is exposed to PostgREST; roles `anon` and `authenticated` have no SELECT/INSERT/UPDATE/DELETE.
--   - RLS is not applicable to internal PostgreSQL extension schemas.
--   - Both cron jobs execute internally within pg_cron under postgres role privileges.
--
-- ROLLBACK GUIDANCE:
--   Execute `supabase/rollbacks/20261030120000_purge_cron_and_net_history_rollback.sql`
--   which cleanly unschedules both maintenance jobs.

-- 1. Unschedule any prior instances to guarantee clean, idempotent application
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-cron-job-run-details-daily') THEN
    PERFORM cron.unschedule('purge-cron-job-run-details-daily');
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-net-http-response-daily') THEN
    PERFORM cron.unschedule('purge-net-http-response-daily');
  END IF;
END $$;

-- 2. Initial backlog purge of historical rows (> 7 days)
DELETE FROM cron.job_run_details
WHERE COALESCE(end_time, start_time) < now() - interval '7 days';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'net' AND table_name = '_http_response'
  ) THEN
    EXECUTE 'DELETE FROM net._http_response WHERE created < now() - interval ''7 days''';
  END IF;
END $$;

-- 3. Schedule daily recurring pruning for cron.job_run_details at 03:15 UTC
SELECT cron.schedule(
  'purge-cron-job-run-details-daily',
  '15 3 * * *',
  $$DELETE FROM cron.job_run_details WHERE COALESCE(end_time, start_time) < now() - interval '7 days'$$
);

-- 4. Schedule daily recurring pruning for net._http_response at 03:20 UTC
SELECT cron.schedule(
  'purge-net-http-response-daily',
  '20 3 * * *',
  $$DELETE FROM net._http_response WHERE created < now() - interval '7 days'$$
);
