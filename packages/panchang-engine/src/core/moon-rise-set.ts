/**
 * core/moon-rise-set.ts
 *
 * Layer A Topocentric Moonrise and Moonset Engine for @sangam/panchang-engine.
 *
 * Computes topocentric upper-limb moonrise and moonset times with standard
 * atmospheric refraction (34') and horizontal parallax based on
 * astronomy-conventions.md §3.1 & §8.
 */

import {
  dateToJd,
  dateToJde,
  getMoonPosition,
  getMoonParallax,
  getNutation,
  getMeanObliquity,
  getApparentSiderealTimeRad,
  getEarthParallaxConstants,
  getTopocentricCoordinates,
} from './astronomy-adapter.js';

export interface RiseSetResult {
  ok: true;
  moonrise: Date | null;
  moonset: Date | null;
  diagnostics: string[];
}

export type MoonRiseSetResult = RiseSetResult | { ok: false; reason: string };

/**
 * Calculates topocentric upper-limb altitude of the Moon (in degrees) with
 * standard 34' horizon refraction and horizontal parallax.
 */
export function getMoonUpperLimbAlt(
  date: Date,
  latDeg: number,
  lonDeg: number,
  isTopocentric = true
): number {
  const latRad = (latDeg * Math.PI) / 180;
  const lonWestRad = (-lonDeg * Math.PI) / 180;
  const jde = dateToJde(date);

  const pos = getMoonPosition(jde);

  // D19 Fix: pass pos.range in km to moonposition.parallax
  const pi = getMoonParallax(pos.range);
  const semidiameterRad = Math.asin(0.2725 * Math.sin(pi));
  const refractionRad = (34 / 60) * (Math.PI / 180);

  // D18 Fix: convert ecliptic (pos.lon, pos.lat) -> apparent equatorial (ra, dec) using true obliquity
  const meanEps = getMeanObliquity(jde);
  const [, dEps] = getNutation(jde);
  const eps = meanEps + dEps;

  const lambda = pos.lon;
  const beta = pos.lat;

  const sinLambda = Math.sin(lambda);
  const cosLambda = Math.cos(lambda);
  const sinBeta = Math.sin(beta);
  const cosBeta = Math.cos(beta);
  const tanBeta = Math.tan(beta);
  const sinEps = Math.sin(eps);
  const cosEps = Math.cos(eps);

  const ra = Math.atan2(sinLambda * cosEps - tanBeta * sinEps, cosLambda);
  const dec = Math.asin(Math.max(-1, Math.min(1, sinBeta * cosEps + cosBeta * sinEps * sinLambda)));

  // Sidereal time is defined on UT, not TT. Passing jde here made every
  // moonrise ~69 s early (13 of 13 vs USNO). See the adapter's doc comment.
  const st0Rad = getApparentSiderealTimeRad(dateToJd(date));
  const lst = st0Rad - lonWestRad;

  let H = lst - ra;
  let finalDec = dec;

  if (isTopocentric) {
    const [sphi, cphi] = getEarthParallaxConstants(latRad, 0);
    const topo = getTopocentricCoordinates({ ra, dec, range: pos.range }, sphi, cphi, lonWestRad, jde);
    H = lst - topo.ra;
    finalDec = topo.dec;
  }

  const sinAlt =
    Math.sin(latRad) * Math.sin(finalDec) +
    Math.cos(latRad) * Math.cos(finalDec) * Math.cos(H);
  const centerAlt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

  return ((centerAlt + refractionRad + semidiameterRad) * 180) / Math.PI;
}

function getTzOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const getPart = (type: string) =>
    parseInt(parts.find((p) => p.type === type)!.value, 10);
  let h = getPart('hour');
  if (h === 24) h = 0;
  const localUtcMs = Date.UTC(
    getPart('year'),
    getPart('month') - 1,
    getPart('day'),
    h,
    getPart('minute'),
    getPart('second')
  );
  return localUtcMs - date.getTime();
}

function getLocalMidnight(year: number, month: number, day: number, timeZone?: string): Date {
  if (!timeZone) {
    return new Date(year, month - 1, day, 0, 0, 0);
  }
  const approxUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const offsetMs = getTzOffsetMs(approxUtc, timeZone);
  const midnightUtc = new Date(approxUtc.getTime() - offsetMs);
  const actualOffsetMs = getTzOffsetMs(midnightUtc, timeZone);
  return new Date(approxUtc.getTime() - actualOffsetMs);
}

