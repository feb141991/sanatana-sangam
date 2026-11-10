import type {
  NotificationCandidate,
  NotificationResolverEventInsert,
} from '@/types/database';
import {
  cadenceBlockKeyForClass,
  canonicalNotificationBudgetType,
  classifyNotificationCadence,
  findNextCadenceSlot,
  NOTIFICATION_CADENCE_POLICY,
  type CadenceBlockKey,
  type CountedCadenceClass,
  type NotificationQuietHours,
} from './notification-cadence-policy';
import { isValidTimeZone } from './sacred-time';

export interface NotificationCandidateRow {
  id?: string;
  user_id: string;
  candidate_key?: string;
  notification_key?: string;
  event_type: string;
  event_id?: string;
  event_instance?: string;
  event_date?: string;
  local_date?: string;
  audience_variant?: string;
  priority?: number;
  priority_rank?: number;
  numeric_priority?: number;
  priority_score?: number;
  priority_class?: NotificationPriorityClass;
  title: string;
  body: string;
  action_url?: string;
  channel?: string;
  scheduled_for: string;
  expires_at?: string;
  sound?: string;
  status?: string;
  category?: string;
  language?: string;
  timezone?: string;
  tradition?: string | null;
  calendar_profile?: string | null;
  source_status?: string;
  source_refs?: any;
  data?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
}

export type NotificationPriorityClass =
  | 'transactional_safety'     // Priority 1: Security, account, moderation, transactional safety (outside budget)
  | 'explicit_user_requested'  // Priority 2: Explicit user-requested observance or ritual reminder (outside budget)
  | 'approved_ritual_window'   // Priority 3: Approved time-sensitive ritual window (outside budget)
  | 'reviewed_observance'      // Priority 4: Reviewed same-day/lead observance (outside budget / never budget-suppressed)
  | 'devotional_engagement'    // Priority 5: Devotional engagement (subject to shared engagement budget)
  | 'routine_engagement';      // Priority 6: Routine checkin / streak (subject to shared engagement budget)

export type ResolverDecision = 'accepted' | 'suppressed' | 'expired' | 'cancelled' | 'deferred';

export const PRIORITY_CLASS_ORDER: Record<NotificationPriorityClass, number> = {
  transactional_safety: 1,
  explicit_user_requested: 2,
  approved_ritual_window: 3,
  reviewed_observance: 4,
  devotional_engagement: 5,
  routine_engagement: 6,
};

export type DeliveryHistoryItem = {
  id: string;
  user_id: string;
  local_date: string;
  notification_type: string;
  priority_class?: NotificationPriorityClass;
  notification_key?: string | null;
  sent_at: string;
};

export type CandidateEvaluationItem = {
  candidate: NotificationCandidate;
  decision: ResolverDecision;
  reason: string;
  priorityClass: NotificationPriorityClass;
  winningCandidateId?: string | null;
};

export type ResolutionResult = {
  accepted: NotificationCandidate[];
  suppressed: NotificationCandidate[];
  deferred: NotificationCandidate[];
  expired: NotificationCandidate[];
  cancelled: NotificationCandidate[];
  evaluations: CandidateEvaluationItem[];
  auditEvents: NotificationResolverEventInsert[];
  summary: {
    totalEvaluated: number;
    acceptedCount: number;
    suppressedCount: number;
    deferredCount: number;
    expiredCount: number;
    cancelledCount: number;
    reasons: Record<string, number>;
  };
};

/**
 * Resolve priority only from the server-owned event type. Candidate metadata
 * is producer-supplied and must never grant a budget exemption.
 */
export function resolvePriorityClass(candidate: NotificationCandidate): NotificationPriorityClass {
  return resolvePriorityClassForEventType(candidate.event_type);
}

