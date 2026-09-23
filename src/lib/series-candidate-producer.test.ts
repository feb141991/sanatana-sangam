import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { produceSeriesCandidates } from './series-candidate-producer';
import type { ClientObservanceResult } from './calendar/observance-formatter';

describe('series-candidate-producer', () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv };
    delete process.env.NOTIFICATION_CANDIDATE_MODE_OBSERVANCE_SERIES;
  });

  afterEach(() => {
    process.env = origEnv;
  });

  const mockChild: ClientObservanceResult = ({
    status: 'resolved',
    id: 'occ-navratri-d1',
    slug: 'navratri-day-1-shailaputri',
    name: 'Navratri Day 1 — Shailaputri',
    civilDate: '2026-10-11',
    occurrenceDate: '2026-10-11',
    reviewPlacementDate: '2026-10-11',
    calendarProfile: 'legacy-ujjain',
    publicationStatus: 'published',
    reviewStatus: 'reviewed',
    verificationStatus: 'verified',
    verificationConfidence: 'high',
    finalDateSource: 'calculation_engine_reviewed',
    sourceRefs: [
      {
        sourceName: 'Rashtriya Panchang',
        pageOrSection: 'Pratipada',
        tier: 1,
        usagePermitted: 'academic_citation',
      },
    ],
    versions: { panchangaCore: '1.0', calendarProfile: '1.0', ruleEngine: '1.0', rule: '1.0' },
    profile: { calendar: 'legacy-ujjain', tradition: 'hindu' },
    location: { label: 'Ujjain', tz: 'Asia/Kolkata', lat: 23.1765, lon: 75.7885 },
  }) as any;

  it('defaults to disabled when env var is unset', () => {
    const res = produceSeriesCandidates({
      targetDate: '2026-10-11',
      userId: 'usr-1',
      userTimezone: 'Asia/Kolkata',
      childOccurrences: [mockChild],
    });
    expect(res.candidates).toHaveLength(0);
    expect(res.diagnostics[0]).toContain('pipeline_mode_disabled');
  });

  it('produces candidate when mode is candidate and child is published with sources', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_OBSERVANCE_SERIES = 'candidate';

    const res = produceSeriesCandidates({
      targetDate: '2026-10-11',
      userId: 'usr-1',
      userTimezone: 'Asia/Kolkata',
      wantsFestivalReminders: true,
      childOccurrences: [mockChild],
    });

    expect(res.candidates).toHaveLength(1);
    const candidate = res.candidates[0];
    expect(candidate.user_id).toBe('usr-1');
    expect(candidate.event_type).toBe('observance_series');
    expect(candidate.priority_rank).toBe(2);
    expect(candidate.numeric_priority).toBe(20);
    expect(candidate.candidate_key).toBe('observance_series:navratri-day-1-shailaputri:sharad-navratri:2026-10-11:general');
    expect(candidate.title).toContain('Sharad Navratri');
    expect(candidate.metadata?.sourceCount).toBe(1);
  });

  it('suppresses candidate if user opted out of festival reminders', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_OBSERVANCE_SERIES = 'candidate';

    const res = produceSeriesCandidates({
      targetDate: '2026-10-11',
      userId: 'usr-1',
      userTimezone: 'Asia/Kolkata',
      wantsFestivalReminders: false,
      childOccurrences: [mockChild],
    });

    expect(res.candidates).toHaveLength(0);
    expect(res.diagnostics).toContain('user_wants_festival_reminders_false');
  });

  it('fails closed when child occurrence lacks source references', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_OBSERVANCE_SERIES = 'candidate';

    const unsourcedChild = { ...mockChild, sourceRefs: [] };

    const res = produceSeriesCandidates({
      targetDate: '2026-10-11',
      userId: 'usr-1',
      userTimezone: 'Asia/Kolkata',
      childOccurrences: [unsourcedChild],
    });

    expect(res.candidates).toHaveLength(0);
    expect(res.diagnostics).toContain('child_navratri-day-1-shailaputri_missing_source_refs');
  });

  it('fails closed when child occurrence is not reviewed', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_OBSERVANCE_SERIES = 'candidate';

    const unreviewedChild = { ...mockChild, reviewStatus: 'under_review' as any };

    const res = produceSeriesCandidates({
      targetDate: '2026-10-11',
      userId: 'usr-1',
      userTimezone: 'Asia/Kolkata',
      childOccurrences: [unreviewedChild],
    });

    expect(res.candidates).toHaveLength(0);
    expect(res.diagnostics).toContain('child_navratri-day-1-shailaputri_not_published_or_reviewed');
  });
});
