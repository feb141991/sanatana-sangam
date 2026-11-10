import { describe, expect, it } from 'vitest';
import { resolveCandidates, type DeliveryHistoryItem } from './notification-resolver';
import { produceQuizCandidate } from './quiz-candidate-producer';
import { produceShlokaCandidate, SHLOKA_REMINDER_LOCAL_HOUR } from './shloka-candidate-producer';
import type { NotificationCandidate } from '@/types/database';

/**
 * The day the founder asked for, built from the REAL producers and the REAL resolver rather than hand-made
 * candidates: Shloka in the morning, the quiz behind it. The three-hour spacing rule means the quiz is
 * moved later on a day Shloka is sent; this file pins that it is moved, never dropped.
 */

const USER = 'devotee-1';
const DATE = '2026-11-08';
const asCandidate = (insert: object, id: string): NotificationCandidate => ({
  ...(insert as NotificationCandidate),
  id,
  status: 'pending',
  decision_reason: null,
  resolved_at: null,
  claimed_at: null,
  created_at: '2026-11-01T00:00:00.000Z',
  updated_at: '2026-11-01T00:00:00.000Z',
});

function shlokaHistoryFor(profile: Parameters<typeof produceShlokaCandidate>[0]): DeliveryHistoryItem {
  const shloka = asCandidate(produceShlokaCandidate(profile, DATE)!, 'shloka');
  // Resolved shortly before it is due, as the ten-minute resolver does.
  const due = new Date(shloka.scheduled_for);
  const res = resolveCandidates({ candidates: [shloka], now: new Date(due.getTime() - 5 * 60_000), allowDeferrals: false });
  expect(res.accepted).toHaveLength(1);
  return {
    id: 'shloka-row',
    user_id: USER,
    local_date: DATE,
    notification_type: 'shloka',
    notification_key: `shloka:${USER}:${DATE}`,
    sent_at: res.accepted[0].scheduled_for,
  };
}

describe('the morning day shape, from the real producers', () => {
  const base = { id: USER, tradition: 'hindu', timezone: 'Asia/Kolkata', wants_shloka_reminders: true, shloka_streak: 4, last_shloka_date: '2026-11-07' };
  const quizProfile = { id: USER, timezone: 'Asia/Kolkata', quiz_reminder_enabled: true };
  // The quiz cron creates the 'available' stage in the hour after the chosen time; 10:05 IST.
  const quizNow = new Date('2026-11-08T04:35:00.000Z');

  it('puts Shloka at 08:00 and moves the 10:00 quiz to 11:00 instead of dropping it', () => {
    expect(SHLOKA_REMINDER_LOCAL_HOUR).toBe(8);
    const shloka = shlokaHistoryFor(base);
    expect(shloka.sent_at).toBe('2026-11-08T02:30:00.000Z'); // 08:00 IST

    const quiz = asCandidate(produceQuizCandidate(quizProfile, DATE, 'available')!, 'quiz');
    expect(quiz.scheduled_for).toBe('2026-11-08T04:30:00.000Z'); // chosen 10:00 IST
    const res = resolveCandidates({ candidates: [quiz], history: [shloka], now: quizNow, allowDeferrals: false });
    expect(res.accepted.map((c) => c.scheduled_for)).toEqual(['2026-11-08T05:30:00.000Z']); // 11:00 IST
    expect(res.evaluations[0].reason).toBe('accepted_after_cadence_spacing');
  });

  it('still keeps the quiz when Shloka lands at 09:00', () => {
    const shloka: DeliveryHistoryItem = { ...shlokaHistoryFor(base), sent_at: '2026-11-08T03:30:00.000Z' };
    const quiz = asCandidate(produceQuizCandidate(quizProfile, DATE, 'available')!, 'quiz');
    const res = resolveCandidates({ candidates: [quiz], history: [shloka], now: quizNow, allowDeferrals: false });
    expect(res.accepted.map((c) => c.scheduled_for)).toEqual(['2026-11-08T06:30:00.000Z']); // 12:00 IST
  });

  it('still keeps the quiz when quiet hours push Shloka to 10:00', () => {
    const quietProfile = { ...base, notification_quiet_hours_start: 22, notification_quiet_hours_end: 9 };
    const shloka = shlokaHistoryFor(quietProfile);
    expect(shloka.sent_at).toBe('2026-11-08T04:30:00.000Z'); // 10:00 IST
    const quiz = asCandidate(produceQuizCandidate({ ...quizProfile, notification_quiet_hours_start: 22, notification_quiet_hours_end: 9 }, DATE, 'available')!, 'quiz');
    const res = resolveCandidates({ candidates: [quiz], history: [shloka], now: quizNow, allowDeferrals: false });
    expect(res.accepted.map((c) => c.scheduled_for)).toEqual(['2026-11-08T07:30:00.000Z']); // 13:00 IST
  });

  it('refuses the quiz when it would need a second three-hour shift: the allowance is bounded', () => {
    // Shloka 09:00 pushes the quiz to 12:00; a chosen Japa time at 12:00 would push it to 15:00, past its expiry.
    const history: DeliveryHistoryItem[] = [
      { ...shlokaHistoryFor(base), sent_at: '2026-11-08T03:30:00.000Z' },
      { id: 'japa', user_id: USER, local_date: DATE, notification_type: 'japa', notification_key: `japa:${DATE}`, sent_at: '2026-11-08T06:30:00.000Z' },
    ];
    const quiz = asCandidate(produceQuizCandidate(quizProfile, DATE, 'available')!, 'quiz');
    const res = resolveCandidates({ candidates: [quiz], history, now: quizNow, allowDeferrals: false });
    expect(res.accepted).toHaveLength(0);
    expect(res.evaluations[0].reason).toBe('no_safe_cadence_slot');
  });

  it('lets a quiz chosen at 10:00 live until 14:00, not beyond', () => {
    const quiz = produceQuizCandidate(quizProfile, DATE, 'available')!;
    expect(quiz.expires_at).toBe('2026-11-08T08:30:00.000Z'); // 14:00 IST
  });

  it('adds the evening other nudge without crowding the morning', () => {
    const shloka = shlokaHistoryFor(base);
    const quiz: DeliveryHistoryItem = { id: 'q', user_id: USER, local_date: DATE, notification_type: 'quiz', notification_key: `quiz:daily-${DATE}:available:${DATE}:default`, sent_at: '2026-11-08T05:30:00.000Z' };
    const mood = asCandidate({
      user_id: USER, event_type: 'mood_checkin', event_id: 'm', event_instance: '', local_date: DATE, audience_variant: 'general',
      scheduled_for: '2026-11-08T12:30:00.000Z', expires_at: '2026-11-08T15:00:00.000Z', priority: 60, title: 't', body: 'b',
      action_url: '/home', language: 'en', timezone: 'Asia/Kolkata', tradition: 'hindu', calendar_profile: null,
      source_status: 'verified', source_refs: {}, metadata: {}, status: 'pending',
    }, 'mood');
    const res = resolveCandidates({ candidates: [mood], history: [shloka, quiz], now: new Date('2026-11-08T12:00:00.000Z'), allowDeferrals: false });
    expect(res.accepted.map((c) => c.scheduled_for)).toEqual(['2026-11-08T12:30:00.000Z']); // 18:00 IST, untouched
  });
});
