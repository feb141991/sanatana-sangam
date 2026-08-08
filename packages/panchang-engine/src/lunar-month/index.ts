/**
 * packages/panchang-engine/src/lunar-month/index.ts
 *
 * Layer B — Correct lunar-month determination.
 *
 * This is a NEW, ADDITIVE module. It does NOT modify calculatePanchang,
 * masaName, masaIndex, or rules.ts. Those remain byte-identical.
 * (See calendar-profiles.md §1.5 and the task specification for why.)
 *
 * Public API
 * ----------
 * export type MonthSystem = 'amanta' | 'purnimanta'
 * export type Paksha = 'shukla' | 'krishna'
 * export type LunarMonthResult = LunarMonthSuccess | LunarMonthFailure
 *
 * export function classifyLunarMonth(input: MonthClassificationInput): MonthClassificationResult
 * export function getLunarMonth(instant: Date, system: MonthSystem, maxSearchHours?: number): LunarMonthResult
 * export function findNewMoonBefore(instant: Date, maxSearchHours?: number): Date | null
 * export function findNewMoonAfter(instant: Date, maxSearchHours?: number): Date | null
 * export function findFullMoonBefore(instant: Date, maxSearchHours?: number): Date | null
 * export function findFullMoonAfter(instant: Date, maxSearchHours?: number): Date | null
 * export function findSankrantisBetween(start: Date, end: Date): Array<{ rashi: number; at: Date }>
 *
 * Algorithm
 * ---------
 * Follows calendar-profiles.md §1 exactly:
 *
 * 1. Amanta month = [amavasya at/before T, next amavasya).
 *    Amavasya = elongation (moon_tropical - sun_tropical) ≡ 0° (mod 360°).
 *    Bisection to ≤ 60 s per astronomy-conventions.md §1.2.
 *
 * 2. Count Sankrantis (30° sidereal-solar boundaries) in [start, end).
 *      0  → adhika; takes name of the following month. isAdhika = true.
 *      1  → normal; name from Sun's rashi at the start amavasya.
 *      2  → kshaya; isKshaya = true; diagnostic pushed; name assigned per §1.4.
 *
 * 3. Paksha from elongation: < 180° → shukla; ≥ 180° → krishna.
 *
 * 4. Purnimanta conversion:
 *      shukla  → purnimanta name = amanta name  (identical)
 *      krishna → purnimanta name = amanta name + 1 (next month name)
 *
 * 5. Discriminated union result: ok: true for valid lunar month, ok: false on solver failure.
 */

import { normalizeAngle } from '../core/astronomy.js';
import {
  computeAstronomy,
  solveBoundary,
  solveBoundaryBefore,
  DEFAULT_LUNATION_SEARCH_HOURS,
} from './astronomy.js';
import {
  MONTH_NAMES,
  monthIndexFromSunSidereal,
  nextMonthIndex,
} from './names.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type MonthSystem = 'amanta' | 'purnimanta';
export type Paksha = 'shukla' | 'krishna';

export type LunarMonthResult = LunarMonthSuccess | LunarMonthFailure;

export interface LunarMonthSuccess {
  ok: true;
  /** Full English month name: 'Chaitra' … 'Phalguna' (possibly with 'Adhika ' prefix) */
  monthName: string;
  /** Amanta month index: Chaitra = 0, Vaishakha = 1, …, Phalguna = 11 */
  monthIndex: number;
  monthSystem: MonthSystem;
  paksha: Paksha;
  /** True when no Sankranti occurs in the lunar month (intercalary month). */
  isAdhika: boolean;
  /**
   * True when two Sankrantis occur in the lunar month (decayed month).
   * This is very rare (multi-decade intervals). The engine does not throw;
   * it surfaces a diagnostic and assigns a name per the documented convention.
   */
  isKshaya: boolean;
  /** Amanta month name, always populated for cross-reference. */
  amantaMonthName: string;
  /** ISO-8601 Z timestamp of the month's starting boundary (amavasya). */
  monthStartUtc: string;
  /** ISO-8601 Z timestamp of the month's ending boundary (next amavasya). */
  monthEndUtc: string;
  /** Number of Sankrantis within [monthStart, monthEnd): always 0, 1, or 2. */
  sankrantiCount: number;
  /** Non-fatal diagnostic messages. */
  diagnostics: string[];
}

