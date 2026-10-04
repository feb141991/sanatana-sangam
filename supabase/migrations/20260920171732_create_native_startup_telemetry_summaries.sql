-- Aggregated, privacy-safe native app-startup/route-open performance
-- telemetry, uploaded automatically in the background from installed
-- native clients so docs/STARTUP_PERFORMANCE_IMPLEMENTATION_PLAN.md's
-- Phase 0 (native repo) can be measured centrally in /admin instead of
-- read off one device. Payload is the existing on-device TelemetrySummary
-- (shoonaya-mobile lib/telemetry.ts) -- route names, durations, counts,
-- cache-hit rates. Never free text, content, or anything identifying what
-- the user was looking at beyond "which screen, how long, cache hit or
-- miss" -- see src/lib/native-telemetry-contract.ts for the validated shape.
create table public.native_startup_telemetry_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  identity_kind text not null check (identity_kind in ('guest', 'authenticated')),
  schema_version int not null,
  app_version text,
  platform text check (platform is null or platform in ('ios', 'android')),
  total_events int not null default 0,
  summary jsonb not null,
  received_at timestamptz not null default now(),
  constraint native_startup_telemetry_identity_consistency check (
    (identity_kind = 'authenticated' and user_id is not null) or
    (identity_kind = 'guest' and user_id is null)
  )
);

comment on table public.native_startup_telemetry_summaries is
  'Aggregated native app-startup/route-open performance summaries (durations, cache-hit rates, counts). No free text or user content -- see lib/telemetry.ts (native repo) and src/lib/native-telemetry-contract.ts for the exact validated schema.';

create index native_startup_telemetry_received_at_idx
  on public.native_startup_telemetry_summaries (received_at desc);
create index native_startup_telemetry_user_id_idx
  on public.native_startup_telemetry_summaries (user_id, received_at desc)
  where user_id is not null;

alter table public.native_startup_telemetry_summaries enable row level security;
alter table public.native_startup_telemetry_summaries force row level security;

-- Written only by the rate-limited /api/native/telemetry-summary route and
-- read only by /api/admin/native-telemetry, both via the service role --
-- same convention as client_error_events. No anon/authenticated policies.
revoke all on table public.native_startup_telemetry_summaries from public, anon, authenticated;
grant all on table public.native_startup_telemetry_summaries to service_role;

-- Same 30-day retention as client_error_events -- this is short-lived
-- engineering diagnostics, not a record that needs to outlive a release cycle.
select cron.schedule(
  'purge-native-startup-telemetry-daily',
  '31 3 * * *',
  $$delete from public.native_startup_telemetry_summaries where received_at < now() - interval '30 days'$$
);
