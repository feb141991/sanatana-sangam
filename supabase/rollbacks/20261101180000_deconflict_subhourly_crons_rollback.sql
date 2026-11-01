-- Rollback: 20261101180000_deconflict_subhourly_crons_rollback.sql
-- Restores original */10 and */15 schedules.

DO $migration$
BEGIN
  -- 1. notification-candidate-resolver-every-10-min -> */10
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notification-candidate-resolver-every-10-min') THEN
    PERFORM cron.unschedule('notification-candidate-resolver-every-10-min');
  END IF;
  PERFORM cron.schedule(
    'notification-candidate-resolver-every-10-min',
    '*/10 * * * *',
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

  -- 2. notification-dispatch-every-10-min -> */10
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notification-dispatch-every-10-min') THEN
    PERFORM cron.unschedule('notification-dispatch-every-10-min');
  END IF;
  PERFORM cron.schedule(
    'notification-dispatch-every-10-min',
    '*/10 * * * *',
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

  -- 3. social-pipeline-tick-every-15-min -> */15
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'social-pipeline-tick-every-15-min') THEN
    PERFORM cron.unschedule('social-pipeline-tick-every-15-min');
  END IF;
  PERFORM cron.schedule(
    'social-pipeline-tick-every-15-min',
    '*/15 * * * *',
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