export interface LunarMonthFailure {
  ok: false;
  monthName: null;
  monthIndex: null;
  monthSystem: MonthSystem;
  paksha: null;
  isAdhika: null;
  isKshaya: null;
  amantaMonthName: null;
  monthStartUtc: null;
  monthEndUtc: null;
  sankrantiCount: null;
  /** Diagnostic messages explaining the solver failure. */
  diagnostics: string[];
}

export interface MonthClassificationInput {
  sunSiderealAtStart: number;
  sankrantis: Array<{ rashi: number; at: Date }>;
  nextSankrantiAfterEnd?: { rashi: number; at: Date };
  sunSiderealAfterEnd?: number;
}

export interface MonthClassificationResult {
  amantaIndex: number;
  amantaMonthName: string;
  displayMonthName: string;
  isAdhika: boolean;
  isKshaya: boolean;
  sankrantiCount: number;
  diagnostics: string[];
}

// ---------------------------------------------------------------------------
// Pure classification helper
// ---------------------------------------------------------------------------

/**
 * Pure helper function to classify a lunar month given astronomical input.
 * Canonical rule per calendar-profiles.md §1:
 * - 0 Sankrantis: Adhika month. Takes the name of the following normal month (which contains the next Sankranti).
 *   The entered rashi at a Sankranti directly corresponds to that month's amanta index (Mesha=0 -> Chaitra=0, etc.).
 * - 1 Sankranti: Normal month. Name from Sun's rashi at start amavasya: (startRashi + 1) % 12.
 * - 2 Sankrantis: Kshaya month. Skipped month convention.
 */
export function classifyLunarMonth(input: MonthClassificationInput): MonthClassificationResult {
  const diagnostics: string[] = [];
  const sankrantiCount = input.sankrantis.length;

  let amantaIndex: number;
  let isAdhika = false;
  let isKshaya = false;
  let amantaMonthName: string;
  let displayMonthName: string;

  if (sankrantiCount === 0) {
    // ── ADHIKA (intercalary) month ─────────────────────────────────────────
    let nijaIndex: number;
    if (input.nextSankrantiAfterEnd) {
      nijaIndex = (input.nextSankrantiAfterEnd.rashi % 12 + 12) % 12;
    } else if (input.sunSiderealAfterEnd !== undefined) {
      nijaIndex = monthIndexFromSunSidereal(input.sunSiderealAfterEnd);
      diagnostics.push('adhika: could not find next Sankranti; used day-after-end Sun position');
    } else {
      const startRashi = Math.floor(normalizeAngle(input.sunSiderealAtStart) / 30) % 12;
      nijaIndex = (startRashi + 1) % 12;
    }

    amantaIndex     = nijaIndex;
    isAdhika        = true;
    amantaMonthName = MONTH_NAMES[amantaIndex] ?? 'Unknown';
    displayMonthName = `Adhika ${amantaMonthName}`;

  } else if (sankrantiCount === 1) {
    // ── NORMAL month ──────────────────────────────────────────────────────
    amantaIndex     = monthIndexFromSunSidereal(input.sunSiderealAtStart);
    amantaMonthName = MONTH_NAMES[amantaIndex] ?? 'Unknown';
    displayMonthName = amantaMonthName;

  } else {
    // ── KSHAYA (decayed) month ─────────────────────────────────────────────
    isKshaya = true;
    amantaIndex     = monthIndexFromSunSidereal(input.sunSiderealAtStart);
    amantaMonthName = MONTH_NAMES[amantaIndex] ?? 'Unknown';
    displayMonthName = amantaMonthName;

    diagnostics.push(
      `kshaya_masa: two Sankrantis (rashi ${input.sankrantis[0]?.rashi ?? '?'} and ` +
      `${input.sankrantis[1]?.rashi ?? '?'}) in month interval. Month name "${amantaMonthName}" ` +
      `is kshaya — skipped name convention must be applied at Layer C.`,
    );
  }

  return {
    amantaIndex,
    amantaMonthName,
    displayMonthName,
    isAdhika,
    isKshaya,
    sankrantiCount,
    diagnostics,
  };
}

// ---------------------------------------------------------------------------
// Exported primitive: findNewMoonBefore
// ---------------------------------------------------------------------------

/**
 * Return the most recent amavasya (new moon) at or before `instant`.
 * Elongation = 0° (mod 360°).
 * Returns null if the solver fails to converge within maxSearchHours.
 */
export function findNewMoonBefore(
  instant: Date,
  maxSearchHours = DEFAULT_LUNATION_SEARCH_HOURS,
): Date | null {
  const snap = computeAstronomy(instant);
  const elong = snap.elongation; // in [0, 360)

  if (elong < 0.005 || elong > 359.995) {
    return instant;
  }

  return solveBoundaryBefore(instant, elong, 360, (d) => computeAstronomy(d).elongation, maxSearchHours);
}

