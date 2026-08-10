import { CANONICAL_RULES, ObservanceRule } from './rules';
import { calculatePanchang, REFERENCE_LOCATION_UJJAIN } from '../panchang';
import { getLunarMonth } from '@sangam/panchang-engine';

// Coordinates of Ujjain - traditional meridian for Hindu calendar calculations
export const UJJAIN_LAT = REFERENCE_LOCATION_UJJAIN.lat;
export const UJJAIN_LON = REFERENCE_LOCATION_UJJAIN.lon;

/**
 * Version flag for the calculation engine.
 *
 * BUMPED TO 2.0.0 — breaking [C] change (D1+D2, Tracker 3.7, Stage 2).
 * The corrected lunar month names (corrected_lunar_masa_name) are wired in.
 * Re-materialisation is required when USE_CORRECTED_MASA is flipped to true.
 * Stage 3 (the live switch) flips this flag default and triggers re-materialisation.
 */
export const RULE_ENGINE_VERSION = '2.0.0'; // D1+D2 Stage 2: corrected masa path behind USE_CORRECTED_MASA

/**
 * D1+D2 (Tracker 3.7) — Corrected lunar month path.
 *
 * DEFAULT: false  — legacy masaName path is active, byte-identical to v1.2.2.
 * Set true for Stage 3 (live switch, re-materialisation). NOT in scope now.
 *
 * When false:
 *   - precomputePanchangForYear runs exactly as before (masaIndex via sun sidereal + 11)
 *   - CANONICAL_RULES use lunar_masa_name (legacy, D1-calibrated)
 *   - verify:harness MUST be 988 passed / 216 skipped — invariant
 * When true:
 *   - precomputePanchangCorrectedForYear replaces masaName with getLunarMonth() amanta result
 *   - CANONICAL_RULES use corrected_lunar_masa_name and corrected_lunar_tithi_index
 *   - Requires re-materialisation and full date diff before going live [S]
 */
export const USE_CORRECTED_MASA: boolean = false;

/**
 * Gate integration behind USE_CONDITION_EVALUATOR, default OFF.
 * Set true to route time-of-day/muhurta dependent rules to the condition evaluator.
 */
export const USE_CONDITION_EVALUATOR: boolean = false;


export interface CalculatedOccurrence {
  slug: string;
  date: string; // YYYY-MM-DD
  year: number;
  /** True for recurring tithi vrats (many per definition per year). Lets the
   *  materialize layer key these by (definition, date) instead of (definition, year). */
  recurring?: boolean;
}

