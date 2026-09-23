import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { requireAdminAccess } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  isCandidateResolverGloballyEnabled,
  getAllPipelineModesSnapshot,
} from '@/lib/notification-candidate-pipeline-mode';

export const dynamic = 'force-dynamic';

const AUDIT_PAGE_SIZE = 500;

interface AuditWindowStats {
  total: number;
  accepted: number;
  suppressed: number;
  deferred: number;
  expired: number;
  cancelled: number;
  reasons: Record<string, number>;
  types: Record<string, number>;
}

interface AuditEventRow {
  id: string;
  resolved_at: string;
  decision: string;
  reason: string | null;
  event_type: string | null;
}

function isAuditEventRow(value: unknown): value is AuditEventRow {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string'
    && typeof row.resolved_at === 'string'
    && typeof row.decision === 'string'
    && (typeof row.reason === 'string' || row.reason === null)
    && (typeof row.event_type === 'string' || row.event_type === null);
}

function emptyAuditWindowStats(): AuditWindowStats {
  return {
    total: 0, accepted: 0, suppressed: 0, deferred: 0, expired: 0, cancelled: 0,
    reasons: {}, types: {},
  };
}

function addAuditEvent(stats: AuditWindowStats, event: AuditEventRow) {
  stats.total++;
  if (event.decision === 'accepted') stats.accepted++;
  else if (event.decision === 'suppressed') stats.suppressed++;
  else if (event.decision === 'deferred') stats.deferred++;
  else if (event.decision === 'expired') stats.expired++;
  else if (event.decision === 'cancelled') stats.cancelled++;
  if (event.reason) stats.reasons[event.reason] = (stats.reasons[event.reason] ?? 0) + 1;
  if (event.event_type) stats.types[event.event_type] = (stats.types[event.event_type] ?? 0) + 1;
}

