import { createClient } from '@supabase/supabase-js';
import type { NativeTelemetryPayload } from '@/lib/native-telemetry-contract';

export interface NativeTelemetrySummaryRow {
  id: string;
  identity_kind: 'guest' | 'authenticated';
  user_id: string | null;
  app_version: string | null;
  platform: string | null;
  total_events: number;
  received_at: string;
  summary: NativeTelemetryPayload['summary'];
}

// F07 (docs/PERFORMANCE_RESEARCH_AND_EXECUTION_PLAN.md, native repo),
// external-review follow-up: every count field is `number | null` --
// `null` means the underlying query failed and the true value is unknown,
// distinct from a genuine 0. The original fix defaulted every failed count
// to `?? 0`, which is indistinguishable from "zero submissions" -- exactly
// the kind of silent under-report this same finding was originally about.
export interface NativeTelemetryMonitoringMetrics {
  submissions_1h: number | null;
  submissions_24h: number | null;
  submissions_lifetime: number | null;
  // Guest submissions carry no stable per-device identifier by design (see
  // the migration's privacy comment), so this can only count distinct
  // *authenticated* users -- it is not a total distinct-device count and
  // must not be presented as one. Computed via a real COUNT(DISTINCT ...)
  // RPC (count_distinct_native_telemetry_users), not a client-side dedupe
  // over a capped row selection -- the previous approach silently
  // under-reported once authenticated submissions in the window exceeded
  // its row cap.
  distinct_authenticated_users_24h: number | null;
  recent: NativeTelemetrySummaryRow[];
  recent_fetch_error: boolean;
}

const RECENT_LIMIT = 100;

// Untyped client -- this table isn't in the generated Database types yet
// (see the migration file and src/lib/api-auth.ts's own note on the same
// `never`-typing issue for tables missing from the generated types).
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function fetchNativeTelemetryMonitoringMetrics(): Promise<NativeTelemetryMonitoringMetrics> {
  const supabase = adminClient();
  const now = Date.now();
  const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const { data: rows, error: recentError } = await supabase
    .from('native_startup_telemetry_summaries')
    .select('id, identity_kind, user_id, app_version, platform, total_events, received_at, summary')
    .order('received_at', { ascending: false })
    .limit(RECENT_LIMIT);

  if (recentError) {
    console.error('[native-telemetry-aggregator] recent-rows fetch failed', recentError.message);
  }
  const recent = (rows ?? []) as NativeTelemetrySummaryRow[];

  // Real range-scoped counts against the full table, not derived from the
  // capped `recent` list above -- deriving 1h/24h counts from a
  // top-100-overall query silently under-reports once daily submissions
  // exceed 100, with no error or signal that it happened.
  const [oneHourResult, twentyFourHourResult, lifetimeResult, distinctUsersResult] = await Promise.all([
    supabase.from('native_startup_telemetry_summaries')
      .select('id', { count: 'exact', head: true })
      .gte('received_at', oneHourAgo),
    supabase.from('native_startup_telemetry_summaries')
      .select('id', { count: 'exact', head: true })
      .gte('received_at', twentyFourHoursAgo),
    supabase.from('native_startup_telemetry_summaries')
      .select('id', { count: 'exact', head: true }),
    supabase.rpc('count_distinct_native_telemetry_users', { p_since: twentyFourHoursAgo }),
  ]);

  if (oneHourResult.error) {
    console.error('[native-telemetry-aggregator] 1h count failed', oneHourResult.error.message);
  }
  if (twentyFourHourResult.error) {
    console.error('[native-telemetry-aggregator] 24h count failed', twentyFourHourResult.error.message);
  }
  if (lifetimeResult.error) {
    console.error('[native-telemetry-aggregator] lifetime count failed', lifetimeResult.error.message);
  }
  if (distinctUsersResult.error) {
    console.error('[native-telemetry-aggregator] distinct-users RPC failed', distinctUsersResult.error.message);
  }

  return {
    submissions_1h: oneHourResult.error ? null : oneHourResult.count,
    submissions_24h: twentyFourHourResult.error ? null : twentyFourHourResult.count,
    submissions_lifetime: lifetimeResult.error ? null : lifetimeResult.count,
    distinct_authenticated_users_24h: distinctUsersResult.error
      ? null
      : Number(distinctUsersResult.data ?? 0),
    recent,
    recent_fetch_error: Boolean(recentError),
  };
}