function getCivilDayInterval(date: Date, timeZone?: string): { start: Date; end: Date } {
  if (timeZone) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const year = parseInt(parts.find((p) => p.type === 'year')!.value, 10);
    const month = parseInt(parts.find((p) => p.type === 'month')!.value, 10);
    const day = parseInt(parts.find((p) => p.type === 'day')!.value, 10);

    const start = getLocalMidnight(year, month, day, timeZone);

    // Compute next day's local midnight independently (handles 23h, 24h, and 25h DST civil days)
    const dayPlusOne = new Date(start.getTime() + 30 * 3600_000);
    const nextParts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(dayPlusOne);
    const nextYear = parseInt(nextParts.find((p) => p.type === 'year')!.value, 10);
    const nextMonth = parseInt(nextParts.find((p) => p.type === 'month')!.value, 10);
    const nextDay = parseInt(nextParts.find((p) => p.type === 'day')!.value, 10);

    const end = getLocalMidnight(nextYear, nextMonth, nextDay, timeZone);
    return { start, end };
  } else {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(start.getTime() + 86_400_000);
    return { start, end };
  }
}

/**
 * Calculates topocentric Moonrise and Moonset for a given civil date and location.
 */
export function getMoonRiseSet(
  date: Date,
  lat: number,
  lon: number,
  tz?: string
): MoonRiseSetResult {
  const diagnostics: string[] = [];
  let effectiveLat = lat;

  // D21 Fix: High-latitude proxy latitude 60° when |lat| >= 66.5° per §8
  if (Math.abs(lat) >= 66.5) {
    effectiveLat = Math.sign(lat) * 60;
    diagnostics.push('latitude_proxy');
  }

  const { start, end } = getCivilDayInterval(date, tz);
  const stepMs = 15 * 60_000;
  let moonrise: Date | null = null;
  let moonset: Date | null = null;

  let prevAlt = getMoonUpperLimbAlt(start, effectiveLat, lon);

  for (let t = start.getTime() + stepMs; t <= end.getTime(); t += stepMs) {
    const curDate = new Date(t);
    const curAlt = getMoonUpperLimbAlt(curDate, effectiveLat, lon);

    if (prevAlt <= 0 && curAlt > 0 && !moonrise) {
      let low = t - stepMs;
      let high = t;
      let aLow = prevAlt;
      while (high - low > 1000) {
        const mid = Math.floor((low + high) / 2);
        const aMid = getMoonUpperLimbAlt(new Date(mid), effectiveLat, lon);
        if (aLow <= 0 && aMid > 0) {
          high = mid;
        } else {
          low = mid;
          aLow = aMid;
        }
      }
      moonrise = new Date((low + high) / 2);
    }

    if (prevAlt >= 0 && curAlt < 0 && !moonset) {
      let low = t - stepMs;
      let high = t;
      let aLow = prevAlt;
      while (high - low > 1000) {
        const mid = Math.floor((low + high) / 2);
        const aMid = getMoonUpperLimbAlt(new Date(mid), effectiveLat, lon);
        if (aLow >= 0 && aMid < 0) {
          high = mid;
        } else {
          low = mid;
          aLow = aMid;
        }
      }
      moonset = new Date((low + high) / 2);
    }

    prevAlt = curAlt;
  }

  if (!moonrise) diagnostics.push('no_moonrise_on_civil_date');
  if (!moonset) diagnostics.push('no_moonset_on_civil_date');

  return { ok: true, moonrise, moonset, diagnostics };
}

/**
 * Searches forward for the first topocentric moonrise after `after` instant.
 */
export function findNextMoonrise(
  after: Date,
  lat: number,
  lon: number
): Date | null {
  let effectiveLat = lat;
  if (Math.abs(lat) >= 66.5) {
    effectiveLat = Math.sign(lat) * 60;
  }

  const stepMs = 15 * 60_000;
  let prevAlt = getMoonUpperLimbAlt(after, effectiveLat, lon);

  for (
    let t = after.getTime() + stepMs;
    t <= after.getTime() + 48 * 3600_000;
    t += stepMs
  ) {
    const curDate = new Date(t);
    const curAlt = getMoonUpperLimbAlt(curDate, effectiveLat, lon);

    if (prevAlt <= 0 && curAlt > 0) {
      let low = t - stepMs;
      let high = t;
      let aLow = prevAlt;
      while (high - low > 1000) {
        const mid = Math.floor((low + high) / 2);
        const aMid = getMoonUpperLimbAlt(new Date(mid), effectiveLat, lon);
        if (aLow <= 0 && aMid > 0) {
          high = mid;
        } else {
          low = mid;
          aLow = aMid;
        }
      }
      return new Date((low + high) / 2);
    }
    prevAlt = curAlt;
  }
  return null;
}
