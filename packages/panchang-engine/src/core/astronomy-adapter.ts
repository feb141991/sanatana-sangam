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

// ---------------------------------------------------------------------------
// Julian Day & Calendar
// ---------------------------------------------------------------------------

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

export function getApparentSiderealTimeRad(jde: number): number {
  return (sidereal.apparent(jde) / 3600) * 15 * (Math.PI / 180);
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
