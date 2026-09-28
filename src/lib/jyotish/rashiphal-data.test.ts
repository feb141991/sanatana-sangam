import { describe, it, expect } from 'vitest';
import {
  getDailyHoroscope,
  getHouseStructure,
  findActiveDashaEntry,
  PLANET_HOUSE_GUIDANCE,
  type GuidancePlanet,
  type HouseNumber,
} from './rashiphal-data';

const PLANETS: GuidancePlanet[] = ['Chandra', 'Guru', 'Shani', 'Mangal', 'Rahu', 'Ketu'];
const HOUSES: HouseNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

describe('getDailyHoroscope PWA/legacy path is unaffected by the native opt-in', () => {
  it('produces byte-identical output whether called with no options or an explicit empty object', () => {
    // The PWA (src/app/(main)/rashiphala/RashiphalClient.tsx) calls this with
    // no 4th argument at all -- this is the exact call shape that must never
    // change behaviour, regardless of what the native-only opt-in adds.
    const date = new Date('2026-06-15T10:00:00Z');
    const withNoOptions = getDailyHoroscope('virgo', date, 'Asia/Kolkata');
    const withEmptyOptions = getDailyHoroscope('virgo', date, 'Asia/Kolkata', {});
    expect(withNoOptions).toEqual(withEmptyOptions);
  });

  it('never includes dashaContext or structure fields unless useDistinctGuidance is true', () => {
    const date = new Date('2026-06-15T10:00:00Z');
    const legacy = getDailyHoroscope('virgo', date, 'Asia/Kolkata');
    expect(legacy.dashaContext).toBeUndefined();
    expect(legacy.transitHighlights.every((h) => h.structure === undefined)).toBe(true);
  });

  it('still uses the legacy generic template when useDistinctGuidance is false', () => {
    const date = new Date('2026-06-15T10:00:00Z');
    const legacy = getDailyHoroscope('virgo', date, 'Asia/Kolkata', { useDistinctGuidance: false });
    for (const highlight of legacy.transitHighlights) {
      expect(highlight.detail).toMatch(/^\w+ activates /);
    }
  });

  it('adds an explicit interpretive-content notice only on the Native opt-in path', () => {
    const date = new Date('2026-06-15T10:00:00Z');
    const legacy = getDailyHoroscope('virgo', date, 'Asia/Kolkata');
    const native = getDailyHoroscope('virgo', date, 'Asia/Kolkata', { useDistinctGuidance: true });
    expect(legacy.accuracyNote).not.toContain('editorial Jyotish-inspired');
    expect(native.accuracyNote).toContain('editorial Jyotish-inspired');
    expect(native.accuracyNote).toContain('awaiting tradition-specific human review');
    expect(native.luckyColor).toBe(legacy.luckyColor);
    expect(native.health).toContain('cannot assess health');
  });
});

describe('PLANET_HOUSE_GUIDANCE completeness and distinctness', () => {
  it('has an entry for all 6 planets across all 12 houses', () => {
    for (const planet of PLANETS) {
      for (const house of HOUSES) {
        const entry = PLANET_HOUSE_GUIDANCE[planet][house];
        expect(entry, `${planet} house ${house}`).toBeDefined();
        expect(entry.text.length, `${planet} house ${house} text`).toBeGreaterThan(0);
        expect(['support', 'discipline', 'neutral']).toContain(entry.tone);
      }
    }
  });

  it('never gives two different planets identical text for the same house', () => {
    for (const house of HOUSES) {
      const textsForHouse = PLANETS.map((planet) => PLANET_HOUSE_GUIDANCE[planet][house].text);
      const unique = new Set(textsForHouse);
      expect(unique.size, `house ${house} should have ${PLANETS.length} distinct texts`).toBe(PLANETS.length);
    }
  });

  it('never repeats the exact same text across two different houses for the same planet', () => {
    for (const planet of PLANETS) {
      const textsForPlanet = HOUSES.map((house) => PLANET_HOUSE_GUIDANCE[planet][house].text);
      const unique = new Set(textsForPlanet);
      expect(unique.size, `${planet} should have ${HOUSES.length} distinct texts`).toBe(HOUSES.length);
    }
  });

  it('does not make medical, accident, or high-stakes financial/legal claims', () => {
    const unsafeClaim = /\b(accident|medical|diagnos(?:e|is)|health issue|debt|inheritance|lawsuit|sharp tools|vehicles?)\b/i;
    for (const planet of PLANETS) {
      for (const house of HOUSES) {
        expect(PLANET_HOUSE_GUIDANCE[planet][house].text, `${planet} house ${house}`).not.toMatch(unsafeClaim);
      }
    }
  });
});

