-- F07 (docs/PERFORMANCE_RESEARCH_AND_EXECUTION_PLAN.md, native repo),
-- external-review follow-up: the admin aggregator was deduplicating
-- user_id across a client-fetched, LIMIT-capped row selection (5000 rows)
-- to approximate a distinct-user count. That silently under-reports once
-- authenticated submissions in the 24h window exceed the cap, with no
-- signal that truncation happened. A real COUNT(DISTINCT ...) run inside
-- Postgres has no such cap and is cheaper than shipping thousands of rows
-- to the application layer just to deduplicate them there.
create or replace function public.count_distinct_native_telemetry_users(p_since timestamptz)
returns bigint
language sql
stable
security invoker
as $$
  select count(distinct user_id)
  from public.native_startup_telemetry_summaries
  where received_at >= p_since
    and user_id is not null;
$$;

comment on function public.count_distinct_native_telemetry_users(timestamptz) is
  'Exact distinct authenticated-user count for native_startup_telemetry_summaries since p_since. security invoker: only ever called by the service-role admin client, which already bypasses this table''s RLS -- no reason to grant definer rights.';

revoke all on function public.count_distinct_native_telemetry_users(timestamptz) from public, anon, authenticated;
grant execute on function public.count_distinct_native_telemetry_users(timestamptz) to service_role;
