CREATE TABLE IF NOT EXISTS public.monitoring_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  severity text NOT NULL CHECK (severity IN ('P0', 'P1', 'P2', 'P3')),
  domain text NOT NULL CHECK (domain IN ('app', 'ai', 'tts', 'translation', 'auth', 'notifications', 'cron', 'storage')),
  route text,
  provider text,
  model text,
  fallback_used boolean,
  latency_ms integer,
  error_code text,
  error_message text,
  request_id text,
  trace_id text,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_events_timestamp
  ON public.monitoring_events (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_monitoring_events_severity_timestamp
  ON public.monitoring_events (severity, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_monitoring_events_domain_timestamp
  ON public.monitoring_events (domain, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_monitoring_events_provider_timestamp
  ON public.monitoring_events (provider, timestamp DESC)
  WHERE provider IS NOT NULL;

ALTER TABLE public.monitoring_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages monitoring events" ON public.monitoring_events;
CREATE POLICY "Service role manages monitoring events"
  ON public.monitoring_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
