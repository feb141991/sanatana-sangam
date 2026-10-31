-- Rollback for 20261031140000_unschedule_nightly_personalise_cron.sql
-- Status: PREPARED, NOT APPLIED.
--
-- Re-creates `nightly-personalise` exactly as defined in 005_patch_idempotency.sql.
-- Note: It requires `app.supabase_url` and `app.service_role_key` to be set in postgresql.conf to succeed.

SELECT cron.schedule(
  'nightly-personalise',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/ai-personalise',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := jsonb_build_object('user_id', user_id)
  )
  FROM (
    SELECT DISTINCT user_id
    FROM sadhana_events
    WHERE created_at > now() - interval '30 days'
  ) active_users;
  $$
);
