import { describe, expect, it } from 'vitest';
import { selectLearningEngagementType } from './learning-engagement-arbitration';

describe('learning-engagement-arbitration', () => {
  const userId = 'devotee-123';

  it('respects single opt-out preferences', () => {
    expect(
      selectLearningEngagementType(userId, '2026-11-08', {
        dharmVeerEnabled: false,
        quizEnabled: true,
      })
    ).toBe('quiz');

    expect(
      selectLearningEngagementType(userId, '2026-11-08', {
        dharmVeerEnabled: true,
        quizEnabled: false,
      })
    ).toBe('dharm_veer');

    expect(
      selectLearningEngagementType(userId, '2026-11-08', {
        dharmVeerEnabled: false,
        quizEnabled: false,
      })
    ).toBeNull();
  });

  it('deterministically selects exactly one learning type per date when both are enabled', () => {
    const dates = [
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
      '2026-11-09',
      '2026-11-10',
    ];

    const results = dates.map((date) =>
      selectLearningEngagementType(userId, date, { dharmVeerEnabled: true, quizEnabled: true })
    );

    // Assert that every date has a selection
    expect(results.every((r) => r === 'dharm_veer' || r === 'quiz')).toBe(true);

    // Assert balanced alternation across 10 days (both must appear at least once)
    expect(results.filter((r) => r === 'dharm_veer').length).toBeGreaterThan(0);
    expect(results.filter((r) => r === 'quiz').length).toBeGreaterThan(0);

    // Assert idempotency: calling repeatedly with same user and date returns exact same choice
    for (const date of dates) {
      const choice1 = selectLearningEngagementType(userId, date, { dharmVeerEnabled: true, quizEnabled: true });
      const choice2 = selectLearningEngagementType(userId, date, { dharmVeerEnabled: true, quizEnabled: true });
      expect(choice1).toBe(choice2);
    }
  });
});