async function readAuditWindows(
  supabase: ReturnType<typeof createAdminClient>,
  since24h: string,
  since7d: string,
  until: string,
) {
  const last24h = emptyAuditWindowStats();
  const last7d = emptyAuditWindowStats();
  const since24hMs = Date.parse(since24h);
  let cursor: { resolvedAt: string; id: string } | null = null;
  for (;;) {
    let query = supabase
      .from('notification_resolver_events')
      .select('id, resolved_at, decision, reason, event_type')
      .gte('resolved_at', since7d)
      .lte('resolved_at', until);
    if (cursor) {
      // Stable keyset pagination avoids offset-page drift while new audit rows
      // are appended during this request.
      query = query.or(`resolved_at.gt.${cursor.resolvedAt},and(resolved_at.eq.${cursor.resolvedAt},id.gt.${cursor.id})`);
    }
    const { data, error } = await query
      .order('resolved_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(AUDIT_PAGE_SIZE);
    if (error) throw new Error(`Failed to load resolver audit window: ${error.message}`);
    const page: unknown[] = Array.isArray(data) ? data : [];
    for (const value of page) {
      if (!isAuditEventRow(value)) throw new Error('Resolver audit query returned an invalid row shape');
      const event = value;
      addAuditEvent(last7d, event);
      if (Date.parse(event.resolved_at) >= since24hMs) addAuditEvent(last24h, event);
    }
    if (page.length < AUDIT_PAGE_SIZE) return { last24h, last7d };
    const last = page[page.length - 1] as AuditEventRow;
    cursor = { resolvedAt: last.resolved_at, id: last.id };
  }
}

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;

  try {
    const supabase = createAdminClient();
    const now = new Date();
    const oneDayAgoIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgoIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const tenMinsAgoIso = new Date(now.getTime() - 10 * 60 * 1000).toISOString();

    // 1. Current queue snapshot & stale leases
    const [
      pendingRes,
      resolvingRes,
      staleLeasesRes,
      acceptedRes,
      suppressedRes,
      deferredRes,
      expiredRes,
      cancelledRes,
    ] = await Promise.all([
      supabase.from('notification_candidates').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('notification_candidates').select('id', { count: 'exact', head: true }).eq('status', 'resolving'),
      supabase.from('notification_candidates').select('id', { count: 'exact', head: true }).eq('status', 'resolving').lte('claimed_at', tenMinsAgoIso),
      supabase.from('notification_candidates').select('id', { count: 'exact', head: true }).eq('status', 'accepted'),
      supabase.from('notification_candidates').select('id', { count: 'exact', head: true }).eq('status', 'suppressed'),
      supabase.from('notification_candidates').select('id', { count: 'exact', head: true }).eq('status', 'deferred'),
      supabase.from('notification_candidates').select('id', { count: 'exact', head: true }).eq('status', 'expired'),
      supabase.from('notification_candidates').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
    ]);

    const countErrors = [pendingRes, resolvingRes, staleLeasesRes, acceptedRes, suppressedRes, deferredRes, expiredRes, cancelledRes]
      .flatMap((result) => result.error ? [result.error.message] : []);
    if (countErrors.length > 0) throw new Error(`Failed to load resolver queue counts: ${countErrors.join('; ')}`);

    // Paginate every matching audit row. PostgREST caps a single response, so
    // aggregating one page would silently under-report at production volume.
    const { last24h: audit24h, last7d: audit7d } = await readAuditWindows(
      supabase,
      oneDayAgoIso,
      sevenDaysAgoIso,
      now.toISOString(),
    );

    // Process 24h metrics
    const { total: total24h, accepted: accepted24h, suppressed: suppressed24h,
      deferred: deferred24h, expired: expired24h, cancelled: cancelled24h,
      reasons: reasons24h, types: typeDistribution24h } = audit24h;
    const { total: total7d, accepted: accepted7d, suppressed: suppressed7d,
      deferred: deferred7d, expired: expired7d, cancelled: cancelled7d } = audit7d;

    const rates24h = {
      acceptedPct: total24h > 0 ? Math.round((accepted24h / total24h) * 100) : 0,
      suppressedPct: total24h > 0 ? Math.round((suppressed24h / total24h) * 100) : 0,
      deferredPct: total24h > 0 ? Math.round((deferred24h / total24h) * 100) : 0,
      expiredPct: total24h > 0 ? Math.round((expired24h / total24h) * 100) : 0,
    };

    const rates7d = {
      acceptedPct: total7d > 0 ? Math.round((accepted7d / total7d) * 100) : 0,
      suppressedPct: total7d > 0 ? Math.round((suppressed7d / total7d) * 100) : 0,
      deferredPct: total7d > 0 ? Math.round((deferred7d / total7d) * 100) : 0,
      expiredPct: total7d > 0 ? Math.round((expired7d / total7d) * 100) : 0,
    };

    // Sort suppression reasons by frequency
    const topSuppressionReasons = Object.entries(reasons24h)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      status: 'ok',
      timestamp: now.toISOString(),
      governance: {
        globallyEnabled: isCandidateResolverGloballyEnabled(),
        pipelineModes: getAllPipelineModesSnapshot(),
      },
      queue: {
        pending: pendingRes.count ?? 0,
        resolving: resolvingRes.count ?? 0,
        staleLeases: staleLeasesRes.count ?? 0,
        retainedAccepted: acceptedRes.count ?? 0,
        retainedSuppressed: suppressedRes.count ?? 0,
        retainedDeferred: deferredRes.count ?? 0,
        retainedExpired: expiredRes.count ?? 0,
        retainedCancelled: cancelledRes.count ?? 0,
      },
      last24h: {
        totalEvaluated: total24h,
        accepted: accepted24h,
        suppressed: suppressed24h,
        deferred: deferred24h,
        expired: expired24h,
        cancelled: cancelled24h,
        rates: rates24h,
        topSuppressionReasons,
        typeDistribution: typeDistribution24h,
      },
      last7d: {
        totalEvaluated: total7d,
        accepted: accepted7d,
        suppressed: suppressed7d,
        deferred: deferred7d,
        expired: expired7d,
        cancelled: cancelled7d,
        rates: rates7d,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
