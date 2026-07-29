-- Supabase/PostgREST upsert cannot target the previous partial unique index:
--
--   UNIQUE (user_id, notification_key) WHERE notification_key IS NOT NULL
--
-- Cron routes call:
--
--   upsert(..., { onConflict: 'user_id,notification_key' })
--
-- and live Postgres returned 42P10 ("there is no unique or exclusion
-- constraint matching the ON CONFLICT specification"). A normal unique index
-- is the correct shape for that conflict target. PostgreSQL permits multiple
-- NULL values in a unique index, so legacy rows without notification_key keep
-- the same behavior while keyed rows remain deduped per user.

DROP INDEX IF EXISTS public.notifications_user_notification_key_idx;

CREATE UNIQUE INDEX notifications_user_notification_key_idx
  ON public.notifications
  USING btree (user_id, notification_key);
