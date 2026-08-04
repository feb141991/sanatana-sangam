import { getSunriseSunset } from './astronomy.js';

/** Version of the day boundary convention implementation (§4 is [C]) */
export const DAY_BOUNDARY_VERSION = '1.0.0';

export interface LocationInput {
  lat: number;
  lon: number;
  tz: string; // IANA timezone, e.g. 'Asia/Kolkata', 'Europe/London', 'America/New_York'
}

export interface VedicDayResolution {
  /** The civil date (YYYY-MM-DD in the location's timezone) on which this Vedic day begins */
  owningCivilDate: string;
  /** Start of the Vedic day: local sunrise for that civil date */
  vedicDayStartSunrise: Date;
  /** End of the Vedic day: local sunrise for the subsequent civil date */
  vedicDayEndSunrise: Date;
  /** Latitude used for calculation (proxy 60.0° if high-latitude/polar fallback, else actual) */
  effectiveLat: number;
  /** Human-readable explanation of the boundary resolution */
  reason: string;
  /** Machine-readable structural reasoning for audit/reasons[] */
  reasonDetails: {
    inputUtc: string;
    inputLocalCivilDate: string;
    vedicDayStartSunriseUtc: string;
    vedicDayEndSunriseUtc: string;
    vedicDayStartSunriseLocal: string;
    vedicDayEndSunriseLocal: string;
    owningCivilDate: string;
  };
  /** Diagnostic flags per §8: 'latitude_proxy', 'compressed_night', 'no_sunrise' */
  diagnostics: string[];
}

export interface IntervalVedicDayResolution extends VedicDayResolution {
  /** Relationship of the interval to the Vedic day */
  intervalRelationship: 'contains_start' | 'contains_end' | 'spans_full_day' | 'within_vedic_day' | 'exact_match';
}

/** Formats a Date object to a YYYY-MM-DD civil date string in the given IANA timezone */
export function formatCivilDateInTz(date: Date, tz: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch {
    // Fallback to UTC if timezone is invalid
    return date.toISOString().slice(0, 10);
  }
}

/** Parses a YYYY-MM-DD string into a Date object representing 12:00:00 UTC on that date */
export function parseCivilDateUtc(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12, 0, 0));
}

/** Adds or subtracts days from a YYYY-MM-DD civil date string */
export function offsetCivilDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + days, 12, 0, 0));
  const ny = dt.getUTCFullYear();
  const nm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const nd = String(dt.getUTCDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

/** Computes local UTC offset in decimal hours for a date and timezone */
export function getTzOffsetHours(date: Date, tz: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'longOffset',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value;
    if (tzPart) {
      if (tzPart === 'GMT' || tzPart === 'UTC') return 0;
      const match = tzPart.match(/GMT([+-])(\d{2}):?(\d{2})?/);
      if (match) {
        const sign = match[1] === '-' ? -1 : 1;
        const hours = parseInt(match[2], 10);
        const mins = match[3] ? parseInt(match[3], 10) : 0;
        return sign * (hours + mins / 60);
      }
    }
  } catch {
    /* silent fallback */
  }
  return 0;
}

/** Resolves effective location and proxy latitude per §8 */
function getEffectiveLocation(lat: number, lon: number): { lat: number; lon: number; isProxy: boolean } {
  if (Math.abs(lat) >= 66.5) {
    const proxyLat = lat >= 0 ? 60.0 : -60.0;
    return { lat: proxyLat, lon, isProxy: true };
  }
  return { lat, lon, isProxy: false };
}

/** Obtains sunrise for a given civil date and location with high-latitude §8 fallback */
export function getSunriseForDateStr(
  dateStr: string,
  location: LocationInput
): { sunrise: Date; sunset: Date | null; diagnostics: string[]; effectiveLat: number } {
  const diagnostics: string[] = [];
  const { lat: effLat, isProxy } = getEffectiveLocation(location.lat, location.lon);
  if (isProxy) {
    diagnostics.push('latitude_proxy');
  }

  const sampleDate = parseCivilDateUtc(dateStr);
  const tzOffset = getTzOffsetHours(sampleDate, location.tz);

  let riseSet = getSunriseSunset(effLat, location.lon, sampleDate, tzOffset);
  let effectiveLat = effLat;

  if (!riseSet.sunrise) {
    if (!isProxy) {
      diagnostics.push('latitude_proxy');
      effectiveLat = location.lat >= 0 ? 60.0 : -60.0;
      riseSet = getSunriseSunset(effectiveLat, location.lon, sampleDate, tzOffset);
    }
  }

  if (!riseSet.sunrise) {
    diagnostics.push('no_sunrise');
    // Synthetic fallback for polar edge cases: 06:00 local time
    const syntheticSunrise = new Date(sampleDate.getTime() - Math.round(tzOffset * 3600_000) - 6 * 3600_000);
    return {
      sunrise: syntheticSunrise,
      sunset: null,
      diagnostics,
      effectiveLat,
    };
  }

  if (riseSet.sunrise && riseSet.sunset) {
    const nightLengthMs = 86_400_000 - (riseSet.sunset.getTime() - riseSet.sunrise.getTime());
    if (nightLengthMs < 4 * 3600_000) {
      diagnostics.push('compressed_night');
    }
  }

  return {
    sunrise: riseSet.sunrise,
    sunset: riseSet.sunset,
    diagnostics,
    effectiveLat,
  };
}

