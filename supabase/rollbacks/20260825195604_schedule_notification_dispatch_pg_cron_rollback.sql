-- Rollback for 20260825195604_schedule_notification_dispatch_pg_cron.sql
-- Unschedules the pg_cron job. Does not remove the Vault secret (harmless to
-- leave; remove separately with select vault._crypto_aead_det_decrypt(...)
-- tooling or the dashboard if desired). Restore the Vercel cron entry in
-- vercel.json and redeploy if reverting back to Vercel-scheduled dispatch.

select cron.unschedule('notification-dispatch-every-10-min');