export function resolvePriorityClassForEventType(rawEventType: string): NotificationPriorityClass {
  const eventType = canonicalNotificationBudgetType(rawEventType);

  // 1. Transactional / Account safety
  if (['security', 'account', 'moderation', 'auth', 'transactional', 'critical_alert'].includes(eventType)) {
    return 'transactional_safety';
  }

  // 2. Explicit user requested
  if (['user_reminder', 'custom_reminder', 'explicit_request', 'user_sadhana_reminder', 'sankalpa_midpoint', 'japa', 'sanskar_milestone', 'family_remembrance'].includes(eventType)) {
    return 'explicit_user_requested';
  }

  // 3. Approved ritual window
  if (['brahma_muhurta', 'sandhya', 'nitya_madhyahn', 'nitya_sandhya', 'ritual_window', 'pradosha_window', 'pradosha_kala', 'ekadashi_parana', 'nitya', 'aarti'].includes(eventType)) {
    return 'approved_ritual_window';
  }

  // 4. Reviewed observance
  if (['observance', 'festival', 'vrat', 'tithi', 'observance_series', 'sankranti'].includes(eventType)) {
    return 'reviewed_observance';
  }

  // 6. Routine engagement
  if (['routine_engagement', 'mood', 'shloka', 'sattvic', 'dharm_veer', 'quiz', 'daily_checkin'].includes(eventType)) {
    return 'routine_engagement';
  }

  // 5. Default devotional engagement
  return 'devotional_engagement';
}

/**
 * Returns whether a priority class is completely exempt from the devotional engagement budget.
 */
export function isBudgetExempt(priorityClass: NotificationPriorityClass): boolean {
  return (
    priorityClass === 'transactional_safety' ||
    priorityClass === 'explicit_user_requested' ||
    priorityClass === 'approved_ritual_window' ||
    priorityClass === 'reviewed_observance'
  );
}

/**
 * Deterministically resolves a set of notification candidates against user history,
 * per-class daily allowances, delivery cadence, priority hierarchies, and expiration windows.
 *
 * Rules (engagement-cadence-v3, "one other nudge a day"):
 * 1. Exempt candidates -- security, explicit user reminders, ritual windows, reviewed
 *    observances -- are never counted and never suppressed by engagement limits.
 * 2. Every other candidate belongs to one counted class and is admitted only while its class
 *    has room: shloka (1 per user/local date), learning (1, shared by quiz and dharm_veer) and
 *    other (1, shared by every remaining type). Shloka and the learning slot are therefore
 *    never crowded out by other nudges. An outer ceiling caps the three together; it is a
 *    backstop, not a target. The database enforces the same numbers.
 * 3. Flexible engagement pushes remain at their requested time unless that would
 *    create a burst, fall in quiet hours, or be outside the daytime delivery window.
 * 4. Flexible engagement pushes are spaced at least three hours apart.
 * 5. Candidates past expires_at are marked 'expired'.
 * 6. Historical deliveries cannot be displaced retroactively.
 */