/**
 * Resolves the Vedic day (sunrise to next sunrise) owning a specific astronomical instant.
 *
 * Per §4:
 * An observance is assigned to the civil date on which its Vedic day begins.
 * If instant T occurs before local sunrise on civil date D, T belongs to the Vedic day
 * that began at sunrise on civil date D - 1.
 */
export function resolveVedicDayForInstant(
  instant: Date,
  location: LocationInput
): VedicDayResolution {
  const localCivilDate = formatCivilDateInTz(instant, location.tz);
  const todayRise = getSunriseForDateStr(localCivilDate, location);

  let owningCivilDate: string;
  let vedicDayStartSunrise: Date;
  let vedicDayEndSunrise: Date;
  const diagnostics = [...todayRise.diagnostics];

  if (instant.getTime() >= todayRise.sunrise.getTime()) {
    // Instant occurred at or after today's sunrise
    const nextCivilDate = offsetCivilDateStr(localCivilDate, 1);
    const nextRise = getSunriseForDateStr(nextCivilDate, location);
    diagnostics.push(...nextRise.diagnostics);

    if (instant.getTime() < nextRise.sunrise.getTime()) {
      owningCivilDate = localCivilDate;
      vedicDayStartSunrise = todayRise.sunrise;
      vedicDayEndSunrise = nextRise.sunrise;
    } else {
      // Edge case: instant is at or past next sunrise
      const dayAfterNext = offsetCivilDateStr(localCivilDate, 2);
      const dayAfterNextRise = getSunriseForDateStr(dayAfterNext, location);
      owningCivilDate = nextCivilDate;
      vedicDayStartSunrise = nextRise.sunrise;
      vedicDayEndSunrise = dayAfterNextRise.sunrise;
    }
  } else {
    // Instant occurred before today's sunrise (e.g. pre-dawn 00:30 Nishita)
    const prevCivilDate = offsetCivilDateStr(localCivilDate, -1);
    const prevRise = getSunriseForDateStr(prevCivilDate, location);
    diagnostics.push(...prevRise.diagnostics);

    owningCivilDate = prevCivilDate;
    vedicDayStartSunrise = prevRise.sunrise;
    vedicDayEndSunrise = todayRise.sunrise;
  }

  // Deduplicate diagnostics
  const uniqueDiagnostics = Array.from(new Set(diagnostics));

  const reason = `Instant ${instant.toISOString()} (${formatCivilDateInTz(instant, location.tz)} local) ` +
    `belongs to Vedic day starting at sunrise ${vedicDayStartSunrise.toISOString()} on ${owningCivilDate}; ` +
    `owning civil date is ${owningCivilDate}.`;

  return {
    owningCivilDate,
    vedicDayStartSunrise,
    vedicDayEndSunrise,
    effectiveLat: todayRise.effectiveLat,
    reason,
    reasonDetails: {
      inputUtc: instant.toISOString(),
      inputLocalCivilDate: localCivilDate,
      vedicDayStartSunriseUtc: vedicDayStartSunrise.toISOString(),
      vedicDayEndSunriseUtc: vedicDayEndSunrise.toISOString(),
      vedicDayStartSunriseLocal: formatCivilDateInTz(vedicDayStartSunrise, location.tz),
      vedicDayEndSunriseLocal: formatCivilDateInTz(vedicDayEndSunrise, location.tz),
      owningCivilDate,
    },
    diagnostics: uniqueDiagnostics,
  };
}

/**
 * Resolves the Vedic day owning an astronomical interval [start, end].
 */
export function resolveVedicDayForInterval(
  interval: { start: Date; end: Date },
  location: LocationInput
): IntervalVedicDayResolution {
  const startRes = resolveVedicDayForInstant(interval.start, location);
  const endRes = resolveVedicDayForInstant(interval.end, location);

  let intervalRelationship: IntervalVedicDayResolution['intervalRelationship'];

  if (startRes.owningCivilDate === endRes.owningCivilDate) {
    if (
      interval.start.getTime() === startRes.vedicDayStartSunrise.getTime() &&
      interval.end.getTime() === startRes.vedicDayEndSunrise.getTime()
    ) {
      intervalRelationship = 'exact_match';
    } else {
      intervalRelationship = 'within_vedic_day';
    }
  } else {
    if (interval.start.getTime() >= startRes.vedicDayStartSunrise.getTime() && interval.start.getTime() < startRes.vedicDayEndSunrise.getTime()) {
      intervalRelationship = 'contains_start';
    } else if (interval.end.getTime() >= endRes.vedicDayStartSunrise.getTime() && interval.end.getTime() < endRes.vedicDayEndSunrise.getTime()) {
      intervalRelationship = 'contains_end';
    } else {
      intervalRelationship = 'spans_full_day';
    }
  }

  return {
    ...startRes,
    intervalRelationship,
  };
}
