-- Rollback: 20261101190000_optimize_notification_indexes_and_cleanup_rollback.sql
-- Restores duplicate index and drops optimization indexes and daily purge cron jobs.

-- 1. Restore duplicate index on public.notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_inbox
  ON public.notifications USING btree (user_id, created_at DESC);

-- 2. Drop optimization indexes
DROP INDEX IF EXISTS public.idx_notification_candidates_status_created;
DROP INDEX IF EXISTS public.idx_notification_resolver_events_created;
DROP INDEX IF EXISTS public.idx_notification_resolver_events_winning_candidate;

-- 3. Unschedule daily purges from pg_cron
DO $rollback$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname IN (
      'purge-monitoring-events-daily',
      'purge-notification-candidates-daily',
      'purge-notification-resolver-events-daily'
    );
  END IF;
END;
$rollback$;
