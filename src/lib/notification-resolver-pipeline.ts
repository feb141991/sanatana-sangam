import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
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
import { deriveCandidateNotificationKey, parseCandidateNotificationKey } from './notification-candidate-key';
import {
  isCandidateResolverGloballyEnabled,
  shouldProcessCandidateType,
} from './notification-candidate-pipeline-mode';
import { getLocalDateIso, resolveTimeZone } from './sacred-time';
import {
  canonicalNotificationBudgetType,
  NOTIFICATION_CADENCE_POLICY,
  type NotificationQuietHours,
} from './notification-cadence-policy';

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
  retryCount?: number;
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

function buildResolverSkippedResult(reason: string, retryCount = 0): ResolverPipelineRunResult {
  return {
    ok: true,
    skipped: true,
    skipReason: reason,
    retryCount,
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
  const { supabase, dryRun = false, forceIgnoreKillSwitch = false } = options;

  // Dry-run is read-only and does not claim candidates, so it needs no lease.
  // Disabled production runs also return without touching the database.
  if (dryRun || (!forceIgnoreKillSwitch && !isCandidateResolverGloballyEnabled())) {
    return executeCandidateResolverPipelineBody(options);
  }

  const lockOwnerId = randomUUID();
  const { data: acquired, error: acquireError } = await supabase.rpc(
    'try_acquire_notification_resolver_lock',
    { p_owner_id: lockOwnerId, p_lease_seconds: 300 }
  );
  if (acquireError) {
    throw new Error(`Could not acquire notification resolver lease: ${acquireError.message}`);
  }
  if (acquired !== true) {
    return buildResolverSkippedResult('resolver_run_in_progress');
  }

  try {
    return await executeCandidateResolverPipelineBody(options, lockOwnerId);
  } finally {
    try {
      const { error: releaseError } = await supabase.rpc(
        'release_notification_resolver_lock',
        { p_owner_id: lockOwnerId }
      );
      if (releaseError) {
        console.error('[notification-resolver] Failed to release run lease; it will expire automatically:', releaseError.message);
      }
    } catch (releaseError) {
      console.error(
        '[notification-resolver] Lease release request failed; it will expire automatically:',
        releaseError instanceof Error ? releaseError.message : String(releaseError)
      );
    }
  }
}

async function executeCandidateResolverPipelineBody(
  options: ResolverPipelineOptions,
  lockOwnerId?: string
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
  const candidateTimeZoneByUser = new Map<string, string>();
  for (const candidate of activeCandidates) {
    if (candidate.timezone && !candidateTimeZoneByUser.has(candidate.user_id)) {
      candidateTimeZoneByUser.set(candidate.user_id, candidate.timezone);
    }
  }

  // Use a generous UTC envelope around each local civil date. Local dates can
  // begin in UTC-12 and end in UTC+14; the extra margin also covers DST shifts.
  const sortedLocalDates = localDates.filter((date): date is string => /^\d{4}-\d{2}-\d{2}$/.test(date)).sort();
  const historyFromIso = sortedLocalDates.length
    ? new Date(Date.parse(`${sortedLocalDates[0]}T00:00:00.000Z`) - 14 * 60 * 60 * 1000).toISOString()
    : new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const historyToIso = sortedLocalDates.length
    ? new Date(Date.parse(`${sortedLocalDates[sortedLocalDates.length - 1]}T00:00:00.000Z`) + 38 * 60 * 60 * 1000).toISOString()
    : new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

  // Read schedule/bell history and the user's quiet-hour policy together. These
  // reads fail closed so missing policy data cannot accidentally create a burst.
  const [
    { data: scheduleHistory, error: scheduleHistoryError },
    { data: directHistory, error: directHistoryError },
    { data: profileRows, error: profileError },
  ] = await Promise.all([
    supabase
    .from('notification_schedule')
    .select('id, user_id, notification_type, send_at, status, notification_key, metadata')
    .in('user_id', userIds)
    .in('status', ['sent', 'sending', 'pending'])
    .gte('send_at', historyFromIso)
    .lt('send_at', historyToIso),
    supabase
      .from('notifications')
      .select('id, user_id, type, created_at, local_date, notification_key')
      .in('user_id', userIds)
      .in('local_date', localDates),
    supabase
      .from('profiles')
      .select('id, timezone, notification_quiet_hours_start, notification_quiet_hours_end')
      .in('id', userIds),
  ]);

  if (scheduleHistoryError || directHistoryError || profileError) {
    throw new Error(`Failed to load notification budget history/policy: ${scheduleHistoryError?.message ?? directHistoryError?.message ?? profileError?.message}`);
  }

  const quietHoursByUser: Record<string, NotificationQuietHours> = {};
  const timeZoneByUser = new Map(candidateTimeZoneByUser);
  if (Array.isArray(profileRows)) {
    for (const row of profileRows) {
      quietHoursByUser[row.id] = {
        startHour: row.notification_quiet_hours_start == null ? null : Number(row.notification_quiet_hours_start),
        endHour: row.notification_quiet_hours_end == null ? null : Number(row.notification_quiet_hours_end),
      };
      if (row.timezone) timeZoneByUser.set(row.id, row.timezone);
    }
  }
  const timeZonesByUser = Object.fromEntries(
    Array.from(timeZoneByUser, ([userId, timezone]) => [userId, resolveTimeZone(timezone)])
  );

  const isIsoLocalDate = (value: unknown): value is string =>
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

  const historyItems: DeliveryHistoryItem[] = [];
  if (Array.isArray(scheduleHistory)) {
    for (const row of scheduleHistory) {
      const meta = row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? row.metadata as Record<string, unknown>
        : {};
      // Metadata is authoritative. Candidate keys have different shapes for
      // generic reminders and observances; parse their semantic date before
      // falling back to a date segment or the user's local date.
      const localDateValue = meta.local_date;
      const keyLocalDate = row.notification_key
        ? parseCandidateNotificationKey(row.notification_key)?.local_date
          ?? row.notification_key.split(':').find((part: string) => isIsoLocalDate(part))
        : undefined;
      const rowTimeZone = typeof meta.timezone === 'string' ? meta.timezone : timeZoneByUser.get(row.user_id);
      const localDate = isIsoLocalDate(localDateValue)
        ? localDateValue
        : isIsoLocalDate(keyLocalDate)
          ? keyLocalDate
          : row.send_at && Number.isFinite(Date.parse(row.send_at))
            ? getLocalDateIso(new Date(row.send_at), resolveTimeZone(rowTimeZone))
            : null;
      if (localDate && localDates.includes(localDate)) {
        historyItems.push({
          id: row.id,
          user_id: row.user_id,
          local_date: localDate,
          notification_type: canonicalNotificationBudgetType(row.notification_type, row.notification_key),
          priority_class: resolvePriorityClassForEventType(canonicalNotificationBudgetType(row.notification_type, row.notification_key)),
          notification_key: row.notification_key,
          sent_at: row.send_at,
        });
      }
    }
  }
  if (Array.isArray(directHistory)) {
    for (const row of directHistory) {
      if (!row.local_date || !localDates.includes(row.local_date)) continue;
      const eventType = canonicalNotificationBudgetType(row.type, row.notification_key);
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
    policyVersion: NOTIFICATION_CADENCE_POLICY.version,
    // These candidate events are time-sensitive; late replay under a future
    // budget window would be misleading. Suppress at the budget boundary.
    allowDeferrals: false,
    quietHoursByUser,
    timeZonesByUser,
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

    if (lockOwnerId) {
      const { data: renewed, error: renewError } = await supabase.rpc(
        'try_acquire_notification_resolver_lock',
        { p_owner_id: lockOwnerId, p_lease_seconds: 300 }
      );
      if (renewError) {
        throw new Error(`Could not renew notification resolver lease: ${renewError.message}`);
      }
      if (renewed !== true) {
        const claimedIds = activeCandidates
          .map((candidate) => candidate.id)
          .filter((id): id is string => typeof id === 'string');
        if (claimedIds.length > 0) {
          const { error: requeueError } = await supabase
            .from('notification_candidates')
            .update({ status: 'pending', claimed_at: null, decision_reason: null, updated_at: nowIso })
            .in('id', claimedIds)
            .eq('status', 'resolving');
          if (requeueError) {
            throw new Error(`Resolver lease expired and claimed candidates could not be requeued: ${requeueError.message}`);
          }
        }
        return buildResolverSkippedResult('resolver_lease_expired_retry_next_run', claimedIds.length);
      }
    }

    // One transaction prevents partial schedule/candidate/audit state. Unique
    // conflicts are ignored in SQL, preserving the existing sent/terminal row.
    const { data: persistedResolution, error: persistError } = await supabase.rpc(
      lockOwnerId
        ? 'persist_notification_candidate_resolution_with_lock'
        : 'persist_notification_candidate_resolution',
      {
        ...(lockOwnerId ? { p_owner_id: lockOwnerId } : {}),
        p_schedule_rows: scheduleRows,
        p_candidate_updates: candidateUpdates,
        p_audit_events: resolution.auditEvents,
      }
    );
    if (persistError) {
      if (
        persistError.message.includes('notification_cadence_conflict') ||
        persistError.message.includes('notification_cadence_candidate_reservation_mismatch') ||
        persistError.message.includes('notification_resolver_lock_lost')
      ) {
        const claimedIds = activeCandidates
          .map((candidate) => candidate.id)
          .filter((id): id is string => typeof id === 'string');
        if (claimedIds.length > 0) {
          const { error: requeueError } = await supabase
            .from('notification_candidates')
            .update({ status: 'pending', claimed_at: null, decision_reason: null, updated_at: nowIso })
            .in('id', claimedIds)
            .eq('status', 'resolving');
          if (requeueError) {
            throw new Error(
              `Cadence conflict occurred and claimed candidates could not be requeued: ${requeueError.message}`
            );
          }
        }
        const retryReason = persistError.message.includes('notification_cadence_conflict')
          ? 'cadence_history_changed_retry_next_run'
          : persistError.message.includes('notification_cadence_candidate_reservation_mismatch')
            ? 'candidate_schedule_not_reserved_retry_next_run'
            : 'resolver_lease_expired_retry_next_run';
        return buildResolverSkippedResult(retryReason, claimedIds.length);
      }
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
