-- Nullable for compatibility with diagnostics produced by app versions that
-- predate lifecycle tagging. True means at least one real AppState background
-- transition occurred between the client request start and diagnostic capture.
alter table public.native_api_diagnostic_events
  add column if not exists crossed_background boolean;

comment on column public.native_api_diagnostic_events.crossed_background is
  'Whether the client observed a real app background transition during the request wall-clock interval; null for older clients.';
