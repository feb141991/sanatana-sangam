import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  NotificationCandidate,
  NotificationResolverEventInsert,
} from '@/types/database';
import {
  resolveCandidates,
  type CandidateEvaluationItem,
  type DeliveryHistoryItem,
  type NotificationPriorityClass,
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
  const { data: scheduleHistory, error: histError } = await supabase
    .from('notification_schedule')
    .select('id, user_id, notification_type, send_at, status, notification_key, metadata')
    .in('user_id', userIds)
    .in('status', ['sent', 'sending', 'pending']);

  const historyItems: DeliveryHistoryItem[] = [];
  if (!histError && Array.isArray(scheduleHistory)) {
    for (const row of scheduleHistory) {
      const meta = (row.metadata ?? {}) as Record<string, any>;
      // Extract local_date from metadata or notification_key or send_at
      const localDate = meta.local_date ?? (row.notification_key?.split(':')[3] || row.send_at?.slice(0, 10));
      if (localDate && localDates.includes(localDate)) {
        historyItems.push({
          id: row.id,
          user_id: row.user_id,
          local_date: localDate,
          notification_type: row.notification_type,
          priority_class: meta.priority_class as NotificationPriorityClass | undefined,
          sent_at: row.send_at,
        });
      }
    }
  }

  // 5. Invoke pure central resolver
  const resolution: ResolutionResult = resolveCandidates({
    candidates: activeCandidates,
    history: historyItems,
    now,
    policyVersion: 'v1',
    allowDeferrals: true,
  });

  let promotedToScheduleCount = 0;
  let auditEventsRecorded = 0;

  // 6. Persist results (if not dry-run)
  if (!dryRun) {
    // a. Promote accepted candidates into notification_schedule (idempotent ON CONFLICT)
    if (resolution.accepted.length > 0) {
      const scheduleInserts = resolution.accepted.map((cand) => {
        const notificationKey = deriveCandidateNotificationKey(cand);
        return {
          user_id: cand.user_id,
          notification_type: cand.event_type,
          title: cand.title,
          body: cand.body,
          send_at: cand.scheduled_for,
          status: 'pending',
          notification_key: notificationKey,
          metadata: {
            ...(cand.metadata as Record<string, any> || {}),
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

      const { data: insertedSched, error: schedError } = await supabase
        .from('notification_schedule')
        .upsert(scheduleInserts, { onConflict: 'user_id,notification_key' })
        .select('id');

      if (!schedError && Array.isArray(insertedSched)) {
        promotedToScheduleCount = insertedSched.length;
      } else {
        // If upsert returned no rows due to ignoreDuplicates, count rows inserted/updated
        promotedToScheduleCount = scheduleInserts.length;
      }
    }

    // b. Update candidate statuses in notification_candidates
    for (const evaluation of resolution.evaluations) {
      await supabase
        .from('notification_candidates')
        .update({
          status: evaluation.decision,
          decision_reason: evaluation.reason,
          resolved_at: nowIso,
        })
        .eq('id', evaluation.candidate.id);
    }

    // c. Write audit events to notification_resolver_events
    if (resolution.auditEvents.length > 0) {
      const { data: insertedEvents, error: auditError } = await supabase
        .from('notification_resolver_events')
        .insert(resolution.auditEvents)
        .select('id');

      if (!auditError && Array.isArray(insertedEvents)) {
        auditEventsRecorded = insertedEvents.length;
      } else {
        auditEventsRecorded = resolution.auditEvents.length;
      }
    }

    // d. Retention cleanup if requested
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
