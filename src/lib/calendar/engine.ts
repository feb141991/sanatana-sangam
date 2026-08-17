import { CANONICAL_RULES, ObservanceRule } from './rules';
import { calculatePanchang, REFERENCE_LOCATION_UJJAIN } from '../panchang';
import { getLunarMonth, getSunriseForDateStr, resolveVedicDayForInstant, offsetCivilDateStr, type LocationInput } from '@sangam/panchang-engine';
import { calculateOccurrencesWithEvaluator } from './materialize';

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
  /**
   * Stable per-rule identity — slug::variant_key (or slug::sampradaya as
   * fallback, or just slug for single-row rules). Derived by ruleIdentityKey().
   *
   * This is the internal key the engine uses to isolate same-slug variants in
   * its occurrence maps. Consumers that only need the public route slug should
   * read `.slug`. Consumers that need to distinguish variants (e.g. the
   * materialiser's batch-tracking) should read `.ruleKey`.
   */
  ruleKey: string;
  date: string; // YYYY-MM-DD
  year: number;
  /** True for recurring tithi vrats (many per definition per year). Lets the
   *  materialize layer key these by (definition, date) instead of (definition, year). */
  recurring?: boolean;
}

export interface ObservanceCandidateDiagnostic {
  slug: string;
  /**
   * Stable per-rule identity. One diagnostic is emitted per rule row, not per
   * slug — two same-slug variants each produce their own diagnostic entry.
   */
  ruleKey: string;
  year: number;
  ruleFamily: ObservanceRule['rule_family'];
  candidateDates: string[];
  candidateCount: number;
  selectedDate: string | null;
  selectionPolicy: 'all_recurring' | 'first_match' | 'last_match' | 'none';
  recurring: boolean;
  /** True when the engine computed dates but publication is withheld. */
  publicationWithheld: boolean;
  /** Why it was withheld, or null when it publishes normally. */
  withheldReason: 'derivability' | 'deferred' | 'disputed_year' | null;
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
/**
 * Whether this observance may be published FOR A GIVEN YEAR.
 *
 * `isPublishable` answers "ever". This answers "this year", because a rule can
 * be sound in one year and disputed in another -- Janmashtami's 2026 date is
 * council-confirmed and reproduces, while its 2027 date is contested.
 *
 * This exists because a review correctly pointed out that `ratification_note`
 * is prose. I had written that recording a disputed year meant it "cannot ship
 * as silently verified". That was false: nothing read the note, so the disputed
 * dates would have materialised exactly like any other. Documentation is not a
 * gate. This is the gate.
 */
export function isPublishableForYear(rule: ObservanceRule, year: number): boolean {
  if (!isPublishable(rule)) return false;
  return !rule.disputed_years?.includes(year);
}

export function isPublishable(rule: ObservanceRule): boolean {
  const r = rule;

  // Not knowable — no calendar we ship can produce an honest date.
  if (r.derivability !== undefined && r.derivability !== 'computed') return false;

  // Knowable, but not in the launch subset. A separate axis on purpose: this one
  // is a scheduling decision that reverses with a data edit, where derivability
  // is a statement about what is computable at all. Collapsing them would lose
  // the difference between "we cannot know this" and "we know it but are not
  // ready to stand behind it".
  if (r.launch_status === 'deferred') return false;

  return true;
}

/**
 * Stable internal identity for a rule — distinct from the public route slug.
 *
 * For single-row rules (the overwhelming majority) this is just the slug.
 * For same-slug variant rows (e.g. the two krishna-janmashtami rows that
 * differ by sampradaya) it is slug::variant_key, or slug::sampradaya as a
 * fallback when variant_key is absent.
 *
 * WHY THIS EXISTS
 * ---------------
 * The occurrence builders keyed their internal maps by `rule.slug`. When two
 * rules share a slug, the second write silently overwrote the first's computed
 * dates. A publication gate on the second rule (e.g. `launch_status: deferred`)
 * then wrote `[]`, which the first rule's assembler-loop entry would later read
 * back — the included rule lost its dates. The outcome depended entirely on
 * array position, not on the rules' own gating fields.
 *
 * This function is the single definition of identity. Callers that need a
 * display slug should read `.slug`; callers that need to distinguish variants
 * should use this.
 */
export function ruleIdentityKey(rule: ObservanceRule): string {
  if (rule.variant_key) return `${rule.slug}::${rule.variant_key}`;
  if (rule.sampradaya) return `${rule.slug}::${rule.sampradaya}`;
  return rule.slug;
}

const legacyPanchangCache = new Map<string, Array<{ dateStr: string; panchang: any }>>();
const DEFAULT_LOCATION: LocationInput = { lat: UJJAIN_LAT, lon: UJJAIN_LON, tz: 'Asia/Kolkata' };
const correctedPanchangCache = new Map<string, Array<{ dateStr: string; panchang: any; sunriseUtc?: string }>>();

/**
 * Computes panchang for all days of the target Gregorian year.
 * We evaluate at exactly 01:00:00 UTC (morning in India, aligning with Ujjain sunrise).
 * LEGACY PATH — uses masaName from sun sidereal position (D1-calibrated).
 * Byte-identical to pre-v2.0.0 when USE_CORRECTED_MASA is false.
 */
export function precomputePanchangForYear(
  year: number,
  location: LocationInput = DEFAULT_LOCATION,
): Array<{ dateStr: string; panchang: any }> {
  const cacheKey = `${year}:${location.lat}:${location.lon}:${location.tz}`;
  if (legacyPanchangCache.has(cacheKey)) {
    return legacyPanchangCache.get(cacheKey)!;
  }
  const numDays = isLeapYear(year) ? 366 : 365;
  const days: Array<{ dateStr: string; panchang: any }> = [];

  for (let i = 0; i < numDays; i++) {
    const current = new Date(Date.UTC(year, 0, i + 1, 1, 0, 0)); // 1am UTC = ~6:30am IST ≈ Ujjain sunrise
    const panchang = calculatePanchang(current, location.lat, location.lon, location.tz);
    days.push({
      dateStr: formatUtcDate(current),
      panchang,
    });
  }

  legacyPanchangCache.set(cacheKey, days);
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
export function precomputePanchangCorrectedForYear(
  year: number,
  location: LocationInput = DEFAULT_LOCATION,
): Array<{ dateStr: string; panchang: any; sunriseUtc?: string }> {
  const cacheKey = `${year}:${location.lat}:${location.lon}:${location.tz}`;
  if (correctedPanchangCache.has(cacheKey)) {
    return correctedPanchangCache.get(cacheKey)!;
  }
  const numDays = isLeapYear(year) ? 366 : 365;
  const days: Array<{ dateStr: string; panchang: any; sunriseUtc?: string }> = [];
  let currentCivilDate = `${year}-01-01`;

  for (let i = 0; i < numDays; i++) {
    const { sunrise } = getSunriseForDateStr(currentCivilDate, location);
    const panchang = calculatePanchang(sunrise, location.lat, location.lon, location.tz);
    const vedicDay = resolveVedicDayForInstant(sunrise, location);

    const amanta = getLunarMonth(sunrise, 'amanta');
    const purnimanta = getLunarMonth(sunrise, 'purnimanta');

    days.push({
      dateStr: vedicDay.owningCivilDate,
      panchang: {
        ...panchang,
        masaName: amanta.ok ? amanta.monthName : '',
        masaNamePurnimanta: purnimanta.ok ? purnimanta.monthName : '',
      },
      sunriseUtc: sunrise.toISOString(),
    });

    currentCivilDate = offsetCivilDateStr(currentCivilDate, 1);
  }

  correctedPanchangCache.set(cacheKey, days);
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
    const canCheckSkipped = (rule.allow_skipped_tithi || rule.skipped_tithi_policy !== undefined) && (isCorrected ? (target >= 1 && target <= 30) : (target >= 1 && target < 15));

    if (canCheckSkipped) {
      const policy = rule.skipped_tithi_policy ?? 'following_day';
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

        if (skipped) {
          const targetDay = (policy === 'previous_day' || policy === 'day_before') ? days[i - 1] : days[i];
          if (isMasaMatching(targetDay.panchang.masaName, rule.lunar_masa_name, rule.adhika_policy)) {
            if (!matchedSet.has(targetDay.dateStr)) {
              matchedDates.push(targetDay.dateStr);
              matchedSet.add(targetDay.dateStr);
            }
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
      const isAdhikaMasa = curr.masaName.startsWith('Adhika ');
      const adhikaPolicy = rule.adhika_policy || 'nija';
      if (adhikaPolicy === 'nija' && isAdhikaMasa) continue;
      if (adhikaPolicy === 'adhika' && !isAdhikaMasa) continue;

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

function buildOccurrencesMap(
  year: number,
  opts: { applyPublicationGate?: boolean; location?: LocationInput } = {},
): Record<string, string[]> {
  // Gated BY DEFAULT. Callers that want raw candidates must ask for them
  // explicitly, so a new publishing call site cannot forget the gate.
  const gate = opts.applyPublicationGate !== false;
  const location = opts.location ?? DEFAULT_LOCATION;
  const days = precomputePanchangForYear(year, location);
  // Keyed by ruleIdentityKey(rule), NOT rule.slug.
  //
  // Using rule.slug as the key meant that two rules sharing a slug (same-slug
  // variants) overwrote each other in this map. Whether the included rule or
  // the deferred rule won depended entirely on their position in CANONICAL_RULES
  // — a publication gate that depended on array order, not on gating fields.
  const occurrencesMap: Record<string, string[]> = {};

  // slug → ruleIdentityKey[] — lets the relative-rule second pass look up a
  // base slug's dates without knowing its variant structure. Today all
  // relative_base_slug values point to single-row rules whose ruleKey equals
  // their slug, so this is currently a one-to-one map. When a base rule gains
  // same-slug variants, all their dates are collected for the derived rule.
  const slugIndex = new Map<string, string[]>();

  // 1. First Pass: Evaluate absolute rules
  for (const rule of CANONICAL_RULES) {
    const rk = ruleIdentityKey(rule);
    slugIndex.set(rule.slug, [...(slugIndex.get(rule.slug) ?? []), rk]);
    if (gate && !isPublishableForYear(rule, year)) { occurrencesMap[rk] = []; continue; }
    if (rule.rule_family === 'solar_fixed') {
      occurrencesMap[rk] = SolarFixedHandler.evaluate(rule, year);
    } else if (rule.rule_family === 'lunar_tithi') {
      occurrencesMap[rk] = LunarTithiHandler.evaluate(rule, days);
    } else if (rule.rule_family === 'lunar_tithi_recurring') {
      occurrencesMap[rk] = RecurringLunarTithiHandler.evaluate(rule, days);
    } else if (rule.rule_family === 'weekday_recurring') {
      occurrencesMap[rk] = RecurringWeekdayHandler.evaluate(rule, days);
    } else if (rule.rule_family === 'nakshatra_based') {
      occurrencesMap[rk] = NakshatraBasedHandler.evaluate(rule, days);
    } else if (rule.rule_family === 'regional_calendar') {
      occurrencesMap[rk] = NanakshahiHandler.evaluate(rule, year);
    } else {
      occurrencesMap[rk] = [];
    }
  }

  // 2. Second Pass: Resolve relative rules
  const maxIterations = 3;
  for (let iter = 0; iter < maxIterations; iter++) {
    for (const rule of CANONICAL_RULES) {
      // The second pass iterates CANONICAL_RULES afresh, so it needs the same
      // publication gate as the first. Without it a deferred relative rule still
      // resolved -- its base was published, so the offset succeeded and the rule
      // appeared in output despite being suppressed. Seven rules leaked through
      // this way (mahalaya-amavasya, kartik-purnima, the Jain Diwali cluster,
      // sangha-day-loy-krathong, chintpurni-mata-sharad-navratri).
      if (gate && !isPublishableForYear(rule, year)) continue;
      if (rule.rule_family === 'relative_to_other_observance') {
        const baseSlug = rule.relative_base_slug;
        const offset = rule.relative_offset_days || 0;
        if (!baseSlug) continue;

        // Collect dates from ALL identities that carry the base slug.
        // For single-row bases (today's only case) this is identical to the old
        // occurrencesMap[baseSlug] lookup. For future multi-variant bases it will
        // aggregate all variants' dates — consistent with relative rules being
        // anchored to the OBSERVANCE, not a specific variant of it.
        const baseKeys = slugIndex.get(baseSlug) ?? [];
        const baseDates = [...new Set(baseKeys.flatMap(k => occurrencesMap[k] ?? []))];
        const resolvedDates: string[] = [];

        for (const baseDate of baseDates) {
          const bd = new Date(baseDate + 'T00:00:00Z');
          const rd = new Date(bd.getTime() + offset * 24 * 60 * 60 * 1000);
          resolvedDates.push(formatUtcDate(rd));
        }

        occurrencesMap[ruleIdentityKey(rule)] = resolvedDates;
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
export function calculateObservancesForYearLegacy(
  year: number,
  location: LocationInput = DEFAULT_LOCATION,
): CalculatedOccurrence[] {
  const occurrencesMap = buildOccurrencesMap(year, { location });

  // 3. Assemble results — one occurrence per rule per year.
  // When multiple dates match (e.g. a dark-half tithi that spans two lunar months within
  // the same solar-rashi window), pick the first match by default, or the last match when
  // the rule explicitly sets `prefer_last_match: true`.
  const results: CalculatedOccurrence[] = [];
  for (const rule of CANONICAL_RULES) {
    const rk = ruleIdentityKey(rule);
    const allDates = (occurrencesMap[rk] || []).filter(
      d => new Date(d + 'T00:00:00Z').getUTCFullYear() === year
    );
    if (allDates.length === 0) continue;
    // Recurring vrats emit EVERY occurrence in the year, not just one.
    if (rule.rule_family === 'lunar_tithi_recurring' || rule.rule_family === 'weekday_recurring') {
      for (const date of allDates) {
        results.push({ slug: rule.slug, ruleKey: rk, date, year, recurring: true });
      }
      continue;
    }
    const selectedDate = rule.prefer_last_match
      ? allDates[allDates.length - 1]
      : allDates[0];
    results.push({ slug: rule.slug, ruleKey: rk, date: selectedDate, year });
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
export function calculateObservancesForYear(
  year: number,
  location?: LocationInput,
): CalculatedOccurrence[] {
  if (USE_CONDITION_EVALUATOR) {
    const { resolved } = calculateOccurrencesWithEvaluator(year, location);
    return resolved.map(o => ({
      slug: o.slug,
      ruleKey: o.variant_key ? `${o.slug}::${o.variant_key}` : o.slug,
      date: o.date,
      year: o.year,
      recurring: o.recurring,
    }));
  }
  return USE_CORRECTED_MASA
    ? calculateObservancesForYearCorrected(year, location)
    : calculateObservancesForYearLegacy(year, location);
}

export function calculateObservanceCandidateDiagnosticsForYear(
  year: number,
  location?: LocationInput,
  // 'legacy' (default) is what production actually ships today
  // (USE_CORRECTED_MASA=false) -- integrity.ts diffs stored dates against
  // this because that's the engine that wrote them. 'corrected' is for
  // callers that explicitly want the new-engine candidate set instead (e.g.
  // fixture-engine-hint.ts, so admin reviewers aren't shown legacy output
  // while sourcing NEW-engine fixtures) -- it does NOT change what ships.
  enginePreference: 'legacy' | 'corrected' = 'legacy',
): ObservanceCandidateDiagnostic[] {
  // UNGATED on purpose. A review caught that routing this through the gated
  // builder made every withheld rule report zero candidates -- so the tool whose
  // entire job is explaining what the engine did was reporting that it did
  // nothing. Suppression is a publication decision, not an amnesia policy: the
  // candidate dates are the evidence a reviewer needs to resolve the dispute.
  // Publication is gated elsewhere; this surface reports and labels instead.
  //
  // One diagnostic entry is emitted PER RULE ROW (per ruleIdentityKey), not per
  // slug. Two same-slug variant rows each produce their own entry, so a reviewer
  // can distinguish which variant computed which candidate dates.
  // The non-preferred map is only ever consulted as a per-rule fallback (when
  // the preferred map has zero candidates for that rule), so it's computed
  // lazily -- most callers asking for 'corrected' never trigger the legacy
  // fallback at all, and legacy's own full-year computation is real, non-
  // trivial work (~3-4s/year) worth skipping when nothing needs it.
  let _legacyMap: Record<string, string[]> | null = null;
  const getLegacyMap = () => (_legacyMap ??= buildOccurrencesMap(year, { applyPublicationGate: false, location }));
  let _correctedMap: Record<string, string[]> | null = null;
  const getCorrectedMap = () => (_correctedMap ??= buildOccurrencesMapCorrected(year, { applyPublicationGate: false, location }));

  return CANONICAL_RULES.map((rule) => {
    const rk = ruleIdentityKey(rule);
    const rawDates = enginePreference === 'corrected'
      ? (() => { const c = getCorrectedMap()[rk]; return (c && c.length > 0) ? c : (getLegacyMap()[rk] || []); })()
      : (() => { const l = getLegacyMap()[rk]; return (l && l.length > 0) ? l : (getCorrectedMap()[rk] || []); })();
    const candidateDates = rawDates.filter(
      d => new Date(d + 'T00:00:00Z').getUTCFullYear() === year
    );
    const recurring = rule.rule_family === 'lunar_tithi_recurring' || rule.rule_family === 'weekday_recurring';
    const preferLast = rule.corrected_prefer_last_match ?? rule.prefer_last_match;
    const selectionPolicy: ObservanceCandidateDiagnostic['selectionPolicy'] = candidateDates.length === 0
      ? 'none'
      : recurring
        ? 'all_recurring'
        : preferLast
          ? 'last_match'
          : 'first_match';
    const selectedDate = candidateDates.length === 0
      ? null
      : preferLast
        ? candidateDates[candidateDates.length - 1]
        : candidateDates[0];

    const withheldReason: ObservanceCandidateDiagnostic['withheldReason'] =
      rule.derivability !== undefined && rule.derivability !== 'computed' ? 'derivability'
      : rule.launch_status === 'deferred' ? 'deferred'
      : rule.disputed_years?.includes(year) ? 'disputed_year'
      : null;

    return {
      slug: rule.slug,
      ruleKey: rk,
      year,
      ruleFamily: rule.rule_family,
      publicationWithheld: withheldReason !== null,
      withheldReason,
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
    skipped_tithi_policy: rule.corrected_skipped_tithi_policy ?? rule.skipped_tithi_policy,
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
function buildOccurrencesMapCorrected(
  year: number,
  opts: { applyPublicationGate?: boolean; location?: LocationInput } = {},
): Record<string, string[]> {
  const gate = opts.applyPublicationGate !== false;
  const location = opts.location ?? DEFAULT_LOCATION;
  const days = precomputePanchangCorrectedForYear(year, location);
  // Keyed by ruleIdentityKey(rule) — same reasoning as buildOccurrencesMap.
  const occurrencesMap: Record<string, string[]> = {};

  // slug → ruleIdentityKey[] for relative-rule resolution (same as legacy path).
  const slugIndex = new Map<string, string[]>();

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
    const rk = ruleIdentityKey(rule);
    slugIndex.set(rule.slug, [...(slugIndex.get(rule.slug) ?? []), rk]);
    if (gate && !isPublishableForYear(rule, year)) { occurrencesMap[rk] = []; continue; }
    const r = toCorrectedRule(rule);
    const d = daysFor(r);
    if (r.rule_family === 'solar_fixed') {
      occurrencesMap[rk] = SolarFixedHandler.evaluate(r, year);
    } else if (r.rule_family === 'lunar_tithi') {
      occurrencesMap[rk] = LunarTithiHandler.evaluate(r, d);
    } else if (r.rule_family === 'lunar_tithi_recurring') {
      occurrencesMap[rk] = RecurringLunarTithiHandler.evaluate(r, d);
    } else if (r.rule_family === 'weekday_recurring') {
      occurrencesMap[rk] = RecurringWeekdayHandler.evaluate(r, d);
    } else if (r.rule_family === 'nakshatra_based') {
      occurrencesMap[rk] = NakshatraBasedHandler.evaluate(r, d);
    } else if (r.rule_family === 'regional_calendar') {
      occurrencesMap[rk] = NanakshahiHandler.evaluate(r, year);
    } else {
      occurrencesMap[rk] = [];
    }
  }

  // 2. Second Pass: Resolve relative rules (identical to legacy — relative rules
  //    are anchored to their base slugs which will already have corrected dates)
  const maxIterations = 3;
  for (let iter = 0; iter < maxIterations; iter++) {
    for (const rule of CANONICAL_RULES) {
      // The second pass iterates CANONICAL_RULES afresh, so it needs the same
      // publication gate as the first. Without it a deferred relative rule still
      // resolved -- its base was published, so the offset succeeded and the rule
      // appeared in output despite being suppressed. Seven rules leaked through
      // this way (mahalaya-amavasya, kartik-purnima, the Jain Diwali cluster,
      // sangha-day-loy-krathong, chintpurni-mata-sharad-navratri).
      if (gate && !isPublishableForYear(rule, year)) continue;
      if (rule.rule_family === 'relative_to_other_observance') {
        const baseSlug = rule.relative_base_slug;
        const offset = rule.relative_offset_days || 0;
        if (!baseSlug) continue;

        const baseKeys = slugIndex.get(baseSlug) ?? [];
        const baseDates = [...new Set(baseKeys.flatMap(k => occurrencesMap[k] ?? []))];
        const resolvedDates: string[] = [];

        for (const baseDate of baseDates) {
          const bd = new Date(baseDate + 'T00:00:00Z');
          const rd = new Date(bd.getTime() + offset * 24 * 60 * 60 * 1000);
          resolvedDates.push(formatUtcDate(rd));
        }

        occurrencesMap[ruleIdentityKey(rule)] = resolvedDates;
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
export function calculateObservancesForYearCorrected(
  year: number,
  location: LocationInput = DEFAULT_LOCATION,
): CalculatedOccurrence[] {
  const occurrencesMap = buildOccurrencesMapCorrected(year, { location });

  const results: CalculatedOccurrence[] = [];
  for (const rule of CANONICAL_RULES) {
    const rk = ruleIdentityKey(rule);
    const r = toCorrectedRule(rule);
    const allDates = (occurrencesMap[rk] || []).filter(
      d => new Date(d + 'T00:00:00Z').getUTCFullYear() === year
    );
    if (allDates.length === 0) continue;
    if (r.rule_family === 'lunar_tithi_recurring' || r.rule_family === 'weekday_recurring') {
      for (const date of allDates) {
        results.push({ slug: r.slug, ruleKey: rk, date, year, recurring: true });
      }
      continue;
    }
    const selectedDate = r.prefer_last_match
      ? allDates[allDates.length - 1]
      : allDates[0];
    results.push({ slug: r.slug, ruleKey: rk, date: selectedDate, year });
  }

  return results;
}
