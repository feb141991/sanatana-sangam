/**
 * core/astronomy-adapter.ts
 *
 * Single point of import for the external 'astronomia' library.
 * Exposes core astronomical services (Julian day, planetary positions,
 * rise/set calculations, coordinate conversions) to Layer A.
 */

import julian from 'astronomia/julian';
import solar from 'astronomia/solar';
import moonposition from 'astronomia/moonposition';
import nutation from 'astronomia/nutation';
import { Sunrise } from 'astronomia/sunrise';
import parallax from 'astronomia/parallax';
import globe from 'astronomia/globe';
import sidereal from 'astronomia/sidereal';
import base from 'astronomia/base';
import iterate from 'astronomia/iterate';

// ---------------------------------------------------------------------------
// Julian Day & Calendar
// ---------------------------------------------------------------------------

/**
 * Julian Day on the **UT** scale. Use for anything measuring Earth's rotation —
 * sidereal time, hour angles, observer position. Differs from `dateToJde` by ΔT
 * (68.88 s in 2026); mixing the two is what caused the moonrise bias.
 */
export function dateToJd(date: Date): number {
  return new julian.CalendarGregorian().fromDate(date).toJD();
}

/** Julian Ephemeris Day (**TT** scale). Use for ephemeris positions. */
export function dateToJde(date: Date): number {
  return julian.DateToJDE(date);
}

// ---------------------------------------------------------------------------
// Sun & Moon Coordinates
// ---------------------------------------------------------------------------

export function getSolarApparentLongitude(t: number): number {
  return solar.apparentLongitude(t);
}

export function getMoonPosition(jde: number): { lon: number; lat: number; range: number } {
  return moonposition.position(jde);
}

export function getMoonParallax(rangeKm: number): number {
  return moonposition.parallax(rangeKm);
}

// ---------------------------------------------------------------------------
// Obliquity & Nutation
// ---------------------------------------------------------------------------

export function getNutation(jde: number): [number, number] {
  return nutation.nutation(jde);
}

export function getMeanObliquity(jde: number): number {
  return nutation.meanObliquity(jde);
}

// ---------------------------------------------------------------------------
// Sidereal Time
// ---------------------------------------------------------------------------

/**
 * Greenwich apparent sidereal time, in radians.
 *
 * *** Takes a JD on the UT scale, NOT a JDE. *** Sidereal time measures Earth's
 * rotation, which is defined against UT. Feeding it TT advances it by ΔT
 * (68.88 s in 2026), which advances every hour angle and so makes every
 * computed rise time that much early.
 *
 * This was a real defect, found by the 13 USNO golden fixtures: the moonrise
 * path passed `jde` here and ran early at 13 of 13 sites. Switching to UT moved
 * the mean residual from −1.62 min to −0.62 min and made 5 of the 13 exact.
 * Sunrise was never affected because it delegates to astronomia's own `Sunrise`,
 * which handles the time base internally — which is why the bias was
 * moon-specific.
 */
export function getApparentSiderealTimeRad(jdUT: number): number {
  return (sidereal.apparent(jdUT) / 3600) * 15 * (Math.PI / 180);
}

// ---------------------------------------------------------------------------
// Observer & Geocentric/Topocentric Corrections
// ---------------------------------------------------------------------------

export function getEarthParallaxConstants(latRad: number, height: number): [number, number] {
  return globe.Earth76.parallaxConstants(latRad, height);
}

export interface EquatorialCoordinates {
  ra: number;
  dec: number;
  range: number;
}

export function getTopocentricCoordinates(
  pos: EquatorialCoordinates,
  sphi: number,
  cphi: number,
  lonWestRad: number,
  jde: number
): { ra: number; dec: number } {
  const posAu = { ra: pos.ra, dec: pos.dec, range: pos.range / 149597870.7 };
  const topo = parallax.topocentric(posAu, sphi, cphi, lonWestRad, jde);
  return {
    ra: topo._ra,
    dec: topo._dec,
  };
}

// ---------------------------------------------------------------------------
// Sunrise & Sunset Solver
// ---------------------------------------------------------------------------

export function getSunriseSunsetTimes(
  lat: number,
  lon: number,
  date: Date
): { sunrise: Date | null; sunset: Date | null; noon: Date | null } {
  const calendar = new julian.CalendarGregorian(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
  const sun = new Sunrise(calendar, lat, -lon, 0);
  const sunriseDate = sun.rise()?.toDate() ?? null;
  const sunsetDate = sun.set()?.toDate() ?? null;
  const noonDate = sun.noon()?.toDate() ?? null;
  return {
    sunrise: sunriseDate,
    sunset: sunsetDate,
    noon: noonDate,
  };
}

export function pmod(x: number, y: number): number {
  return base.pmod(x, y);
}

export function binaryRoot(f: (x: number) => number, lower: number, upper: number): number {
  return iterate.binaryRoot(f, lower, upper);
}
