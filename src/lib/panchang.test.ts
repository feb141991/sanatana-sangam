import { describe, expect, it } from 'vitest';
import { getNextBrahmaMuhurtaInstant, getPanchangTimes } from './panchang';

// Tirana, Albania -- the real-world case this function exists to fix: a user
// here must never have their notification computed from Ujjain's sunrise.
const TIRANA_LAT = 41.3275;
const TIRANA_LON = 19.8189;

describe('getNextBrahmaMuhurtaInstant', () => {
  it('returns null when coordinates are missing, rather than defaulting to a fixed location', () => {
    const now = new Date('2026-09-10T12:00:00Z');
    expect(getNextBrahmaMuhurtaInstant(now, null, null)).toBeNull();
    expect(getNextBrahmaMuhurtaInstant(now, undefined, undefined)).toBeNull();
    expect(getNextBrahmaMuhurtaInstant(now, Number.NaN, TIRANA_LON)).toBeNull();
    expect(getNextBrahmaMuhurtaInstant(now, TIRANA_LAT, Number.NaN)).toBeNull();
  });

  it("returns today's instant when it has not yet passed", () => {
    const referenceDay = new Date('2026-09-10T00:00:00Z');
    const todayStart = getPanchangTimes(referenceDay, TIRANA_LAT, TIRANA_LON).brahmaMuhurtaStart;

    const justBefore = new Date(todayStart.getTime() - 60_000);
    const result = getNextBrahmaMuhurtaInstant(justBefore, TIRANA_LAT, TIRANA_LON);

    expect(result).not.toBeNull();
    expect(result!.getTime()).toBe(todayStart.getTime());
  });

  it("advances to tomorrow's instant once today's has already passed", () => {
    const referenceDay = new Date('2026-09-10T00:00:00Z');
    const todayStart = getPanchangTimes(referenceDay, TIRANA_LAT, TIRANA_LON).brahmaMuhurtaStart;
    const tomorrowRef = new Date(referenceDay.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStart = getPanchangTimes(tomorrowRef, TIRANA_LAT, TIRANA_LON).brahmaMuhurtaStart;

    const justAfter = new Date(todayStart.getTime() + 60_000);
    const result = getNextBrahmaMuhurtaInstant(justAfter, TIRANA_LAT, TIRANA_LON);

    expect(result).not.toBeNull();
    expect(result!.getTime()).toBe(tomorrowStart.getTime());
    // Sunrise drifts by at most a couple of minutes day to day -- this is
    // the real "next dawn", not a coincidental repeat of today's.
    expect(result!.getTime()).toBeGreaterThan(justAfter.getTime());
    expect(Math.abs(result!.getTime() - (todayStart.getTime() + 24 * 60 * 60 * 1000))).toBeLessThan(5 * 60_000);
  });

  it('never falls back to a different location silently -- Tirana and Ujjain compute different instants', () => {
    const now = new Date('2026-09-10T00:00:00Z');
    const tirana = getNextBrahmaMuhurtaInstant(now, TIRANA_LAT, TIRANA_LON);
    const ujjain = getNextBrahmaMuhurtaInstant(now, 23.1765, 75.7885);

    expect(tirana).not.toBeNull();
    expect(ujjain).not.toBeNull();
    // Different longitudes (~56 degrees apart) must not collapse to the
    // same UTC instant.
    expect(tirana!.getTime()).not.toBe(ujjain!.getTime());
  });
});