export interface ObservanceCandidateDiagnostic {
  slug: string;
  year: number;
  ruleFamily: ObservanceRule['rule_family'];
  candidateDates: string[];
  candidateCount: number;
  selectedDate: string | null;
  selectionPolicy: 'all_recurring' | 'first_match' | 'last_match' | 'none';
  recurring: boolean;
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
 * Whether this observance may be published at all.
 *
 * A rule carrying a `derivability` other than `computed` is one we cannot
 * honestly date:
 *
 *   requires_tradition_profile — computable, but only under a calendar profile
 *     Shoonaya does not ship. Our amanta/purnimanta profiles are not
 *     authoritative for it, so a date derived from them is an India-derived
 *     substitute, not the observance's date.
 *
 *   externally_curated — not computable by ANY calendar, because the date is
 *     chosen by an institution rather than computed (Kathina: a month-long
 *     season within which each monastery picks its own day).
 *
 * In both cases publishing our computed value would assert something we cannot
 * stand behind. The definition stays in rules.json — with its sources and
 * reasoning — so it can be switched on the moment a real profile exists. It
 * simply produces no occurrence, which means no calendar entry and no
 * notification, because both are built from occurrences.
 */
export function isPublishable(rule: ObservanceRule): boolean {
  const d = (rule as { derivability?: string }).derivability;
  return d === undefined || d === 'computed';
}

/**
 * Computes panchang for all days of the target Gregorian year.
 * We evaluate at exactly 01:00:00 UTC (morning in India, aligning with Ujjain sunrise).
 * LEGACY PATH — uses masaName from sun sidereal position (D1-calibrated).
 * Byte-identical to pre-v2.0.0 when USE_CORRECTED_MASA is false.
 */
export function precomputePanchangForYear(year: number): Array<{ dateStr: string; panchang: any }> {
  const numDays = isLeapYear(year) ? 366 : 365;
  const days: Array<{ dateStr: string; panchang: any }> = [];

  for (let i = 0; i < numDays; i++) {
    const current = new Date(Date.UTC(year, 0, i + 1, 1, 0, 0)); // 1am UTC = ~6:30am IST ≈ Ujjain sunrise
    const panchang = calculatePanchang(current, UJJAIN_LAT, UJJAIN_LON);
    days.push({
      dateStr: formatUtcDate(current),
      panchang,
    });
  }

  return days;
}

/**
 * Computes panchang for all days of the target Gregorian year using CORRECTED lunar month names.
 *
 * D1+D2 (Tracker 3.7, Stage 1). Active only when USE_CORRECTED_MASA is true.
 *
 * Replaces masaName in the panchang object with the result of getLunarMonth(instant, 'amanta')
 * from packages/panchang-engine/src/lunar-month/index.ts. This is the astronomically correct
 * amanta month name (amavasya-boundary + sankranti counting), not the D1-shifted sun-rashi name.
 *
 * All other panchang fields (tithiIndex, nakshatra, etc.) are unchanged. The handlers
 * (LunarTithiHandler etc.) still read panchang.masaName — only the data source changes.
 *
 * Rules must use corrected_lunar_masa_name (and corrected_lunar_tithi_index where different)
 * when this path is active.
 */
export function precomputePanchangCorrectedForYear(year: number): Array<{ dateStr: string; panchang: any }> {
  const numDays = isLeapYear(year) ? 366 : 365;
  const days: Array<{ dateStr: string; panchang: any }> = [];

  for (let i = 0; i < numDays; i++) {
    const current = new Date(Date.UTC(year, 0, i + 1, 1, 0, 0));
    const panchang = calculatePanchang(current, UJJAIN_LAT, UJJAIN_LON);

    // Replace masaName with the correct amanta month from getLunarMonth().
    // On solver failure (extremely rare) fall back to empty string so rules
    // that need a specific month simply produce no match rather than a wrong one.
    // D32: BOTH month systems are computed. A rule's `corrected_month_system`
    // selects which one it is matched against.
    //
    // Previously only amanta was computed and `corrected_month_system` was never
    // read -- line ~219 tests it for `!== undefined` as a "is this the corrected
    // path" boolean and discards the value. So a rule declaring 'purnimanta' was
    // silently evaluated as amanta.
    //
    // For SHUKLA-paksha rules the two systems agree, so this was invisible. For
    // KRISHNA paksha they differ by exactly one month (purnimanta = amanta + 1),
    // and every such rule was therefore a month out if its tradition reckons
    // purnimanta -- which North India does. Vat Savitri / Shani Jayanti is the
    // confirmed case: Jyeshtha Amavasya is 2026-05-16 purnimanta (correct) but
    // 2026-07-14 amanta (which is really Ashadha Amavasya).
    const amanta = getLunarMonth(current, 'amanta');
    const purnimanta = getLunarMonth(current, 'purnimanta');

    days.push({
      dateStr: formatUtcDate(current),
      panchang: {
        ...panchang,
        masaName: amanta.ok ? amanta.monthName : '',
        masaNamePurnimanta: purnimanta.ok ? purnimanta.monthName : '',
      },
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
 * Verifies if the panchang's month name matches the rule's target month name
 * under the rule's Adhika masa policy.
 */
export function isMasaMatching(
  panchangMasaName: string,
  ruleMasaName: string,
  policy?: 'nija' | 'adhika' | 'both',
): boolean {
  if (!panchangMasaName || !ruleMasaName) return false;
  
  const isPanchangAdhika = panchangMasaName.startsWith('Adhika ');
  const cleanPanchangMasa = isPanchangAdhika ? panchangMasaName.slice(7) : panchangMasaName;
  
  if (cleanPanchangMasa !== ruleMasaName) return false;
  
  const p = policy || 'nija';
  if (p === 'nija') {
    return !isPanchangAdhika;
  }
  if (p === 'adhika') {
    return isPanchangAdhika;
  }
  if (p === 'both') {
    return true;
  }
  return false;
}

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
        isMasaMatching(d.panchang.masaName, rule.lunar_masa_name, rule.adhika_policy) &&
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
    const isCorrected = rule.corrected_month_system !== undefined;
    const canCheckSkipped = rule.allow_skipped_tithi && (isCorrected ? (target >= 1 && target <= 30) : (target >= 1 && target < 15));

    if (canCheckSkipped) {
      for (let i = 1; i < days.length; i++) {
        const prev = days[i - 1].panchang;
        const curr = days[i].panchang;
        let skipped = false;

        if (target === 1) {
          skipped = prev.tithiIndex === 30 && curr.tithiIndex === 2;
        } else if (isCorrected && target === 16) {
          skipped = prev.tithiIndex === 15 && curr.tithiIndex === 17;
        } else if (isCorrected && target === 30) {
          skipped = prev.tithiIndex === 29 && curr.tithiIndex === 1;
        } else {
          skipped = prev.tithiIndex === target - 1 && curr.tithiIndex === target + 1;
        }

        if (skipped && isMasaMatching(curr.masaName, rule.lunar_masa_name, rule.adhika_policy)) {
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
 * Handler for recurring lunar-tithi vrats (every masa, both pakshas).
 * Returns every date whose tithi matches one of `recurring_tithi_indices`,
 * reusing the skipped-tithi detection and collapsing a tithi that spans two
 * consecutive sunrises down to its first day. Unlike LunarTithiHandler this
 * does NOT filter by masa, so it yields ~12-26 occurrences per year.
 */
export const RecurringLunarTithiHandler = {
  evaluate(rule: ObservanceRule, days: Array<{ dateStr: string; panchang: any }>): string[] {
    const targets = rule.recurring_tithi_indices;
    if (!targets || targets.length === 0) return [];
    const targetSet = new Set(targets);
    const matchedDates: string[] = [];
    const matchedSet = new Set<string>();
    let lastPushedTithi = -1;

    for (let i = 0; i < days.length; i++) {
      const curr = days[i].panchang;
      const prev = i > 0 ? days[i - 1].panchang : null;

      // Filter by Adhika policy if applicable
      const cleanMasa = curr.masaName.startsWith('Adhika ') ? curr.masaName.slice(7) : curr.masaName;
      if (!isMasaMatching(curr.masaName, cleanMasa, rule.adhika_policy)) {
        continue;
      }

      // Primary: target tithi present at the sunrise scan. Collapse a tithi that
      // spans two consecutive sunrises to its first day.
      if (targetSet.has(curr.tithiIndex)) {
        if (curr.tithiIndex !== lastPushedTithi && !matchedSet.has(days[i].dateStr)) {
          matchedDates.push(days[i].dateStr);
          matchedSet.add(days[i].dateStr);
        }
        lastPushedTithi = curr.tithiIndex;
        continue;
      }
      lastPushedTithi = -1;

      // Skipped tithi: a fast target tithi fully contained between two scans
      // (prev = T-1, curr = T+1). Observe on curr, matching LunarTithiHandler.
      if (rule.allow_skipped_tithi && prev) {
        for (const T of targets) {
          const skippedWithinPaksha = T > 1 && T < 30 && prev.tithiIndex === T - 1 && curr.tithiIndex === T + 1;
          const skippedAmavasya = T === 30 && prev.tithiIndex === 29 && curr.tithiIndex === 1;
          if (skippedWithinPaksha || skippedAmavasya) {
            if (!matchedSet.has(days[i].dateStr)) {
              matchedDates.push(days[i].dateStr);
              matchedSet.add(days[i].dateStr);
            }
            break;
          }
        }
      }
    }
    return matchedDates;
  }
};

/**
 * Handler for recurring weekday vrats inside a calibrated lunar masa, such as
 * Shravan Somvar and Mangala Gauri. Weekday uses the generated Gregorian date
 * at the same Ujjain sunrise scan as the rest of the engine.
 */
export const RecurringWeekdayHandler = {
  evaluate(rule: ObservanceRule, days: Array<{ dateStr: string; panchang: any }>): string[] {
    if (rule.recurring_weekday === undefined) return [];
    const matchedDates: string[] = [];

    for (const d of days) {
      if (rule.lunar_masa_name && !isMasaMatching(d.panchang.masaName, rule.lunar_masa_name, rule.adhika_policy)) {
        continue;
      }

      const weekday = new Date(`${d.dateStr}T00:00:00Z`).getUTCDay();
      if (weekday === rule.recurring_weekday) {
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
        isMasaMatching(d.panchang.masaName, rule.lunar_masa_name, rule.adhika_policy) &&
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

function buildOccurrencesMap(year: number): Record<string, string[]> {
  const days = precomputePanchangForYear(year);
  const occurrencesMap: Record<string, string[]> = {};

  // 1. First Pass: Evaluate absolute rules
  for (const rule of CANONICAL_RULES) {
    if (!isPublishable(rule)) { occurrencesMap[rule.slug] = []; continue; }
    if (rule.rule_family === 'solar_fixed') {
      occurrencesMap[rule.slug] = SolarFixedHandler.evaluate(rule, year);
    } else if (rule.rule_family === 'lunar_tithi') {
      occurrencesMap[rule.slug] = LunarTithiHandler.evaluate(rule, days);
    } else if (rule.rule_family === 'lunar_tithi_recurring') {
      occurrencesMap[rule.slug] = RecurringLunarTithiHandler.evaluate(rule, days);
    } else if (rule.rule_family === 'weekday_recurring') {
      occurrencesMap[rule.slug] = RecurringWeekdayHandler.evaluate(rule, days);
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

  return occurrencesMap;
}

/**
 * Calculates all occurrences of observances for a target Gregorian year, using
 * the **legacy** masa path unconditionally — it ignores USE_CORRECTED_MASA.
 *
 * Diff and reconciliation scripts MUST call this, not `calculateObservancesForYear`,
 * whenever they need "the legacy answer". `calculateObservancesForYear` dispatches on
 * the gate, so once the gate is on it returns the *corrected* result and any script
 * diffing it against `calculateObservancesForYearCorrected` silently becomes a
 * self-comparison reporting zero movement.
 *
 * That is not hypothetical: `scripts/verify-masa-gate.ts` measures 74 differing
 * (slug@date) pairs for 2026 with the gate off, and 0 with it on.
 */
export function calculateObservancesForYearLegacy(year: number): CalculatedOccurrence[] {
  const occurrencesMap = buildOccurrencesMap(year);

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
    // Recurring vrats emit EVERY occurrence in the year, not just one.
    if (rule.rule_family === 'lunar_tithi_recurring' || rule.rule_family === 'weekday_recurring') {
      for (const date of allDates) {
        results.push({ slug: rule.slug, date, year, recurring: true });
      }
      continue;
    }
    const selectedDate = rule.prefer_last_match
      ? allDates[allDates.length - 1]
      : allDates[0];
    results.push({ slug: rule.slug, date: selectedDate, year });
  }

  return results;
}

/**
 * The production entry point. Dispatches on USE_CORRECTED_MASA.
 *
 * Callers that want "whatever ships" use this. Callers that want a *specific*
 * path must name it — `calculateObservancesForYearLegacy` or
 * `calculateObservancesForYearCorrected` — so their meaning survives a gate flip.
 */
export function calculateObservancesForYear(year: number): CalculatedOccurrence[] {
  return USE_CORRECTED_MASA
    ? calculateObservancesForYearCorrected(year)
    : calculateObservancesForYearLegacy(year);
}

export function calculateObservanceCandidateDiagnosticsForYear(year: number): ObservanceCandidateDiagnostic[] {
  const occurrencesMap = buildOccurrencesMap(year);

  return CANONICAL_RULES.map((rule) => {
    const candidateDates = (occurrencesMap[rule.slug] || []).filter(
      d => new Date(d + 'T00:00:00Z').getUTCFullYear() === year
    );
    const recurring = rule.rule_family === 'lunar_tithi_recurring' || rule.rule_family === 'weekday_recurring';
    const selectionPolicy: ObservanceCandidateDiagnostic['selectionPolicy'] = candidateDates.length === 0
      ? 'none'
      : recurring
        ? 'all_recurring'
        : rule.prefer_last_match
          ? 'last_match'
          : 'first_match';
    const selectedDate = candidateDates.length === 0
      ? null
      : rule.prefer_last_match
        ? candidateDates[candidateDates.length - 1]
        : candidateDates[0];

    return {
      slug: rule.slug,
      year,
      ruleFamily: rule.rule_family,
      candidateDates,
      candidateCount: candidateDates.length,
      selectedDate,
      selectionPolicy,
      recurring,
    };
  });
}

// ---------------------------------------------------------------------------
// D1+D2 Stage 1: Corrected shadow evaluation path
// ---------------------------------------------------------------------------

/**
 * Adapts a rule to use its corrected fields for the corrected engine path.
 *
 * In the corrected path:
 *   - lunar_masa_name      → corrected_lunar_masa_name (if set, otherwise unchanged)
 *   - lunar_tithi_index    → corrected_lunar_tithi_index (if set, otherwise unchanged)
 *
 * This adapter is used ONLY by buildOccurrencesMapCorrected. It never touches
 * the legacy path. The original rule object is never mutated.
 */
function toCorrectedRule(rule: ObservanceRule): ObservanceRule {
  return {
    ...rule,
    lunar_masa_name: rule.corrected_lunar_masa_name ?? rule.lunar_masa_name,
    lunar_tithi_index: rule.corrected_lunar_tithi_index ?? rule.lunar_tithi_index,
    prefer_last_match: rule.corrected_prefer_last_match !== undefined ? rule.corrected_prefer_last_match : rule.prefer_last_match,
    allow_skipped_tithi: rule.corrected_allow_skipped_tithi !== undefined ? rule.corrected_allow_skipped_tithi : rule.allow_skipped_tithi,
  };
}

/**
 * Parallel to buildOccurrencesMap but uses:
 *   1. precomputePanchangCorrectedForYear (correct amanta masaName from getLunarMonth)
 *   2. corrected_lunar_masa_name / corrected_lunar_tithi_index from each rule
 *
 * Used exclusively by calculateObservancesForYearCorrected (Stage 1 shadow diff).
 * Does NOT affect calculateObservancesForYear (legacy path, flag OFF invariant).
 */
function buildOccurrencesMapCorrected(year: number): Record<string, string[]> {
  const days = precomputePanchangCorrectedForYear(year);
  const occurrencesMap: Record<string, string[]> = {};

  // D32: present each rule with the month name of ITS declared system. The
  // handlers all read `panchang.masaName`, so the swap happens here rather than
  // in every handler. Defaults to amanta, matching the previous behaviour, so a
  // rule that does not declare a system is evaluated exactly as before.
  const daysPurnimanta = days.map(d => ({
    ...d,
    panchang: { ...d.panchang, masaName: d.panchang.masaNamePurnimanta },
  }));
  const daysFor = (r: ObservanceRule) =>
    r.corrected_month_system === 'purnimanta' ? daysPurnimanta : days;

  // 1. First Pass: Evaluate absolute rules using corrected rule fields
  for (const rule of CANONICAL_RULES) {
    if (!isPublishable(rule)) { occurrencesMap[rule.slug] = []; continue; }
    const r = toCorrectedRule(rule);
    const d = daysFor(r);
    if (r.rule_family === 'solar_fixed') {
      occurrencesMap[r.slug] = SolarFixedHandler.evaluate(r, year);
    } else if (r.rule_family === 'lunar_tithi') {
      occurrencesMap[r.slug] = LunarTithiHandler.evaluate(r, d);
    } else if (r.rule_family === 'lunar_tithi_recurring') {
      occurrencesMap[r.slug] = RecurringLunarTithiHandler.evaluate(r, d);
    } else if (r.rule_family === 'weekday_recurring') {
      occurrencesMap[r.slug] = RecurringWeekdayHandler.evaluate(r, d);
    } else if (r.rule_family === 'nakshatra_based') {
      occurrencesMap[r.slug] = NakshatraBasedHandler.evaluate(r, d);
    } else if (r.rule_family === 'regional_calendar') {
      occurrencesMap[r.slug] = NanakshahiHandler.evaluate(r, year);
    } else {
      occurrencesMap[r.slug] = [];
    }
  }

  // 2. Second Pass: Resolve relative rules (identical to legacy — relative rules
  //    are anchored to their base slugs which will already have corrected dates)
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

  return occurrencesMap;
}

/**
 * Calculates all occurrences of observances for a target year using the CORRECTED engine.
 *
 * D1+D2 Stage 1 — Shadow evaluation path. Used by the diff script only.
 * Does not affect calculateObservancesForYear (legacy, flag OFF).
 *
 * Each rule's prefer_last_match applies as in the legacy path.
 */
export function calculateObservancesForYearCorrected(year: number): CalculatedOccurrence[] {
  const occurrencesMap = buildOccurrencesMapCorrected(year);

  const results: CalculatedOccurrence[] = [];
  for (const rule of CANONICAL_RULES) {
    const r = toCorrectedRule(rule);
    const allDates = (occurrencesMap[r.slug] || []).filter(
      d => new Date(d + 'T00:00:00Z').getUTCFullYear() === year
    );
    if (allDates.length === 0) continue;
    if (r.rule_family === 'lunar_tithi_recurring' || r.rule_family === 'weekday_recurring') {
      for (const date of allDates) {
        results.push({ slug: r.slug, date, year, recurring: true });
      }
      continue;
    }
    const selectedDate = r.prefer_last_match
      ? allDates[allDates.length - 1]
      : allDates[0];
    results.push({ slug: r.slug, date: selectedDate, year });
  }

  return results;
}
