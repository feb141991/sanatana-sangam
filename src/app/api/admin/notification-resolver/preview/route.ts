import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { requireAdminAccess } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase-admin';
import { executeCandidateResolverPipeline } from '@/lib/notification-resolver-pipeline';
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
    const url = new URL(request.url);
    const batchLimit = Math.max(1, Math.min(500, Number(url.searchParams.get('limit') ?? 50) || 50));
    const eventType = url.searchParams.get('eventType') || undefined;

    // 1. Gather status counts from notification_candidates
    const [
      pendingRes,
      resolvingRes,
      acceptedRes,
      suppressedRes,
      deferredRes,
      expiredRes,
      cancelledRes,
      recentCandidatesRes,
      recentAuditRes,
    ] = await Promise.all([
      supabase.from('notification_candidates').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('notification_candidates').select('id', { count: 'exact', head: true }).eq('status', 'resolving'),
      supabase.from('notification_candidates').select('id', { count: 'exact', head: true }).eq('status', 'accepted'),
      supabase.from('notification_candidates').select('id', { count: 'exact', head: true }).eq('status', 'suppressed'),
      supabase.from('notification_candidates').select('id', { count: 'exact', head: true }).eq('status', 'deferred'),
      supabase.from('notification_candidates').select('id', { count: 'exact', head: true }).eq('status', 'expired'),
      supabase.from('notification_candidates').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
      supabase
        .from('notification_candidates')
        .select('id, user_id, event_type, event_id, event_instance, local_date, scheduled_for, expires_at, priority, title, status, decision_reason, created_at')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('notification_resolver_events')
        .select('id, candidate_id, user_id, event_type, decision, reason, policy_version, resolved_at')
        .order('resolved_at', { ascending: false })
        .limit(20),
    ]);

    // 2. Run read-only dry-run simulation on current pending queue
    const previewRun = await executeCandidateResolverPipeline({
      supabase,
      dryRun: true,
      batchLimit,
      eventType,
      forceIgnoreKillSwitch: true, // Show preview even if kill switch is active
    });

    const pipelineConfig = {
      globallyEnabled: isCandidateResolverGloballyEnabled(),
      modes: getAllPipelineModesSnapshot(),
    };

    const queueStats = {
      pending: pendingRes.count ?? 0,
      resolving: resolvingRes.count ?? 0,
      accepted: acceptedRes.count ?? 0,
      suppressed: suppressedRes.count ?? 0,
      deferred: deferredRes.count ?? 0,
      expired: expiredRes.count ?? 0,
      cancelled: cancelledRes.count ?? 0,
    };

    return NextResponse.json({
      pipelineConfig,
      queueStats,
      recentCandidates: recentCandidatesRes.data ?? [],
      recentAuditEvents: recentAuditRes.data ?? [],
      previewSimulation: previewRun,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch resolver preview' },
      { status: 500 }
    );
  }
}
