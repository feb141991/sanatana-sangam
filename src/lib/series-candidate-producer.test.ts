import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { produceSeriesCandidates, type ReviewedSeriesOccurrence } from './series-candidate-producer';

describe('series-candidate-producer', () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv };
    delete process.env.NOTIFICATION_CANDIDATE_MODE_OBSERVANCE_SERIES;
  });

  afterEach(() => {
    process.env = origEnv;
  });

  const mockChild: ReviewedSeriesOccurrence = {
    status: 'resolved',
    slug: 'navratri-day-1-shailaputri',
    civilDate: '2026-10-11',
    calendarProfile: 'legacy-ujjain',
    publicationStatus: 'published',
    reviewStatus: 'reviewed',
    verificationStatus: 'verified',
    auditStatus: 'completed',
    finalDateSource: 'calculation_engine_reviewed',
    sourceRefs: [{ sourceName: 'Reviewed canonical occurrence fixture', tier: 1 }],
    tradition: 'hindu',
  };

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
    expect(candidate.priority).toBe(20);
    expect(candidate.event_id).toBe('navratri-day-1-shailaputri');
    expect(candidate.event_instance).toBe('sharad-navratri');
    expect(candidate.local_date).toBe('2026-10-11');
    expect(candidate.scheduled_for).toBe('2026-10-11T01:30:00.000Z');
    expect(candidate.title).toContain('Sharad Navratri');
    expect(candidate.metadata).toMatchObject({ sourceCount: 9, timezone: 'Asia/Kolkata' });
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
