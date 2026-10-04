-- Schedules the social publishing pipeline tick every 15 minutes via
-- Supabase pg_cron + pg_net, following the exact pattern established by
-- 20260825195604_schedule_notification_dispatch_pg_cron.sql -- same
-- reasoning: this project's Vercel crons have stayed daily-or-slower (see
-- vercel.json), consistent with a Hobby-tier cap, and the publish stage
-- needs closer-to-real-time cadence to hit each post's scheduled local
-- publish time. If Phase 1 setup confirms a Vercel plan tier that supports
-- sub-daily crons, this job can be moved to vercel.json instead and this
-- pg_cron schedule unscheduled -- the route itself (src/app/api/cron/
-- social-pipeline-tick/route.ts) is cadence-agnostic either way.
--
-- Secret handling matches notification-dispatch: the bearer token is stored
-- in Supabase Vault as 'social_pipeline_tick_secret' (created out-of-band
-- via vault.create_secret, not in this file) and read at execution time via
-- vault.decrypted_secrets -- never embedded in this migration or in
-- cron.job's stored command text. Matches the Vercel production env var
-- SOCIAL_PIPELINE_TICK_SECRET.
--
-- This migration documents the job for operators reading migration
-- history; it does not (and cannot, without the secret) recreate the vault
-- entry. If re-running from scratch, create the vault secret first, then
-- this schedule.

select cron.schedule(
  'social-pipeline-tick-every-15-min',
  '*/15 * * * *',
  $cron$
  select net.http_get(
    url := 'https://www.shoonaya.com/api/cron/social-pipeline-tick',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'social_pipeline_tick_secret')
    ),
    timeout_milliseconds := 25000
  );
  $cron$
);
