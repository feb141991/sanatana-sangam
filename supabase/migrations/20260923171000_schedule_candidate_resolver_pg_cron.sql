-- Run the central resolver every ten minutes through Supabase pg_cron/pg_net.
-- Reuse the out-of-band Vault secret already used by notification-dispatch;
-- never persist bearer credentials in cron.job command text.
--
-- Prerequisites: pg_cron, pg_net, and Vault secret
-- `notification_dispatch_secret` are installed as documented in
-- 20260825195604_schedule_notification_dispatch_pg_cron.sql. This job is
-- enabled in the database only after this migration is applied.
SELECT cron.schedule(
  'notification-candidate-resolver-every-10-min',
  '*/10 * * * *',
  $cron$
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
  $cron$
);
