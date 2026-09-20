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

export async function fetchNativeTelemetryMonitoringMetrics(): Promise<NativeTelemetryMonitoringMetrics> {
  const supabase = adminClient();
  const now = Date.now();
  const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const { data: rows, error } = await supabase
    .from('native_startup_telemetry_summaries')
    .select('id, identity_kind, user_id, app_version, platform, total_events, received_at, summary')
    .order('received_at', { ascending: false })
    .limit(RECENT_LIMIT);

  if (error) {
    console.error('[native-telemetry-aggregator] fetch failed', error.message);
    return {
      submissions_1h: 0,
      submissions_24h: 0,
      submissions_lifetime: 0,
      distinct_authenticated_users_24h: 0,
      recent: [],
    };
  }

  const recent = (rows ?? []) as NativeTelemetrySummaryRow[];

  const { count: lifetimeCount } = await supabase
    .from('native_startup_telemetry_summaries')
    .select('id', { count: 'exact', head: true });

  let submissions1h = 0;
  let submissions24h = 0;
  const distinctUsers24h = new Set<string>();

  for (const row of recent) {
    if (row.received_at >= twentyFourHoursAgo) {
      submissions24h += 1;
      if (row.user_id) distinctUsers24h.add(row.user_id);
      if (row.received_at >= oneHourAgo) submissions1h += 1;
    }
  }

  return {
    submissions_1h: submissions1h,
    submissions_24h: submissions24h,
    submissions_lifetime: lifetimeCount ?? recent.length,
    distinct_authenticated_users_24h: distinctUsers24h.size,
    recent,
  };
}
