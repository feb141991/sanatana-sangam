-- Rollback: 20261101010000_stagger_daily_purge_crons_rollback.sql
-- Restores original 03:15 to 03:47 UTC schedules for daily maintenance crons.

DO $migration$
BEGIN
  -- 1. purge-cron-job-run-details-daily -> 03:15 UTC
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-cron-job-run-details-daily') THEN
    PERFORM cron.unschedule('purge-cron-job-run-details-daily');
  END IF;
  PERFORM cron.schedule(
    'purge-cron-job-run-details-daily',
    '15 3 * * *',
    $cmd$DELETE FROM cron.job_run_details WHERE COALESCE(end_time, start_time) < now() - interval '7 days'$cmd$
  );

  -- 2. purge-client-error-events-daily -> 03:17 UTC
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-client-error-events-daily') THEN
    PERFORM cron.unschedule('purge-client-error-events-daily');
  END IF;
  PERFORM cron.schedule(
    'purge-client-error-events-daily',
    '17 3 * * *',
    $cmd$delete from public.client_error_events where created_at < now() - interval '30 days'$cmd$
  );

  -- 3. purge-native-startup-telemetry-daily -> 03:31 UTC
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-native-startup-telemetry-daily') THEN
    PERFORM cron.unschedule('purge-native-startup-telemetry-daily');
  END IF;
  PERFORM cron.schedule(
    'purge-native-startup-telemetry-daily',
    '31 3 * * *',
    $cmd$delete from public.native_startup_telemetry_summaries where received_at < now() - interval '30 days'$cmd$
  );

  -- 4. purge-native-auth-diagnostic-events-daily -> 03:37 UTC
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-native-auth-diagnostic-events-daily') THEN
    PERFORM cron.unschedule('purge-native-auth-diagnostic-events-daily');
  END IF;
  PERFORM cron.schedule(
    'purge-native-auth-diagnostic-events-daily',
    '37 3 * * *',
    $cmd$delete from public.native_auth_diagnostic_events where received_at < now() - interval '30 days'$cmd$
  );

  -- 5. purge-native-api-diagnostic-events-daily -> 03:39 UTC
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-native-api-diagnostic-events-daily') THEN
    PERFORM cron.unschedule('purge-native-api-diagnostic-events-daily');
  END IF;
  PERFORM cron.schedule(
    'purge-native-api-diagnostic-events-daily',
    '39 3 * * *',
    $cmd$delete from public.native_api_diagnostic_events where received_at < now() - interval '30 days'$cmd$
  );

  -- 6. purge-native-product-analytics-daily -> 03:47 UTC
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-native-product-analytics-daily') THEN
    PERFORM cron.unschedule('purge-native-product-analytics-daily');
  END IF;
  PERFORM cron.schedule(
    'purge-native-product-analytics-daily',
    '47 3 * * *',
    $cmd$delete from public.native_product_analytics_daily where event_date < (timezone('utc', now()))::date - 90$cmd$
  );

  -- 7. purge-ai-chat-answer-cache-daily -> 03:47 UTC
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-ai-chat-answer-cache-daily') THEN
    PERFORM cron.unschedule('purge-ai-chat-answer-cache-daily');
  END IF;
  PERFORM cron.schedule(
    'purge-ai-chat-answer-cache-daily',
    '47 3 * * *',
    $cmd$delete from public.ai_chat_answer_cache where expires_at < now()$cmd$
  );
END $migration$;
