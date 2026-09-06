import { describe, expect, it } from 'vitest';
import { STOTRAMS, MOOD_META, DEITY_META } from './stotrams';

describe('Sacred Library mood vocabulary -- MOOD_META must match real content tags', () => {
  it('every MOOD_META key matches at least one real stotram (no dead filter buttons)', () => {
    for (const key of Object.keys(MOOD_META)) {
      const matches = STOTRAMS.filter((s) => s.mood === key);
      expect(matches.length, `MOOD_META key "${key}" matches zero stotrams -- this button would return an empty list`).toBeGreaterThan(0);
    }
  });

  it('every mood value actually present on a stotram has a MOOD_META entry (every real mood is selectable)', () => {
    const usedMoods = new Set(STOTRAMS.map((s) => s.mood).filter((m): m is NonNullable<typeof m> => Boolean(m)));
    for (const mood of usedMoods) {
      expect(MOOD_META[mood], `Stotrams are tagged mood="${mood}" but MOOD_META has no entry for it`).toBeDefined();
    }
  });

  it('the old, disjoint mood vocabulary is gone (regression guard)', () => {
    for (const staleKey of ['morning', 'evening', 'meditation', 'festival', 'difficult']) {
      expect(MOOD_META[staleKey], `"${staleKey}" was the old, never-matching vocabulary -- it must not reappear`).toBeUndefined();
    }
  });

  it('matches the live catalog composition exactly (56 items across 6 moods)', () => {
    const counts: Record<string, number> = {};
    for (const s of STOTRAMS) {
      if (!s.mood) continue;
      counts[s.mood] = (counts[s.mood] ?? 0) + 1;
    }
    expect(counts).toEqual({
      devotional: 21,
      meditative: 15,
      energetic: 7,
      protective: 6,
      gratitude: 5,
      celebratory: 2,
    });
  });
});

describe('Sacred Library filtering -- the exact predicate the API route and both clients use', () => {
  function filterStotrams(params: { tradition?: string; deity?: string; mood?: string; type?: string }) {
    return STOTRAMS.filter((s) => {
      const traditionOk = !params.tradition || params.tradition === 'all' || s.tradition === params.tradition || s.tradition === 'all';
      const deityOk = !params.deity || params.deity === 'all' || s.deity === params.deity || s.deity === 'universal';
      const moodOk = !params.mood || params.mood === 'all' || s.mood === params.mood;
      const typeOk = !params.type || params.type === 'all' || s.type === params.type;
      return traditionOk && deityOk && moodOk && typeOk;
    });
  }

  it('every selectable mood button returns a non-empty result set on its own', () => {
    for (const mood of Object.keys(MOOD_META)) {
      expect(filterStotrams({ mood }).length).toBeGreaterThan(0);
    }
  });

  it('combining mood with tradition/deity/type narrows results but a valid combination still returns some', () => {
    // devotional is the largest bucket (21) and spans multiple deities/traditions
    // in the real catalog, so at least a hindu+devotional combination should
    // never be empty.
    const combined = filterStotrams({ mood: 'devotional', tradition: 'hindu' });
    expect(combined.length).toBeGreaterThan(0);
    expect(combined.every((s) => s.mood === 'devotional' && s.tradition === 'hindu')).toBe(true);
  });

  it('an impossible combination (type that no item of that mood has) returns empty, not an error', () => {
    // `type` has no "universal fallback" escape hatch the way `deity` does
    // (deityOk also matches s.deity === 'universal' regardless of the
    // requested deity), so a type+mood pair with zero real overlap makes a
    // reliable negative case.
    const types = new Set(STOTRAMS.map((s) => s.type).filter(Boolean));
    let someType: string | undefined;
    let unusedMood: string | undefined;
    for (const type of types) {
      const typeMoods = new Set(STOTRAMS.filter((s) => s.type === type).map((s) => s.mood));
      const candidate = Object.keys(MOOD_META).find((m) => !typeMoods.has(m as never));
      if (candidate) {
        someType = type;
        unusedMood = candidate;
        break;
      }
    }
    expect(someType, 'expected at least one type+mood combination with zero matches to exist as a real negative case').toBeDefined();
    expect(unusedMood).toBeDefined();
    const result = filterStotrams({ type: someType, mood: unusedMood });
    expect(result).toEqual([]);
  });

  it('"all" mood plus "all" other filters (clear-all) returns the full catalog', () => {
    expect(filterStotrams({ tradition: 'all', deity: 'all', mood: 'all', type: 'all' }).length).toBe(STOTRAMS.length);
  });

  it('no filter params at all (equivalent to clear-all) returns the full catalog', () => {
    expect(filterStotrams({}).length).toBe(STOTRAMS.length);
  });
});

describe('DEITY_META sanity (unaffected by this change, checked as a baseline)', () => {
  it('every DEITY_META key matches at least one stotram or is the universal fallback', () => {
    for (const key of Object.keys(DEITY_META)) {
      if (key === 'universal') continue;
      const matches = STOTRAMS.filter((s) => s.deity === key);
      expect(matches.length, `DEITY_META key "${key}" matches zero stotrams`).toBeGreaterThan(0);
    }
  });
});
