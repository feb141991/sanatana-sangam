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
        sourceRefs: [{ sourceName: 'Reviewed Punya Kala window fixture', tier: 1 }],
      },
    };

    const res = produceSankrantiCandidate(context);
    expect(res.status).toBe('resolved');
    expect(res.candidate).not.toBeNull();

    const cand = res.candidate!;
    expect(cand.event_type).toBe('sankranti');
    expect(cand.event_id).toBe('makar-sankranti');
    expect(cand.event_instance).toBe('punyakala');
    expect(cand.local_date).toBe('2026-01-14');
    expect(cand.priority).toBe(30);
    expect(cand.title).toBe('Makar Sankranti - Punya Kala');
    expect(cand.body).toContain('Punya Kala auspicious window for Snana and Dana');
    expect(cand.source_refs).toEqual([{ sourceName: 'Reviewed Punya Kala window fixture', tier: 1 }]);

    // Start: 09:15 UTC -> scheduled 15m before -> 09:00 UTC
    expect(cand.scheduled_for).toBe('2026-01-14T09:00:00.000Z');
    expect(cand.expires_at).toBe('2026-01-14T12:30:00.000Z');
  });

  it('fails closed when only a transit instant is provided', () => {
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
    expect(res.status).toBe('needs_review');
    expect(res.candidate).toBeNull();
    expect(res.diagnostics).toContain('missing or incomplete reviewed punya kala boundaries');
  });

  it('fails closed when location latitude is missing', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_SANKRANTI = 'candidate';
    const res = produceSankrantiCandidate({
      userId: 'user-sankranti-no-lat',
      userTimezone: 'Asia/Kolkata',
      window: {
        sankrantiSlug: 'makar-sankranti',
        sankrantiName: 'Makar Sankranti',
        localDate: '2026-01-14',
        punyaKalaStart: '2026-01-14T09:15:00Z',
        punyaKalaEnd: '2026-01-14T12:30:00Z',
        sourceRefs: [{ sourceName: 'Reviewed fixture', tier: 1 }],
      },
    });
    expect(res.candidate).toBeNull();
    expect(res.status).toBe('needs_review');
    expect(res.diagnostics).toContain('missing_or_invalid_location_latitude');
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

  it('rejects legacy pipeline mode', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_SANKRANTI = 'legacy';
    const res = produceSankrantiCandidate({
      userId: 'user-sankranti-legacy',
      userTimezone: 'Asia/Kolkata',
      window: { sankrantiSlug: 'makar', sankrantiName: 'Makar Sankranti', localDate: '2026-01-14' },
    });
    expect(res.candidate).toBeNull();
    expect(res.diagnostics).toContain('sankranti_pipeline_mode_legacy');
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
