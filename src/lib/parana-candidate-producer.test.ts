import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { produceParanaCandidate, type ParanaCandidateContext } from './parana-candidate-producer';

describe('parana-candidate-producer', () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv };
    delete process.env.NOTIFICATION_CANDIDATE_MODE_EKADASHI_PARANA;
  });

  afterEach(() => {
    process.env = origEnv;
  });

  const baseContext: ParanaCandidateContext = {
    userId: 'user-parana-1',
    userTimezone: 'Asia/Kolkata',
    wantsVratReminders: true,
    latitude: 23.1765,
    longitude: 75.7885,
    window: {
      ekadashiSlug: 'mokshada-ekadashi',
      ekadashiName: 'Mokshada Ekadashi',
      ekadashiDate: '2026-12-20',
      dwadashiDate: '2026-12-21',
      sunrise: '2026-12-21T01:30:00Z', // ~07:00 AM IST
      dwadashiEnd: '2026-12-21T05:00:00Z', // ~10:30 AM IST
      hariVasaraEnd: null,
    },
  };

  it('defaults to disabled when env var is unset', () => {
    const res = produceParanaCandidate(baseContext);
    expect(res.candidate).toBeNull();
    expect(res.status).toBe('suppressed');
    expect(res.diagnostics[0]).toContain('pipeline_mode_disabled');
  });

  it('produces candidate when mode is candidate with valid sunrise window', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_EKADASHI_PARANA = 'candidate';

    const res = produceParanaCandidate(baseContext);
    expect(res.status).toBe('resolved');
    expect(res.candidate).not.toBeNull();
    const c = res.candidate!;
    expect(c.user_id).toBe('user-parana-1');
    expect(c.event_type).toBe('ekadashi_parana');
    expect(c.priority_rank).toBe(3); // approved_ritual_window
    expect(c.numeric_priority).toBe(30);
    expect(c.candidate_key).toBe('ekadashi_parana:mokshada-ekadashi:parana:2026-12-21:general');
    expect(c.title).toContain('Mokshada Ekadashi Parana Window');
  });

  it('respects Hari Vasara end time if it extends beyond sunrise', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_EKADASHI_PARANA = 'candidate';

    const res = produceParanaCandidate({
      ...baseContext,
      window: {
        ...baseContext.window,
        // Hari Vasara ends 1 hour after sunrise
        hariVasaraEnd: '2026-12-21T02:30:00Z',
      },
    });

    expect(res.status).toBe('resolved');
    expect(res.candidate).not.toBeNull();
    expect(res.candidate?.metadata?.paranaStart).toBe('2026-12-21T02:30:00.000Z');
  });

  it('suppresses candidate if user opted out of vrat reminders', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_EKADASHI_PARANA = 'candidate';

    const res = produceParanaCandidate({
      ...baseContext,
      wantsVratReminders: false,
    });

    expect(res.candidate).toBeNull();
    expect(res.status).toBe('suppressed');
    expect(res.diagnostics).toContain('user_wants_vrat_reminders_false');
  });

  it('fails closed when latitude is polar or high-latitude (|lat| > 60)', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_EKADASHI_PARANA = 'candidate';

    const res = produceParanaCandidate({
      ...baseContext,
      latitude: 68.2, // Arctic Circle
    });

    expect(res.candidate).toBeNull();
    expect(res.status).toBe('needs_review');
    expect(res.diagnostics).toContain('polar_high_latitude_window_undefined');
  });

  it('fails closed when parana window is inverted or invalid', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_EKADASHI_PARANA = 'candidate';

    const res = produceParanaCandidate({
      ...baseContext,
      window: {
        ...baseContext.window,
        // Dwadashi ends before sunrise (inverted)
        sunrise: '2026-12-21T07:00:00Z',
        dwadashiEnd: '2026-12-21T06:00:00Z',
      },
    });

    expect(res.candidate).toBeNull();
    expect(res.status).toBe('needs_review');
    expect(res.diagnostics).toContain('inverted_parana_window_start_after_end');
  });
});
