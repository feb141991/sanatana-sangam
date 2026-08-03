/**
 * core/muhurta.ts
 *
 * Layer A Muhurta Window Engine for @sangam/panchang-engine.
 *
 * Computes location- and date-dependent variable day/night-proportional muhurta
 * windows (Brahma Muhurta, Pratah, Sangava, Madhyahna, Aparahna, Sayahna, Pradosha,
 * Nishita, Abhijit) based on astronomy-conventions.md §7 & §8.
 *
 * All returned window timestamps are absolute UTC Date objects.
 */

import { getSunriseSunset } from './astronomy.js';

export interface MuhurtaWindow {
  name: string;
  start: Date;
  end: Date;
}

export interface MuhurtaSet {
  ok: true;
  civilDate: string;
  sunrise: Date;
  sunset: Date;
  nextSunrise: Date;
  dayLengthMs: number;
  nightLengthMs: number;
  windows: Record<string, MuhurtaWindow>;
  diagnostics: string[];
}

export type MuhurtaResult = MuhurtaSet | { ok: false; reason: string };

/** Default Pradosha duration: 3 ghatikas = 72 minutes (astronomy-conventions.md §7) */
export const PRADOSHA_DEFAULT_MINUTES = 72;

export function getMuhurtaWindows(
  date: Date,
  lat: number,
  lon: number,
  tz?: string
): MuhurtaResult {
  // High-latitude check (§8)
  if (Math.abs(lat) > 66.5) {
    return {
      ok: false,
      reason: `Polar day/night: sunrise or sunset absent for latitude ${lat}`,
    };
  }

  const todayRiseSet = getSunriseSunset(lat, lon, date);
  if (!todayRiseSet.sunrise || !todayRiseSet.sunset) {
    return {
      ok: false,
      reason: `Sunrise or sunset absent for date ${date.toISOString()} at lat ${lat}, lon ${lon}`,
    };
  }

  const nextDay = new Date(date.getTime() + 86_400_000);
  const nextRiseSet = getSunriseSunset(lat, lon, nextDay);
  if (!nextRiseSet.sunrise) {
    return {
      ok: false,
      reason: `Next sunrise absent for date ${nextDay.toISOString()} at lat ${lat}, lon ${lon}`,
    };
  }

  const sunrise = todayRiseSet.sunrise;
  const sunset = todayRiseSet.sunset;
  const nextSunrise = nextRiseSet.sunrise;

  const dayLengthMs = sunset.getTime() - sunrise.getTime();
  const nightLengthMs = nextSunrise.getTime() - sunset.getTime();

  if (dayLengthMs <= 0 || nightLengthMs <= 0) {
    return {
      ok: false,
      reason: `Degenerate day/night length for date ${date.toISOString()} at lat ${lat}, lon ${lon}`,
    };
  }

  const diagnostics: string[] = [];

  if (Math.abs(lat) >= 60) {
    diagnostics.push('latitude_proxy');
  }

  if (nightLengthMs < 4 * 3600 * 1000) {
    diagnostics.push('compressed_night');
  }

  const dayFifth = dayLengthMs / 5;
  const nightMuhurta = nightLengthMs / 15;
  const dayNoon = new Date(sunrise.getTime() + dayLengthMs / 2);

  const civilDate = tz
    ? new Intl.DateTimeFormat('sv', { timeZone: tz }).format(date)
    : date.toISOString().slice(0, 10);

  const windows: Record<string, MuhurtaWindow> = {
    brahmaMuhurta: {
      name: 'Brahma Muhurta',
      start: new Date(nextSunrise.getTime() - 2 * nightMuhurta),
      end: new Date(nextSunrise.getTime() - 1 * nightMuhurta),
    },
    pratah: {
      name: 'Pratah',
      start: new Date(sunrise.getTime()),
      end: new Date(sunrise.getTime() + dayFifth),
    },
    sangava: {
      name: 'Sangava',
      start: new Date(sunrise.getTime() + dayFifth),
      end: new Date(sunrise.getTime() + 2 * dayFifth),
    },
    madhyahna: {
      name: 'Madhyahna',
      start: new Date(sunrise.getTime() + 2 * dayFifth),
      end: new Date(sunrise.getTime() + 3 * dayFifth),
    },
    aparahna: {
      name: 'Aparahna',
      start: new Date(sunrise.getTime() + 3 * dayFifth),
      end: new Date(sunrise.getTime() + 4 * dayFifth),
    },
    sayahna: {
      name: 'Sayahna',
      start: new Date(sunrise.getTime() + 4 * dayFifth),
      end: new Date(sunset.getTime()),
    },
    // [S] Scholar review pending — unratified default: sunset + 72 min (3 ghatikas)
    pradosha: {
      name: 'Pradosha',
      start: new Date(sunset.getTime()),
      end: new Date(sunset.getTime() + PRADOSHA_DEFAULT_MINUTES * 60_000),
    },
    nishita: {
      name: 'Nishita',
      start: new Date(sunset.getTime() + 7 * nightMuhurta),
      end: new Date(sunset.getTime() + 8 * nightMuhurta),
    },
    abhijit: {
      name: 'Abhijit',
      start: new Date(dayNoon.getTime() - 24 * 60_000),
      end: new Date(dayNoon.getTime() + 24 * 60_000),
    },
  };

  return {
    ok: true,
    civilDate,
    sunrise,
    sunset,
    nextSunrise,
    dayLengthMs,
    nightLengthMs,
    windows,
    diagnostics,
  };
}

/**
 * Returns true if `instant` falls within `window` (or [start - toleranceMs, end + toleranceMs]).
 */
export function isInWindow(
  instant: Date,
  wOrStart: MuhurtaWindow | Date,
  endDate?: Date,
  toleranceMs = 0
): boolean {
  if (typeof wOrStart === 'object' && 'start' in wOrStart && 'end' in wOrStart) {
    const t = instant.getTime();
    return t >= wOrStart.start.getTime() && t <= wOrStart.end.getTime();
  }
  const t = instant.getTime();
  const startMs = (wOrStart as Date).getTime();
  const endMs = endDate ? endDate.getTime() : startMs;
  return t >= startMs - toleranceMs && t <= endMs + toleranceMs;
}
