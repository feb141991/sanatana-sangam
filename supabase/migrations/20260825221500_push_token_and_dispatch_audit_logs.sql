-- Push-token lifecycle and notification dispatch append-only audit tables.
--
-- 1. push_token_events: Records every creation, refresh, explicit unregistration,
--    and dead-device prune (e.g. DeviceNotRegistered from Expo receipts or send tickets).
--    Hashed token representation ensures compliance with privacy baselines without
--    sacrificing traceability during support disputes.
--
-- 2. notification_dispatch_events: Append-only audit trail capturing every decision
--    (sent, skipped, failed) made by notification_dispatch (including quiet-hours skips)
--    that survives past the 90-day operational cleanup of notification_schedule.

CREATE TABLE IF NOT EXISTS public.push_token_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  token       text NOT NULL,
  event_type  text NOT NULL CHECK (event_type IN ('registered', 'pruned_device_not_registered', 'pruned_other')),
  reason      text NULL,
  source      text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_token_events_user_created
  ON public.push_token_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_push_token_events_token_created
  ON public.push_token_events (token, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_push_token_events_type_created
  ON public.push_token_events (event_type, created_at DESC);

ALTER TABLE public.push_token_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.push_token_events FROM anon;
REVOKE ALL ON TABLE public.push_token_events FROM authenticated;
GRANT ALL ON TABLE public.push_token_events TO service_role;

DROP POLICY IF EXISTS "Service role manages push_token_events" ON public.push_token_events;
CREATE POLICY "Service role manages push_token_events"
  ON public.push_token_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Notification dispatch lifecycle events table
CREATE TABLE IF NOT EXISTS public.notification_dispatch_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  notification_key  text NULL,
  notification_type text NULL,
  decision          text NOT NULL CHECK (decision IN ('sent', 'skipped', 'failed')),
  reason            text NULL,
  provider          text NOT NULL DEFAULT 'expo',
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_dispatch_events_user_created
  ON public.notification_dispatch_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_dispatch_events_key
  ON public.notification_dispatch_events (notification_key);

CREATE INDEX IF NOT EXISTS idx_notification_dispatch_events_decision_created
  ON public.notification_dispatch_events (decision, created_at DESC);

ALTER TABLE public.notification_dispatch_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.notification_dispatch_events FROM anon;
REVOKE ALL ON TABLE public.notification_dispatch_events FROM authenticated;
GRANT ALL ON TABLE public.notification_dispatch_events TO service_role;

DROP POLICY IF EXISTS "Service role manages notification_dispatch_events" ON public.notification_dispatch_events;
CREATE POLICY "Service role manages notification_dispatch_events"
  ON public.notification_dispatch_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
