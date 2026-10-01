-- Bounded, anonymous Native API failure diagnostics. The client uploads only
-- failed, retry-recovered, and slow requests. It never sends URLs with query
-- strings, request/response bodies, auth tokens, or user identifiers.
create table public.native_api_diagnostic_events (
  client_event_id uuid primary key,
  server_request_id uuid,
  retry_server_request_id uuid,
  endpoint text not null check (
    char_length(endpoint) <= 120
    and endpoint ~ '^/(api|supabase)/[a-z0-9/_:-]{1,115}$'
  ),
  method text not null check (method in ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OTHER')),
  outcome text not null check (outcome in (
    'http_failure', 'network_failure', 'timeout', 'client_failure', 'owner_mismatch',
    'retry_recovered', 'auth_recovered', 'slow_success'
  )),
  first_status smallint check (first_status is null or first_status between 100 and 599),
  final_status smallint check (final_status is null or final_status between 100 and 599),
  attempt_count smallint not null check (attempt_count between 0 and 4),
  duration_ms integer not null check (duration_ms between 0 and 180000),
  app_version text check (app_version is null or char_length(app_version) <= 40),
  platform text check (platform is null or platform in ('ios', 'android')),
  client_occurred_at timestamptz,
  received_at timestamptz not null default now()
);

comment on table public.native_api_diagnostic_events is
  'Anonymous, bounded Native API failure/recovery/slow-request diagnostics. Contains normalized endpoint, status, timing and server request IDs only; no user ID, URL query, request body, response body, token, or exception text. Retained for 30 days.';

create index native_api_diag_received_at_idx
  on public.native_api_diagnostic_events (received_at desc);
create index native_api_diag_endpoint_received_at_idx
  on public.native_api_diagnostic_events (endpoint, received_at desc);
create index native_api_diag_server_request_id_idx
  on public.native_api_diagnostic_events (server_request_id)
  where server_request_id is not null;
create index native_api_diag_retry_server_request_id_idx
  on public.native_api_diagnostic_events (retry_server_request_id)
  where retry_server_request_id is not null;

alter table public.native_api_diagnostic_events enable row level security;
alter table public.native_api_diagnostic_events force row level security;
revoke all on table public.native_api_diagnostic_events from public, anon, authenticated;
grant all on table public.native_api_diagnostic_events to service_role;

select cron.schedule(
  'purge-native-api-diagnostic-events-daily',
  '39 3 * * *',
  $$delete from public.native_api_diagnostic_events where received_at < now() - interval '30 days'$$
);
