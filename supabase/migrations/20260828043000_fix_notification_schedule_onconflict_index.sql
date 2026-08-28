-- notification_schedule has had zero rows since it was created 8 days ago
-- (20260820150000_notification_schedule_pipeline.sql). Both of its unique
-- indexes are partial (WHERE notification_key IS NOT NULL / IS NULL), and
-- Postgres will not use a partial unique index for ON CONFLICT inference
-- unless the exact same WHERE predicate is repeated in the conflict clause
-- -- which the Supabase JS client's .upsert(..., { onConflict }) never
-- does. Every cron writing to this table (mood-reminder, mood-reminder-
-- evening, tithi-reminder, sattvic-reminder, vrat-reminder,
-- festival-reminder, pitru-paksha-reminder, japa-reminder, brahma-muhurta,
-- guided-plan-reminder, nitya-reminder, nitya-reminder-sandhya,
-- nitya-reminder-madhyahn, shloka-reminder, notification-dispatch) has been
-- failing every single invocation with "there is no unique or exclusion
-- constraint matching the ON CONFLICT specification".
--
-- Adds a plain (non-partial) unique index on (user_id, notification_key),
-- which Supabase's onConflict: 'user_id,notification_key' can actually
-- match. NULLs in notification_key are never considered equal by Postgres
-- uniqueness, so this does not conflict with the existing partial index
-- that handles the notification_key IS NULL dedup path -- both existing
-- indexes are left in place, this is additive only.

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_schedule_user_notification_key
  ON public.notification_schedule (user_id, notification_key);
