import { describe, expect, it } from 'vitest';
import rules from '../../../packages/dharma-rules/src/festivals/rules.json';
import { FESTIVAL_STORIES, getFestivalStory } from '../festival-stories';

describe('festival story coverage and claim boundaries', () => {
  it('resolves every launch-included rule by canonical slug or display name', () => {
    const missing = rules
      .filter((rule) => rule.launch_status === 'included')
      .filter((rule) => !getFestivalStory(rule.slug, rule.display_name))
      .map((rule) => rule.slug);

    expect(missing).toEqual([]);
  });

  it('requires story citation structure without claiming that structure proves authenticity', () => {
    for (const story of FESTIVAL_STORIES) {
      expect(story.shloka.text.trim().length, story.slug).toBeGreaterThan(0);
      expect(story.shloka.translation.trim().length, story.slug).toBeGreaterThan(0);
      expect(story.shloka.source.trim().length, story.slug).toBeGreaterThan(0);
    }
  });
});
