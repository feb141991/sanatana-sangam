import { describe, expect, it } from 'vitest';
import {
  produceShlokaCandidate,
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

  it('defaults to eligible when wants_shloka_reminders is null/undefined', () => {
    const cand = produceShlokaCandidate(
      { ...devotee, wants_shloka_reminders: null },
      '2026-11-08'
    );
    expect(cand).not.toBeNull();
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

  it('defers send time outside quiet hours when 19:00 falls in quiet window', () => {
    const quietDevotee: DevoteeProfileForShloka = {
      ...devotee,
      notification_quiet_hours_start: 18,
      notification_quiet_hours_end: 6,
    };
    const cand = produceShlokaCandidate(quietDevotee, '2026-11-08');
    expect(cand).not.toBeNull();
    const scheduled = new Date(cand!.scheduled_for);
    // 07:00 IST is 01:30 UTC
    expect(scheduled.toISOString()).toContain('T01:30:00.000Z');
  });
});
