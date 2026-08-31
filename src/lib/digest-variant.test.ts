import { describe, expect, it } from 'vitest';

import { buildDigestPanchangSignature } from '@/lib/digest-variant';

describe('buildDigestPanchangSignature', () => {
  const base = {
    tithi: 11,
    tithiName: 'Ekadashi',
    paksha: 'Shukla',
    nakshatra: 'Rohini',
    weekday: 'Monday',
  };

  it('is stable for equivalent Panchang inputs', () => {
    expect(buildDigestPanchangSignature(base as never)).toBe(
      buildDigestPanchangSignature({ ...base } as never),
    );
  });

  it('separates variants whose Panchang differs', () => {
    expect(buildDigestPanchangSignature(base as never)).not.toBe(
      buildDigestPanchangSignature({ ...base, nakshatra: 'Mrigashira' } as never),
    );
  });
});