export function resolveCandidates(input: {
  candidates: NotificationCandidate[];
  history?: DeliveryHistoryItem[];
  now: Date;
  policyVersion?: string;
  allowDeferrals?: boolean;
  quietHoursByUser?: Record<string, NotificationQuietHours>;
  timeZonesByUser?: Record<string, string>;
}): ResolutionResult {
  const {
    candidates,
    history = [],
    now,
    policyVersion = NOTIFICATION_CADENCE_POLICY.version,
    allowDeferrals = true,
    quietHoursByUser = {},
    timeZonesByUser = {},
  } = input;

  const accepted: NotificationCandidate[] = [];
  const suppressed: NotificationCandidate[] = [];
  const deferred: NotificationCandidate[] = [];
  const expired: NotificationCandidate[] = [];
  const cancelled: NotificationCandidate[] = [];
  const evaluations: CandidateEvaluationItem[] = [];
  const auditEvents: NotificationResolverEventInsert[] = [];
  const reasons: Record<string, number> = {};

  const recordReason = (reason: string) => {
    reasons[reason] = (reasons[reason] || 0) + 1;
  };

  type ClassCounts = { total: number; byClass: Record<CountedCadenceClass, number> };
  const emptyCounts = (): ClassCounts => ({ total: 0, byClass: { shloka: 0, learning: 0, other: 0 } });
  const copyCounts = (counts: ClassCounts): ClassCounts => ({ total: counts.total, byClass: { ...counts.byClass } });

  // 1. Count all non-exempt history by class and retain delivery instants for cadence.
  const historyCountsByGroup = new Map<string, ClassCounts>();
  const historyDeliveryInstantsByGroup = new Map<string, Date[]>();
  const seenHistoryNotificationKeys = new Set<string>();

  for (const item of history) {
    if (item.notification_key) {
      const identity = `${item.user_id}::${item.notification_key}`;
      if (seenHistoryNotificationKeys.has(identity)) continue;
      seenHistoryNotificationKeys.add(identity);
    }
    const groupKey = `${item.user_id}::${item.local_date}`;
    // Re-derive the class from the trusted type AND key (a generic bell row carries its real type
    // in its key). A stale/manual priority_class on a legacy row must not make engagement
    // disappear from the daily allowances, and a bell row must not be counted differently here
    // than the database counts it.
    const cadenceClass = classifyNotificationCadence(item.notification_type, item.notification_key);

    if (cadenceClass !== 'exempt') {
      const counts = historyCountsByGroup.get(groupKey) ?? emptyCounts();
      counts.total += 1;
      counts.byClass[cadenceClass] += 1;
      historyCountsByGroup.set(groupKey, counts);
    }

    const pClass = resolvePriorityClassForEventType(
      canonicalNotificationBudgetType(item.notification_type, item.notification_key),
    );
    if (pClass !== 'transactional_safety') {
      const instant = new Date(item.sent_at);
      if (Number.isFinite(instant.getTime())) {
        const existing = historyDeliveryInstantsByGroup.get(groupKey) ?? [];
        existing.push(instant);
        historyDeliveryInstantsByGroup.set(groupKey, existing);
      }
    }
  }

  // 2. Group candidates by user_id and local_date
  const candidatesByGroup = new Map<string, NotificationCandidate[]>();
  for (const cand of candidates) {
    const groupKey = `${cand.user_id}::${cand.local_date}`;
    if (!candidatesByGroup.has(groupKey)) candidatesByGroup.set(groupKey, []);
    candidatesByGroup.get(groupKey)!.push(cand);
  }

  // 3. Resolve each user/local-day group. Capacity is selected by priority;
  // accepted times are then assigned chronologically so a later high-priority
  // reminder cannot push an earlier one past its window.
  for (const [groupKey, groupCandidates] of candidatesByGroup) {
    const historyCounts = historyCountsByGroup.get(groupKey) ?? emptyCounts();
    // `reserved` includes provisional reservations for candidates selected but not yet given a slot.
    const reserved = copyCounts(historyCounts);
    // `acceptedCounts` is history plus candidates actually accepted so far (for the audit trail).
    const acceptedCounts = copyCounts(historyCounts);
    const groupUserId = groupCandidates[0]?.user_id;
    const blockedInstants = [...(historyDeliveryInstantsByGroup.get(groupKey) ?? [])];

    const blockKeyFor = (cadenceClass: CountedCadenceClass): CadenceBlockKey | null => {
      if (reserved.total >= NOTIFICATION_CADENCE_POLICY.dailyCeiling) return 'daily_ceiling';
      if (reserved.byClass[cadenceClass] >= NOTIFICATION_CADENCE_POLICY.classLimits[cadenceClass]) {
        return cadenceBlockKeyForClass(cadenceClass);
      }
      return null;
    };
    const reserve = (cadenceClass: CountedCadenceClass) => {
      reserved.total += 1;
      reserved.byClass[cadenceClass] += 1;
    };
    const release = (cadenceClass: CountedCadenceClass) => {
      reserved.total = Math.max(0, reserved.total - 1);
      reserved.byClass[cadenceClass] = Math.max(0, reserved.byClass[cadenceClass] - 1);
    };

    // Filter out pre-terminal candidates (cancelled / expired) first
    const competingCandidates: Array<{
      candidate: NotificationCandidate;
      priorityClass: NotificationPriorityClass;
      cadenceClass: ReturnType<typeof classifyNotificationCadence>;
      scheduledInstant: Date;
      expiresInstant: Date;
    }> = [];

    for (const candidate of groupCandidates) {
      if (candidate.status === 'cancelled') {
        cancelled.push(candidate);
        evaluations.push({
          candidate,
          decision: 'cancelled',
          reason: 'candidate_status_cancelled',
          priorityClass: resolvePriorityClass(candidate),
        });
        auditEvents.push({
          candidate_id: candidate.id,
          user_id: candidate.user_id,
          event_type: candidate.event_type,
          decision: 'cancelled',
          reason: 'candidate_status_cancelled',
          policy_version: policyVersion,
          resolved_at: now.toISOString(),
          metadata: { local_date: candidate.local_date },
        });
        recordReason('candidate_status_cancelled');
        continue;
      }

      const scheduledInstant = new Date(candidate.scheduled_for);
      const expiresInstant = new Date(candidate.expires_at);

      if (now.getTime() >= expiresInstant.getTime()) {
        expired.push(candidate);
        evaluations.push({
          candidate,
          decision: 'expired',
          reason: 'window_expired',
          priorityClass: resolvePriorityClass(candidate),
        });
        auditEvents.push({
          candidate_id: candidate.id,
          user_id: candidate.user_id,
          event_type: candidate.event_type,
          decision: 'expired',
          reason: 'window_expired',
          policy_version: policyVersion,
          resolved_at: now.toISOString(),
          metadata: { local_date: candidate.local_date, expires_at: candidate.expires_at },
        });
        recordReason('window_expired');
        continue;
      }

      competingCandidates.push({
        candidate,
        priorityClass: resolvePriorityClass(candidate),
        cadenceClass: classifyNotificationCadence(candidate.event_type),
        scheduledInstant,
        expiresInstant,
      });
    }

    // Sort competing candidates:
    // 1. Priority class ascending (1 is highest, 6 is lowest)
    // 2. Numeric priority ascending (e.g. 10 before 50)
    // 3. Scheduled time ascending (earlier scheduled time first)
    competingCandidates.sort((a, b) => {
      const classDiff = PRIORITY_CLASS_ORDER[a.priorityClass] - PRIORITY_CLASS_ORDER[b.priorityClass];
      if (classDiff !== 0) return classDiff;

      const priorityDiff = a.candidate.priority - b.candidate.priority;
      if (priorityDiff !== 0) return priorityDiff;

      return a.scheduledInstant.getTime() - b.scheduledInstant.getTime();
    });

    let winningEngagementId: string | null = null;

    type Competing = typeof competingCandidates[number];
    const budgetedCandidates: Competing[] = [];

    // Exempt, time-sensitive candidates keep their producer's exact slot and
    // block nearby flexible engagement from clustering around them.
    for (const item of competingCandidates) {
      const { candidate, priorityClass, scheduledInstant } = item;
      if (item.cadenceClass === 'exempt') {
        accepted.push(candidate);
        evaluations.push({
          candidate,
          decision: 'accepted',
          reason: 'budget_exempt_priority',
          priorityClass,
        });
        auditEvents.push({
          candidate_id: candidate.id,
          user_id: candidate.user_id,
          event_type: candidate.event_type,
          decision: 'accepted',
          reason: 'budget_exempt_priority',
          policy_version: policyVersion,
          resolved_at: now.toISOString(),
          metadata: { priority_class: priorityClass, budget_exempt: true, scheduled_for: candidate.scheduled_for },
        });
        if (priorityClass !== 'transactional_safety' && Number.isFinite(scheduledInstant.getTime())) {
          blockedInstants.push(scheduledInstant);
        }
        recordReason('budget_exempt_priority');
      } else {
        budgetedCandidates.push(item);
      }
    }

    // Select budgeted candidates in the established priority order, each against its own class
    // allowance and the shared outer ceiling.
    const selectedForCadence: Competing[] = [];
    const capacityLimitedCandidates: Competing[] = [];
    for (const item of budgetedCandidates) {
      const cadenceClass = item.cadenceClass as CountedCadenceClass;
      if (blockKeyFor(cadenceClass)) {
        capacityLimitedCandidates.push(item);
        continue;
      }
      reserve(cadenceClass);
      selectedForCadence.push(item);
    }

    // Allocate slots from earliest requested time to latest, keeping as close
    // as possible to each producer's preferred local time.
    selectedForCadence.sort((a, b) => {
      const timeDiff = a.scheduledInstant.getTime() - b.scheduledInstant.getTime();
      if (timeDiff !== 0) return timeDiff;
      const priorityDiff = PRIORITY_CLASS_ORDER[a.priorityClass] - PRIORITY_CLASS_ORDER[b.priorityClass];
      if (priorityDiff !== 0) return priorityDiff;
      return a.candidate.priority - b.candidate.priority;
    });

    const acceptAtCadenceSlot = (item: Competing): boolean => {
      const { candidate, priorityClass } = item;
      const cadenceClass = item.cadenceClass as CountedCadenceClass;
      const cadenceSlot = findNextCadenceSlot({
        scheduledFor: candidate.scheduled_for,
        expiresAt: candidate.expires_at,
        localDate: candidate.local_date,
        timezone: candidate.timezone && isValidTimeZone(candidate.timezone)
          ? candidate.timezone
          : (groupUserId ? timeZonesByUser[groupUserId] : candidate.timezone),
        now,
        quietHours: groupUserId ? quietHoursByUser[groupUserId] : undefined,
        blockedInstants,
      });

      if (!cadenceSlot) {
        const reason = 'no_safe_cadence_slot';
        suppressed.push(candidate);
        evaluations.push({ candidate, decision: 'suppressed', reason, priorityClass });
        auditEvents.push({
          candidate_id: candidate.id,
          user_id: candidate.user_id,
          event_type: candidate.event_type,
          decision: 'suppressed',
          reason,
          policy_version: policyVersion,
          resolved_at: now.toISOString(),
          metadata: {
            priority_class: priorityClass,
            original_scheduled_for: candidate.scheduled_for,
            expires_at: candidate.expires_at,
            min_spacing_minutes: NOTIFICATION_CADENCE_POLICY.minSpacingMinutes,
          },
        });
        recordReason(reason);
        return false;
      }

      const deliveryCadence = {
        policy_version: NOTIFICATION_CADENCE_POLICY.version,
        original_scheduled_for: candidate.scheduled_for,
        scheduled_for: cadenceSlot.scheduledFor.toISOString(),
        delay_minutes: cadenceSlot.delayMinutes,
        min_spacing_minutes: NOTIFICATION_CADENCE_POLICY.minSpacingMinutes,
      };
      const acceptedCandidate: NotificationCandidate = cadenceSlot.delayMinutes > 0
        ? {
            ...candidate,
            scheduled_for: cadenceSlot.scheduledFor.toISOString(),
            metadata: {
              ...(candidate.metadata && typeof candidate.metadata === 'object' && !Array.isArray(candidate.metadata)
                ? candidate.metadata
                : {}),
              delivery_cadence: deliveryCadence,
            },
          }
        : candidate;

      accepted.push(acceptedCandidate);
      winningEngagementId ??= candidate.id ?? null;
      acceptedCounts.total += 1;
      acceptedCounts.byClass[cadenceClass] += 1;
      blockedInstants.push(cadenceSlot.scheduledFor);

      const reason = cadenceSlot.delayMinutes > 0
        ? 'accepted_after_cadence_spacing'
        : priorityClass === 'routine_engagement'
          ? 'routine_engagement_accepted'
          : 'devotional_engagement_accepted';
      evaluations.push({ candidate, decision: 'accepted', reason, priorityClass, winningCandidateId: winningEngagementId });
      auditEvents.push({
        candidate_id: candidate.id,
        user_id: candidate.user_id,
        event_type: candidate.event_type,
        decision: 'accepted',
        reason,
        policy_version: policyVersion,
        resolved_at: now.toISOString(),
        metadata: {
          priority_class: priorityClass,
          budgeted_count: acceptedCounts.total,
          daily_ceiling: NOTIFICATION_CADENCE_POLICY.dailyCeiling,
          cadence_class: cadenceClass,
          class_count: acceptedCounts.byClass[cadenceClass],
          class_limit: NOTIFICATION_CADENCE_POLICY.classLimits[cadenceClass],
          delivery_cadence: deliveryCadence,
        },
      });
      recordReason(reason);
      return true;
    };

    for (const item of selectedForCadence) {
      if (acceptAtCadenceSlot(item)) continue;

      // A selected candidate that has no safe same-day slot did not consume
      // capacity. Release its provisional reservation so a lower-priority
      // candidate can use the actual free slot below.
      release(item.cadenceClass as CountedCadenceClass);
    }

    // Capacity blocked only candidates provisionally while cadence assignment
    // was pending. Backfill any capacity released by a candidate with no safe
    // slot, preserving the original priority order and every shared limit.
    for (const item of capacityLimitedCandidates) {
      const { candidate, priorityClass } = item;
      const cadenceClass = item.cadenceClass as CountedCadenceClass;
      const canDefer = allowDeferrals
        && item.scheduledInstant.getTime() < item.expiresInstant.getTime()
        && now.getTime() < item.expiresInstant.getTime();
      const blockKey = blockKeyFor(cadenceClass);

      if (blockKey) {
        const reason = `${blockKey}_${canDefer ? 'deferrable' : 'reached'}`;
        const decision = canDefer ? 'deferred' : 'suppressed';
        (canDefer ? deferred : suppressed).push(candidate);
        evaluations.push({ candidate, decision, reason, priorityClass, winningCandidateId: winningEngagementId });
        auditEvents.push({
          candidate_id: candidate.id,
          user_id: candidate.user_id,
          event_type: candidate.event_type,
          decision,
          reason,
          winning_candidate_id: winningEngagementId,
          policy_version: policyVersion,
          resolved_at: now.toISOString(),
          metadata: blockKey === 'daily_ceiling'
            ? {
                priority_class: priorityClass,
                budgeted_count: reserved.total,
                daily_ceiling: NOTIFICATION_CADENCE_POLICY.dailyCeiling,
              }
            : {
                priority_class: priorityClass,
                cadence_class: cadenceClass,
                class_count: reserved.byClass[cadenceClass],
                class_limit: NOTIFICATION_CADENCE_POLICY.classLimits[cadenceClass],
              },
        });
        recordReason(reason);
        continue;
      }

      reserve(cadenceClass);
      if (!acceptAtCadenceSlot(item)) release(cadenceClass);
    }
  }

  return {
    accepted,
    suppressed,
    deferred,
    expired,
    cancelled,
    evaluations,
    auditEvents,
    summary: {
      totalEvaluated: candidates.length,
      acceptedCount: accepted.length,
      suppressedCount: suppressed.length,
      deferredCount: deferred.length,
      expiredCount: expired.length,
      cancelledCount: cancelled.length,
      reasons,
    },
  };
}
