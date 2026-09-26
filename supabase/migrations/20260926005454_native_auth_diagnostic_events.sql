-- Persistent, anonymous auth-recovery diagnostics from Native.
-- Each logical API call has one UUID request_id, so retries and repeated
-- uploads are idempotent. No user ID, token, profile data, or free text is
-- stored. Records are accepted only through the bounded server endpoint.
create table public.native_auth_diagnostic_events (
  request_id uuid primary key,
  retry_request_id uuid,
  constraint native_auth_diag_retry_request_distinct check (retry_request_id is null or retry_request_id <> request_id),
  route text not null check (route in (
    'native_home_summary', 'sankalpa', 'register_token',
    'festival_quiz_seasons', 'ai_chat_usage', 'native_home_live',
    'dharm_veer_submit'
  )),
  auth_code text not null check (auth_code in ('AUTH_REQUIRED', 'AUTH_UNAVAILABLE', 'unknown')),
  initial_status smallint not null check (initial_status in (0, 401, 503)),
  final_status smallint not null check (final_status = 0 or final_status between 100 and 599),
  auth_ready_wait_ms integer not null check (auth_ready_wait_ms between 0 and 180000),
  had_access_token boolean not null,
  refresh_attempted boolean not null,
  refresh_succeeded boolean not null,
  duration_ms integer not null check (duration_ms between 0 and 180000),
  app_version text check (app_version is null or length(app_version) <= 40),
  platform text check (platform is null or platform in ('ios', 'android')),
  client_occurred_at timestamptz,
  received_at timestamptz not null default now(),
  constraint native_auth_diag_refresh_consistency check (not refresh_succeeded or refresh_attempted)
);

comment on table public.native_auth_diagnostic_events is
  'Anonymous, bounded Native auth-recovery events for diagnosing 401/503 outcomes. Request IDs correlate with backend logs; no user IDs, tokens, profile data, or free text. Retained for 30 days.';

create index native_auth_diag_received_at_idx
  on public.native_auth_diagnostic_events (received_at desc);
create index native_auth_diag_route_received_at_idx
  on public.native_auth_diagnostic_events (route, received_at desc);

alter table public.native_auth_diagnostic_events enable row level security;
alter table public.native_auth_diagnostic_events force row level security;
revoke all on table public.native_auth_diagnostic_events from public, anon, authenticated;
grant all on table public.native_auth_diagnostic_events to service_role;

select cron.schedule(
  'purge-native-auth-diagnostic-events-daily',
  '37 3 * * *',
  $$delete from public.native_auth_diagnostic_events where received_at < now() - interval '30 days'$$
);
