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
    const matchedDates: string[] = [];
    for (const d of days) {
      if (
        d.panchang.masaName === rule.lunar_masa_name &&
        d.panchang.tithiIndex === rule.lunar_tithi_index
      ) {
        matchedDates.push(d.dateStr);
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

  // 3. Assemble and flatten results
  const results: CalculatedOccurrence[] = [];
  for (const rule of CANONICAL_RULES) {
    const dates = occurrencesMap[rule.slug] || [];
    for (const date of dates) {
      const occYear = new Date(date + 'T00:00:00Z').getUTCFullYear();
      if (occYear === year) {
        results.push({
          slug: rule.slug,
          date,
          year,
        });
      }
    }
  }

  return results;
}