// ---------------------------------------------------------------------------
// Exported primitive: findNewMoonAfter
// ---------------------------------------------------------------------------

/**
 * Return the next amavasya (new moon) strictly after `instant`.
 * Elongation = 0° (mod 360°).
 * Returns null if the solver fails to converge within maxSearchHours.
 */
export function findNewMoonAfter(
  instant: Date,
  maxSearchHours = DEFAULT_LUNATION_SEARCH_HOURS,
): Date | null {
  const snap = computeAstronomy(instant);
  let searchFrom = instant;
  let searchElong = snap.elongation;

  if (snap.elongation < 0.005 || snap.elongation > 359.995) {
    searchFrom = new Date(instant.getTime() + 12 * 60 * 60 * 1000);
    searchElong = computeAstronomy(searchFrom).elongation;
  }

  return solveBoundary(searchFrom, searchElong, 360, (d) => computeAstronomy(d).elongation, maxSearchHours);
}

// ---------------------------------------------------------------------------
// Exported primitive: findFullMoonBefore
// ---------------------------------------------------------------------------

/**
 * Return the most recent purnima (full moon) at or before `instant`.
 * Elongation = 180°.
 * Returns null if the solver fails to converge within maxSearchHours.
 */
export function findFullMoonBefore(
  instant: Date,
  maxSearchHours = DEFAULT_LUNATION_SEARCH_HOURS,
): Date | null {
  const snap = computeAstronomy(instant);
  const shifted = (snap.elongation + 180) % 360;

  if (shifted < 0.005 || shifted > 359.995) {
    return instant;
  }

  return solveBoundaryBefore(
    instant,
    shifted,
    360,
    (d) => (computeAstronomy(d).elongation + 180) % 360,
    maxSearchHours,
  );
}

// ---------------------------------------------------------------------------
// Exported primitive: findFullMoonAfter
// ---------------------------------------------------------------------------

/**
 * Return the next purnima (full moon) strictly after `instant`.
 * Elongation = 180°.
 * Returns null if the solver fails to converge within maxSearchHours.
 */
export function findFullMoonAfter(
  instant: Date,
  maxSearchHours = DEFAULT_LUNATION_SEARCH_HOURS,
): Date | null {
  const snap = computeAstronomy(instant);
  let searchFrom = instant;
  let searchShifted = (snap.elongation + 180) % 360;

  if (searchShifted < 0.005 || searchShifted > 359.995) {
    searchFrom = new Date(instant.getTime() + 12 * 60 * 60 * 1000);
    searchShifted = (computeAstronomy(searchFrom).elongation + 180) % 360;
  }

  return solveBoundary(
    searchFrom,
    searchShifted,
    360,
    (d) => (computeAstronomy(d).elongation + 180) % 360,
    maxSearchHours,
  );
}

// ---------------------------------------------------------------------------
// Exported primitive: findSankrantisBetween
// ---------------------------------------------------------------------------

/**
 * Find all Sankrantis (solar ingresses into a new sidereal rashi, i.e.,
 * crossings of 30° multiples of sidereal solar longitude) in [start, end).
 *
 * Returns an array of { rashi: 0–11, at: Date } sorted ascending.
 * rashi 0 = Mesha (Aries), 1 = Vrishabha (Taurus), …, 11 = Meena (Pisces).
 */
export function findSankrantisBetween(
  start: Date,
  end: Date,
): Array<{ rashi: number; at: Date }> {
  const results: Array<{ rashi: number; at: Date }> = [];

  const startSnap = computeAstronomy(start);
  let cursor      = start;
  let cursorValue = startSnap.sunSidereal;

  const endMs = end.getTime();

  while (cursor.getTime() < endMs) {
    const boundary = solveBoundary(
      cursor,
      cursorValue,
      30,
      (d) => computeAstronomy(d).sunSidereal,
      40 * 24,
    );

    if (!boundary || boundary.getTime() >= endMs) break;

    const rashiSnap = computeAstronomy(new Date(boundary.getTime() + 30_000));
    const rashi = Math.floor(rashiSnap.sunSidereal / 30) % 12;

    results.push({ rashi, at: boundary });

    cursor      = new Date(boundary.getTime() + 60_000);
    cursorValue = computeAstronomy(cursor).sunSidereal;
  }

  return results;
}

