import { describe, expect, it } from 'vitest';
import { getFullRecommendationsForMood } from './engine';

describe('mood recommendation activity ranking', () => {
  it('leaves the baseline unchanged when no activity history is supplied', () => {
    const baseline = getFullRecommendationsForMood('grateful');
    const withoutHistory = getFullRecommendationsForMood('grateful', undefined, []);
    expect(withoutHistory.map((item) => item.id)).toEqual(baseline.map((item) => item.id));
  });

  it('moves completed practice types up and skipped types down in the actual recommendation output', () => {
    const baseline = getFullRecommendationsForMood('grateful');
    const personalized = getFullRecommendationsForMood('grateful', undefined, [{
      completed_action: 'pathshala',
      clicked_action: 'japa',
      skipped_actions: ['stotram'],
    }]);
    expect(personalized[0]?.type).toBe('pathshala');
    expect(personalized[1]?.type).toBe('japa');
    expect(personalized.at(-1)?.type).toBe('stotram');
    expect(personalized.map((item) => item.id).sort()).toEqual(baseline.map((item) => item.id).sort());
  });
});