describe('getHouseStructure', () => {
  it('tags houses with every applicable classical group, not just one', () => {
    // House 10 is both Kendra and Upachaya; house 6 is both Upachaya and Dusthana.
    expect(getHouseStructure(10).sort()).toEqual(['kendra', 'upachaya'].sort());
    expect(getHouseStructure(6).sort()).toEqual(['dusthana', 'upachaya'].sort());
  });

  it('hides house 1 classification pending the disputed-classification review gate', () => {
    expect(getHouseStructure(1)).toEqual([]);
  });

  it('returns an empty array for a house outside all four groups, never "neutral"', () => {
    expect(getHouseStructure(2)).toEqual([]);
  });

  it('covers every house from 1 to 12 without throwing', () => {
    for (const house of HOUSES) {
      expect(() => getHouseStructure(house)).not.toThrow();
    }
  });
});

describe('findActiveDashaEntry', () => {
  const validChartData = {
    schemaVersion: 2,
    dasha: {
      timeline: [
        { planet: 'Shani', startDate: '2020-01-01', endDate: '2039-01-01', years: 19, isCurrent: true },
        { planet: 'Budha', startDate: '2039-01-01', endDate: '2056-01-01', years: 17, isCurrent: false },
      ],
    },
  };

  it('finds the entry active on a date within its range', () => {
    const result = findActiveDashaEntry(validChartData, new Date('2026-06-15T00:00:00.000Z'));
    expect(result).toEqual({ planet: 'Shani', endDate: '2039-01-01' });
  });

  it('finds the entry exactly on its start-date boundary (inclusive)', () => {
    const result = findActiveDashaEntry(validChartData, new Date('2039-01-01T00:00:00.000Z'));
    expect(result?.planet).toBe('Budha');
  });

  it('treats the end-date boundary as exclusive (belongs to the next entry, not this one)', () => {
    // 2039-01-01T00:00:00.000Z is Shani's endDate AND Budha's startDate --
    // must resolve to Budha, never double-count Shani as still active.
    const result = findActiveDashaEntry(validChartData, new Date('2039-01-01T00:00:00.000Z'));
    expect(result?.planet).not.toBe('Shani');
  });

  it('returns null for a date before the first entry', () => {
    const result = findActiveDashaEntry(validChartData, new Date('2019-01-01T00:00:00.000Z'));
    expect(result).toBeNull();
  });

  it('returns null for a date after the last entry', () => {
    const result = findActiveDashaEntry(validChartData, new Date('2060-01-01T00:00:00.000Z'));
    expect(result).toBeNull();
  });

  it('returns null when chart_data is missing entirely', () => {
    expect(findActiveDashaEntry(null, new Date())).toBeNull();
    expect(findActiveDashaEntry(undefined, new Date())).toBeNull();
  });

  it('rejects chart_data with a mismatched schema version even if its timeline looks valid', () => {
    expect(findActiveDashaEntry({ ...validChartData, schemaVersion: 1 }, new Date('2026-06-15T00:00:00.000Z'))).toBeNull();
  });

  it('returns null when dasha.timeline is absent (older/malformed chart_data)', () => {
    expect(findActiveDashaEntry({ schemaVersion: 2 }, new Date())).toBeNull();
    expect(findActiveDashaEntry({ schemaVersion: 2, dasha: {} }, new Date())).toBeNull();
  });

  it('returns null when timeline entries are malformed', () => {
    const malformed = { schemaVersion: 2, dasha: { timeline: [{ planet: 'Shani', startDate: null, endDate: '2039-01-01' }] } };
    expect(findActiveDashaEntry(malformed, new Date('2026-01-01'))).toBeNull();
  });

  it('returns null for invalid date values and overlapping active ranges', () => {
    expect(findActiveDashaEntry(validChartData, new Date('invalid'))).toBeNull();
    const overlapping = {
      schemaVersion: 2,
      dasha: { timeline: [
        { planet: 'Shani', startDate: '2020-01-01', endDate: '2030-01-01' },
        { planet: 'Budha', startDate: '2025-01-01', endDate: '2040-01-01' },
      ] },
    };
    expect(findActiveDashaEntry(overlapping, new Date('2026-01-01T00:00:00.000Z'))).toBeNull();
  });

  it('never throws on a non-object chart_data', () => {
    expect(() => findActiveDashaEntry('garbage', new Date())).not.toThrow();
    expect(findActiveDashaEntry('garbage', new Date())).toBeNull();
  });
});
