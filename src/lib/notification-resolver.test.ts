import { describe, expect, it } from 'vitest';
import {
  isBudgetExempt,
  resolveCandidates,
  resolvePriorityClass,
  type DeliveryHistoryItem,
} from './notification-resolver';
import type { NotificationCandidate } from '@/types/database';

function makeCandidate(overrides: Partial<NotificationCandidate> = {}): NotificationCandidate {
  return {
    id: overrides.id ?? 'cand-' + Math.random().toString(36).slice(2, 9),
    user_id: overrides.user_id ?? 'user-devotee-1',
    event_type: overrides.event_type ?? 'devotional_engagement',
    event_id: overrides.event_id ?? 'event-1',
    event_instance: overrides.event_instance ?? '',
    local_date: overrides.local_date ?? '2026-11-08',
    audience_variant: overrides.audience_variant ?? 'general',
    scheduled_for: overrides.scheduled_for ?? '2026-11-08T02:30:00.000Z',
    expires_at: overrides.expires_at ?? '2026-11-08T18:00:00.000Z',
    priority: overrides.priority ?? 50,
    title: overrides.title ?? 'Test Title',
    body: overrides.body ?? 'Test Body',
    action_url: overrides.action_url ?? '/home',
    language: overrides.language ?? 'en',
    timezone: overrides.timezone ?? 'Asia/Kolkata',
    tradition: overrides.tradition ?? 'hindu',
    calendar_profile: overrides.calendar_profile ?? null,
    source_status: overrides.source_status ?? 'verified',
    source_refs: overrides.source_refs ?? {},
    metadata: overrides.metadata ?? {},
    status: overrides.status ?? 'pending',
    decision_reason: overrides.decision_reason ?? null,
    resolved_at: overrides.resolved_at ?? null,
    claimed_at: overrides.claimed_at ?? null,
    created_at: overrides.created_at ?? '2026-11-01T00:00:00.000Z',
    updated_at: overrides.updated_at ?? '2026-11-01T00:00:00.000Z',
  };
}

