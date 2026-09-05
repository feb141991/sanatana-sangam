import { describe, expect, it } from 'vitest';

import { getDailyFallbackQuiz } from '@/lib/quiz-fallback';

describe('getDailyFallbackQuiz', () => {
  it.each([
    ['hindu', 'en'], ['sikh', 'en'], ['buddhist', 'en'], ['jain', 'en'],
    ['hindu', 'hi'], ['sikh', 'hi'], ['buddhist', 'hi'], ['jain', 'hi'],
    ['hindu', 'pa'], ['sikh', 'pa'], ['buddhist', 'pa'], ['jain', 'pa'],
  ])('provides a quiz for %s in %s', (tradition, language) => {
    const fallback = getDailyFallbackQuiz(tradition, language, '2026-09-05');

    expect(fallback.quiz.question).toBeTruthy();
    expect(fallback.quiz.options).toHaveLength(4);
    expect(fallback.quiz.answerIndex).toBeGreaterThanOrEqual(0);
    expect(fallback.quiz.answerIndex).toBeLessThan(4);
  });

  it('uses the Punjabi shared fallback instead of an unrelated English or Hindu quiz', () => {
    const fallback = getDailyFallbackQuiz('jain', 'pa', '2026-09-05');

    expect(fallback.fallbackLanguage).toBeUndefined();
    expect(fallback.quiz.question).toContain('ਨਦੀ');
  });

  it('selects the same fallback for the same requested day', () => {
    expect(getDailyFallbackQuiz('hindu', 'en', '2026-09-05')).toEqual(
      getDailyFallbackQuiz('hindu', 'en', '2026-09-05'),
    );
  });
});
