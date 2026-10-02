import type {
  NotificationCandidate,
  NotificationResolverEventInsert,
} from '@/types/database';
import {
  canonicalNotificationBudgetType,
  findNextCadenceSlot,
  NOTIFICATION_CADENCE_POLICY,
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
  if (['user_reminder', 'custom_reminder', 'explicit_request', 'user_sadhana_reminder', 'sankalpa_midpoint', 'japa', 'sanskar_milestone'].includes(eventType)) {
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
 * shared engagement limits, delivery cadence, priority hierarchies, and expiration windows.
 *
 * Rules:
 * 1. Transactional, explicit user reminders, ritual windows, and reviewed observances
 *    are 100% budget-exempt and never suppressed by engagement caps.
 * 2. All non-exempt engagement shares a maximum of five per user/local civil date;
 *    each canonical event type also has a five-per-day ceiling.
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

  // 1. Count all non-exempt history and retain delivery instants for cadence.
  const historyBudgetedByGroup = new Map<string, number>();
  const historyBudgetedByType = new Map<string, number>();
  const historyDeliveryInstantsByGroup = new Map<string, Date[]>();
  const seenHistoryNotificationKeys = new Set<string>();

  for (const item of history) {
    if (item.notification_key) {
      const identity = `${item.user_id}::${item.notification_key}`;
      if (seenHistoryNotificationKeys.has(identity)) continue;
      seenHistoryNotificationKeys.add(identity);
    }
    const groupKey = `${item.user_id}::${item.local_date}`;
    // Re-derive from the trusted event type. A stale/manual priority_class from
    // a legacy row must not make engagement disappear from the shared budget.
    const pClass = resolvePriorityClassForEventType(item.notification_type);

    if (pClass === 'routine_engagement' || pClass === 'devotional_engagement') {
      historyBudgetedByGroup.set(groupKey, (historyBudgetedByGroup.get(groupKey) || 0) + 1);
      const typeKey = `${groupKey}::${canonicalNotificationBudgetType(item.notification_type)}`;
      historyBudgetedByType.set(typeKey, (historyBudgetedByType.get(typeKey) || 0) + 1);
    }

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
    let currentBudgetedCount = historyBudgetedByGroup.get(groupKey) || 0;
    const budgetedByType = new Map<string, number>();
    const groupUserId = groupCandidates[0]?.user_id;
    const blockedInstants = [...(historyDeliveryInstantsByGroup.get(groupKey) ?? [])];

    for (const candidate of groupCandidates) {
      const typeKey = `${groupKey}::${canonicalNotificationBudgetType(candidate.event_type)}`;
      budgetedByType.set(typeKey, historyBudgetedByType.get(typeKey) || 0);
    }

    // Filter out pre-terminal candidates (cancelled / expired) first
    const competingCandidates: Array<{
      candidate: NotificationCandidate;
      priorityClass: NotificationPriorityClass;
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

      const priorityClass = resolvePriorityClass(candidate);
      competingCandidates.push({
        candidate,
        priorityClass,
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

    const budgetedCandidates: typeof competingCandidates = [];

    // Exempt, time-sensitive candidates keep their producer's exact slot and
    // block nearby flexible engagement from clustering around them.
    for (const item of competingCandidates) {
      const { candidate, priorityClass, scheduledInstant } = item;
      if (isBudgetExempt(priorityClass)) {
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

    // Select budgeted candidates in the established priority order. The total
    // ceiling is deliberately shared across types: five-per-type alone would
    // multiply into an unbounded daily volume as features grow.
    const selectedForCadence: typeof competingCandidates = [];
    for (const item of budgetedCandidates) {
      const { candidate, priorityClass } = item;
      const canDefer = allowDeferrals && item.scheduledInstant.getTime() < item.expiresInstant.getTime() && now.getTime() < item.expiresInstant.getTime();
      const typeKey = `${groupKey}::${canonicalNotificationBudgetType(candidate.event_type)}`;
      const currentTypeCount = budgetedByType.get(typeKey) || 0;

      if (currentBudgetedCount >= NOTIFICATION_CADENCE_POLICY.maxBudgetedPerLocalDate) {
        const reason = canDefer ? 'daily_budget_cap_deferrable' : 'daily_budget_cap_reached';
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
          metadata: {
            priority_class: priorityClass,
            budgeted_count: currentBudgetedCount,
            budgeted_limit: NOTIFICATION_CADENCE_POLICY.maxBudgetedPerLocalDate,
          },
        });
        recordReason(reason);
        continue;
      }

      if (currentTypeCount >= NOTIFICATION_CADENCE_POLICY.maxPerCanonicalTypePerLocalDate) {
        const reason = canDefer ? 'per_type_budget_cap_deferrable' : 'per_type_budget_cap_reached';
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
          metadata: {
            priority_class: priorityClass,
            canonical_event_type: canonicalNotificationBudgetType(candidate.event_type),
            type_count: currentTypeCount,
            type_limit: NOTIFICATION_CADENCE_POLICY.maxPerCanonicalTypePerLocalDate,
          },
        });
        recordReason(reason);
        continue;
      }

      currentBudgetedCount += 1;
      budgetedByType.set(typeKey, currentTypeCount + 1);
      winningEngagementId ??= candidate.id ?? null;
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

    let acceptedBudgetedCount = historyBudgetedByGroup.get(groupKey) || 0;
    for (const item of selectedForCadence) {
      const { candidate, priorityClass } = item;
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
        continue;
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
      acceptedBudgetedCount += 1;
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
          budgeted_count: acceptedBudgetedCount,
          budgeted_limit: NOTIFICATION_CADENCE_POLICY.maxBudgetedPerLocalDate,
          canonical_event_type: canonicalNotificationBudgetType(candidate.event_type),
          per_type_count: budgetedByType.get(`${groupKey}::${canonicalNotificationBudgetType(candidate.event_type)}`) || 0,
          per_type_limit: NOTIFICATION_CADENCE_POLICY.maxPerCanonicalTypePerLocalDate,
          delivery_cadence: deliveryCadence,
        },
      });
      recordReason(reason);
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
