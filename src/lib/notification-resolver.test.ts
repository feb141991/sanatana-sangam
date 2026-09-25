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
      expect(resolvePriorityClass(makeCandidate({ event_type: 'brahma_muhurta' }))).toBe('approved_ritual_window');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'nitya' }))).toBe('approved_ritual_window');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'observance' }))).toBe('reviewed_observance');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'festival' }))).toBe('reviewed_observance');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'mandali_prompt', metadata: { budget_exempt: true, priority_class: 'transactional_safety' } }))).toBe('devotional_engagement');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'dharm_veer' }))).toBe('routine_engagement');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'quiz' }))).toBe('routine_engagement');
      expect(resolvePriorityClass(makeCandidate({ event_type: 'mood_checkin' }))).toBe('routine_engagement');
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
    it('enforces maximum 1 routine engagement notification per local date', () => {
      const routine1 = makeCandidate({
        id: 'routine-1',
        event_type: 'mood_checkin',
        priority: 40,
        title: 'Morning reflection',
      });
      const routine2 = makeCandidate({
        id: 'routine-2',
        event_type: 'streak_nudge',
        priority: 50,
        title: 'Continue your japa streak',
      });

      const res = resolveCandidates({
        candidates: [routine1, routine2],
        now: fixedNow,
        allowDeferrals: false,
      });

      expect(res.accepted).toHaveLength(1);
      expect(res.accepted[0].id).toBe('routine-1');
      expect(res.suppressed).toHaveLength(1);
      expect(res.suppressed[0].id).toBe('routine-2');
      expect(res.evaluations.find((e) => e.candidate.id === 'routine-2')?.reason).toBe(
        'routine_engagement_cap_reached'
      );
    });

    it('enforces maximum 2 non-exempt devotional notifications per local date', () => {
      const dev1 = makeCandidate({ id: 'dev-1', event_type: 'mandali_prompt', priority: 50 });
      const dev2 = makeCandidate({ id: 'dev-2', event_type: 'quiz_daily', priority: 51 });
      const dev3 = makeCandidate({ id: 'dev-3', event_type: 'gita_reflection', priority: 52 });

      const res = resolveCandidates({
        candidates: [dev1, dev2, dev3],
        now: fixedNow,
        allowDeferrals: false,
      });

      expect(res.accepted).toHaveLength(2);
      expect(res.accepted.map((c) => c.id)).toEqual(['dev-1', 'dev-2']);
      expect(res.suppressed).toHaveLength(1);
      expect(res.suppressed[0].id).toBe('dev-3');
      expect(res.evaluations.find((e) => e.candidate.id === 'dev-3')?.reason).toBe(
        'devotional_budget_cap_reached'
      );
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

    it('never applies the generic daily budget to an opted-in Sankalpa midpoint candidate', () => {
      const sankalpa = makeCandidate({ id: 'sankalpa-midpoint', event_type: 'sankalpa_midpoint', priority: 20 });
      const history: DeliveryHistoryItem[] = [
        { id: 'history-1', user_id: sankalpa.user_id, local_date: sankalpa.local_date, notification_type: 'mood', priority_class: 'routine_engagement', sent_at: fixedNow.toISOString() },
        { id: 'history-2', user_id: sankalpa.user_id, local_date: sankalpa.local_date, notification_type: 'japa', priority_class: 'routine_engagement', sent_at: fixedNow.toISOString() },
      ];
      const result = resolveCandidates({ candidates: [sankalpa], history, now: fixedNow, allowDeferrals: false });
      expect(result.accepted.map((candidate) => candidate.id)).toEqual(['sankalpa-midpoint']);
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

      // Devotee already received 1 routine and 1 devotional (total 2 devotional budget consumed)
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
        history,
        now: fixedNow,
        allowDeferrals: false,
      });

      // newDevotional is suppressed because history consumed 2/2 slots
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
      const candidate = makeCandidate({ id: 'routine-follow-up', event_type: 'japa' });
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
      const dev1 = makeCandidate({ id: 'dev-1', priority: 50 });
      const dev2 = makeCandidate({ id: 'dev-2', priority: 51 });
      const dev3 = makeCandidate({
        id: 'dev-3',
        priority: 52,
        scheduled_for: '2026-11-08T02:30:00.000Z',
        expires_at: '2026-11-08T18:00:00.000Z', // Open until evening
      });

      const res = resolveCandidates({
        candidates: [dev1, dev2, dev3],
        now: fixedNow,
        allowDeferrals: true,
      });

      expect(res.accepted).toHaveLength(2);
      expect(res.deferred).toHaveLength(1);
      expect(res.deferred[0].id).toBe('dev-3');
      expect(res.evaluations.find((e) => e.candidate.id === 'dev-3')?.reason).toBe(
        'devotional_budget_cap_deferrable'
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
        expect(event.policy_version).toBe('v1');
        expect(event.decision).toBe('accepted');
        expect(event.resolved_at).toBe(fixedNow.toISOString());
      }
    });
  });
});
