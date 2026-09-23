import { describe, expect, it } from 'vitest';
import {
  produceJapaCandidate,
  type DevoteeProfileForJapa,
} from './japa-candidate-producer';

describe('japa-candidate-producer', () => {
  const devotee: DevoteeProfileForJapa = {
    id: 'user-japa-1',
    timezone: 'Asia/Kolkata',
    japa_reminder_enabled: true,
    japa_reminder_time: '07:30',
  };

  it('produces candidate when enabled and not completed', () => {
    const cand = produceJapaCandidate(devotee, '2026-11-08', false);
    expect(cand).not.toBeNull();
    expect(cand!.event_type).toBe('japa');
    expect(cand!.event_id).toBe('japa-daily');
    expect(cand!.local_date).toBe('2026-11-08');
    expect(cand!.action_url).toBe('/japa');
    expect(cand!.priority).toBe(50);
    expect(cand!.title).toBe('🔔 Time for Japa');
    expect(cand!.body).toBe('Your daily Japa practice awaits. Keep your streak alive 🙏');
  });

  it('suppresses candidate when devotee has already completed Japa', () => {
    const cand = produceJapaCandidate(devotee, '2026-11-08', true);
    expect(cand).toBeNull();
  });

  it('suppresses candidate when japa_reminder_enabled is false', () => {
    const cand = produceJapaCandidate(
      { ...devotee, japa_reminder_enabled: false },
      '2026-11-08',
      false
    );
    expect(cand).toBeNull();
  });

  it('defers send time outside quiet hours window', () => {
    const quietDevotee: DevoteeProfileForJapa = {
      id: 'user-quiet',
      timezone: 'Asia/Kolkata',
      japa_reminder_enabled: true,
      japa_reminder_time: '23:30',
      notification_quiet_hours_start: 22,
      notification_quiet_hours_end: 6,
    };

    const cand = produceJapaCandidate(quietDevotee, '2026-11-08', false);
    expect(cand).not.toBeNull();
    const scheduled = new Date(cand!.scheduled_for);
    // 07:30 IST is 02:00 UTC
    expect(scheduled.toISOString()).toContain('T02:00:00.000Z');
  });
});
