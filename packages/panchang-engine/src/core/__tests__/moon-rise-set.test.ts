import { describe, it, expect } from 'vitest';
import {
  getMoonRiseSet,
  findNextMoonrise,
  getMoonUpperLimbAlt,
} from '../moon-rise-set.js';
import { getSunriseSunset } from '../astronomy.js';

describe('Topocentric Moonrise & Moonset Engine (Tracker 2.4, Defect D14)', () => {
  const UJJAIN = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
  const BEDFORD = { lat: 52.1356, lon: -0.4685, tz: 'Europe/London' };

  it('T1: Full moon rises near sunset (within ~45 min)', () => {
    // Phalguna Purnima: 2026-03-03
    const date = new Date('2026-03-03T12:00:00Z');
    const riseSet = getMoonRiseSet(date, UJJAIN.lat, UJJAIN.lon, UJJAIN.tz);
    expect(riseSet.ok).toBe(true);
    if (!riseSet.ok) return;

    expect(riseSet.moonrise).not.toBeNull();
    const sun = getSunriseSunset(UJJAIN.lat, UJJAIN.lon, date);
    expect(sun.sunset).not.toBeNull();
    if (!riseSet.moonrise || !sun.sunset) return;

    const diffMin = Math.abs(riseSet.moonrise.getTime() - sun.sunset.getTime()) / 60_000;
    expect(diffMin).toBeLessThan(45);
  });

  it('T2: New moon rises near sunrise (within ~60 min)', () => {
    // Phalguna Amavasya: 2026-02-17
    const date = new Date('2026-02-17T12:00:00Z');
    const riseSet = getMoonRiseSet(date, UJJAIN.lat, UJJAIN.lon, UJJAIN.tz);
    expect(riseSet.ok).toBe(true);
    if (!riseSet.ok) return;

    expect(riseSet.moonrise).not.toBeNull();
    const sun = getSunriseSunset(UJJAIN.lat, UJJAIN.lon, date);
    expect(sun.sunrise).not.toBeNull();
    if (!riseSet.moonrise || !sun.sunrise) return;

    const diffMin = Math.abs(riseSet.moonrise.getTime() - sun.sunrise.getTime()) / 60_000;
    expect(diffMin).toBeLessThan(60);
  });

  it('T3: Moonrise advances ~30-80 min/day on average over a lunation', () => {
    const d1 = new Date('2026-02-01T12:00:00Z');
    const mr1 = findNextMoonrise(d1, UJJAIN.lat, UJJAIN.lon);
    expect(mr1).not.toBeNull();
    if (!mr1) return;

    const mr2 = findNextMoonrise(new Date(mr1.getTime() + 60_000), UJJAIN.lat, UJJAIN.lon);
    expect(mr2).not.toBeNull();
    if (!mr2) return;

    const diffMin = (mr2.getTime() - mr1.getTime()) / 60_000 - 1440;
    expect(diffMin).toBeGreaterThan(30);
    expect(diffMin).toBeLessThan(80);
  });

  it('T4: Over a 30-day span at mid-latitude, AT LEAST ONE civil date has moonrise === null', () => {
    let nullCount = 0;
    for (let i = 0; i < 30; i++) {
      const date = new Date(new Date('2026-02-01T12:00:00Z').getTime() + i * 86_400_000);
      const res = getMoonRiseSet(date, UJJAIN.lat, UJJAIN.lon, UJJAIN.tz);
      expect(res.ok).toBe(true);
      if (res.ok && res.moonrise === null) {
        nullCount++;
      }
    }
    expect(nullCount).toBeGreaterThanOrEqual(1);
  });

  it('T5: Determinism and Monotonicity — findNextMoonrise(t) > t always', () => {
    const instant = new Date('2026-02-15T12:00:00Z');
    const nextMr1 = findNextMoonrise(instant, UJJAIN.lat, UJJAIN.lon);
    const nextMr2 = findNextMoonrise(instant, UJJAIN.lat, UJJAIN.lon);

    expect(nextMr1).not.toBeNull();
    expect(nextMr2).not.toBeNull();
    if (!nextMr1 || !nextMr2) return;

    expect(nextMr1.getTime()).toBe(nextMr2.getTime());
    expect(nextMr1.getTime()).toBeGreaterThan(instant.getTime());
  });

  it('T6: Bedford vs Ujjain on the same date give materially different times', () => {
    const date = new Date('2026-02-17T12:00:00Z');
    const resUjjain = getMoonRiseSet(date, UJJAIN.lat, UJJAIN.lon, UJJAIN.tz);
    const resBedford = getMoonRiseSet(date, BEDFORD.lat, BEDFORD.lon, BEDFORD.tz);

    expect(resUjjain.ok && resBedford.ok).toBe(true);
    if (!resUjjain.ok || !resBedford.ok) return;
    if (!resUjjain.moonrise || !resBedford.moonrise) return;

    const diffMin = Math.abs(resUjjain.moonrise.getTime() - resBedford.moonrise.getTime()) / 60_000;
    expect(diffMin).toBeGreaterThan(15);
  });

  it('T7: High-latitude case returns typed failure for circumpolar moon, never garbage', () => {
    const summerSolstice = new Date('2026-06-21T12:00:00Z');
    const resPolar = getMoonRiseSet(summerSolstice, 78.22, 15.65, 'Arctic/Longyearbyen');
    if (!resPolar.ok) {
      expect(resPolar.reason).toContain('latitude');
    } else {
      expect(resPolar.diagnostics).toContain('latitude_proxy');
    }
  });

  it('T8: Topocentric sanity — results differ measurably from geocentric calculation (parallax proof)', () => {
    const t1 = new Date('2026-02-15T23:00:00Z');
    const t2 = new Date('2026-02-16T00:30:00Z');

    const getZero = (isTopo: boolean) => {
      const step = 15 * 60_000;
      let prev = getMoonUpperLimbAlt(t1, UJJAIN.lat, UJJAIN.lon, isTopo);
      for (let t = t1.getTime() + step; t <= t2.getTime(); t += step) {
        const cur = getMoonUpperLimbAlt(new Date(t), UJJAIN.lat, UJJAIN.lon, isTopo);
        if (prev <= 0 && cur > 0) {
          let low = t - step;
          let high = t;
          let aLow = prev;
          while (high - low > 1000) {
            const mid = Math.floor((low + high) / 2);
            const aMid = getMoonUpperLimbAlt(new Date(mid), UJJAIN.lat, UJJAIN.lon, isTopo);
            if (aLow <= 0 && aMid > 0) high = mid;
            else { low = mid; aLow = aMid; }
          }
          return new Date((low + high) / 2);
        }
        prev = cur;
      }
      return null;
    };

    const topoRise = getZero(true);
    const geoRise = getZero(false);

    expect(topoRise).not.toBeNull();
    expect(geoRise).not.toBeNull();
    if (!topoRise || !geoRise) return;

    const diffSec = Math.abs(topoRise.getTime() - geoRise.getTime()) / 1000;
    // Parallax shifts moonrise by > 120 seconds (implied by ~1 deg horizontal parallax)
    expect(diffSec).toBeGreaterThan(120);
  });
});
