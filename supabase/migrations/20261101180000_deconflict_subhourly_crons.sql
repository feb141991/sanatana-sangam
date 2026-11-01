-- Migration: 20261101180000_deconflict_subhourly_crons.sql
-- Status: PREPARED, NOT APPLIED.
--
-- PURPOSE:
--   Deconflicts the 4 high-frequency sub-hourly pg_cron jobs so they never fire on the same minute.
--   Prevents concurrent WAL and lock collisions on the 5 MB/s baseline storage.
--
-- EVIDENCE & CONTEXT:
--   - On 2026-11-01 between 03:55 and 04:25 UTC, 7 cron jobs failed with `job startup timeout`.
--   - At 04:00:00.000, three jobs fired at the exact same millisecond:
--       - notification-candidate-resolver-every-10-min (*/10)
--       - notification-dispatch-every-10-min (*/10)
--       - social-pipeline-tick-every-15-min (*/15)
--     alongside external Vercel crons at top-of-hour.
--   - Spacing them by 2-5 minutes guarantees that no two jobs ever start simultaneously.
--   - Minutes :00 and :30 are left completely empty for external Vercel crons.
--
-- SCHEDULE MAPPING:
--   - notification-candidate-resolver: */10  ->  1,11,21,31,41,51 * * * *
--   - notification-dispatch:           */10  ->  3,13,23,33,43,53 * * * * (runs 2 min after resolver)
--   - quiz-reminder-candidates:        (already on 5,15,25,35,45,55 * * * *)
--   - social-pipeline-tick:            */15  ->  7,22,37,52 * * * *
--
-- IDEMPOTENT: unschedules existing jobs before rescheduling.
--
-- ROLLBACK: supabase/rollbacks/20261101180000_deconflict_subhourly_crons_rollback.sql

DO $migration$
BEGIN
  -- 1. notification-candidate-resolver-every-10-min
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notification-candidate-resolver-every-10-min') THEN
    PERFORM cron.unschedule('notification-candidate-resolver-every-10-min');
  END IF;
  PERFORM cron.schedule(
    'notification-candidate-resolver-every-10-min',
    '1,11,21,31,41,51 * * * *',
    $cmd$
  SELECT net.http_get(
    url := 'https://www.shoonaya.com/api/cron/notification-resolver',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'notification_dispatch_secret'
      )
    ),
    timeout_milliseconds := 25000
  );
  $cmd$
  );

  -- 2. notification-dispatch-every-10-min
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notification-dispatch-every-10-min') THEN
    PERFORM cron.unschedule('notification-dispatch-every-10-min');
  END IF;
  PERFORM cron.schedule(
    'notification-dispatch-every-10-min',
    '3,13,23,33,43,53 * * * *',
    $cmd$
  select net.http_get(
    url := 'https://www.shoonaya.com/api/cron/notification-dispatch',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'notification_dispatch_secret')
    ),
    timeout_milliseconds := 25000
  );
  $cmd$
  );

  -- 3. social-pipeline-tick-every-15-min
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'social-pipeline-tick-every-15-min') THEN
    PERFORM cron.unschedule('social-pipeline-tick-every-15-min');
  END IF;
  PERFORM cron.schedule(
    'social-pipeline-tick-every-15-min',
    '7,22,37,52 * * * *',
    $cmd$
  select net.http_get(
    url := 'https://www.shoonaya.com/api/cron/social-pipeline-tick',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'social_pipeline_tick_secret')
    ),
    timeout_milliseconds := 25000
  );
  $cmd$
  );
END $migration$;
