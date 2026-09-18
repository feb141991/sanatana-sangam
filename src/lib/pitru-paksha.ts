/**
 * Pitru Paksha — the Bhadrapada kṛṣṇa-pakṣa ancestor-remembrance period.
 *
 * Dates are derived at local sunrise from the same corrected lunar-month engine
 * used by the canonical calendar. There is deliberately no Gregorian lookup
 * table: the helper therefore continues to work in future years and follows
 * the user's observance location.
 */
import {
  getLunarMonth,
  getSunriseForDateStr,
  offsetCivilDateStr,
  type LocationInput,
} from '@sangam/panchang-engine';
import { calculatePanchang, REFERENCE_LOCATION_UJJAIN } from '@/lib/panchang';

export interface PitruPakshaDay {
  /** YYYY-MM-DD in the observance location. */
  date: string;
  /** Civil-day position within this year's astronomically derived window. */
  day: number;
  /** Number of civil days in the window (normally 15, but tithi growth/loss can vary it). */
  totalDays: number;
  /** True only on the final sunrise-qualified Amavasya day. */
  isMahalaya: boolean;
  /** Sunrise tithi for this civil day. */
  tithiName: string;
}

export type PitruPakshaLocation = LocationInput;

const DEFAULT_LOCATION: PitruPakshaLocation = REFERENCE_LOCATION_UJJAIN;
const MAX_BOUNDARY_SEARCH_DAYS = 18;

type DayClassification = {
  inPeriod: boolean;
  tithiIndex: number;
  tithiName: string;
};

const classificationCache = new Map<string, DayClassification>();

function locationKey(location: PitruPakshaLocation): string {
  return `${location.lat}:${location.lon}:${location.tz}`;
}

function civilDateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function classifyCivilDay(dateStr: string, location: PitruPakshaLocation): DayClassification {
  const key = `${dateStr}:${locationKey(location)}`;
  const cached = classificationCache.get(key);
  if (cached) return cached;

  const { sunrise } = getSunriseForDateStr(dateStr, location);
  const lunarMonth = getLunarMonth(sunrise, 'amanta');
  const panchang = calculatePanchang(sunrise, location.lat, location.lon, location.tz);
  const inPeriod =
    lunarMonth.ok &&
    lunarMonth.monthName === 'Bhadrapada' &&
    !lunarMonth.isAdhika &&
    lunarMonth.paksha === 'krishna' &&
    panchang.tithiIndex >= 16;

  const result = {
    inPeriod,
    tithiIndex: panchang.tithiIndex,
    tithiName: panchang.tithi,
  };
  classificationCache.set(key, result);
  return result;
}

function findBoundary(
  dateStr: string,
  location: PitruPakshaLocation,
  direction: -1 | 1,
): string {
  let boundary = dateStr;
  for (let offset = 1; offset <= MAX_BOUNDARY_SEARCH_DAYS; offset++) {
    const candidate = offsetCivilDateStr(dateStr, direction * offset);
    if (!classifyCivilDay(candidate, location).inPeriod) break;
    boundary = candidate;
  }
  return boundary;
}

function civilDayDistance(start: string, end: string): number {
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  return Math.round((endMs - startMs) / 86_400_000);
}

/**
 * Returns Pitru Paksha context for a Date or YYYY-MM-DD civil date.
 * Passing a string is preferred when the caller already owns a selected civil
 * date because it avoids converting that date through the runtime timezone.
 */
export function getPitruPakshaDay(
  date: Date | string = new Date(),
  location: PitruPakshaLocation = DEFAULT_LOCATION,
): PitruPakshaDay | null {
  const dateStr = typeof date === 'string' ? date : civilDateInTimeZone(date, location.tz);
  const classification = classifyCivilDay(dateStr, location);
  if (!classification.inPeriod) return null;

  const start = findBoundary(dateStr, location, -1);
  const end = findBoundary(dateStr, location, 1);
  return {
    date: dateStr,
    day: civilDayDistance(start, dateStr) + 1,
    totalDays: civilDayDistance(start, end) + 1,
    isMahalaya: dateStr === end,
    tithiName: dateStr === end ? 'Mahalaya Amavasya' : classification.tithiName,
  };
}

export function isInPitruPaksha(
  date: Date | string = new Date(),
  location: PitruPakshaLocation = DEFAULT_LOCATION,
): boolean {
  return getPitruPakshaDay(date, location) !== null;
}

/** Banner copy for each day (rotates through ancestor-focused themes). */
export function getPitruPakshaBannerCopy(info: PitruPakshaDay): { title: string; subtitle: string } {
  if (info.isMahalaya) {
    return {
      title: 'Mahalaya Amavasya',
      subtitle: 'The most auspicious day of Pitru Paksha — offer tarpan and Pinda daan to all ancestors today.',
    };
  }

  const copies: Array<{ title: string; subtitle: string }> = [
    {
      title: `Pitru Paksha — Day ${info.day}`,
      subtitle: 'A sacred time to remember your ancestors with gratitude and prayer.',
    },
    {
      title: `Pitru Paksha — ${info.tithiName}`,
      subtitle: 'Offer water, sesame, or a quiet prayer in honour of those who came before you.',
    },
    {
      title: `Pitru Paksha — Day ${info.day} of ${info.totalDays}`,
      subtitle: 'May your remembrance bring peace to your ancestors and blessings to your family.',
    },
  ];

  return copies[(info.day - 1) % copies.length];
}
