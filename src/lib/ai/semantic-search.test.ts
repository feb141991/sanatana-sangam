import { describe, expect, it } from 'vitest';
import { performSemanticPramanaSearch } from './semantic-search';

describe('Pramana Semantic Search', () => {
  it('returns empty results for blank query', async () => {
    const res = await performSemanticPramanaSearch({ query: '' });
    expect(res.total).toBe(0);
    expect(res.results).toEqual([]);
  });

  it('searches journal essays by keyword', async () => {
    const res = await performSemanticPramanaSearch({
      query: 'Brahma Muhurta awakening',
      category: 'journal',
    });

    expect(res.results.length).toBeGreaterThan(0);
    const top = res.results[0];
    expect(top.category).toBe('journal');
    expect(top.url).toContain('/journal/');
    expect(top.relevanceScore).toBeGreaterThan(0);
  });

  it('searches Dharm Veer heroes by name and legacy', async () => {
    const res = await performSemanticPramanaSearch({
      query: 'Chhatrapati Shivaji',
      category: 'hero',
    });

    expect(res.results.length).toBeGreaterThan(0);
    const hero = res.results.find((r) => r.title.includes('Shivaji'));
    expect(hero).toBeDefined();
    expect(hero?.category).toBe('hero');
    expect(hero?.tradition.toLowerCase()).toBe('hindu');
    expect(hero?.url).toContain('/dharm-veer/');
  });

  it('searches festival rules by festival slug or name', async () => {
    const res = await performSemanticPramanaSearch({
      query: 'Makar Sankranti',
      category: 'festival',
    });

    expect(res.results.length).toBeGreaterThan(0);
    const fest = res.results.find((r) => r.title.includes('Makar Sankranti'));
    expect(fest).toBeDefined();
    expect(fest?.category).toBe('festival');
    expect(fest?.url).toContain('/festivals/');
  });

  it('searches moral stories from Panchatantra', async () => {
    const res = await performSemanticPramanaSearch({
      query: 'lion rabbit well',
      category: 'story',
    });

    expect(res.results.length).toBeGreaterThan(0);
    const story = res.results[0];
    expect(story.category).toBe('story');
    expect(story.url).toContain('/stories/');
  });

  it('filters by tradition correctly', async () => {
    const res = await performSemanticPramanaSearch({
      query: 'meditation guru',
      tradition: 'sikh',
    });

    for (const r of res.results) {
      if (r.category === 'hero') {
        expect(r.tradition.toLowerCase()).toBe('sikh');
      }
    }
  });

  it('searches canonical scriptures including Patanjali Yoga Sutras', async () => {
    const res = await performSemanticPramanaSearch({
      query: 'chitta vritti nirodha',
      category: 'scripture',
    });

    expect(res.results.length).toBeGreaterThan(0);
    const top = res.results[0];
    expect(top.category).toBe('scripture');
    expect(top.content).toContain('Yoga');
  });

  it('honors result limit', async () => {
    const res = await performSemanticPramanaSearch({
      query: 'dharma peace',
      limit: 3,
    });

    expect(res.results.length).toBeLessThanOrEqual(3);
  });
});