// ---------------------------------------------------------------------------
// Internal helper: find the amanta month boundaries containing `instant`
// ---------------------------------------------------------------------------

export function findAmantaMonth(
  instant: Date,
  maxSearchHours = DEFAULT_LUNATION_SEARCH_HOURS,
): {
  start: Date;
  end: Date;
} | null {
  const start = findNewMoonBefore(instant, maxSearchHours);
  if (!start) return null;

  const searchFrom = new Date(start.getTime() + 12 * 60 * 60 * 1000);
  const end = findNewMoonAfter(searchFrom, maxSearchHours);
  if (!end) return null;

  return { start, end };
}

// ---------------------------------------------------------------------------
// Main export: getLunarMonth
// ---------------------------------------------------------------------------

/**
 * Determine the lunar month containing `instant` under the given `system`.
 * Follows calendar-profiles.md §1 algorithm exactly.
 * Returns a discriminated result: ok: true on success, ok: false on solver failure.
 */
export function getLunarMonth(
  instant: Date,
  system: MonthSystem,
  maxSearchHours = DEFAULT_LUNATION_SEARCH_HOURS,
): LunarMonthResult {
  const diagnostics: string[] = [];

  // ── Step 1: find amanta boundaries ──────────────────────────────────────
  const amanta = findAmantaMonth(instant, maxSearchHours);
  if (!amanta) {
    diagnostics.push(`solver_failure: boundary solver failed to find amavasya boundary for ${instant.toISOString()}`);
    return {
      ok: false,
      monthName: null,
      monthIndex: null,
      monthSystem: system,
      paksha: null,
      isAdhika: null,
      isKshaya: null,
      amantaMonthName: null,
      monthStartUtc: null,
      monthEndUtc: null,
      sankrantiCount: null,
      diagnostics,
    };
  }

  const { start, end } = amanta;

  // ── Step 2: count Sankrantis in [start, end) ────────────────────────────
  const sankrantis = findSankrantisBetween(start, end);

  // ── Step 3: classify lunar month via pure helper ─────────────────────────
  const startSnap = computeAstronomy(start);
  let nextSankrantiAfterEnd: { rashi: number; at: Date } | undefined;
  let sunSiderealAfterEnd: number | undefined;

  if (sankrantis.length === 0) {
    const nextSankrantis = findSankrantisBetween(end, new Date(end.getTime() + 35 * 24 * 60 * 60 * 1000));
    if (nextSankrantis.length > 0) {
      nextSankrantiAfterEnd = nextSankrantis[0];
    } else {
      const postSnap = computeAstronomy(new Date(end.getTime() + 24 * 60 * 60 * 1000));
      sunSiderealAfterEnd = postSnap.sunSidereal;
    }
  }

  const classification = classifyLunarMonth({
    sunSiderealAtStart: startSnap.sunSidereal,
    sankrantis,
    nextSankrantiAfterEnd,
    sunSiderealAfterEnd,
  });

  diagnostics.push(...classification.diagnostics);

  const { amantaIndex, amantaMonthName, displayMonthName, isAdhika, isKshaya, sankrantiCount } = classification;

  // ── Step 4: paksha ───────────────────────────────────────────────────────
  const snap    = computeAstronomy(instant);
  const paksha: Paksha = snap.elongation < 180 ? 'shukla' : 'krishna';

  // ── Step 5: purnimanta conversion ───────────────────────────────────────
  let finalMonthName: string;
  let finalMonthIndex: number;

  if (system === 'amanta') {
    finalMonthName  = displayMonthName;
    finalMonthIndex = amantaIndex;
  } else {
    // purnimanta
    if (paksha === 'shukla') {
      finalMonthName  = displayMonthName;
      finalMonthIndex = amantaIndex;
    } else {
      // krishna: next month name
      const nextIdx   = nextMonthIndex(amantaIndex);
      finalMonthIndex = nextIdx;
      finalMonthName  = isAdhika
        ? (MONTH_NAMES[nextIdx] ?? 'Unknown')
        : (MONTH_NAMES[nextIdx] ?? 'Unknown');
    }
  }

  return {
    ok: true,
    monthName:      finalMonthName,
    monthIndex:     finalMonthIndex,
    monthSystem:    system,
    paksha,
    isAdhika,
    isKshaya,
    amantaMonthName,
    monthStartUtc:  start.toISOString(),
    monthEndUtc:    end.toISOString(),
    sankrantiCount,
    diagnostics,
  };
}
