/**
 * timezone-utils.ts
 *
 * Timezone, DST, International Date Line, and Location Divergence utilities.
 * Handles:
 * 1. Timezone & location divergence detection (home vs device/travel).
 * 2. International Date Line (IDL) crossings (e.g. Tokyo UTC+9 <-> Honolulu UTC-10).
 * 3. Daylight Saving Time (DST) boundaries (e.g. Europe/London GMT/BST).
 * 4. Location provenance formatting for display.
 */

export interface LocationDivergenceResult {
  isDivergent: boolean;
  reason?: 'timezone_mismatch' | 'distance_mismatch' | 'none';
  homeTimezone?: string | null;
  travelTimezone?: string | null;
}

/** Detects if a temporary travel location/timezone diverges from saved home observance location */
export function detectTimezoneDivergence(
  homeLoc?: { latitude?: number | null; longitude?: number | null; timezone?: string | null } | null,
  travelLoc?: { latitude?: number | null; longitude?: number | null; timezone?: string | null } | null
): LocationDivergenceResult {
  if (!homeLoc || !travelLoc) {
    return { isDivergent: false, reason: 'none' };
  }

  const homeTz = homeLoc.timezone?.trim();
  const travelTz = travelLoc.timezone?.trim();

  // Check timezone string mismatch
  if (homeTz && travelTz && homeTz !== travelTz) {
    return {
      isDivergent: true,
      reason: 'timezone_mismatch',
      homeTimezone: homeTz,
      travelTimezone: travelTz,
    };
  }

  // Check coordinate mismatch (greater than ~0.05 degrees, ~5km)
  if (
    typeof homeLoc.latitude === 'number' &&
    typeof homeLoc.longitude === 'number' &&
    typeof travelLoc.latitude === 'number' &&
    typeof travelLoc.longitude === 'number'
  ) {
    const latDiff = Math.abs(homeLoc.latitude - travelLoc.latitude);
    const lonDiff = Math.abs(homeLoc.longitude - travelLoc.longitude);
    if (latDiff > 0.05 || lonDiff > 0.05) {
      return {
        isDivergent: true,
        reason: 'distance_mismatch',
        homeTimezone: homeTz || null,
        travelTimezone: travelTz || null,
      };
    }
  }

  return { isDivergent: false, reason: 'none' };
}

/**
 * Calculates civil date offset when crossing the International Date Line (IDL).
 * Example:
 * Flying west from Tokyo (Asia/Tokyo, UTC+9) across IDL to Honolulu (Pacific/Honolulu, UTC-10):
 * 2026-08-10 10:00 AM in Tokyo is 2026-08-09 03:00 PM in Honolulu (-1 day).
 * Flying east from Fiji (Pacific/Fiji, UTC+12) to Samoa (Pacific/Apia, UTC-11):
 * Date jumps back 1 civil day.
 */
export function calculateCivilDateOffsetAcrossIDL(
  utcTimestamp: string | number | Date,
  sourceTz: string,
  targetTz: string
): { sourceCivilDate: string; targetCivilDate: string; dateOffsetDays: number } {
  const dateObj = new Date(utcTimestamp);

  const sourceStr = dateObj.toLocaleDateString('en-CA', { timeZone: sourceTz }); // YYYY-MM-DD
  const targetStr = dateObj.toLocaleDateString('en-CA', { timeZone: targetTz }); // YYYY-MM-DD

  const sourceTime = new Date(`${sourceStr}T00:00:00Z`).getTime();
  const targetTime = new Date(`${targetStr}T00:00:00Z`).getTime();

  const dateOffsetDays = Math.round((targetTime - sourceTime) / (86400 * 1000));

  return {
    sourceCivilDate: sourceStr,
    targetCivilDate: targetStr,
    dateOffsetDays,
  };
}

/** Checks if DST is active for a given date in an IANA timezone */
export function isDstActiveInTimezone(tz: string, date: Date = new Date()): boolean {
  try {
    const jan = new Date(date.getFullYear(), 0, 1);
    const jul = new Date(date.getFullYear(), 6, 1);

    const getStdOffset = (d: Date) => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'shortOffset',
      }).formatToParts(d);
      return parts.find((p) => p.type === 'timeZoneName')?.value || '';
    };

    const currentOffset = getStdOffset(date);
    const janOffset = getStdOffset(jan);
    const julOffset = getStdOffset(jul);

    // If summer and winter offsets differ in this zone, compare current offset with std winter offset
    if (janOffset !== julOffset) {
      return currentOffset !== janOffset;
    }
    return false;
  } catch {
    return false;
  }
}

/** Formats location label showing producing location and provenance */
export function formatLocationProvenance(loc?: {
  label?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  isTravelLocation?: boolean;
}): string {
  if (!loc) return 'Ujjain, India (Home Observance Site)';
  const name = loc.label || 'Saved Location';
  const tag = loc.isTravelLocation ? 'Travel Location' : 'Home Observance Site';
  const tz = loc.timezone ? ` · ${loc.timezone}` : '';
  return `${name} (${tag}${tz})`;
}
