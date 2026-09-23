import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  NotificationCandidate,
} from '@/types/database';
import {
  resolveCandidates,
  type CandidateEvaluationItem,
  type DeliveryHistoryItem,
  resolvePriorityClassForEventType,
  type ResolutionResult,
} from './notification-resolver';
import { deriveCandidateNotificationKey } from './notification-candidate-key';
import {
  isCandidateResolverGloballyEnabled,
  shouldProcessCandidateType,
} from './notification-candidate-pipeline-mode';

export interface ResolverPipelineOptions {
  supabase: SupabaseClient;
  now?: Date;
  batchLimit?: number;
  leaseMinutes?: number;
  dryRun?: boolean;
  eventType?: string;
  forceIgnoreKillSwitch?: boolean;
  runRetentionCleanup?: boolean;
  retentionDays?: number;
}

export interface ResolverPipelineRunResult {
  ok: boolean;
  skipped?: boolean;
  skipReason?: string;
  dryRun: boolean;
  candidatesClaimed: number;
  acceptedCount: number;
  suppressedCount: number;
  deferredCount: number;
  expiredCount: number;
  cancelledCount: number;
  evaluations: CandidateEvaluationItem[];
  promotedToScheduleCount: number;
  auditEventsRecorded: number;
  retention?: {
    candidatesPurged: number;
    eventsPurged: number;
  };
  summary: ResolutionResult['summary'];
  error?: string;
}

/**
 * Retention cleanup for terminal candidates and audit log data.
 * Documented retention period: 90 days (matches notification_schedule operational retention).
 */
export async function cleanupNotificationCandidatesRetention(
  supabase: SupabaseClient,
  retentionDays: number = 90
): Promise<{ candidatesPurged: number; eventsPurged: number }> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

  // 1. Purge terminal candidates (cascade will delete corresponding resolver events if any, but we also purge orphaned events)
  const { data: candData, error: candError } = await supabase
    .from('notification_candidates')
    .delete()
    .in('status', ['accepted', 'suppressed', 'expired', 'cancelled'])
    .lte('created_at', cutoff)
    .select('id');

  const candidatesPurged = !candError && Array.isArray(candData) ? candData.length : 0;

  // 2. Purge resolver audit events
  const { data: eventData, error: eventError } = await supabase
    .from('notification_resolver_events')
    .delete()
    .lte('created_at', cutoff)
    .select('id');

  const eventsPurged = !eventError && Array.isArray(eventData) ? eventData.length : 0;

  return { candidatesPurged, eventsPurged };
}

/**
 * Main execution engine for central notification candidate resolution and schedule promotion.
 */
