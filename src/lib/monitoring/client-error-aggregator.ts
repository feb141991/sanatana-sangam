import { createAdminClient } from '@/lib/supabase-admin';

export interface ClientErrorFingerprintGroup {
  fingerprint: string;
  error_name: string;
  error_message: string;
  route: string;
  source: string;
  first_seen: string;
  last_seen: string;
  count_1h: number;
  count_24h: number;
  total_count: number;
  distinct_sessions_count: number;
  latest_client_sha: string;
  latest_server_sha: string;
  stale_client_count: number;
  is_stale_client_heavy: boolean;
  sample_stack: string | null;
  sample_component_stack: string | null;
  browser_family: string;
  os_family: string;
  recent_incident_ids: string[];
}

export interface ClientErrorMonitoringMetrics {
  total_1h: number;
  total_24h: number;
  total_lifetime: number;
  distinct_fingerprints_24h: number;
  stale_deploy_mismatches_24h: number;
  distinct_sessions_24h: number;
  home_errors_1h: number;
  fingerprints: ClientErrorFingerprintGroup[];
}

export async function fetchClientErrorMonitoringMetrics(): Promise<ClientErrorMonitoringMetrics> {
  const supabase = createAdminClient();
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Query events in last 24 hours (capped at 1500 for fast aggregation)
  const { data: rows, error } = await supabase
    .from('client_error_events')
    .select('*')
    .gte('created_at', twentyFourHoursAgo)
    .order('created_at', { ascending: false })
    .limit(1500);

  if (error) {
    console.error('[client-error-aggregator] Error fetching client_error_events:', error);
    return {
      total_1h: 0,
      total_24h: 0,
      total_lifetime: 0,
      distinct_fingerprints_24h: 0,
      stale_deploy_mismatches_24h: 0,
      distinct_sessions_24h: 0,
      home_errors_1h: 0,
      fingerprints: [],
    };
  }

  const events = rows || [];
  let total1h = 0;
  let stale24h = 0;
  let homeErrors1h = 0;
  const globalSessions24h = new Set<string>();

  const fingerprintMap = new Map<string, {
    events: typeof events;
    sessions: Set<string>;
  }>();

  for (const ev of events) {
    const is1h = ev.created_at >= oneHourAgo;
    if (is1h) {
      total1h++;
      if (ev.route === '/home') homeErrors1h++;
    }

    if (ev.client_release_sha && ev.server_release_sha && ev.client_release_sha !== ev.server_release_sha) {
      stale24h++;
    }

    if (ev.anonymous_session_hash) {
      globalSessions24h.add(ev.anonymous_session_hash);
    }

    const group = fingerprintMap.get(ev.fingerprint) || { events: [], sessions: new Set<string>() };
    group.events.push(ev);
    if (ev.anonymous_session_hash) {
      group.sessions.add(ev.anonymous_session_hash);
    }
    fingerprintMap.set(ev.fingerprint, group);
  }

  const fingerprints: ClientErrorFingerprintGroup[] = [];

  for (const [fingerprint, group] of fingerprintMap.entries()) {
    const evList = group.events;
    const latest = evList[0];
    const oldest = evList[evList.length - 1];

    let count1h = 0;
    let staleCount = 0;

    for (const e of evList) {
      if (e.created_at >= oneHourAgo) count1h++;
      if (e.client_release_sha && e.server_release_sha && e.client_release_sha !== e.server_release_sha) {
        staleCount++;
      }
    }

    const isStaleHeavy = evList.length > 0 && (staleCount / evList.length) >= 0.5;

    fingerprints.push({
      fingerprint,
      error_name: latest.error_name,
      error_message: latest.error_message,
      route: latest.route,
      source: latest.source,
      first_seen: oldest.created_at,
      last_seen: latest.created_at,
      count_1h: count1h,
      count_24h: evList.length,
      total_count: evList.length,
      distinct_sessions_count: group.sessions.size,
      latest_client_sha: latest.client_release_sha,
      latest_server_sha: latest.server_release_sha,
      stale_client_count: staleCount,
      is_stale_client_heavy: isStaleHeavy,
      sample_stack: latest.stack,
      sample_component_stack: latest.component_stack,
      browser_family: latest.browser_family,
      os_family: latest.os_family,
      recent_incident_ids: evList.slice(0, 5).map(e => e.incident_id),
    });
  }

  // Sort fingerprints by most recent activity and volume
  fingerprints.sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime());

  return {
    total_1h: total1h,
    total_24h: events.length,
    total_lifetime: events.length,
    distinct_fingerprints_24h: fingerprints.length,
    stale_deploy_mismatches_24h: stale24h,
    distinct_sessions_24h: globalSessions24h.size,
    home_errors_1h: homeErrors1h,
    fingerprints,
  };
}

export async function purgeOldClientErrorEvents(retentionDays = 30): Promise<{ deletedCount: number }> {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('client_error_events')
    .delete()
    .lt('created_at', cutoff)
    .select('id');

  if (error) {
    console.error('[client-error-aggregator] Failed to purge old records:', error);
    throw error;
  }

  return { deletedCount: data?.length || 0 };
}
