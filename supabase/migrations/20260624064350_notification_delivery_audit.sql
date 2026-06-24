-- Create notification_deliveries table
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    user_id uuid null references auth.users(id) on delete set null,
    notification_id uuid null references public.notifications(id) on delete set null,
    notification_key text null,
    channel text not null default 'push',
    provider text not null default 'onesignal',
    provider_message_id text null,
    type text not null,
    status text not null,
    dry_run boolean not null default false,
    disabled boolean not null default false,
    error_code text null,
    error_message text null,
    metadata jsonb not null default '{}'::jsonb
);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS notification_deliveries_user_created_idx ON public.notification_deliveries (user_id, created_at desc);
CREATE INDEX IF NOT EXISTS notification_deliveries_key_idx ON public.notification_deliveries (notification_key);
CREATE INDEX IF NOT EXISTS notification_deliveries_type_created_idx ON public.notification_deliveries (type, created_at desc);
CREATE INDEX IF NOT EXISTS notification_deliveries_status_created_idx ON public.notification_deliveries (status, created_at desc);

-- RLS
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.notification_deliveries FROM anon;
REVOKE ALL ON TABLE public.notification_deliveries FROM authenticated;
GRANT ALL ON TABLE public.notification_deliveries TO service_role;

DROP POLICY IF EXISTS "Service role manages notification deliveries" ON public.notification_deliveries;
CREATE POLICY "Service role manages notification deliveries"
ON public.notification_deliveries
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
