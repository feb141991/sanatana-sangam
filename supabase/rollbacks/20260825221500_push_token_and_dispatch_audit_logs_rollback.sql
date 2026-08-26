-- Rollback push_token_events and notification_dispatch_events audit tables

DROP POLICY IF EXISTS "Service role manages notification_dispatch_events" ON public.notification_dispatch_events;
DROP TABLE IF EXISTS public.notification_dispatch_events;

DROP POLICY IF EXISTS "Service role manages push_token_events" ON public.push_token_events;
DROP TABLE IF EXISTS public.push_token_events;
