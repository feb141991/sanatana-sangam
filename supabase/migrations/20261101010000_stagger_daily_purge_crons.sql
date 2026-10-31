-- Migration: 20261101010000_stagger_daily_purge_crons.sql
-- Status: PREPARED, NOT APPLIED.
--
-- PURPOSE:
--   Reschedules the 7 daily pg_cron maintenance purge jobs out of the crowded 03:00 to 04:30 UTC
--   morning window to lean evening hours (19:15 to 20:45 UTC), spaced 15 minutes apart.
--
-- EVIDENCE & CONTEXT:
--   - docs/DB_CRON_STALL_PROFILE_2026-10-31.md documented nightly disk I/O exhaustion at 03:00-04:30 UTC.
--   - 7 maintenance purge jobs all fired between 03:15 and 03:47 UTC, directly colliding with 5 Vercel
--     notification crons (03:00, 03:05, 03:30, 04:00, 04:30 UTC).
--   - Two jobs (purge-native-product-analytics-daily and purge-ai-chat-answer-cache-daily) ran at the exact
--     same minute (03:47 UTC).
--   - This caused AWS EBS burst credit depletion down to 5 MB/s baseline throughput, leading to
--     53+ second checkpoints and `job startup timeout` crashes.
--   - Moving these to 19:15 to 20:45 UTC places them in an empty window in vercel.json (zero Vercel crons
--     run between 19:00 and 21:00 UTC), and spacing them by 15 minutes prevents concurrent WAL flushes.
--
-- SCHEDULE MAPPING:
--   - purge-cron-job-run-details-daily:          03:15 UTC -> 19:15 UTC ('15 19 * * *')
--   - purge-client-error-events-daily:            03:17 UTC -> 19:30 UTC ('30 19 * * *')
--   - purge-native-startup-telemetry-daily:       03:31 UTC -> 19:45 UTC ('45 19 * * *')
--   - purge-native-auth-diagnostic-events-daily:  03:37 UTC -> 20:00 UTC ('00 20 * * *')
--   - purge-native-api-diagnostic-events-daily:   03:39 UTC -> 20:15 UTC ('15 20 * * *')
--   - purge-native-product-analytics-daily:       03:47 UTC -> 20:30 UTC ('30 20 * * *')
--   - purge-ai-chat-answer-cache-daily:           03:47 UTC -> 20:45 UTC ('45 20 * * *')
--
-- IDEMPOTENT: unschedules existing jobs before rescheduling. No table data is modified.
--
-- ROLLBACK: supabase/rollbacks/20261101010000_stagger_daily_purge_crons_rollback.sql

DO $migration$
BEGIN
  -- 1. purge-cron-job-run-details-daily
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-cron-job-run-details-daily') THEN
    PERFORM cron.unschedule('purge-cron-job-run-details-daily');
  END IF;
  PERFORM cron.schedule(
    'purge-cron-job-run-details-daily',
    '15 19 * * *',
    $cmd$DELETE FROM cron.job_run_details WHERE COALESCE(end_time, start_time) < now() - interval '7 days'$cmd$
  );

  -- 2. purge-client-error-events-daily
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-client-error-events-daily') THEN
    PERFORM cron.unschedule('purge-client-error-events-daily');
  END IF;
  PERFORM cron.schedule(
    'purge-client-error-events-daily',
    '30 19 * * *',
    $cmd$delete from public.client_error_events where created_at < now() - interval '30 days'$cmd$
  );

  -- 3. purge-native-startup-telemetry-daily
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-native-startup-telemetry-daily') THEN
    PERFORM cron.unschedule('purge-native-startup-telemetry-daily');
  END IF;
  PERFORM cron.schedule(
    'purge-native-startup-telemetry-daily',
    '45 19 * * *',
    $cmd$delete from public.native_startup_telemetry_summaries where received_at < now() - interval '30 days'$cmd$
  );

  -- 4. purge-native-auth-diagnostic-events-daily
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-native-auth-diagnostic-events-daily') THEN
    PERFORM cron.unschedule('purge-native-auth-diagnostic-events-daily');
  END IF;
  PERFORM cron.schedule(
    'purge-native-auth-diagnostic-events-daily',
    '00 20 * * *',
    $cmd$delete from public.native_auth_diagnostic_events where received_at < now() - interval '30 days'$cmd$
  );

  -- 5. purge-native-api-diagnostic-events-daily
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-native-api-diagnostic-events-daily') THEN
    PERFORM cron.unschedule('purge-native-api-diagnostic-events-daily');
  END IF;
  PERFORM cron.schedule(
    'purge-native-api-diagnostic-events-daily',
    '15 20 * * *',
    $cmd$delete from public.native_api_diagnostic_events where received_at < now() - interval '30 days'$cmd$
  );

  -- 6. purge-native-product-analytics-daily
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-native-product-analytics-daily') THEN
    PERFORM cron.unschedule('purge-native-product-analytics-daily');
  END IF;
  PERFORM cron.schedule(
    'purge-native-product-analytics-daily',
    '30 20 * * *',
    $cmd$delete from public.native_product_analytics_daily where event_date < (timezone('utc', now()))::date - 90$cmd$
  );

  -- 7. purge-ai-chat-answer-cache-daily
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-ai-chat-answer-cache-daily') THEN
    PERFORM cron.unschedule('purge-ai-chat-answer-cache-daily');
  END IF;
  PERFORM cron.schedule(
    'purge-ai-chat-answer-cache-daily',
    '45 20 * * *',
    $cmd$delete from public.ai_chat_answer_cache where expires_at < now()$cmd$
  );
END $migration$;
