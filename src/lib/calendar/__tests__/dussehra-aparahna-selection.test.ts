import { describe, expect, it } from 'vitest';
import { CANONICAL_RULES } from '../rules';
import {
  LunarTithiSpanHandler,
  precomputePanchangCorrectedForYear,
} from '../engine';

describe('Vijayadashami date selection', () => {
  it('uses the day Dashami prevails through Aparahna for the mainstream observance', () => {
    const rule = CANONICAL_RULES.find(candidate => candidate.slug === 'navratri-begins')!;
    const days = [
      { dateStr: '2026-10-20', panchang: { masaName: 'Ashwin', tithiIndex: 9 } },
      { dateStr: '2026-10-21', panchang: { masaName: 'Ashwin', tithiIndex: 10 } },
    ];

    const result = LunarTithiSpanHandler.resolveSpan(rule, days, {
      lat: 23.1765,
      lon: 75.7885,
      tz: 'Asia/Kolkata',
    });

    expect(result.subObservanceDates.get('dussehra')).toBe('2026-10-20');
  });

  it('matches the real 2026 Ujjain computation and leaves Kolkata to its regional date', () => {
    const rule = CANONICAL_RULES.find(candidate => candidate.slug === 'navratri-begins')!;
    const locations = [
      { name: 'Ujjain', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
      { name: 'Kolkata', lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata' },
    ];

    const dates = locations.map(location => {
      const days = precomputePanchangCorrectedForYear(2026, location);
      return LunarTithiSpanHandler.resolveSpan(rule, days, location)
        .subObservanceDates.get('dussehra') ?? null;
    });

    expect(dates).toEqual(['2026-10-20', null]);
  });
});
