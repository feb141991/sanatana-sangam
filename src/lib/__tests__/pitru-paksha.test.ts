import { describe, expect, it } from 'vitest';
import { getPitruPakshaDay, isInPitruPaksha } from '../pitru-paksha';

describe('Pitru Paksha astronomy-derived window', () => {
  it('derives the corrected 2026 Ujjain window instead of the removed Gregorian table', () => {
    expect(getPitruPakshaDay('2026-09-26')).toBeNull();
    expect(getPitruPakshaDay('2026-09-27')).toMatchObject({
      day: 1,
      totalDays: 14,
      isMahalaya: false,
      tithiName: 'Pratipada',
    });
    expect(getPitruPakshaDay('2026-10-10')).toMatchObject({
      day: 14,
      totalDays: 14,
      isMahalaya: true,
      tithiName: 'Mahalaya Amavasya',
    });
    expect(getPitruPakshaDay('2026-10-11')).toBeNull();
  });

  it('continues into future years without adding year constants', () => {
    expect(getPitruPakshaDay('2027-09-16')).toMatchObject({ day: 1, totalDays: 15 });
    expect(getPitruPakshaDay('2027-09-30')).toMatchObject({
      day: 15,
      isMahalaya: true,
    });
    expect(getPitruPakshaDay('2028-09-18')).toMatchObject({
      day: 15,
      isMahalaya: true,
    });
  });

  it('uses the supplied observance location and rejects dates outside the window', () => {
    const newYork = { lat: 40.7128, lon: -74.006, tz: 'America/New_York' };
    expect(isInPitruPaksha('2026-10-10', newYork)).toBe(true);
    expect(isInPitruPaksha('2026-10-11', newYork)).toBe(false);
  });
});
