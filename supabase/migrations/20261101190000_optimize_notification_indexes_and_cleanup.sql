-- Migration: 20261101190000_optimize_notification_indexes_and_cleanup.sql
-- Status: PREPARED
--
-- PURPOSE:
--   1. Drop duplicate index idx_notifications_user_inbox on public.notifications
--      (identical definition to idx_notifications_user_id_created: btree (user_id, created_at DESC)).
--      Eliminates double index write I/O overhead on every notification insert/update and frees buffer memory.
--   2. Add composite index on public.notification_candidates (status, created_at)
--      to convert candidate retention purges from 210 ms full sequential scans into index range scans.
--   3. Add index on public.notification_resolver_events (created_at)
--      to convert resolver audit event purges from 147 ms full sequential scans into index range scans.
--   4. Add index on public.notification_resolver_events (winning_candidate_id)
--      to satisfy foreign key checks on candidate deletion without sequentially scanning child events.
--   5. Schedule automated daily 30-day retention purge for public.monitoring_events at 21:00 UTC.
--   6. Schedule automated daily 90-day retention purges for terminal notification_candidates at 21:15 UTC
--      and notification_resolver_events at 21:30 UTC.
--
-- ROLLBACK: supabase/rollbacks/20261101190000_optimize_notification_indexes_and_cleanup_rollback.sql

-- 1. Drop duplicate index on public.notifications
DROP INDEX IF EXISTS public.idx_notifications_user_inbox;

-- 2. Add composite index on public.notification_candidates (status, created_at)
CREATE INDEX IF NOT EXISTS idx_notification_candidates_status_created
  ON public.notification_candidates USING btree (status, created_at);

-- 3. Add index on public.notification_resolver_events (created_at)
CREATE INDEX IF NOT EXISTS idx_notification_resolver_events_created
  ON public.notification_resolver_events USING btree (created_at);

-- 4. Add index on public.notification_resolver_events (winning_candidate_id)
CREATE INDEX IF NOT EXISTS idx_notification_resolver_events_winning_candidate
  ON public.notification_resolver_events USING btree (winning_candidate_id);

-- 5 & 6. Schedule daily purges in pg_cron
DO $migration$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unschedule existing jobs if already present
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname IN (
      'purge-monitoring-events-daily',
      'purge-notification-candidates-daily',
      'purge-notification-resolver-events-daily'
    );

    -- 21:00 UTC: purge monitoring events older than 30 days
    PERFORM cron.schedule(
      'purge-monitoring-events-daily',
      '00 21 * * *',
      $cmd$DELETE FROM public.monitoring_events WHERE timestamp < now() - interval '30 days'$cmd$
    );

    -- 21:15 UTC: purge terminal notification candidates older than 90 days
    PERFORM cron.schedule(
      'purge-notification-candidates-daily',
      '15 21 * * *',
      $cmd$DELETE FROM public.notification_candidates WHERE status IN ('accepted', 'suppressed', 'expired', 'cancelled') AND created_at < now() - interval '90 days'$cmd$
    );

    -- 21:30 UTC: purge notification resolver audit events older than 90 days
    PERFORM cron.schedule(
      'purge-notification-resolver-events-daily',
      '30 21 * * *',
      $cmd$DELETE FROM public.notification_resolver_events WHERE created_at < now() - interval '90 days'$cmd$
    );
  END IF;
END;
$migration$;
