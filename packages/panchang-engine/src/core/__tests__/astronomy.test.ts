import { describe, it, expect } from 'vitest';
import { lahiriAyanamsha, LAHIRI_AYANAMSHA_JDE_MIN, LAHIRI_AYANAMSHA_JDE_MAX } from '../astronomy.js';

describe('Lahiri Ayanamsha Core Engine', () => {
  it('validates J2000.0 epoch value matches published 23° 51′ 11.23″ (23.85311944°)', () => {
    const J2000 = 2451545.0;
    const value = lahiriAyanamsha(J2000);
    expect(value).toBeCloseTo(23.85311944, 7);
  });

  it('validates historical epoch 1950.0 within 0.2 arcseconds of published value (23.154722°)', () => {
    const J1950 = 2433282.5;
    const value = lahiriAyanamsha(J1950);
    const diffArcsec = Math.abs(value - 23.154722) * 3600;
    expect(diffArcsec).toBeLessThan(0.2);
  });

  it('validates historical epoch 1900.0 within 0.1 arcseconds of published value (22.456444°)', () => {
    const J1900 = 2415020.0;
    const value = lahiriAyanamsha(J1900);
    const diffArcsec = Math.abs(value - 22.456444) * 3600;
    expect(diffArcsec).toBeLessThan(0.1);
  });

  it('validates future epoch 2026.0 within 0.1 arcseconds of published value (24.216361°)', () => {
    const J2026 = 2461041.5;
    const value = lahiriAyanamsha(J2026);
    const diffArcsec = Math.abs(value - 24.216361) * 3600;
    expect(diffArcsec).toBeLessThan(0.1);
  });

  it('throws RangeError outside supported range (1800-01-01 to 2100-12-31 CE)', () => {
    expect(() => lahiriAyanamsha(LAHIRI_AYANAMSHA_JDE_MIN - 1)).toThrow(RangeError);
    expect(() => lahiriAyanamsha(LAHIRI_AYANAMSHA_JDE_MAX + 1)).toThrow(RangeError);
  });
});
