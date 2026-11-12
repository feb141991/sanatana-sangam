import { describe, expect, it } from 'vitest';
import {
  produceShlokaCandidate,
  SHLOKA_REMINDER_LOCAL_HOUR,
  type DevoteeProfileForShloka,
} from './shloka-candidate-producer';

describe('shloka-candidate-producer', () => {
  const devotee: DevoteeProfileForShloka = {
    id: 'user-shloka-1',
    tradition: 'hindu',
    timezone: 'Asia/Kolkata',
    shloka_streak: 5,
    last_shloka_date: '2026-11-07', // Read yesterday
    wants_shloka_reminders: true,
  };

  it('produces candidate when incomplete on local date', () => {
    const cand = produceShlokaCandidate(devotee, '2026-11-08');
    expect(cand).not.toBeNull();
    expect(cand!.event_type).toBe('shloka');
    expect(cand!.event_id).toBe('shloka-daily');
    expect(cand!.local_date).toBe('2026-11-08');
    expect(cand!.action_url).toBe('/home?focus=shloka');
    expect(cand!.metadata).toMatchObject({ type: 'streak', emoji: '🕉️' });
    expect(cand!.priority).toBe(45);
    expect(cand!.title).toContain('awaits');
    expect(cand!.body).toContain('Continue your 5-day sadhana journey 🙏');
    // Ensure no guilt or loss-pressure phrasing
    expect(cand!.body).not.toContain("Don't break your");
    expect(cand!.body).not.toContain('🔥');
  });

  it('suppresses candidate when devotee has already read today shloka', () => {
    const cand = produceShlokaCandidate(
      { ...devotee, last_shloka_date: '2026-11-08' },
      '2026-11-08'
    );
    expect(cand).toBeNull();
  });

  it('suppresses candidate when wants_shloka_reminders is false', () => {
    const cand = produceShlokaCandidate(
      { ...devotee, wants_shloka_reminders: false },
      '2026-11-08'
    );
    expect(cand).toBeNull();
  });

  it('suppresses new candidates for accounts in the deletion lifecycle', () => {
    expect(produceShlokaCandidate(
      { ...devotee, is_deleting: true },
      '2026-11-08',
    )).toBeNull();
  });

  it.each([null, undefined])('suppresses reminders without an explicit choice (%s)', (preference) => {
    expect(produceShlokaCandidate(
      { ...devotee, wants_shloka_reminders: preference }, '2026-11-08',
    )).toBeNull();
  });

  it('adapts vocabulary for non-Hindu traditions with zero loss pressure', () => {
    const sikhDevotee: DevoteeProfileForShloka = {
      ...devotee,
      tradition: 'sikh',
      shloka_streak: 0,
    };
    const cand = produceShlokaCandidate(sikhDevotee, '2026-11-08');
    expect(cand).not.toBeNull();
    expect(cand!.body).toContain('shalok reflection today');
    expect(cand!.body).not.toContain('🔥');
  });

  it('sends in the morning, at 08:00 local, by default', () => {
    expect(SHLOKA_REMINDER_LOCAL_HOUR).toBe(8);
    const cand = produceShlokaCandidate(devotee, '2026-11-08');
    // 08:00 IST is 02:30 UTC
    expect(cand!.scheduled_for).toBe('2026-11-08T02:30:00.000Z');
  });

  it('keeps 08:00 under the default 22:00-06:00 quiet hours, and when quiet hours end exactly at 08:00', () => {
    for (const end of [6, 8]) {
      const cand = produceShlokaCandidate(
        { ...devotee, notification_quiet_hours_start: 22, notification_quiet_hours_end: end },
        '2026-11-08',
      );
      expect(cand!.scheduled_for, `quiet hours end ${end}`).toBe('2026-11-08T02:30:00.000Z');
    }
  });

  it('moves past quiet hours when 08:00 falls inside them', () => {
    const quietDevotee: DevoteeProfileForShloka = {
      ...devotee,
      notification_quiet_hours_start: 22,
      notification_quiet_hours_end: 9,
    };
    const cand = produceShlokaCandidate(quietDevotee, '2026-11-08');
    expect(cand).not.toBeNull();
    // quiet until 09:00, so 10:00 IST, which is 04:30 UTC
    expect(cand!.scheduled_for).toBe('2026-11-08T04:30:00.000Z');
  });
});
