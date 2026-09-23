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
      paranaStart: '2026-12-21T01:30:00Z',
      paranaEnd: '2026-12-21T05:00:00Z',
      sourceRefs: [{ sourceName: 'Reviewed parana window fixture', tier: 1 }],
    },
  };

  it('defaults to disabled when env var is unset', () => {
    const res = produceParanaCandidate(baseContext);
    expect(res.candidate).toBeNull();
    expect(res.status).toBe('suppressed');
    expect(res.diagnostics[0]).toContain('pipeline_mode_disabled');
  });

  it('fails closed when Hari Vasara end is missing', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_EKADASHI_PARANA = 'candidate';
    const res = produceParanaCandidate(baseContext);
    expect(res.candidate).toBeNull();
    expect(res.status).toBe('needs_review');
    expect(res.diagnostics).toContain('missing_reviewed_parana_boundaries');
  });

  it('produces a database-shaped candidate when the reviewed window is complete', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_EKADASHI_PARANA = 'candidate';

    const res = produceParanaCandidate({
      ...baseContext,
      window: {
        ...baseContext.window,
        hariVasaraEnd: '2026-12-21T01:15:00Z',
        paranaStart: '2026-12-21T01:30:00Z',
      },
    });
    expect(res.status).toBe('resolved');
    expect(res.candidate).not.toBeNull();
    const c = res.candidate!;
    expect(c.user_id).toBe('user-parana-1');
    expect(c.event_type).toBe('ekadashi_parana');
    expect(c.priority).toBe(30);
    expect(c.event_id).toBe('mokshada-ekadashi');
    expect(c.event_instance).toBe('parana');
    expect(c.local_date).toBe('2026-12-21');
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
        paranaStart: '2026-12-21T02:30:00Z',
        paranaEnd: '2026-12-21T05:00:00Z',
      },
    });

    expect(res.status).toBe('resolved');
    expect(res.candidate).not.toBeNull();
    expect(res.candidate?.metadata).toMatchObject({ paranaStart: '2026-12-21T02:30:00.000Z' });
  });

  it('rejects a configured legacy mode instead of producing candidate rows', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_EKADASHI_PARANA = 'legacy';
    const res = produceParanaCandidate(baseContext);
    expect(res.candidate).toBeNull();
    expect(res.diagnostics).toContain('ekadashi_parana_pipeline_mode_legacy');
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

  it('fails closed when location latitude is missing', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_EKADASHI_PARANA = 'candidate';
    const { latitude: _latitude, ...withoutLatitude } = baseContext;
    const res = produceParanaCandidate(withoutLatitude);
    expect(res.candidate).toBeNull();
    expect(res.status).toBe('needs_review');
    expect(res.diagnostics).toContain('missing_or_invalid_location_latitude');
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
        hariVasaraEnd: '2026-12-21T05:30:00Z',
        paranaStart: '2026-12-21T08:00:00Z',
        paranaEnd: '2026-12-21T05:30:00Z',
      },
    });

    expect(res.candidate).toBeNull();
    expect(res.status).toBe('needs_review');
    expect(res.diagnostics).toContain('inverted_parana_window_start_after_end');
  });
});
