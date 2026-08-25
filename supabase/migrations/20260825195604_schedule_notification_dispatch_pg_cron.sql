-- Moves the notification-dispatch cron's every-10-minutes schedule from
-- Vercel (which caps Hobby-plan crons at once per day) into Supabase's own
-- pg_cron, calling the exact same route via pg_net. No app-code scheduling
-- change beyond accepting a second bearer secret
-- (see src/app/api/cron/notification-dispatch/route.ts).
--
-- Secret handling: the bearer token is stored in Supabase Vault as
-- 'notification_dispatch_secret' (created out-of-band via
-- vault.create_secret, not in this file) and read at execution time via
-- vault.decrypted_secrets -- never embedded in this migration or in
-- cron.job's stored command text. Matches the Vercel production env var
-- INTERNAL_DISPATCH_SECRET. Neither cron nor vault schemas are exposed to
-- anon/authenticated roles (confirmed via information_schema.role_table_grants
-- at setup time).
--
-- This migration file documents the job for operators reading migration
-- history; it does not (and cannot, without the secret) recreate the vault
-- entry. If re-running from scratch, create the vault secret first, then
-- this schedule.

select cron.schedule(
  'notification-dispatch-every-10-min',
  '*/10 * * * *',
  $cron$
  select net.http_post(
    url := 'https://www.shoonaya.com/api/cron/notification-dispatch',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'notification_dispatch_secret'),
      'Content-Type', 'application/json'
    ),
    timeout_milliseconds := 25000
  );
  $cron$
);
