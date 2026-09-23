import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { producePradoshaCandidate, type PradoshaCandidateContext } from './pradosha-candidate-producer';

describe('pradosha-candidate-producer', () => {
  const originalEnv = process.env.NOTIFICATION_CANDIDATE_MODE_PRADOSHA_KALA;

  beforeEach(() => {
    delete process.env.NOTIFICATION_CANDIDATE_MODE_PRADOSHA_KALA;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NOTIFICATION_CANDIDATE_MODE_PRADOSHA_KALA = originalEnv;
    } else {
      delete process.env.NOTIFICATION_CANDIDATE_MODE_PRADOSHA_KALA;
    }
  });

  it('defaults to disabled when env var is unset', () => {
    const context: PradoshaCandidateContext = {
      userId: 'user-pradosha-1',
      userTimezone: 'Asia/Kolkata',
      latitude: 19.076,
      longitude: 72.877,
      window: {
        observanceSlug: 'pradosh-vrat',
        observanceName: 'Pradosha Vrat',
        localDate: '2026-10-08',
        sunset: '2026-10-08T12:45:00Z',
      },
    };

    const res = producePradoshaCandidate(context);
    expect(res.candidate).toBeNull();
    expect(res.status).toBe('suppressed');
    expect(res.diagnostics[0]).toContain('disabled');
  });

  it('rejects legacy mode and missing timing boundaries', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_PRADOSHA_KALA = 'legacy';
    const context: PradoshaCandidateContext = {
      userId: 'user-pradosha-legacy',
      userTimezone: 'Asia/Kolkata',
      latitude: 19.076,
      window: {
        observanceSlug: 'pradosh-vrat',
        observanceName: 'Pradosha Vrat',
        localDate: '2026-10-08',
        sunset: '2026-10-08T12:45:00Z',
      },
    };
    expect(producePradoshaCandidate(context).diagnostics).toContain('pradosha_kala_pipeline_mode_legacy');

    process.env.NOTIFICATION_CANDIDATE_MODE_PRADOSHA_KALA = 'candidate';
    const result = producePradoshaCandidate(context);
    expect(result.candidate).toBeNull();
    expect(result.status).toBe('needs_review');
    expect(result.diagnostics).toContain('missing_reviewed_twilight_boundaries');
  });

  it('produces candidate when mode is candidate with valid sunset twilight window', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_PRADOSHA_KALA = 'candidate';

    const context: PradoshaCandidateContext = {
      userId: 'user-pradosha-2',
      userTimezone: 'Asia/Kolkata',
      latitude: 28.6139,
      longitude: 77.2090,
      window: {
        observanceSlug: 'shani-pradosh',
        observanceName: 'Shani Pradosh Vrat',
        localDate: '2026-10-24',
        sunset: '2026-10-24T12:15:00Z', // 17:45 IST
        twilightStart: '2026-10-24T11:30:00Z',
        twilightEnd: '2026-10-24T13:00:00Z',
        sourceRefs: [{ sourceName: 'Reviewed twilight window fixture', tier: 1 }],
      },
    };

    const res = producePradoshaCandidate(context);
    expect(res.status).toBe('resolved');
    expect(res.candidate).not.toBeNull();

    const cand = res.candidate!;
    expect(cand.event_type).toBe('pradosha_kala');
    expect(cand.event_id).toBe('shani-pradosh');
    expect(cand.event_instance).toBe('twilight');
    expect(cand.local_date).toBe('2026-10-24');
    expect(cand.priority).toBe(30);
    expect(cand.title).toBe('Shani Pradosh Vrat - Pradosha Kala');
    expect(cand.body).toContain('Pradosha Kala puja window');
    expect(cand.source_refs).toEqual([{ sourceName: 'Reviewed twilight window fixture', tier: 1 }]);

    // Sunset was 12:15 UTC (17:45 IST).
    // Twilight start = 12:15 - 45m = 11:30 UTC (17:00 IST)
    // Twilight end = 12:15 + 45m = 13:00 UTC (18:30 IST)
    // Scheduled 15m before start = 11:15 UTC
    expect(cand.scheduled_for).toBe('2026-10-24T11:15:00.000Z');
    expect(cand.expires_at).toBe('2026-10-24T13:00:00.000Z');
  });

  it('accepts explicit twilight window boundaries if provided', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_PRADOSHA_KALA = 'candidate';

    const context: PradoshaCandidateContext = {
      userId: 'user-pradosha-3',
      userTimezone: 'Asia/Kolkata',
      latitude: 13.0827,
      longitude: 80.2707,
      window: {
        observanceSlug: 'pradosham',
        observanceName: 'Pradosham',
        localDate: '2026-11-06',
        sunset: '2026-11-06T12:10:00Z',
        twilightStart: '2026-11-06T11:30:00Z',
        twilightEnd: '2026-11-06T12:50:00Z',
        sourceRefs: [{ sourceName: 'Reviewed twilight window fixture', tier: 1 }],
      },
    };

    const res = producePradoshaCandidate(context);
    expect(res.status).toBe('resolved');
    expect(res.candidate).not.toBeNull();
    expect(res.candidate?.scheduled_for).toBe('2026-11-06T11:15:00.000Z');
    expect(res.candidate?.expires_at).toBe('2026-11-06T12:50:00.000Z');
  });

  it('suppresses candidate if user opted out of pradosha reminders', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_PRADOSHA_KALA = 'candidate';

    const context: PradoshaCandidateContext = {
      userId: 'user-pradosha-4',
      userTimezone: 'Asia/Kolkata',
      wantsPradoshaReminders: false,
      window: {
        observanceSlug: 'pradosh-vrat',
        observanceName: 'Pradosha Vrat',
        localDate: '2026-10-08',
        sunset: '2026-10-08T12:45:00Z',
      },
    };

    const res = producePradoshaCandidate(context);
    expect(res.candidate).toBeNull();
    expect(res.status).toBe('suppressed');
    expect(res.diagnostics[0]).toContain('opted out');
  });

  it('fails closed when latitude is polar or high-latitude (|lat| > 60)', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_PRADOSHA_KALA = 'candidate';

    const context: PradoshaCandidateContext = {
      userId: 'user-pradosha-polar',
      userTimezone: 'Europe/Oslo',
      latitude: 69.6492, // Tromso, Norway
      longitude: 18.9553,
      window: {
        observanceSlug: 'pradosh-vrat',
        observanceName: 'Pradosha Vrat',
        localDate: '2026-12-15',
        sunset: '2026-12-15T11:00:00Z',
      },
    };

    const res = producePradoshaCandidate(context);
    expect(res.candidate).toBeNull();
    expect(res.status).toBe('needs_review');
    expect(res.diagnostics[0]).toContain('polar/high-latitude');
  });

  it('fails closed when location latitude is missing', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_PRADOSHA_KALA = 'candidate';
    const res = producePradoshaCandidate({
      userId: 'user-pradosha-no-lat',
      userTimezone: 'Asia/Kolkata',
      window: {
        observanceSlug: 'pradosh-vrat',
        observanceName: 'Pradosha Vrat',
        localDate: '2026-10-08',
        sunset: '2026-10-08T12:45:00Z',
        twilightStart: '2026-10-08T12:00:00Z',
        twilightEnd: '2026-10-08T13:30:00Z',
        sourceRefs: [{ sourceName: 'Reviewed fixture', tier: 1 }],
      },
    });
    expect(res.candidate).toBeNull();
    expect(res.status).toBe('needs_review');
    expect(res.diagnostics).toContain('missing_or_invalid_location_latitude');
  });

  it('fails closed when twilight window is inverted or invalid', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_PRADOSHA_KALA = 'candidate';

    const context: PradoshaCandidateContext = {
      userId: 'user-pradosha-inverted',
      userTimezone: 'Asia/Kolkata',
      latitude: 19.076,
      longitude: 72.877,
      window: {
        observanceSlug: 'pradosh-vrat',
        observanceName: 'Pradosha Vrat',
        localDate: '2026-10-08',
        sunset: '2026-10-08T12:45:00Z',
        twilightStart: '2026-10-08T13:00:00Z',
        twilightEnd: '2026-10-08T12:00:00Z', // start > end
        sourceRefs: [{ sourceName: 'Reviewed twilight window fixture', tier: 1 }],
      },
    };

    const res = producePradoshaCandidate(context);
    expect(res.candidate).toBeNull();
    expect(res.status).toBe('needs_review');
    expect(res.diagnostics[0]).toContain('inverted');
  });
});