export async function executeCandidateResolverPipeline(
  options: ResolverPipelineOptions
): Promise<ResolverPipelineRunResult> {
  const {
    supabase,
    now = new Date(),
    batchLimit = 200,
    leaseMinutes = 10,
    dryRun = false,
    eventType,
    forceIgnoreKillSwitch = false,
    runRetentionCleanup = false,
    retentionDays = 90,
  } = options;

  // 1. Check global kill switch
  if (!dryRun && !forceIgnoreKillSwitch && !isCandidateResolverGloballyEnabled()) {
    return {
      ok: true,
      skipped: true,
      skipReason: 'resolver_globally_disabled',
      dryRun: false,
      candidatesClaimed: 0,
      acceptedCount: 0,
      suppressedCount: 0,
      deferredCount: 0,
      expiredCount: 0,
      cancelledCount: 0,
      evaluations: [],
      promotedToScheduleCount: 0,
      auditEventsRecorded: 0,
      summary: {
        totalEvaluated: 0,
        acceptedCount: 0,
        suppressedCount: 0,
        deferredCount: 0,
        expiredCount: 0,
        cancelledCount: 0,
        reasons: {},
      },
    };
  }

  const nowIso = now.toISOString();
  const tenMinsLaterIso = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
  const leaseThresholdIso = new Date(now.getTime() - leaseMinutes * 60 * 1000).toISOString();

  let claimedCandidates: NotificationCandidate[] = [];

  // 2. Claim pending candidates
  if (dryRun) {
    // Read-only candidate query for preview mode
    let query = supabase
      .from('notification_candidates')
      .select('*')
      .in('status', ['pending', 'resolving'])
      .lte('scheduled_for', tenMinsLaterIso)
      .order('priority', { ascending: true })
      .order('scheduled_for', { ascending: true })
      .limit(batchLimit);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to query candidates in preview mode: ${error.message}`);
    }
    claimedCandidates = (data as NotificationCandidate[]) ?? [];
  } else {
    // Attempt PostgreSQL RPC claim first (FOR UPDATE SKIP LOCKED)
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'claim_pending_notification_candidates',
      {
        p_batch_limit: batchLimit,
        p_lease_minutes: leaseMinutes,
        p_event_type: eventType ?? null,
      }
    );

    if (!rpcError && Array.isArray(rpcData)) {
      claimedCandidates = rpcData as NotificationCandidate[];
    } else {
      // Fallback: JS/PostgREST atomic claim
      // a) Expire overdue candidates
      await supabase
        .from('notification_candidates')
        .update({
          status: 'expired',
          decision_reason: 'window_expired',
          resolved_at: nowIso,
        })
        .eq('status', 'pending')
        .lte('expires_at', nowIso);

      // b) Select pending due or stale resolving candidates
      let selectQuery = supabase
        .from('notification_candidates')
        .select('*')
        .or(
          `and(status.eq.pending,scheduled_for.lte.${tenMinsLaterIso},expires_at.gt.${nowIso}),and(status.eq.resolving,claimed_at.lte.${leaseThresholdIso})`
        )
        .order('priority', { ascending: true })
        .order('scheduled_for', { ascending: true })
        .limit(batchLimit);

      if (eventType) {
        selectQuery = selectQuery.eq('event_type', eventType);
      }

      const { data: candidatesToLock } = await selectQuery;

      if (candidatesToLock && candidatesToLock.length > 0) {
        const ids = candidatesToLock.map((c: any) => c.id);
        const { data: lockedData } = await supabase
          .from('notification_candidates')
          .update({
            status: 'resolving',
            claimed_at: nowIso,
          })
          .in('id', ids)
          .select('*');

        claimedCandidates = (lockedData as NotificationCandidate[]) ?? [];
      }
    }
  }

  if (claimedCandidates.length === 0) {
    let retentionResult;
    if (!dryRun && runRetentionCleanup) {
      retentionResult = await cleanupNotificationCandidatesRetention(supabase, retentionDays);
    }

    return {
      ok: true,
      dryRun,
      candidatesClaimed: 0,
      acceptedCount: 0,
      suppressedCount: 0,
      deferredCount: 0,
      expiredCount: 0,
      cancelledCount: 0,
      evaluations: [],
      promotedToScheduleCount: 0,
      auditEventsRecorded: 0,
      retention: retentionResult,
      summary: {
        totalEvaluated: 0,
        acceptedCount: 0,
        suppressedCount: 0,
        deferredCount: 0,
        expiredCount: 0,
        cancelledCount: 0,
        reasons: {},
      },
    };
  }

  // 3. Filter candidates by per-type kill switch (unless preview/forced)
  const activeCandidates: NotificationCandidate[] = [];
  const skippedByTypeCandidates: NotificationCandidate[] = [];

  for (const cand of claimedCandidates) {
    if (forceIgnoreKillSwitch || dryRun || shouldProcessCandidateType(cand.event_type)) {
      activeCandidates.push(cand);
    } else {
      skippedByTypeCandidates.push(cand);
    }
  }

  // Reset skipped candidates back to pending if they were claimed
  if (!dryRun && skippedByTypeCandidates.length > 0) {
    await supabase
      .from('notification_candidates')
      .update({ status: 'pending', claimed_at: null })
      .in(
        'id',
        skippedByTypeCandidates.map((c) => c.id)
      );
  }

  if (activeCandidates.length === 0) {
    return {
      ok: true,
      dryRun,
      candidatesClaimed: claimedCandidates.length,
      acceptedCount: 0,
      suppressedCount: 0,
      deferredCount: 0,
      expiredCount: 0,
      cancelledCount: 0,
      evaluations: [],
      promotedToScheduleCount: 0,
      auditEventsRecorded: 0,
      summary: {
        totalEvaluated: 0,
        acceptedCount: 0,
        suppressedCount: 0,
        deferredCount: 0,
        expiredCount: 0,
        cancelledCount: 0,
        reasons: { type_disabled_by_policy: skippedByTypeCandidates.length },
      },
    };
  }

  // 4. Fetch delivery history for candidate users to check existing engagement budget consumption
  const userIds = Array.from(new Set(activeCandidates.map((c) => c.user_id)));
  const localDates = Array.from(new Set(activeCandidates.map((c) => c.local_date)));

  // Query notification_schedule for existing sent or pending records for these devotees
  const [{ data: scheduleHistory, error: scheduleHistoryError }, { data: directHistory, error: directHistoryError }] = await Promise.all([
    supabase
    .from('notification_schedule')
    .select('id, user_id, notification_type, send_at, status, notification_key, metadata')
    .in('user_id', userIds)
    .in('status', ['sent', 'sending', 'pending']),
    supabase
      .from('notifications')
      .select('id, user_id, type, created_at, local_date, notification_key')
      .in('user_id', userIds)
      .in('local_date', localDates),
  ]);

  if (scheduleHistoryError || directHistoryError) {
    throw new Error(`Failed to load notification budget history: ${scheduleHistoryError?.message ?? directHistoryError?.message}`);
  }

  const historyItems: DeliveryHistoryItem[] = [];
  if (Array.isArray(scheduleHistory)) {
    for (const row of scheduleHistory) {
      const meta = row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? row.metadata as Record<string, unknown>
        : {};
      // Extract local_date from metadata or notification_key or send_at
      const localDateValue = meta.local_date;
      const localDate = typeof localDateValue === 'string'
        ? localDateValue
        : (row.notification_key?.split(':')[3] || row.send_at?.slice(0, 10));
      if (localDate && localDates.includes(localDate)) {
        historyItems.push({
          id: row.id,
          user_id: row.user_id,
          local_date: localDate,
          notification_type: row.notification_type,
          priority_class: resolvePriorityClassForEventType(row.notification_type),
          notification_key: row.notification_key,
          sent_at: row.send_at,
        });
      }
    }
  }
  if (Array.isArray(directHistory)) {
    for (const row of directHistory) {
      if (!row.local_date || !localDates.includes(row.local_date)) continue;
      const eventType = row.type === 'festival' ? 'festival' : row.type === 'streak' ? 'streak' : row.type;
      historyItems.push({
        id: row.id,
        user_id: row.user_id,
        local_date: row.local_date,
        notification_type: row.type,
        priority_class: resolvePriorityClassForEventType(eventType),
        notification_key: row.notification_key,
        sent_at: row.created_at,
      });
    }
  }

  // 5. Invoke pure central resolver
  const resolution: ResolutionResult = resolveCandidates({
    candidates: activeCandidates,
    history: historyItems,
    now,
    policyVersion: 'v1',
    // These candidate events are time-sensitive; late replay under a future
    // budget window would be misleading. Suppress at the budget boundary.
    allowDeferrals: false,
  });

  let promotedToScheduleCount = 0;
  let auditEventsRecorded = 0;

  // 6. Persist results (if not dry-run)
  if (!dryRun) {
    const scheduleRows = resolution.accepted.map((cand) => {
      const notificationKey = deriveCandidateNotificationKey(cand);
      return {
        user_id: cand.user_id,
        notification_type: cand.event_type,
        title: cand.title,
        body: cand.body,
        send_at: cand.scheduled_for,
        notification_key: notificationKey,
        metadata: {
          ...(cand.metadata as Record<string, unknown> || {}),
          action_url: cand.action_url,
          candidate_id: cand.id,
          priority: cand.priority,
          language: cand.language,
          timezone: cand.timezone,
          tradition: cand.tradition,
          calendar_profile: cand.calendar_profile,
          source_status: cand.source_status,
          source_refs: cand.source_refs,
          local_date: cand.local_date,
          promoted_by: 'central_notification_resolver',
          promoted_at: nowIso,
        },
      };
    });
    const candidateUpdates = resolution.evaluations.map((evaluation) => ({
      candidate_id: evaluation.candidate.id,
      status: evaluation.decision,
      reason: evaluation.reason,
      resolved_at: nowIso,
    }));

    // One transaction prevents partial schedule/candidate/audit state. Unique
    // conflicts are ignored in SQL, preserving the existing sent/terminal row.
    const { data: persistedResolution, error: persistError } = await supabase.rpc(
      'persist_notification_candidate_resolution',
      {
        p_schedule_rows: scheduleRows,
        p_candidate_updates: candidateUpdates,
        p_audit_events: resolution.auditEvents,
      }
    );
    if (persistError) {
      throw new Error(`Failed to persist candidate resolution atomically: ${persistError.message}`);
    }
    const persistence = Array.isArray(persistedResolution) ? persistedResolution[0] : persistedResolution;
    if (!persistence || typeof persistence !== 'object') {
      throw new Error('Candidate resolution persistence returned no counts');
    }
    promotedToScheduleCount = Number(persistence.promoted_count ?? 0);
    auditEventsRecorded = Number(persistence.audit_count ?? 0);

    // Retention cleanup if requested
    if (runRetentionCleanup) {
      await cleanupNotificationCandidatesRetention(supabase, retentionDays);
    }
  }

  return {
    ok: true,
    dryRun,
    candidatesClaimed: claimedCandidates.length,
    acceptedCount: resolution.accepted.length,
    suppressedCount: resolution.suppressed.length,
    deferredCount: resolution.deferred.length,
    expiredCount: resolution.expired.length,
    cancelledCount: resolution.cancelled.length,
    evaluations: resolution.evaluations,
    promotedToScheduleCount,
    auditEventsRecorded,
    summary: resolution.summary,
  };
}
