import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { produceSankrantiCandidate, type SankrantiCandidateContext } from './sankranti-candidate-producer';

describe('sankranti-candidate-producer', () => {
  const originalEnv = process.env.NOTIFICATION_CANDIDATE_MODE_SANKRANTI;

  beforeEach(() => {
    delete process.env.NOTIFICATION_CANDIDATE_MODE_SANKRANTI;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NOTIFICATION_CANDIDATE_MODE_SANKRANTI = originalEnv;
    } else {
      delete process.env.NOTIFICATION_CANDIDATE_MODE_SANKRANTI;
    }
  });

  it('defaults to disabled when env var is unset', () => {
    const context: SankrantiCandidateContext = {
      userId: 'user-sankranti-1',
      userTimezone: 'Asia/Kolkata',
      latitude: 19.076,
      longitude: 72.877,
      window: {
        sankrantiSlug: 'makar-sankranti',
        sankrantiName: 'Makar Sankranti',
        localDate: '2026-01-14',
        transitInstant: '2026-01-14T09:15:00Z',
      },
    };

    const res = produceSankrantiCandidate(context);
    expect(res.candidate).toBeNull();
    expect(res.status).toBe('suppressed');
    expect(res.diagnostics[0]).toContain('disabled');
  });

  it('produces candidate when mode is candidate with valid punya kala window', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_SANKRANTI = 'candidate';

    const context: SankrantiCandidateContext = {
      userId: 'user-sankranti-2',
      userTimezone: 'Asia/Kolkata',
      latitude: 28.6139,
      longitude: 77.2090,
      window: {
        sankrantiSlug: 'makar-sankranti',
        sankrantiName: 'Makar Sankranti',
        localDate: '2026-01-14',
        transitInstant: '2026-01-14T09:15:00Z',
        punyaKalaStart: '2026-01-14T09:15:00Z',
        punyaKalaEnd: '2026-01-14T12:30:00Z',
      },
    };

    const res = produceSankrantiCandidate(context);
    expect(res.status).toBe('resolved');
    expect(res.candidate).not.toBeNull();

    const cand = res.candidate!;
    expect(cand.notification_key).toBe('sankranti:makar-sankranti:punyakala:2026-01-14:general');
    expect(cand.event_type).toBe('sankranti');
    expect(cand.priority_class).toBe('approved_ritual_window');
    expect(cand.priority_score).toBe(30);
    expect(cand.title).toBe('Makar Sankranti - Punya Kala');
    expect(cand.body).toContain('Punya Kala auspicious window for Snana and Dana');
    expect(cand.data?.canonical_source).toBe('Surya Siddhanta & Dharma Sindhu');

    // Start: 09:15 UTC -> scheduled 15m before -> 09:00 UTC
    expect(cand.scheduled_for).toBe('2026-01-14T09:00:00.000Z');
    expect(cand.expires_at).toBe('2026-01-14T12:30:00.000Z');
  });

  it('derives canonical punya kala if only transit instant is provided', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_SANKRANTI = 'candidate';

    const context: SankrantiCandidateContext = {
      userId: 'user-sankranti-3',
      userTimezone: 'Asia/Kolkata',
      latitude: 13.0827,
      longitude: 80.2707,
      window: {
        sankrantiSlug: 'mesha-sankranti',
        sankrantiName: 'Mesha Sankranti',
        localDate: '2026-04-14',
        transitInstant: '2026-04-14T04:00:00Z',
      },
    };

    const res = produceSankrantiCandidate(context);
    expect(res.status).toBe('resolved');
    expect(res.candidate).not.toBeNull();
    // Scheduled 15m before transit: 03:45 UTC
    expect(res.candidate?.scheduled_for).toBe('2026-04-14T03:45:00.000Z');
    // Standard 384 min (6.4h) window: 04:00 + 6h24m = 10:24 UTC
    expect(res.candidate?.expires_at).toBe('2026-04-14T10:24:00.000Z');
  });

  it('suppresses candidate if user opted out of sankranti/observance reminders', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_SANKRANTI = 'candidate';

    const context: SankrantiCandidateContext = {
      userId: 'user-sankranti-4',
      userTimezone: 'Asia/Kolkata',
      wantsSankrantiReminders: false,
      window: {
        sankrantiSlug: 'makar-sankranti',
        sankrantiName: 'Makar Sankranti',
        localDate: '2026-01-14',
        transitInstant: '2026-01-14T09:15:00Z',
      },
    };

    const res = produceSankrantiCandidate(context);
    expect(res.candidate).toBeNull();
    expect(res.status).toBe('suppressed');
    expect(res.diagnostics[0]).toContain('opted out');
  });

  it('fails closed when latitude is polar or high-latitude (|lat| > 60)', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_SANKRANTI = 'candidate';

    const context: SankrantiCandidateContext = {
      userId: 'user-sankranti-polar',
      userTimezone: 'Europe/Helsinki',
      latitude: 65.0,
      longitude: 25.46,
      window: {
        sankrantiSlug: 'makar-sankranti',
        sankrantiName: 'Makar Sankranti',
        localDate: '2026-01-14',
        transitInstant: '2026-01-14T09:15:00Z',
      },
    };

    const res = produceSankrantiCandidate(context);
    expect(res.candidate).toBeNull();
    expect(res.status).toBe('needs_review');
    expect(res.diagnostics[0]).toContain('polar/high-latitude');
  });

  it('fails closed when punya kala window is inverted or invalid', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_SANKRANTI = 'candidate';

    const context: SankrantiCandidateContext = {
      userId: 'user-sankranti-inverted',
      userTimezone: 'Asia/Kolkata',
      latitude: 19.076,
      longitude: 72.877,
      window: {
        sankrantiSlug: 'makar-sankranti',
        sankrantiName: 'Makar Sankranti',
        localDate: '2026-01-14',
        punyaKalaStart: '2026-01-14T12:00:00Z',
        punyaKalaEnd: '2026-01-14T10:00:00Z', // start > end
      },
    };

    const res = produceSankrantiCandidate(context);
    expect(res.candidate).toBeNull();
    expect(res.status).toBe('needs_review');
    expect(res.diagnostics[0]).toContain('inverted');
  });
});
