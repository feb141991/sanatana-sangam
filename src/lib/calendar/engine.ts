import { CANONICAL_RULES, ObservanceRule } from './rules';
import { calculatePanchang } from '../panchang';

// Coordinates of Ujjain - traditional meridian for Hindu calendar calculations
export const UJJAIN_LAT = 23.1765;
export const UJJAIN_LON = 75.7885;

// Versioning the calculation engine
export const RULE_ENGINE_VERSION = '1.0.0';

export interface CalculatedOccurrence {
  slug: string;
  date: string; // YYYY-MM-DD
  year: number;
}

/**
 * Formats a Date object to YYYY-MM-DD in UTC timezone to prevent local timezone shifts.
 */
function formatUtcDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const r = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${r}`;
}

/**
 * Checks if a given year is a leap year.
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Computes panchang for all days of the target Gregorian year.
 * We evaluate at exactly 05:00:00 UTC (morning in India, aligning with the target datasets).
 */
export function precomputePanchangForYear(year: number): Array<{ dateStr: string; panchang: any }> {
  const numDays = isLeapYear(year) ? 366 : 365;
  const days: Array<{ dateStr: string; panchang: any }> = [];

  for (let i = 0; i < numDays; i++) {
    const current = new Date(Date.UTC(year, 0, i + 1, 5, 0, 0));
    const panchang = calculatePanchang(current, UJJAIN_LAT, UJJAIN_LON);
    days.push({
      dateStr: formatUtcDate(current),
      panchang,
    });
  }

  return days;
}

/**
 * Rule handler interface for future rule extensions
 */
export interface RuleHandler {
  evaluate(rule: ObservanceRule, days: Array<{ dateStr: string; panchang: any }>, year: number): string[];
}

/**
 * Handler for Solar Fixed rules
 */
export const SolarFixedHandler = {
  evaluate(rule: ObservanceRule, year: number): string[] {
    if (rule.solar_month === undefined || rule.solar_day === undefined) {
      return [];
    }
    const monthStr = String(rule.solar_month).padStart(2, '0');
    const dayStr = String(rule.solar_day).padStart(2, '0');
    return [`${year}-${monthStr}-${dayStr}`];
  }
};

/**
 * Handler for Lunar Tithi rules
 */
export const LunarTithiHandler = {
  evaluate(rule: ObservanceRule, days: Array<{ dateStr: string; panchang: any }>): string[] {
    if (!rule.lunar_masa_name || rule.lunar_tithi_index === undefined) {
      return [];
    }
    const target = rule.lunar_tithi_index;
    const matchedDates: string[] = [];
    const matchedSet = new Set<string>();

    // Primary scan: exact tithi match
    for (const d of days) {
      if (
        d.panchang.masaName === rule.lunar_masa_name &&
        d.panchang.tithiIndex === target
      ) {
        if (!matchedSet.has(d.dateStr)) {
          matchedDates.push(d.dateStr);
          matchedSet.add(d.dateStr);
        }
      }
    }

    // Secondary scan: detect tithis that the 5am UTC scan misses because the
    // tithi is fast-moving and fully contained within a single 24h window.
    // When prev.tithiIndex === T-1 and curr.tithiIndex === T+1 (with curr in
    // the target masa), the target tithi was present at IST sunrise on curr's
    // date but had already advanced by the 5am UTC scan time. Observe on curr.
    if (rule.allow_skipped_tithi && target > 1 && target < 15) {
      for (let i = 1; i < days.length; i++) {
        const prev = days[i - 1].panchang;
        const curr = days[i].panchang;
        if (
          curr.masaName === rule.lunar_masa_name &&
          prev.tithiIndex === target - 1 &&
          curr.tithiIndex === target + 1
        ) {
          if (!matchedSet.has(days[i].dateStr)) {
            matchedDates.push(days[i].dateStr);
            matchedSet.add(days[i].dateStr);
          }
        }
      }
    }

    return matchedDates;
  }
};

/**
 * Handler for Nakshatra Based rules
 */
export const NakshatraBasedHandler = {
  evaluate(rule: ObservanceRule, days: Array<{ dateStr: string; panchang: any }>): string[] {
    if (!rule.lunar_masa_name || !rule.nakshatra_name) {
      return [];
    }
    const matchedDates: string[] = [];
    for (const d of days) {
      if (
        d.panchang.masaName === rule.lunar_masa_name &&
        d.panchang.nakshatra === rule.nakshatra_name
      ) {
        matchedDates.push(d.dateStr);
      }
    }
    return matchedDates;
  }
};

/**
 * Handler for Regional Calendar rules (e.g. Nanakshahi, etc.) - Defined for future expansion
 */
export interface RegionalCalendarRule {
  evaluate(rule: ObservanceRule, year: number): string[];
}

const NANAKSHAHI_GREGORIAN_START: Record<string, { month: number; day: number }> = {
  'Chet':    { month: 3,  day: 14 },
  'Vaisakh': { month: 4,  day: 14 },
  'Jeth':    { month: 5,  day: 15 },
  'Harh':    { month: 6,  day: 15 },
  'Sawan':   { month: 7,  day: 16 },
  'Bhadon':  { month: 8,  day: 16 },
  'Assu':    { month: 9,  day: 15 },
  'Katik':   { month: 10, day: 15 },
  'Maghar':  { month: 11, day: 14 },
  'Poh':     { month: 12, day: 14 },
  'Magh':    { month: 1,  day: 13 },
  'Phagan':  { month: 2,  day: 12 },
};

export const NanakshahiHandler = {
  evaluate(rule: ObservanceRule, year: number): string[] {
    if (!rule.nanakshahi_month || rule.nanakshahi_day === undefined) return [];
    const start = NANAKSHAHI_GREGORIAN_START[rule.nanakshahi_month];
    if (!start) return [];

    // Magh and Phagan fall in the next Gregorian year
    const gregYear = (rule.nanakshahi_month === 'Magh' || rule.nanakshahi_month === 'Phagan')
      ? year + 1 : year;

    const startDate = new Date(Date.UTC(gregYear, start.month - 1, start.day));
    const observanceDate = new Date(startDate.getTime() + (rule.nanakshahi_day - 1) * 86400000);

    // Only include if the resulting date falls in the target year
    if (observanceDate.getUTCFullYear() !== year) return [];

    return [formatUtcDate(observanceDate)];
  }
};
export interface RegionalCalendarRule {
  evaluate(rule: ObservanceRule, year: number): string[];
}

/**
 * Calculates all occurrences of observances for a target Gregorian year.
 * Keeps calculation output deterministic and versionable.
 */
export function calculateObservancesForYear(year: number): CalculatedOccurrence[] {
  const days = precomputePanchangForYear(year);
  const occurrencesMap: Record<string, string[]> = {};

  // 1. First Pass: Evaluate absolute rules
  for (const rule of CANONICAL_RULES) {
    if (rule.rule_family === 'solar_fixed') {
      occurrencesMap[rule.slug] = SolarFixedHandler.evaluate(rule, year);
    } else if (rule.rule_family === 'lunar_tithi') {
      occurrencesMap[rule.slug] = LunarTithiHandler.evaluate(rule, days);
    } else if (rule.rule_family === 'nakshatra_based') {
      occurrencesMap[rule.slug] = NakshatraBasedHandler.evaluate(rule, days);
    } else if (rule.rule_family === 'regional_calendar') {
      occurrencesMap[rule.slug] = NanakshahiHandler.evaluate(rule, year);
    } else {
      occurrencesMap[rule.slug] = [];
    }
  }

  // 2. Second Pass: Resolve relative rules
  const maxIterations = 3;
  for (let iter = 0; iter < maxIterations; iter++) {
    for (const rule of CANONICAL_RULES) {
      if (rule.rule_family === 'relative_to_other_observance') {
        const baseSlug = rule.relative_base_slug;
        const offset = rule.relative_offset_days || 0;
        if (!baseSlug) continue;

        const baseDates = occurrencesMap[baseSlug] || [];
        const resolvedDates: string[] = [];

        for (const baseDate of baseDates) {
          const bd = new Date(baseDate + 'T00:00:00Z');
          const rd = new Date(bd.getTime() + offset * 24 * 60 * 60 * 1000);
          resolvedDates.push(formatUtcDate(rd));
        }

        occurrencesMap[rule.slug] = resolvedDates;
      }
    }
  }

  // 3. Assemble results — one occurrence per rule per year.
  // When multiple dates match (e.g. a dark-half tithi that spans two lunar months within
  // the same solar-rashi window), pick the first match by default, or the last match when
  // the rule explicitly sets `prefer_last_match: true`.
  const results: CalculatedOccurrence[] = [];
  for (const rule of CANONICAL_RULES) {
    const allDates = (occurrencesMap[rule.slug] || []).filter(
      d => new Date(d + 'T00:00:00Z').getUTCFullYear() === year
    );
    if (allDates.length === 0) continue;
    const selectedDate = rule.prefer_last_match
      ? allDates[allDates.length - 1]
      : allDates[0];
    results.push({ slug: rule.slug, date: selectedDate, year });
  }

  return results;
}
