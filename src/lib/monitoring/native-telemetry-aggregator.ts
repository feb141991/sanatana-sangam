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

export interface NativeTelemetryMonitoringMetrics {
  submissions_1h: number;
  submissions_24h: number;
  submissions_lifetime: number;
  // Guest submissions carry no stable per-device identifier by design (see
  // the migration's privacy comment), so this can only count distinct
  // *authenticated* users -- it is not a total distinct-device count and
  // must not be presented as one.
  distinct_authenticated_users_24h: number;
  recent: NativeTelemetrySummaryRow[];
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

// Upper bound for the distinct-user dedupe query -- generous for this
// table's expected volume (a single background beacon per install per
// hour), without an unbounded scan.
const DISTINCT_USERS_SCAN_LIMIT = 5000;

export async function fetchNativeTelemetryMonitoringMetrics(): Promise<NativeTelemetryMonitoringMetrics> {
  const supabase = adminClient();
  const now = Date.now();
  const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const emptyMetrics: NativeTelemetryMonitoringMetrics = {
    submissions_1h: 0,
    submissions_24h: 0,
    submissions_lifetime: 0,
    distinct_authenticated_users_24h: 0,
    recent: [],
  };

  const { data: rows, error } = await supabase
    .from('native_startup_telemetry_summaries')
    .select('id, identity_kind, user_id, app_version, platform, total_events, received_at, summary')
    .order('received_at', { ascending: false })
    .limit(RECENT_LIMIT);

  if (error) {
    console.error('[native-telemetry-aggregator] fetch failed', error.message);
    return emptyMetrics;
  }

  const recent = (rows ?? []) as NativeTelemetrySummaryRow[];

  // Real range-scoped counts against the full table, not derived from the
  // capped `recent` list above -- deriving 1h/24h counts (or the distinct-
  // user set) from a top-100-overall query silently under-reports once
  // daily submissions exceed 100, with no error or signal that it happened.
  const [oneHourResult, twentyFourHourResult, lifetimeResult, usersResult] = await Promise.all([
    supabase.from('native_startup_telemetry_summaries')
      .select('id', { count: 'exact', head: true })
      .gte('received_at', oneHourAgo),
    supabase.from('native_startup_telemetry_summaries')
      .select('id', { count: 'exact', head: true })
      .gte('received_at', twentyFourHoursAgo),
    supabase.from('native_startup_telemetry_summaries')
      .select('id', { count: 'exact', head: true }),
    supabase.from('native_startup_telemetry_summaries')
      .select('user_id')
      .gte('received_at', twentyFourHoursAgo)
      .not('user_id', 'is', null)
      .limit(DISTINCT_USERS_SCAN_LIMIT),
  ]);

  const distinctUsers24h = new Set(
    ((usersResult.data ?? []) as Array<{ user_id: string }>).map((r) => r.user_id)
  );

  return {
    submissions_1h: oneHourResult.count ?? 0,
    submissions_24h: twentyFourHourResult.count ?? 0,
    submissions_lifetime: lifetimeResult.count ?? recent.length,
    distinct_authenticated_users_24h: distinctUsers24h.size,
    recent,
  };
}
