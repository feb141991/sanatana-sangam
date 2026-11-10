import { describe, expect, it } from 'vitest';
import { BUDGET_EXEMPT_EVENT_TYPES } from './notification-cadence-policy';
import {
  isBudgetExempt,
  resolveCandidates,
  resolvePriorityClass,
  resolvePriorityClassForEventType,
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
      expect(resolvePriorityClass(makeCandidate({ event_type: 'family_remembrance' }))).toBe('explicit_user_requested');
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

  describe('one other nudge a day (engagement-cadence-v3)', () => {
    // 05:30 IST: before the 07:00 delivery window opens, so requested times are honoured.
    const earlyNow = new Date('2026-11-08T00:00:00.000Z');
    const history = (
      id: string,
      notification_type: string,
      overrides: Partial<DeliveryHistoryItem> = {},
    ): DeliveryHistoryItem => ({
      id,
      user_id: 'user-devotee-1',
      local_date: '2026-11-08',
      notification_type,
      sent_at: '2026-11-08T01:00:00.000Z',
      ...overrides,
    });

    it('admits Shloka in the morning, the learning slot at 10:00 and one other nudge in the evening', () => {
      const shloka = makeCandidate({ id: 'shloka', event_type: 'shloka', priority: 40, scheduled_for: '2026-11-08T01:30:00.000Z' }); // 07:00 IST
      const quiz = makeCandidate({ id: 'quiz', event_type: 'quiz', priority: 50, scheduled_for: '2026-11-08T04:30:00.000Z' }); // 10:00 IST
      const mood = makeCandidate({ id: 'mood', event_type: 'mood_checkin', priority: 60, scheduled_for: '2026-11-08T12:30:00.000Z' }); // 18:00 IST

      const res = resolveCandidates({ candidates: [shloka, quiz, mood], now: earlyNow, allowDeferrals: false });

      expect(res.accepted.map((c) => c.id)).toEqual(['shloka', 'quiz', 'mood']);
      expect(res.accepted.map((c) => c.scheduled_for)).toEqual([
        '2026-11-08T01:30:00.000Z',
        '2026-11-08T04:30:00.000Z',
        '2026-11-08T12:30:00.000Z',
      ]);
      expect(res.suppressed).toHaveLength(0);
    });

    it('allows only one candidate per class on a day: three in all, however many are offered', () => {
      const eventTypes = ['mood', 'sattvic', 'shloka', 'dharm_veer', 'quiz', 'daily_checkin'];
      const candidates = eventTypes.map((eventType, index) => makeCandidate({
        id: `engagement-${index + 1}`,
        event_type: eventType,
        priority: index + 1,
        scheduled_for: '2026-11-08T02:30:00.000Z',
      }));

      const res = resolveCandidates({ candidates, now: fixedNow, allowDeferrals: false });

      // Within a class the lower numeric priority wins: mood (other), shloka, dharm_veer (learning).
      expect(res.accepted.map((c) => c.id)).toEqual(['engagement-1', 'engagement-3', 'engagement-4']);
      expect(res.accepted.map((c) => c.scheduled_for)).toEqual([
        '2026-11-08T02:30:00.000Z',
        '2026-11-08T05:30:00.000Z',
        '2026-11-08T08:30:00.000Z',
      ]);
      const reasonOf = (id: string) => res.evaluations.find((e) => e.candidate.id === id)?.reason;
      expect(reasonOf('engagement-2')).toBe('other_nudge_reached'); // sattvic: the one other nudge is mood
      expect(reasonOf('engagement-5')).toBe('learning_slot_reached'); // quiz: dharm_veer holds the slot
      expect(reasonOf('engagement-6')).toBe('other_nudge_reached'); // daily_checkin
      expect(res.suppressed.map((c) => c.id)).toEqual(['engagement-2', 'engagement-5', 'engagement-6']);
    });

    it('does not let an earlier other nudge crowd out Shloka', () => {
      const mood = makeCandidate({ id: 'mood', event_type: 'mood_checkin', priority: 10, scheduled_for: '2026-11-08T02:30:00.000Z' });
      const shloka = makeCandidate({ id: 'shloka', event_type: 'shloka', priority: 90, scheduled_for: '2026-11-08T13:30:00.000Z' });
      const res = resolveCandidates({ candidates: [mood, shloka], now: fixedNow, allowDeferrals: false });
      expect(res.accepted.map((c) => c.id)).toEqual(['mood', 'shloka']);
    });

    it('lets Shloka and the learning slot through even when old history already holds several other nudges', () => {
      const legacy = [
        history('h1', 'mood_checkin'),
        history('h2', 'sattvic_reminder', { sent_at: '2026-11-08T04:00:00.000Z' }),
        history('h3', 'daily_digest', { sent_at: '2026-11-08T07:00:00.000Z' }),
      ];
      const shloka = makeCandidate({ id: 'shloka', event_type: 'shloka', scheduled_for: '2026-11-08T10:30:00.000Z' });
      const quiz = makeCandidate({ id: 'quiz', event_type: 'quiz', scheduled_for: '2026-11-08T13:30:00.000Z' });
      const weekly = makeCandidate({ id: 'weekly', event_type: 'weekly_summary', scheduled_for: '2026-11-08T14:30:00.000Z' });
      const res = resolveCandidates({ candidates: [shloka, quiz, weekly], history: legacy, now: earlyNow, allowDeferrals: false });
      expect(res.accepted.map((c) => c.id)).toEqual(['shloka', 'quiz']);
      expect(res.evaluations.find((e) => e.candidate.id === 'weekly')?.reason).toBe('other_nudge_reached');
    });

    it('holds the Daily Quiz to one push a day: a second quiz stage is refused once the slot is used', () => {
      const available = makeCandidate({
        id: 'quiz-available', event_type: 'quiz', event_id: 'daily-2026-11-08', event_instance: 'available',
        scheduled_for: '2026-11-08T04:30:00.000Z', expires_at: '2026-11-08T05:30:00.000Z',
      });
      const evening = makeCandidate({
        id: 'quiz-evening', event_type: 'quiz', event_id: 'daily-2026-11-08', event_instance: 'evening_nudge',
        scheduled_for: '2026-11-08T12:30:00.000Z', expires_at: '2026-11-08T15:15:00.000Z',
      });
      const res = resolveCandidates({ candidates: [available, evening], now: earlyNow, allowDeferrals: false });
      expect(res.accepted.map((c) => c.id)).toEqual(['quiz-available']);
      expect(res.evaluations.find((e) => e.candidate.id === 'quiz-evening')?.reason).toBe('learning_slot_reached');
    });

    it('shares the learning slot between quiz and dharm_veer', () => {
      const history1 = [history('h1', 'quiz_daily')];
      const dharmVeer = makeCandidate({ id: 'dv', event_type: 'dharm_veer', scheduled_for: '2026-11-08T08:30:00.000Z' });
      const res = resolveCandidates({ candidates: [dharmVeer], history: history1, now: earlyNow, allowDeferrals: false });
      expect(res.suppressed.map((c) => c.id)).toEqual(['dv']);
      expect(res.evaluations[0].reason).toBe('learning_slot_reached');
    });

    it('unifies legacy and candidate aliases into one allowance', () => {
      const candidates = ['sattvic', 'sattvic_reminder', 'sattvic', 'sattvic_reminder', 'sattvic', 'sattvic_reminder']
        .map((eventType, index) => makeCandidate({
          id: `sattvic-${index + 1}`,
          event_type: eventType,
          priority: index + 1,
          scheduled_for: new Date(Date.parse('2026-11-08T02:30:00.000Z') + index * 3 * 60 * 60 * 1000).toISOString(),
        }));

      const result = resolveCandidates({ candidates, now: fixedNow, allowDeferrals: false });
      expect(result.accepted.map((c) => c.id)).toEqual(['sattvic-1']);
      expect(result.suppressed).toHaveLength(5);
      expect(result.evaluations.find((evaluation) => evaluation.candidate.id === 'sattvic-6')?.reason).toBe('other_nudge_reached');
    });

    it('backfills a class slot when the candidate that held it has no safe cadence slot', () => {
      const noSlot = makeCandidate({
        id: 'no-slot', event_type: 'shloka', priority: 1,
        scheduled_for: '2026-11-08T16:30:00.000Z', expires_at: '2026-11-08T18:00:00.000Z', // 22:00 IST: past the 21:00 cutoff
      });
      const backfill = makeCandidate({ id: 'backfill', event_type: 'streak_nudge', priority: 2, scheduled_for: '2026-11-08T02:30:00.000Z' });
      const mood = makeCandidate({ id: 'mood', event_type: 'mood', priority: 3, scheduled_for: '2026-11-08T08:30:00.000Z' });

      const result = resolveCandidates({ candidates: [noSlot, backfill, mood], now: earlyNow, allowDeferrals: false });

      // The backfilled candidate is accepted in the second pass, after the candidates selected up front.
      expect(result.accepted.map((candidate) => candidate.id)).toEqual(['mood', 'backfill']);
      expect(result.suppressed.map((candidate) => candidate.id)).toEqual(['no-slot']);
      expect(result.evaluations.find((item) => item.candidate.id === 'no-slot')?.reason).toBe('no_safe_cadence_slot');
    });

    it('never suppresses reviewed observances or ritual windows even when every allowance is used', () => {
      const dev1 = makeCandidate({ id: 'dev-1', event_type: 'mandali_prompt', priority: 50 });
      const dev2 = makeCandidate({ id: 'dev-2', event_type: 'quiz_daily', priority: 51 });
      const dev3 = makeCandidate({ id: 'dev-3', event_type: 'streak_nudge', priority: 52 });
      const diwaliObservance = makeCandidate({
        id: 'diwali-alert', event_type: 'observance', priority: 10, title: '🪔 Today is Diwali',
        metadata: { budget_class: 'explicit_observance', budget_exempt: true },
      });
      const brahmaMuhurta = makeCandidate({ id: 'brahma-alert', event_type: 'brahma_muhurta', priority: 20, title: '🌅 Brahma Muhurta sacred window' });

      const res = resolveCandidates({
        candidates: [dev1, dev2, dev3, diwaliObservance, brahmaMuhurta],
        now: fixedNow,
        allowDeferrals: false,
      });

      expect(res.accepted).toHaveLength(5);
      expect(res.accepted.map((c) => c.id)).toContain('diwali-alert');
      expect(res.accepted.map((c) => c.id)).toContain('brahma-alert');
      expect(res.suppressed).toHaveLength(0);
    });

    it('never applies the daily allowances to opted-in Sankalpa or Japa reminders', () => {
      const sankalpa = makeCandidate({ id: 'sankalpa-midpoint', event_type: 'sankalpa_midpoint', priority: 20 });
      const japa = makeCandidate({ id: 'opted-in-japa', event_type: 'japa', priority: 21 });
      const used = [history('history-1', 'mood'), history('history-2', 'mandali_prompt'), history('history-3', 'quiz'), history('history-4', 'shloka')];
      const result = resolveCandidates({ candidates: [sankalpa, japa], history: used, now: fixedNow, allowDeferrals: false });
      expect(result.accepted.map((candidate) => candidate.id)).toEqual(['sankalpa-midpoint', 'opted-in-japa']);
      expect(result.suppressed).toHaveLength(0);
    });

    it('re-derives each history row from its trusted type, so a stale priority label cannot evade an allowance', () => {
      const labelled: DeliveryHistoryItem[] = [
        history('hist-1', 'mandali_prompt', { priority_class: 'devotional_engagement' }),
        history('hist-3', 'shloka', { priority_class: 'devotional_engagement', sent_at: '2026-11-08T01:45:00.000Z' }),
        history('hist-4', 'quiz', { priority_class: 'transactional_safety', sent_at: '2026-11-08T01:50:00.000Z' }),
      ];
      const newOther = makeCandidate({ id: 'new-other', event_type: 'gita_reflection', scheduled_for: '2026-11-08T08:30:00.000Z' });
      const newShloka = makeCandidate({ id: 'new-shloka', event_type: 'streak', scheduled_for: '2026-11-08T11:30:00.000Z' });
      const newLearning = makeCandidate({ id: 'new-learning', event_type: 'dharm_veer', scheduled_for: '2026-11-08T14:30:00.000Z' });
      const newObservance = makeCandidate({ id: 'new-observance', event_type: 'observance' });

      const res = resolveCandidates({
        candidates: [newOther, newShloka, newLearning, newObservance],
        history: labelled,
        now: fixedNow,
        allowDeferrals: false,
      });

      expect(res.suppressed.map((c) => c.id).sort()).toEqual(['new-learning', 'new-other', 'new-shloka']);
      expect(res.accepted.map((c) => c.id)).toEqual(['new-observance']);
    });

    it('counts a scheduled push and its in-app bell record once, classifying the bell row by its key', () => {
      // Five distinct counted rows plus one push/bell pair for the SAME quiz = six. Counted twice it would be seven
      // and the outer ceiling would wrongly refuse Shloka.
      const rows: DeliveryHistoryItem[] = [
        history('o1', 'mood', { notification_key: 'mood:a' }),
        history('o2', 'sattvic_reminder', { notification_key: 'sattvic:a' }),
        history('o3', 'daily_digest', { notification_key: 'daily_digest:a' }),
        history('o4', 'weekly_summary', { notification_key: 'weekly_summary:a' }),
        history('o5', 'mandali_prompt', { notification_key: 'mandali_prompt:a' }),
        history('schedule-row', 'quiz', { notification_key: 'quiz:daily-2026-11-08:default' }),
        history('bell-row', 'general', { notification_key: 'quiz:daily-2026-11-08:default' }),
      ];
      const shloka = makeCandidate({ id: 'shloka', event_type: 'shloka', scheduled_for: '2026-11-08T13:30:00.000Z' });
      const result = resolveCandidates({ candidates: [shloka], history: rows, now: earlyNow, allowDeferrals: false });
      expect(result.accepted.map((item) => item.id)).toEqual(['shloka']);
    });

    it('classifies a generic bell row by its key: a japa bell row is not an other nudge, a quiz bell row is the learning slot', () => {
      const bell = [
        history('b1', 'general', { notification_key: 'japa:2026-11-08' }),
        history('b2', 'general', { notification_key: 'quiz:daily-2026-11-08:default' }),
      ];
      const mood = makeCandidate({ id: 'mood', event_type: 'mood_checkin', scheduled_for: '2026-11-08T08:30:00.000Z' });
      const dv = makeCandidate({ id: 'dv', event_type: 'dharm_veer', scheduled_for: '2026-11-08T12:30:00.000Z' });
      const res = resolveCandidates({ candidates: [mood, dv], history: bell, now: earlyNow, allowDeferrals: false });
      expect(res.accepted.map((c) => c.id)).toEqual(['mood']);
      expect(res.evaluations.find((e) => e.candidate.id === 'dv')?.reason).toBe('learning_slot_reached');
    });

    it('does not count Mandali activity: it is another person’s action, and carries no local date', () => {
      const mandali = [
        history('m1', 'post_reaction', { notification_key: 'post_reaction:p:u' }),
        history('m2', 'mandali_comment', { notification_key: 'mandali_comment:c1' }),
        history('m3', 'connection_request', { notification_key: 'connection_request:r1' }),
      ];
      const mood = makeCandidate({ id: 'mood', event_type: 'mood_checkin', scheduled_for: '2026-11-08T08:30:00.000Z' });
      const res = resolveCandidates({ candidates: [mood], history: mandali, now: earlyNow, allowDeferrals: false });
      expect(res.accepted.map((c) => c.id)).toEqual(['mood']);
    });

    it('applies the outer ceiling of seven even to a protected class, and not before', () => {
      const counted = (n: number) => Array.from({ length: n }, (_, i) => history(`c${i}`, `legacy_type_${i}`, { notification_key: `legacy:${i}` }));
      const shloka = makeCandidate({ id: 'shloka', event_type: 'shloka', scheduled_for: '2026-11-08T13:30:00.000Z' });

      const atSix = resolveCandidates({ candidates: [shloka], history: counted(6), now: earlyNow, allowDeferrals: false });
      expect(atSix.accepted.map((c) => c.id)).toEqual(['shloka']);

      const atSeven = resolveCandidates({ candidates: [shloka], history: counted(7), now: earlyNow, allowDeferrals: false });
      expect(atSeven.suppressed.map((c) => c.id)).toEqual(['shloka']);
      expect(atSeven.evaluations[0].reason).toBe('daily_ceiling_reached');
    });

    it('counts candidates reserved in the same pass toward the outer ceiling, not only history', () => {
      // Six counted rows already exist. Shloka takes the seventh; the quiz then finds the ceiling reached even though
      // its own class is empty.
      const six = Array.from({ length: 6 }, (_, i) => history(`c${i}`, `legacy_type_${i}`, { notification_key: `legacy:${i}` }));
      const shloka = makeCandidate({ id: 'shloka', event_type: 'shloka', priority: 10, scheduled_for: '2026-11-08T06:30:00.000Z' });
      const quiz = makeCandidate({ id: 'quiz', event_type: 'quiz', priority: 20, scheduled_for: '2026-11-08T12:30:00.000Z' });
      const res = resolveCandidates({ candidates: [shloka, quiz], history: six, now: earlyNow, allowDeferrals: false });
      expect(res.accepted.map((c) => c.id)).toEqual(['shloka']);
      expect(res.suppressed.map((c) => c.id)).toEqual(['quiz']);
      expect(res.evaluations.find((e) => e.candidate.id === 'quiz')?.reason).toBe('daily_ceiling_reached');
    });

    it('does not let exempt history spend any allowance', () => {
      const exemptHistory = ['japa', 'festival', 'nitya', 'brahma_muhurta', 'vrat', 'tithi', 'aarti', 'security']
        .map((type, i) => history(`e${i}`, type, { notification_key: `${type}:2026-11-08` }));
      const shloka = makeCandidate({ id: 'shloka', event_type: 'shloka', scheduled_for: '2026-11-08T01:30:00.000Z' });
      const quiz = makeCandidate({ id: 'quiz', event_type: 'quiz', scheduled_for: '2026-11-08T04:30:00.000Z' });
      const mood = makeCandidate({ id: 'mood', event_type: 'mood_checkin', scheduled_for: '2026-11-08T12:30:00.000Z' });
      const res = resolveCandidates({ candidates: [shloka, quiz, mood], history: exemptHistory, now: earlyNow, allowDeferrals: false });
      expect(res.accepted.map((c) => c.id)).toEqual(['shloka', 'quiz', 'mood']);
    });

    it('treats a person-initiated type as exempt even when offered as a candidate', () => {
      const used = [history('h1', 'mood'), history('h2', 'shloka'), history('h3', 'quiz')];
      const comment = makeCandidate({ id: 'comment', event_type: 'mandali_comment', scheduled_for: '2026-11-08T03:00:00.000Z' });
      const res = resolveCandidates({ candidates: [comment], history: used, now: earlyNow, allowDeferrals: false });
      expect(res.accepted.map((c) => c.id)).toEqual(['comment']);
      expect(res.accepted[0].scheduled_for).toBe('2026-11-08T03:00:00.000Z');
      expect(res.evaluations[0].reason).toBe('budget_exempt_priority');
    });

    it('records the class, its count and its limit in the audit trail', () => {
      const mood = makeCandidate({ id: 'mood', event_type: 'mood_checkin', scheduled_for: '2026-11-08T08:30:00.000Z' });
      const sattvic = makeCandidate({ id: 'sattvic', event_type: 'sattvic', priority: 90, scheduled_for: '2026-11-08T12:30:00.000Z' });
      const res = resolveCandidates({ candidates: [mood, sattvic], now: earlyNow, allowDeferrals: false });
      const acceptedEvent = res.auditEvents.find((e) => e.candidate_id === 'mood');
      expect(acceptedEvent?.metadata).toMatchObject({ cadence_class: 'other', class_count: 1, class_limit: 1, daily_ceiling: 7 });
      const refusedEvent = res.auditEvents.find((e) => e.candidate_id === 'sattvic');
      expect(refusedEvent?.reason).toBe('other_nudge_reached');
      expect(refusedEvent?.metadata).toMatchObject({ cadence_class: 'other', class_count: 1, class_limit: 1 });
    });

    it('keeps the priority-class exemption lists and the cadence exempt list in agreement', () => {
      for (const type of BUDGET_EXEMPT_EVENT_TYPES) {
        expect(isBudgetExempt(resolvePriorityClassForEventType(type)), type).toBe(true);
      }
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

    it('defers candidates when the day\'s allowance is used and the window remains open', () => {
      const candidates = Array.from({ length: 3 }, (_, index) => makeCandidate({
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

      expect(res.accepted.map((c) => c.id)).toEqual(['dev-1']);
      expect(res.deferred.map((c) => c.id)).toEqual(['dev-2', 'dev-3']);
      expect(res.evaluations.find((e) => e.candidate.id === 'dev-3')?.reason).toBe('other_nudge_deferrable');
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
        expect(event.policy_version).toBe('engagement-cadence-v3');
        expect(event.decision).toBe('accepted');
        expect(event.resolved_at).toBe(fixedNow.toISOString());
      }
    });
  });
});
