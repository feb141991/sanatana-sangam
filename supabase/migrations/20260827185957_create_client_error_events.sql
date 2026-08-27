-- Private production client-error evidence. Browsers post only through the
-- rate-limited Next.js endpoint; they never receive table privileges.
create table public.client_error_events (
  id uuid primary key default gen_random_uuid(),
  incident_id text not null unique,
  fingerprint text not null,
  source text not null check (source in ('react_root', 'react_home', 'window_error', 'unhandled_rejection', 'qa_probe')),
  error_name text not null,
  error_message text not null,
  stack text,
  component_stack text,
  route text not null,
  browser_family text not null,
  os_family text not null,
  client_release_sha text not null,
  client_deployment_url text,
  server_release_sha text not null,
  server_deployment_url text,
  service_worker_controller text,
  online boolean,
  anonymous_session_hash text,
  created_at timestamptz not null default now()
);

comment on table public.client_error_events is
  'Sanitized PWA runtime errors. No user identity, request data, profile data, tokens, URLs with query strings, or raw user-agent strings.';

create index client_error_events_created_at_idx
  on public.client_error_events (created_at desc);
create index client_error_events_fingerprint_created_at_idx
  on public.client_error_events (fingerprint, created_at desc);
create index client_error_events_release_created_at_idx
  on public.client_error_events (client_release_sha, created_at desc);

alter table public.client_error_events enable row level security;
alter table public.client_error_events force row level security;

revoke all on table public.client_error_events from public, anon, authenticated;
grant all on table public.client_error_events to service_role;

-- Retention is enforced in Postgres rather than relying on an admin screen or
-- application traffic. The existing project already uses pg_cron.
select cron.schedule(
  'purge-client-error-events-daily',
  '17 3 * * *',
  $$delete from public.client_error_events where created_at < now() - interval '30 days'$$
);
