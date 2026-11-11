import { describe, expect, it } from 'vitest';
import { CANONICAL_RULES } from './rules';
import { SikhLunarAnchorHandler } from './engine';

const amritsar = { lat: 31.634, lon: 74.872, tz: 'Asia/Kolkata' };

describe('Sikh lunar anchors', () => {
  it('uses the declared anchors outside the printed edition', () => {
    const expected: Record<string, Record<number, string | null>> = {
      'guru-nanak-gurpurab': { 2027: '2027-11-14', 2028: '2028-11-02', 2029: '2029-11-20', 2030: '2030-11-10' },
      'guru-gobind-singh-gurpurab': { 2027: '2027-01-15', 2028: '2028-01-04', 2029: null, 2030: '2030-01-10' },
      'guru-tegh-bahadur-martyrdom': { 2027: '2027-12-03', 2028: '2028-11-21', 2029: '2029-12-10', 2030: '2030-11-29' },
    };
    for (const [slug, years] of Object.entries(expected)) {
      const rule = CANONICAL_RULES.find(candidate => candidate.slug === slug);
      expect(rule?.sikh_lunar_anchor, slug).toBeDefined();
      for (const [year, date] of Object.entries(years)) {
        const result = SikhLunarAnchorHandler.evaluate(rule!, Number(year), amritsar);
        expect(result[0]?.date ?? null, `${slug} ${year}`).toBe(date);
        if (date && Number(year) !== 2027) expect(result[0]?.calendarProvenance.provenance).toBe('computed_expected');
      }
    }
  });

  it('does not silently substitute the old fixed Gregorian table', () => {
    const rule = CANONICAL_RULES.find(candidate => candidate.slug === 'guru-tegh-bahadur-martyrdom')!;
    const result = SikhLunarAnchorHandler.evaluate(rule, 2028, amritsar)[0];
    expect(result.date).not.toBe('2028-11-23');
    expect(result.calendarProvenance.reason).toContain('lunar anchor');
  });
});