describe('notification resolver & engagement policy', () => {
  const fixedNow = new Date('2026-11-08T02:00:00.000Z');

  describe('priority classification & exemption rules', () => {
    it('correctly maps event types and metadata to priority classes', () => {
      expect(resolvePriorityClass(makeCandidate({ event_type: 'security' }))).toBe('transactional_safety');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'user_reminder' }))).toBe('explicit_user_requested');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'sankalpa_midpoint' }))).toBe('explicit_user_requested');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'japa' }))).toBe('explicit_user_requested');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'sanskar_milestone' }))).toBe('explicit_user_requested');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'brahma_muhurta' }))).toBe('approved_ritual_window');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'aarti' }))).toBe('approved_ritual_window');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'nitya' }))).toBe('approved_ritual_window');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'observance' }))).toBe('reviewed_observance');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'festival' }))).toBe('reviewed_observance');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'mandali_prompt', metadata: { budget_exempt: true, priority_class: 'transactional_safety' } }))).toBe('devotional_engagement');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'dharm_veer' }))).toBe('routine_engagement');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'quiz' }))).toBe('routine_engagement');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'mood_checkin' }))).toBe('routine_engagement');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'sattvic_reminder' }))).toBe('routine_engagement');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'streak_nudge' }))).toBe('routine_engagement');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'mandali_prompt' }))).toBe('devotional_engagement');
    });

    it('confirms the 4 higher priority classes are budget-exempt', () => {
      expect(isBudgetExempt('transactional_safety')).toBe(true);
      expect(isBudgetExempt('explicit_user_requested')).toBe(true);
      expect(isBudgetExempt('approved_ritual_window')).toBe(true);
      expect(isBudgetExempt('reviewed_observance')).toBe(true);
      expect(isBudgetExempt('devotional_engagement')).toBe(false);
      expect(isBudgetExempt('routine_engagement')).toBe(false);
    });
  });

  describe('engagement budget enforcement', () => {
    it('applies one shared five-push budget across routine and devotional engagement', () => {
      const routine1 = makeCandidate({
        id: 'routine-1',
        event_type: 'mood_checkin',
        priority: 40,
        scheduled_for: '2026-11-08T02:30:00.000Z',
        title: 'Morning reflection',
      });
      const routine2 = makeCandidate({
        id: 'routine-2',
        event_type: 'streak_nudge',
        priority: 50,
        scheduled_for: '2026-11-08T05:30:00.000Z',
        title: 'Continue your japa streak',
      });
      const devotional = makeCandidate({ id: 'devotional-1', event_type: 'mandali_prompt', scheduled_for: '2026-11-08T08:30:00.000Z' });

      const res = resolveCandidates({
        candidates: [routine1, routine2, devotional],
        now: fixedNow,
        allowDeferrals: false,
      });

      expect(res.accepted).toHaveLength(3);
      expect(res.accepted.map((candidate) => candidate.scheduled_for)).toEqual([
        '2026-11-08T02:30:00.000Z',
        '2026-11-08T05:30:00.000Z',
        '2026-11-08T08:30:00.000Z',
      ]);
      expect(res.suppressed).toHaveLength(0);
    });

    it('accepts up to five, spreads collisions, and suppresses the sixth budgeted push', () => {
      const eventTypes = ['mood', 'sattvic', 'shloka', 'dharm_veer', 'quiz', 'daily_checkin'];
      const candidates = eventTypes.map((eventType, index) => makeCandidate({
        id: `engagement-${index + 1}`,
        event_type: eventType,
        priority: index + 1,
        scheduled_for: '2026-11-08T02:30:00.000Z',
      }));

      const res = resolveCandidates({
        candidates,
        now: fixedNow,
        allowDeferrals: false,
      });

      expect(res.accepted).toHaveLength(5);
      expect(res.accepted.map((c) => c.id)).toEqual(candidates.slice(0, 5).map((c) => c.id));
      expect(res.accepted.map((candidate) => candidate.scheduled_for)).toEqual([
        '2026-11-08T02:30:00.000Z',
        '2026-11-08T05:30:00.000Z',
        '2026-11-08T08:30:00.000Z',
        '2026-11-08T11:30:00.000Z',
        '2026-11-08T14:30:00.000Z',
      ]);
      expect(res.suppressed).toHaveLength(1);
      expect(res.suppressed[0].id).toBe(candidates[5].id);
      expect(res.evaluations.find((e) => e.candidate.id === candidates[5].id)?.reason).toBe('daily_budget_cap_reached');
    });

    it('backfills capacity when a higher-priority candidate has no safe cadence slot', () => {
      const requests = [
        { id: 'no-slot', event_type: 'shloka', priority: 1, scheduled_for: '2026-11-08T16:30:00.000Z', expires_at: '2026-11-08T18:00:00.000Z' },
        { id: 'slot-1', event_type: 'mood', priority: 2, scheduled_for: '2026-11-08T02:30:00.000Z' },
        { id: 'slot-2', event_type: 'sattvic', priority: 3, scheduled_for: '2026-11-08T05:30:00.000Z' },
        { id: 'slot-3', event_type: 'quiz', priority: 4, scheduled_for: '2026-11-08T08:30:00.000Z' },
        { id: 'slot-4', event_type: 'dharm_veer', priority: 5, scheduled_for: '2026-11-08T11:30:00.000Z' },
        { id: 'backfill', event_type: 'daily_checkin', priority: 6, scheduled_for: '2026-11-08T14:30:00.000Z' },
      ];
      const candidates = requests.map((request) => makeCandidate({
        ...request,
        expires_at: request.expires_at ?? '2026-11-08T18:00:00.000Z',
      }));

      const result = resolveCandidates({
        candidates,
        now: new Date('2026-11-08T00:00:00.000Z'),
        allowDeferrals: false,
      });

      expect(result.accepted.map((candidate) => candidate.id)).toEqual([
        'slot-1', 'slot-2', 'slot-3', 'slot-4', 'backfill',
      ]);
      expect(result.suppressed.map((candidate) => candidate.id)).toEqual(['no-slot']);
      expect(result.evaluations.find((item) => item.candidate.id === 'no-slot')?.reason).toBe('no_safe_cadence_slot');
    });

    it('unifies legacy and candidate aliases for the per-type cap', () => {
      const candidates = ['sattvic', 'sattvic_reminder', 'sattvic', 'sattvic_reminder', 'sattvic', 'sattvic_reminder']
        .map((eventType, index) => makeCandidate({
          id: `sattvic-${index + 1}`,
          event_type: eventType,
          priority: index + 1,
          scheduled_for: new Date(Date.parse('2026-11-08T02:30:00.000Z') + index * 3 * 60 * 60 * 1000).toISOString(),
        }));

      const result = resolveCandidates({ candidates, now: fixedNow, allowDeferrals: false });
      expect(result.accepted).toHaveLength(5);
      expect(result.suppressed.map((candidate) => candidate.id)).toEqual(['sattvic-6']);
      expect(result.evaluations.find((evaluation) => evaluation.candidate.id === 'sattvic-6')?.reason).toBe('daily_budget_cap_reached');
    });

    it('never suppresses reviewed observances even when the devotional budget is full', () => {
      const dev1 = makeCandidate({ id: 'dev-1', event_type: 'mandali_prompt', priority: 50 });
      const dev2 = makeCandidate({ id: 'dev-2', event_type: 'quiz_daily', priority: 51 });
      const diwaliObservance = makeCandidate({
        id: 'diwali-alert',
        event_type: 'observance',
        priority: 10,
        title: '🪔 Today is Diwali',
        metadata: { budget_class: 'explicit_observance', budget_exempt: true },
      });
      const brahmaMuhurta = makeCandidate({
        id: 'brahma-alert',
        event_type: 'brahma_muhurta',
        priority: 20,
        title: '🌅 Brahma Muhurta sacred window',
      });

      const res = resolveCandidates({
        candidates: [dev1, dev2, diwaliObservance, brahmaMuhurta],
        now: fixedNow,
        allowDeferrals: false,
      });

      // Both exempt items AND the 2 devotional items are accepted (total 4)
      expect(res.accepted).toHaveLength(4);
      expect(res.accepted.map((c) => c.id)).toContain('diwali-alert');
      expect(res.accepted.map((c) => c.id)).toContain('brahma-alert');
      expect(res.suppressed).toHaveLength(0);
    });

    it('never applies the generic daily budget to opted-in Sankalpa or Japa reminders', () => {
      const sankalpa = makeCandidate({ id: 'sankalpa-midpoint', event_type: 'sankalpa_midpoint', priority: 20 });
      const japa = makeCandidate({ id: 'opted-in-japa', event_type: 'japa', priority: 21 });
      const history: DeliveryHistoryItem[] = [
        { id: 'history-1', user_id: sankalpa.user_id, local_date: sankalpa.local_date, notification_type: 'mood', priority_class: 'routine_engagement', sent_at: fixedNow.toISOString() },
        { id: 'history-2', user_id: sankalpa.user_id, local_date: sankalpa.local_date, notification_type: 'mandali_prompt', priority_class: 'devotional_engagement', sent_at: fixedNow.toISOString() },
      ];
      const result = resolveCandidates({ candidates: [sankalpa, japa], history, now: fixedNow, allowDeferrals: false });
      expect(result.accepted.map((candidate) => candidate.id)).toEqual(['sankalpa-midpoint', 'opted-in-japa']);
      expect(result.suppressed).toHaveLength(0);
    });

    it('respects past history and does not retroactively displace sent notifications', () => {
      const history: DeliveryHistoryItem[] = [
        {
          id: 'hist-1',
          user_id: 'user-devotee-1',
          local_date: '2026-11-08',
          notification_type: 'mandali_prompt',
          priority_class: 'devotional_engagement',
          sent_at: '2026-11-08T01:00:00.000Z',
        },
        {
          id: 'hist-2',
          user_id: 'user-devotee-1',
          local_date: '2026-11-08',
          notification_type: 'mood_checkin',
          priority_class: 'routine_engagement',
          sent_at: '2026-11-08T01:30:00.000Z',
        },
      ];

      // Five budgeted pushes already exist; this candidate must not exceed the shared cap.
      const fullHistory: DeliveryHistoryItem[] = [
        ...history,
        { id: 'hist-3', user_id: 'user-devotee-1', local_date: '2026-11-08', notification_type: 'shloka', priority_class: 'devotional_engagement', sent_at: '2026-11-08T01:45:00.000Z' },
        { id: 'hist-4', user_id: 'user-devotee-1', local_date: '2026-11-08', notification_type: 'quiz', priority_class: 'transactional_safety', sent_at: '2026-11-08T01:50:00.000Z' },
        { id: 'hist-5', user_id: 'user-devotee-1', local_date: '2026-11-08', notification_type: 'sattvic_reminder', priority_class: 'reviewed_observance', sent_at: '2026-11-08T01:55:00.000Z' },
      ];
      const newDevotional = makeCandidate({
        id: 'new-devotional',
        event_type: 'gita_reflection',
      });
      const newObservance = makeCandidate({
        id: 'new-observance',
        event_type: 'observance',
      });

      const res = resolveCandidates({
        candidates: [newDevotional, newObservance],
        history: fullHistory,
        now: fixedNow,
        allowDeferrals: false,
      });

      // Engagement event types are reclassified from their trusted event type,
      // so stale priority labels cannot evade the five-push budget.
      expect(res.suppressed.map((c) => c.id)).toContain('new-devotional');
      // newObservance is accepted because it is exempt
      expect(res.accepted.map((c) => c.id)).toContain('new-observance');
    });

    it('counts a scheduled push and its in-app bell record only once', () => {
      const history: DeliveryHistoryItem[] = [
        {
          id: 'schedule-row',
          user_id: 'user-devotee-1',
          local_date: '2026-11-08',
          notification_type: 'mandali_prompt',
          priority_class: 'devotional_engagement',
          notification_key: 'mandali_prompt:prompt-1:2026-11-08:general',
          sent_at: '2026-11-08T01:00:00.000Z',
        },
        {
          id: 'bell-row',
          user_id: 'user-devotee-1',
          local_date: '2026-11-08',
          notification_type: 'general',
          priority_class: 'devotional_engagement',
          notification_key: 'mandali_prompt:prompt-1:2026-11-08:general',
          sent_at: '2026-11-08T01:00:00.000Z',
        },
      ];
      const candidate = makeCandidate({ id: 'routine-follow-up', event_type: 'mood_checkin' });
      const result = resolveCandidates({ candidates: [candidate], history, now: fixedNow, allowDeferrals: false });
      expect(result.accepted.map((item) => item.id)).toContain('routine-follow-up');
      expect(result.suppressed).toHaveLength(0);
    });
  });

  describe('expiration and deferral rules', () => {
    it('marks candidates expired if now >= expires_at', () => {
      const expiredCandidate = makeCandidate({
        id: 'cand-expired',
        scheduled_for: '2026-11-08T01:00:00.000Z',
        expires_at: '2026-11-08T01:30:00.000Z', // 30 mins before fixedNow
      });

      const res = resolveCandidates({
        candidates: [expiredCandidate],
        now: fixedNow,
      });

      expect(res.expired).toHaveLength(1);
      expect(res.expired[0].id).toBe('cand-expired');
      expect(res.evaluations[0].reason).toBe('window_expired');
    });

    it('marks pre-cancelled candidates as cancelled', () => {
      const cancelledCandidate = makeCandidate({
        id: 'cand-cancelled',
        status: 'cancelled',
      });

      const res = resolveCandidates({
        candidates: [cancelledCandidate],
        now: fixedNow,
      });

      expect(res.cancelled).toHaveLength(1);
      expect(res.cancelled[0].id).toBe('cand-cancelled');
      expect(res.evaluations[0].reason).toBe('candidate_status_cancelled');
    });

    it('defers candidates when budget is reached and window remains open', () => {
      const candidates = Array.from({ length: 6 }, (_, index) => makeCandidate({
        id: `dev-${index + 1}`,
        priority: 50 + index,
        scheduled_for: '2026-11-08T02:30:00.000Z',
        expires_at: '2026-11-08T18:00:00.000Z', // Open until evening
      }));

      const res = resolveCandidates({
        candidates,
        now: fixedNow,
        allowDeferrals: true,
      });

      expect(res.accepted).toHaveLength(5);
      expect(res.deferred).toHaveLength(1);
      expect(res.deferred[0].id).toBe('dev-6');
      expect(res.evaluations.find((e) => e.candidate.id === 'dev-6')?.reason).toBe(
        'daily_budget_cap_deferrable'
      );
    });
  });

  describe('audit event generation', () => {
    it('generates an append-only audit event for every evaluated candidate', () => {
      const dev = makeCandidate({ id: 'dev-1', event_type: 'mandali_prompt' });
      const obs = makeCandidate({ id: 'obs-1', event_type: 'observance' });

      const res = resolveCandidates({
        candidates: [dev, obs],
        now: fixedNow,
      });

      expect(res.auditEvents).toHaveLength(2);
      for (const event of res.auditEvents) {
        expect(event.candidate_id).toBeDefined();
        expect(event.user_id).toBe('user-devotee-1');
        expect(event.policy_version).toBe('engagement-cadence-v2');
        expect(event.decision).toBe('accepted');
        expect(event.resolved_at).toBe(fixedNow.toISOString());
      }
    });
  });
});
