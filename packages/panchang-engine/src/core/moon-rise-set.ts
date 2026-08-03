/**
 * core/moon-rise-set.ts
 *
 * Layer A Topocentric Moonrise and Moonset Engine for @sangam/panchang-engine.
 *
 * Computes topocentric upper-limb moonrise and moonset times with standard
 * atmospheric refraction (34') and lunar horizontal parallax based on
 * astronomy-conventions.md §3.1 & §8.
 */

import julian from 'astronomia/julian';
import moonposition from 'astronomia/moonposition';
import parallax from 'astronomia/parallax';
import globe from 'astronomia/globe';
import sidereal from 'astronomia/sidereal';

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
  const jde = julian.DateToJDE(date);

  const pos = moonposition.position(jde);
  const pi = moonposition.parallax(jde);
  const semidiameterRad = Math.asin(0.2725 * Math.sin(pi));
  const refractionRad = (34 / 60) * (Math.PI / 180);

  const st0Rad = (sidereal.apparent(jde) / 3600) * 15 * (Math.PI / 180);
  const lst = st0Rad - lonWestRad;

  let H = lst - pos.ra;
  let dec = pos.dec;

  if (isTopocentric) {
    const [sphi, cphi] = globe.Earth76.parallaxConstants(latRad, 0);
    const posAu = { ra: pos.ra, dec: pos.dec, range: pos.range / 149597870.7 };
    const topo = parallax.topocentric(posAu, sphi, cphi, lonWestRad, jde);
    H = lst - topo._ra;
    dec = topo._dec;
  }

  const sinAlt =
    Math.sin(latRad) * Math.sin(dec) +
    Math.cos(latRad) * Math.cos(dec) * Math.cos(H);
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

    const approxUtc = new Date(Date.UTC(year, month - 1, day));
    const offsetMs = getTzOffsetMs(approxUtc, timeZone);
    const start = new Date(approxUtc.getTime() - offsetMs);
    const end = new Date(start.getTime() + 86_400_000);
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
  // High-latitude check (§8)
  if (Math.abs(lat) > 66.5) {
    const { start, end } = getCivilDayInterval(date, tz);
    let allAbove = true;
    let allBelow = true;
    const stepMs = 30 * 60_000;
    for (let t = start.getTime(); t <= end.getTime(); t += stepMs) {
      const alt = getMoonUpperLimbAlt(new Date(t), lat, lon);
      if (alt <= 0) allAbove = false;
      if (alt >= 0) allBelow = false;
    }
    if (allAbove) {
      return {
        ok: false,
        reason: `Moon is circumpolar (does not set) for latitude ${lat}`,
      };
    }
    if (allBelow) {
      return {
        ok: false,
        reason: `Moon never rises for latitude ${lat}`,
      };
    }
  }

  const { start, end } = getCivilDayInterval(date, tz);
  const stepMs = 15 * 60_000;
  let moonrise: Date | null = null;
  let moonset: Date | null = null;
  const diagnostics: string[] = [];

  if (Math.abs(lat) >= 60) {
    diagnostics.push('latitude_proxy');
  }

  let prevAlt = getMoonUpperLimbAlt(start, lat, lon);

  for (let t = start.getTime() + stepMs; t <= end.getTime(); t += stepMs) {
    const curDate = new Date(t);
    const curAlt = getMoonUpperLimbAlt(curDate, lat, lon);

    if (prevAlt <= 0 && curAlt > 0 && !moonrise) {
      let low = t - stepMs;
      let high = t;
      let aLow = prevAlt;
      while (high - low > 1000) {
        const mid = Math.floor((low + high) / 2);
        const aMid = getMoonUpperLimbAlt(new Date(mid), lat, lon);
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
        const aMid = getMoonUpperLimbAlt(new Date(mid), lat, lon);
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
  const stepMs = 15 * 60_000;
  let prevAlt = getMoonUpperLimbAlt(after, lat, lon);

  for (
    let t = after.getTime() + stepMs;
    t <= after.getTime() + 48 * 3600_000;
    t += stepMs
  ) {
    const curDate = new Date(t);
    const curAlt = getMoonUpperLimbAlt(curDate, lat, lon);

    if (prevAlt <= 0 && curAlt > 0) {
      let low = t - stepMs;
      let high = t;
      let aLow = prevAlt;
      while (high - low > 1000) {
        const mid = Math.floor((low + high) / 2);
        const aMid = getMoonUpperLimbAlt(new Date(mid), lat, lon);
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
