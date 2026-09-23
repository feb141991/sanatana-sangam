import type {
  NotificationCandidate,
  NotificationResolverEventInsert,
} from '@/types/database';

export type NotificationPriorityClass =
  | 'transactional_safety'     // Priority 1: Security, account, moderation, transactional safety (outside budget)
  | 'explicit_user_requested'  // Priority 2: Explicit user-requested observance or ritual reminder (outside budget)
  | 'approved_ritual_window'   // Priority 3: Approved time-sensitive ritual window (outside budget)
  | 'reviewed_observance'      // Priority 4: Reviewed same-day/lead observance (outside budget / never budget-suppressed)
  | 'devotional_engagement'    // Priority 5: Devotional engagement (subject to max 2/day budget)
  | 'routine_engagement';      // Priority 6: Routine checkin / streak (subject to max 1/day budget)

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
 * Resolves the priority class of a candidate based on explicit metadata
 * or canonical event type categorization.
 */
export function resolvePriorityClass(candidate: NotificationCandidate): NotificationPriorityClass {
  const meta = (candidate.metadata ?? {}) as Record<string, any>;

  if (meta.priority_class && meta.priority_class in PRIORITY_CLASS_ORDER) {
    return meta.priority_class as NotificationPriorityClass;
  }

  if (meta.budget_class === 'explicit_observance' || meta.budget_exempt === true) {
    return 'reviewed_observance';
  }

  const eventType = candidate.event_type.toLowerCase();

  // 1. Transactional / Account safety
  if (['security', 'account', 'moderation', 'auth', 'transactional', 'critical_alert'].includes(eventType)) {
    return 'transactional_safety';
  }

  // 2. Explicit user requested
  if (['user_reminder', 'custom_reminder', 'explicit_request', 'user_sadhana_reminder'].includes(eventType)) {
    return 'explicit_user_requested';
  }

  // 3. Approved ritual window
  if (['brahma_muhurta', 'sandhya', 'nitya_madhyahn', 'nitya_sandhya', 'ritual_window', 'pradosha_window'].includes(eventType)) {
    return 'approved_ritual_window';
  }

  // 4. Reviewed observance
  if (['observance', 'festival', 'vrat', 'tithi'].includes(eventType)) {
    return 'reviewed_observance';
  }

  // 6. Routine engagement
  if (['routine_engagement', 'mood_checkin', 'streak', 'streak_nudge', 'daily_checkin'].includes(eventType)) {
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
 * devotional budget caps, priority hierarchies, and expiration windows.
 *
 * Rules:
 * 1. Transactional, explicit user reminders, ritual windows, and reviewed observances
 *    are 100% budget-exempt and never suppressed by engagement caps.
 * 2. Non-exempt devotional engagement is capped at max 2 per devotee per local date.
 * 3. Routine engagement is capped at max 1 per devotee per local date (and counts toward
 *    the total 2 devotional cap).
 * 4. Candidates past expires_at are marked 'expired'.
 * 5. Candidates may be deferred only while scheduled_for < expires_at.
 * 6. Historical deliveries cannot be displaced retroactively.
 */
export function resolveCandidates(input: {
  candidates: NotificationCandidate[];
  history?: DeliveryHistoryItem[];
  now: Date;
  policyVersion?: string;
  allowDeferrals?: boolean;
}): ResolutionResult {
  const { candidates, history = [], now, policyVersion = 'v1', allowDeferrals = true } = input;

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

  // 1. Group past history by user_id and local_date
  const historyDevotionalByGroup = new Map<string, number>();
  const historyRoutineByGroup = new Map<string, number>();

  for (const item of history) {
    const groupKey = `${item.user_id}::${item.local_date}`;
    const pClass = item.priority_class ?? 'devotional_engagement';

    if (pClass === 'routine_engagement') {
      historyRoutineByGroup.set(groupKey, (historyRoutineByGroup.get(groupKey) || 0) + 1);
      historyDevotionalByGroup.set(groupKey, (historyDevotionalByGroup.get(groupKey) || 0) + 1);
    } else if (pClass === 'devotional_engagement') {
      historyDevotionalByGroup.set(groupKey, (historyDevotionalByGroup.get(groupKey) || 0) + 1);
    }
  }

  // 2. Group candidates by user_id and local_date
  const candidatesByGroup = new Map<string, NotificationCandidate[]>();
  for (const cand of candidates) {
    const groupKey = `${cand.user_id}::${cand.local_date}`;
    if (!candidatesByGroup.has(groupKey)) candidatesByGroup.set(groupKey, []);
    candidatesByGroup.get(groupKey)!.push(cand);
  }

  // 3. Resolve group by group
  for (const [groupKey, groupCandidates] of candidatesByGroup) {
    let currentRoutineCount = historyRoutineByGroup.get(groupKey) || 0;
    let currentDevotionalCount = historyDevotionalByGroup.get(groupKey) || 0;

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

    let winningDevotionalId: string | null = null;

    // Evaluate budget and eligibility in sorted order
    for (const item of competingCandidates) {
      const { candidate, priorityClass, scheduledInstant, expiresInstant } = item;
      const canDefer = allowDeferrals && scheduledInstant.getTime() < expiresInstant.getTime() && now.getTime() < expiresInstant.getTime();

      // Class 1 to 4: Budget-Exempt
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
          metadata: { priority_class: priorityClass, budget_exempt: true },
        });
        recordReason('budget_exempt_priority');
        continue;
      }

      // Class 6: Routine Engagement (max 1/day, and counts toward total 2 devotional cap)
      if (priorityClass === 'routine_engagement') {
        if (currentRoutineCount >= 1) {
          if (canDefer) {
            deferred.push(candidate);
            evaluations.push({
              candidate,
              decision: 'deferred',
              reason: 'routine_cap_reached_deferrable',
              priorityClass,
              winningCandidateId: winningDevotionalId,
            });
            auditEvents.push({
              candidate_id: candidate.id,
              user_id: candidate.user_id,
              event_type: candidate.event_type,
              decision: 'deferred',
              reason: 'routine_cap_reached_deferrable',
              winning_candidate_id: winningDevotionalId,
              policy_version: policyVersion,
              resolved_at: now.toISOString(),
              metadata: { priority_class: priorityClass, routine_count: currentRoutineCount },
            });
            recordReason('routine_cap_reached_deferrable');
          } else {
            suppressed.push(candidate);
            evaluations.push({
              candidate,
              decision: 'suppressed',
              reason: 'routine_engagement_cap_reached',
              priorityClass,
              winningCandidateId: winningDevotionalId,
            });
            auditEvents.push({
              candidate_id: candidate.id,
              user_id: candidate.user_id,
              event_type: candidate.event_type,
              decision: 'suppressed',
              reason: 'routine_engagement_cap_reached',
              winning_candidate_id: winningDevotionalId,
              policy_version: policyVersion,
              resolved_at: now.toISOString(),
              metadata: { priority_class: priorityClass, routine_count: currentRoutineCount },
            });
            recordReason('routine_engagement_cap_reached');
          }
          continue;
        }

        if (currentDevotionalCount >= 2) {
          if (canDefer) {
            deferred.push(candidate);
            evaluations.push({
              candidate,
              decision: 'deferred',
              reason: 'devotional_budget_cap_deferrable',
              priorityClass,
              winningCandidateId: winningDevotionalId,
            });
            auditEvents.push({
              candidate_id: candidate.id,
              user_id: candidate.user_id,
              event_type: candidate.event_type,
              decision: 'deferred',
              reason: 'devotional_budget_cap_deferrable',
              winning_candidate_id: winningDevotionalId,
              policy_version: policyVersion,
              resolved_at: now.toISOString(),
              metadata: { priority_class: priorityClass, devotional_count: currentDevotionalCount },
            });
            recordReason('devotional_budget_cap_deferrable');
          } else {
            suppressed.push(candidate);
            evaluations.push({
              candidate,
              decision: 'suppressed',
              reason: 'devotional_budget_cap_reached',
              priorityClass,
              winningCandidateId: winningDevotionalId,
            });
            auditEvents.push({
              candidate_id: candidate.id,
              user_id: candidate.user_id,
              event_type: candidate.event_type,
              decision: 'suppressed',
              reason: 'devotional_budget_cap_reached',
              winning_candidate_id: winningDevotionalId,
              policy_version: policyVersion,
              resolved_at: now.toISOString(),
              metadata: { priority_class: priorityClass, devotional_count: currentDevotionalCount },
            });
            recordReason('devotional_budget_cap_reached');
          }
          continue;
        }

        // Accepted routine engagement
        accepted.push(candidate);
        winningDevotionalId = candidate.id;
        currentRoutineCount++;
        currentDevotionalCount++;

        evaluations.push({
          candidate,
          decision: 'accepted',
          reason: 'routine_engagement_accepted',
          priorityClass,
        });
        auditEvents.push({
          candidate_id: candidate.id,
          user_id: candidate.user_id,
          event_type: candidate.event_type,
          decision: 'accepted',
          reason: 'routine_engagement_accepted',
          policy_version: policyVersion,
          resolved_at: now.toISOString(),
          metadata: { priority_class: priorityClass },
        });
        recordReason('routine_engagement_accepted');
        continue;
      }

      // Class 5: Devotional Engagement (max 2/day)
      if (priorityClass === 'devotional_engagement') {
        if (currentDevotionalCount >= 2) {
          if (canDefer) {
            deferred.push(candidate);
            evaluations.push({
              candidate,
              decision: 'deferred',
              reason: 'devotional_budget_cap_deferrable',
              priorityClass,
              winningCandidateId: winningDevotionalId,
            });
            auditEvents.push({
              candidate_id: candidate.id,
              user_id: candidate.user_id,
              event_type: candidate.event_type,
              decision: 'deferred',
              reason: 'devotional_budget_cap_deferrable',
              winning_candidate_id: winningDevotionalId,
              policy_version: policyVersion,
              resolved_at: now.toISOString(),
              metadata: { priority_class: priorityClass, devotional_count: currentDevotionalCount },
            });
            recordReason('devotional_budget_cap_deferrable');
          } else {
            suppressed.push(candidate);
            evaluations.push({
              candidate,
              decision: 'suppressed',
              reason: 'devotional_budget_cap_reached',
              priorityClass,
              winningCandidateId: winningDevotionalId,
            });
            auditEvents.push({
              candidate_id: candidate.id,
              user_id: candidate.user_id,
              event_type: candidate.event_type,
              decision: 'suppressed',
              reason: 'devotional_budget_cap_reached',
              winning_candidate_id: winningDevotionalId,
              policy_version: policyVersion,
              resolved_at: now.toISOString(),
              metadata: { priority_class: priorityClass, devotional_count: currentDevotionalCount },
            });
            recordReason('devotional_budget_cap_reached');
          }
          continue;
        }

        // Accepted devotional engagement
        accepted.push(candidate);
        winningDevotionalId = candidate.id;
        currentDevotionalCount++;

        evaluations.push({
          candidate,
          decision: 'accepted',
          reason: 'devotional_engagement_accepted',
          priorityClass,
        });
        auditEvents.push({
          candidate_id: candidate.id,
          user_id: candidate.user_id,
          event_type: candidate.event_type,
          decision: 'accepted',
          reason: 'devotional_engagement_accepted',
          policy_version: policyVersion,
          resolved_at: now.toISOString(),
          metadata: { priority_class: priorityClass },
        });
        recordReason('devotional_engagement_accepted');
      }
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
