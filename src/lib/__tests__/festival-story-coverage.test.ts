import { describe, expect, it } from 'vitest';
import rules from '../../../packages/dharma-rules/src/festivals/rules.json';
import festivalContent from '../../../packages/dharma-rules/src/festivals/festival-content.json';
import { FESTIVAL_STORIES, getFestivalStory } from '../festival-stories';

describe('festival story coverage and claim boundaries', () => {
  it('resolves launch-included stories and keeps source-pending narratives withheld', () => {
    // Radha Ashtami is calendar-visible while its narrative remains pending
    // source review. Keep that gate closed rather than invent story content.
    const pendingStorySlugs = new Set(['radha-ashtami']);
    const missing = rules
      .filter((rule) => rule.launch_status === 'included')
      .filter((rule) => !pendingStorySlugs.has(rule.slug))
      .filter((rule) => !getFestivalStory(rule.slug, rule.display_name))
      .map((rule) => rule.slug);

    expect(missing).toEqual([]);
    for (const slug of pendingStorySlugs) {
      const content = festivalContent.festivals.find((entry) => entry.definitionKey === slug);
      expect(content?.significance.status, `${slug} story remains withheld pending source review`).toBe('pending_source');
      expect(getFestivalStory(slug)).toBeNull();
    }
  });

  it('requires story citation structure without claiming that structure proves authenticity', () => {
    for (const story of FESTIVAL_STORIES) {
      expect(story.shloka.text.trim().length, story.slug).toBeGreaterThan(0);
      expect(story.shloka.translation.trim().length, story.slug).toBeGreaterThan(0);
      expect(story.shloka.source.trim().length, story.slug).toBeGreaterThan(0);
    }
  });
});
