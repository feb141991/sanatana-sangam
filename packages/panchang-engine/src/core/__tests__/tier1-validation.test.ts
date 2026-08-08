/**
 * Tracker 4.3 — astronomical validation against Tier-1 sources.
 *
 * Covers the §10 quantities left uncovered after moonrise/moonset/sunrise:
 * sunset, tithi boundary, nakshatra boundary, Sankranti instant, Nishita window.
 *
 * Tithi / nakshatra / Sankranti are validated at their ROOT — the apparent
 * geocentric longitudes of the Sun and Moon — because all three are simple
 * functions of those two numbers. See `fixtures/tier1-sites.ts` for why that is
 * a stronger check than matching a published pañcāṅga table.
 *
 * A fixture with `source: null` has never been read off an authority, so its
 * test is SKIPPED, not passed. `npm run fixtures:coverage` prints how many are
 * still outstanding, so a green suite can never be mistaken for full coverage.
 */
import { describe, it, expect } from 'vitest';
import { computeAstronomy, normalizeAngle } from '../astronomy.js';
import { getSunriseSunsetTimes } from '../astronomy-adapter.js';
import {
  TIER1_SITES,
  SUNSET_FIXTURES,
  LONGITUDE_FIXTURES,
  TOLERANCES,
} from './fixtures/tier1-sites.js';

const siteOf = (city: string) => {
  const s = TIER1_SITES.find(x => x.city === city);
  if (!s) throw new Error(`Fixture names a city absent from TIER1_SITES: ${city}`);
  return s;
};

/** Smallest signed difference between two angles, in degrees. */
function angleDelta(a: number, b: number): number {
  const d = normalizeAngle(a - b);
  return d > 180 ? d - 360 : d;
}

describe('4.3 — sunset vs Tier-1 authority', () => {
  for (const f of SUNSET_FIXTURES) {
    const label = `${f.city} ${f.dateStr}`;
    const run = f.source !== null && f.value !== null ? it : it.skip;

    run(`${label} sunset within ${TOLERANCES.sunsetSeconds}s`, () => {
      const s = siteOf(f.city);
      const [y, m, d] = f.dateStr.split('-').map(Number);
      const { sunset } = getSunriseSunsetTimes(s.lat, s.lon, new Date(Date.UTC(y, m - 1, d)));

      expect(sunset, `engine returned no sunset for ${label}`).not.toBeNull();

      // Compare on the authority's own local clock, to the minute it printed.
      const printed = new Intl.DateTimeFormat('en-GB', {
        timeZone: s.tz, hour: '2-digit', minute: '2-digit', hour12: false,
      }).format(sunset!);

      const toMin = (hhmm: string) => {
        const [hh, mm] = hhmm.split(':').map(Number);
        return hh * 60 + mm;
      };
      const deltaSeconds = Math.abs(toMin(printed) - toMin(f.value!)) * 60;

      expect(
        deltaSeconds,
        `${label}: engine ${printed}, ${f.source!.authority} ${f.value} ` +
          `(${deltaSeconds}s apart, budget ${TOLERANCES.sunsetSeconds}s)`
      ).toBeLessThanOrEqual(TOLERANCES.sunsetSeconds);
    });
  }
});

describe('4.3 — Sun/Moon apparent longitude vs JPL Horizons', () => {
  for (const f of LONGITUDE_FIXTURES) {
    const populated = f.source !== null && f.sunApparentLon !== null && f.moonApparentLon !== null;
    const run = populated ? it : it.skip;

    run(`${f.instantUtc} — solar longitude within ${TOLERANCES.solarDegrees}°`, () => {
      // Guards the aberration trap: an astrometric value differs by ~0.0057°,
      // which is larger than the Sankranti budget it would be checked against.
      expect(
        f.frame,
        `${f.instantUtc}: frame must be 'apparent'. Astrometric longitudes differ ` +
          `by ~0.0057° (aberration), exceeding the ${TOLERANCES.solarDegrees}° budget.`
      ).toBe('apparent');

      const astro = computeAstronomy(new Date(f.instantUtc));
      const delta = Math.abs(angleDelta(astro.sunTropical, f.sunApparentLon!));

      expect(
        delta,
        `${f.instantUtc}: engine ${astro.sunTropical.toFixed(6)}°, ` +
          `Horizons ${f.sunApparentLon!.toFixed(6)}° (Δ ${delta.toFixed(6)}°)`
      ).toBeLessThanOrEqual(TOLERANCES.solarDegrees);
    });

    run(`${f.instantUtc} — lunar longitude within ${TOLERANCES.siderealDegrees}°`, () => {
      const astro = computeAstronomy(new Date(f.instantUtc));
      const delta = Math.abs(angleDelta(astro.moonTropical, f.moonApparentLon!));

      expect(
        delta,
        `${f.instantUtc}: engine ${astro.moonTropical.toFixed(6)}°, ` +
          `Horizons ${f.moonApparentLon!.toFixed(6)}° (Δ ${delta.toFixed(6)}°)`
      ).toBeLessThanOrEqual(TOLERANCES.siderealDegrees);
    });

    run(`${f.instantUtc} — elongation (tithi root) within ${TOLERANCES.elongationDegrees}°`, () => {
      // Tithi is a DIFFERENCE of two tropical longitudes, so ayanamsha cancels
      // (conventions §1.2). This is therefore the tightest and most direct check
      // of tithi-boundary correctness available without a pañcāṅga table.
      const astro = computeAstronomy(new Date(f.instantUtc));
      const reference = normalizeAngle(f.moonApparentLon! - f.sunApparentLon!);
      const delta = Math.abs(angleDelta(astro.elongation, reference));

      expect(
        delta,
        `${f.instantUtc}: engine elongation ${astro.elongation.toFixed(6)}°, ` +
          `Horizons-derived ${reference.toFixed(6)}° (Δ ${delta.toFixed(6)}°)`
      ).toBeLessThanOrEqual(TOLERANCES.elongationDegrees);
    });
  }
});

describe('4.3 — fixture hygiene (runs regardless of population)', () => {
  it('every fixture city exists in TIER1_SITES', () => {
    for (const f of SUNSET_FIXTURES) expect(() => siteOf(f.city)).not.toThrow();
  });

  it('covers all 12 validation cities', () => {
    expect(TIER1_SITES).toHaveLength(12);
    const covered = new Set(SUNSET_FIXTURES.map(f => f.city));
    const missing = TIER1_SITES.filter(s => !covered.has(s.city)).map(s => s.city);
    expect(missing, `cities with no sunset fixture: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('spans both hemispheres and the high-latitude band', () => {
    const lats = TIER1_SITES.map(s => s.lat);
    expect(Math.min(...lats), 'need a southern-hemisphere site').toBeLessThan(0);
    expect(Math.max(...lats), 'need a high-latitude site (proxy path)').toBeGreaterThan(60);
  });

  it('no fixture claims a source while carrying no value', () => {
    for (const f of SUNSET_FIXTURES) {
      if (f.source !== null) {
        expect(f.value, `${f.city} ${f.dateStr} cites ${f.source.authority} but has no value`).not.toBeNull();
      }
    }
    for (const f of LONGITUDE_FIXTURES) {
      if (f.source !== null) {
        expect(f.sunApparentLon, `${f.instantUtc} cites a source but has no solar longitude`).not.toBeNull();
        expect(f.moonApparentLon, `${f.instantUtc} cites a source but has no lunar longitude`).not.toBeNull();
        expect(f.frame, `${f.instantUtc} cites a source but does not state its frame`).not.toBeNull();
      }
    }
  });
});
