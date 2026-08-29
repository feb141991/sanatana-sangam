import { describe, expect, it } from 'vitest';
import { HOME_OBSERVANCE_LOOKAHEAD_DAYS, getHomeObservanceWindowEnd } from './home-observance-window';

describe('Home observance window', () => {
  it('covers a complete lunar fortnight plus one day', () => {
    expect(HOME_OBSERVANCE_LOOKAHEAD_DAYS).toBe(16);
    expect(getHomeObservanceWindowEnd('2026-08-29')).toBe('2026-09-14');
  });

  it('crosses month and year boundaries deterministically', () => {
    expect(getHomeObservanceWindowEnd('2026-12-25')).toBe('2027-01-10');
  });
});
