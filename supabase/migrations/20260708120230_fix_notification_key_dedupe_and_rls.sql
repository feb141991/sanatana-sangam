-- Fix notification_key dedupe collision + harden notifications UPDATE RLS.
--
-- Problem 1: two unique indexes exist on public.notifications today —
--   idx_notifications_key                    UNIQUE (notification_key) WHERE notification_key IS NOT NULL
--   notifications_user_notification_key_idx  UNIQUE (user_id, notification_key) WHERE notification_key IS NOT NULL
-- The first is a GLOBAL unique constraint on notification_key alone. Since
-- notification_key values are semantic and shared across users by design
-- (e.g. "milestone:streak:7", written by /api/notifications/milestone for
-- every user who hits that streak), any second user reaching the same
-- milestone collides against the first user's row and silently fails to
-- insert/upsert. The per-user index already exists and is the correct
-- dedupe boundary (one row per user per semantic key) — the global index is
-- redundant with it and actively wrong. Drop the global one; keep the
-- per-user one.
--
-- Problem 2: "Users update own notifications" only has USING (auth.uid() =
-- user_id), no WITH CHECK. USING alone permits SELECT-side visibility
-- restriction on UPDATE (which rows the client may touch) but doesn't
-- restrict the resulting row after the write — a crafted request could
-- attempt to write a row with a different user_id. Add WITH CHECK to close
-- that gap, matching the pattern already used for profiles / tirtha_* in
-- 20260704112914_native_phase0_security_rls.sql.
--
-- Not touched: "Users read own notifications" (SELECT) and "Service role
-- insert notifications" (INSERT, TO service_role) are unrelated to this fix
-- and are left exactly as they are — inserts remain service-role/API/cron
-- only, users still only ever read their own rows.

DROP INDEX IF EXISTS public.idx_notifications_key;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_notification_key_idx
  ON public.notifications
  USING btree (user_id, notification_key)
  WHERE (notification_key IS NOT NULL);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;

CREATE POLICY "Users update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
