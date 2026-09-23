import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { requireAdminAccess } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  isCandidateResolverGloballyEnabled,
  getAllPipelineModesSnapshot,
} from '@/lib/notification-candidate-pipeline-mode';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;

  try {
    const supabase = createAdminClient() as any;
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

    // 2. 24-hour audit events
    const { data: audit24h, error: audit24hError } = await supabase
      .from('notification_resolver_events')
      .select('decision, reason, event_type')
      .gte('resolved_at', oneDayAgoIso);

    // 3. 7-day audit events
    const { data: audit7d, error: audit7dError } = await supabase
      .from('notification_resolver_events')
      .select('decision, reason')
      .gte('resolved_at', sevenDaysAgoIso);

    if (audit24hError) {
      console.warn('[notification-resolver-stats] audit24hError:', audit24hError.message);
    }
    if (audit7dError) {
      console.warn('[notification-resolver-stats] audit7dError:', audit7dError.message);
    }

    // Process 24h metrics
    const events24h = Array.isArray(audit24h) ? audit24h : [];
    const total24h = events24h.length;
    let accepted24h = 0;
    let suppressed24h = 0;
    let deferred24h = 0;
    let expired24h = 0;
    let cancelled24h = 0;
    let duplicates24h = 0;
    const reasons24h: Record<string, number> = {};
    const typeDistribution24h: Record<string, number> = {};

    for (const ev of events24h) {
      if (ev.decision === 'accepted') accepted24h++;
      else if (ev.decision === 'suppressed') suppressed24h++;
      else if (ev.decision === 'deferred') deferred24h++;
      else if (ev.decision === 'expired') expired24h++;
      else if (ev.decision === 'cancelled') cancelled24h++;

      if (ev.reason) {
        reasons24h[ev.reason] = (reasons24h[ev.reason] ?? 0) + 1;
        if (ev.reason.includes('duplicate') || ev.reason.includes('deduplicat')) {
          duplicates24h++;
        }
      }

      if (ev.event_type) {
        typeDistribution24h[ev.event_type] = (typeDistribution24h[ev.event_type] ?? 0) + 1;
      }
    }

    // Process 7d metrics
    const events7d = Array.isArray(audit7d) ? audit7d : [];
    const total7d = events7d.length;
    let accepted7d = 0;
    let suppressed7d = 0;
    let deferred7d = 0;
    let expired7d = 0;
    let cancelled7d = 0;

    for (const ev of events7d) {
      if (ev.decision === 'accepted') accepted7d++;
      else if (ev.decision === 'suppressed') suppressed7d++;
      else if (ev.decision === 'deferred') deferred7d++;
      else if (ev.decision === 'expired') expired7d++;
      else if (ev.decision === 'cancelled') cancelled7d++;
    }

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
        lifetimeAccepted: acceptedRes.count ?? 0,
        lifetimeSuppressed: suppressedRes.count ?? 0,
        lifetimeDeferred: deferredRes.count ?? 0,
        lifetimeExpired: expiredRes.count ?? 0,
        lifetimeCancelled: cancelledRes.count ?? 0,
      },
      last24h: {
        totalEvaluated: total24h,
        accepted: accepted24h,
        suppressed: suppressed24h,
        deferred: deferred24h,
        expired: expired24h,
        cancelled: cancelled24h,
        duplicatesPrevented: duplicates24h,
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
