import { binaryRoot } from '../core/astronomy-adapter.js';
/**
 * lunar-month/astronomy.ts
 *
 * Low-level astronomical helpers for the lunar-month module.
 *
 * Layer discipline: this file is Layer A (astronomical facts). It computes
 * positions and solves boundary instants. It knows nothing about month names,
 * calendar profiles, or festival rules.
 *
 * All instants are UTC Date objects. All angles are decimal degrees [0, 360).
 * Ayanamsha: Lahiri — THE SAME polynomial already used by calculatePanchang
 * (index.ts:161-164). We do NOT introduce a different one (tracker item 2.2).
 *
 * Precision: bisection converges to ≤ 60 seconds per astronomy-conventions.md
 * §1.2, implemented via a tolerance test rather than a fixed iteration count.
 */

import {
  normalizeAngle,
  unwrapForward,
  lahiriAyanamsha,
  computeAstronomy,
  type AstroSnapshot,
} from '../core/astronomy.js';

export {
  normalizeAngle,
  unwrapForward,
  lahiriAyanamsha,
  computeAstronomy,
  type AstroSnapshot,
};



// ---------------------------------------------------------------------------
// Bisection solver — tolerance-based (≤ 60 s), matching astronomy-conventions §6
// ---------------------------------------------------------------------------

/** Default lunation search window: 35 days (840 hours) to cover full synodic month */
export const DEFAULT_LUNATION_SEARCH_HOURS = 35 * 24;

/**
 * Solve the next instant after `startDate` at which `valueAt()` first crosses
 * a multiple of `stepDegrees` forward of `startValue`.
 *
 * The underlying quantity must be strictly monotonically increasing (elongation,
 * sidereal longitudes). Bisection is provably correct; see §6 of
 * astronomy-conventions.md.
 *
 * Convergence criterion: bracket width ≤ 60 seconds, satisfying the ≤ 60 s
 * tolerance budget from §1.2.
 *
 * Returns null (and does NOT throw or return estimated boundaries) if target is
 * not reached within maxSearchHours.
 */
export function solveBoundary(
  startDate: Date,
  startValue: number,
  stepDegrees: number,
  valueAt: (d: Date) => number,
  maxSearchHours = DEFAULT_LUNATION_SEARCH_HOURS,
): Date | null {
  // Target: next multiple of stepDegrees strictly above startValue
  let target = Math.ceil(startValue / stepDegrees) * stepDegrees;
  if (Math.abs(target - startValue) < 1e-9) target += stepDegrees;

  const TOLERANCE_MS  = 60_000;   // 60 seconds — matches §1.2 budget
  const STEP_MS       = 6 * 60 * 60 * 1000; // advance bracket in 6-h chunks
  const maxHighMs     = startDate.getTime() + maxSearchHours * 60 * 60 * 1000;

  // Step 1: expand `high` until the angle has crossed the target.
  //
  // Turns are ACCUMULATED as we scan rather than recovered by unwrapping each
  // sample against `startValue`. `unwrapForward(v, base)` adds 360 only while
  // v < base, so when `base` is small it cannot tell a pre-wrap value from a
  // post-wrap one: with startValue = 0.006deg, a wrapped sample of 0.5deg stays
  // 0.5 instead of becoming 360.5, the bracket never registers the crossing,
  // and the search runs to maxSearchHours and returns null.
  //
  // That is a real defect, D31. It bites whenever stepDegrees = 360 (the new-
  // and full-moon searches), because only then is the target a whole revolution
  // away. The 12deg tithi and 13.33deg nakshatra callers are unaffected: their
  // target is always within one step of startValue, so `base` is large whenever
  // a wrap matters. Concretely, findNewMoonAfter returned null for roughly the
  // first 50 minutes after every new moon -- masked until now by the 0.005deg
  // guard in findNewMoonAfter, which was not protecting against re-finding the
  // same boundary (its stated purpose) so much as accidentally keeping `base`
  // out of the range where the unwrap breaks.
  let low  = startDate.getTime();
  let high = low + STEP_MS;
  let prevRaw = normalizeAngle(startValue);
  let turns = 0;
  let crossed = false;

  while (high <= maxHighMs) {
    const raw = normalizeAngle(valueAt(new Date(high)));
    if (raw < prevRaw) turns++;            // the angle wrapped past 360
    prevRaw = raw;
    if (raw + 360 * turns >= target) { crossed = true; break; }
    high += STEP_MS;
  }

  if (!crossed) return null;

  // Step 2: solve for the crossing with the shared solver (rule 13/15).
  // The previous loop stopped at TOLERANCE_MS and returned `high` — the UPPER
  // bracket, i.e. up to 60 s AFTER the true boundary. binaryRoot converges to
  // sub-ms, so the returned instant is the boundary itself rather than a
  // 60 s-late approximation of it. Still inside the §1.2 budget, and tighter.
  // Step 2: bisect inside the final bracket only. Measuring the signed distance
  // from the target angle keeps this wrap-safe without any turn bookkeeping: the
  // angle advances only a few degrees across one STEP_MS, so the signed distance
  // is negative at the bracket's start and positive at its end regardless of
  // where 360 falls between them.
  const targetMod = normalizeAngle(target);
  const signedFromTarget = (ms: number) => {
    const d = normalizeAngle(valueAt(new Date(ms)) - targetMod);
    return d > 180 ? d - 360 : d;
  };

  const rootMs = binaryRoot(signedFromTarget, Math.max(low, high - STEP_MS), high);

  return new Date(rootMs);
}

/**
 * Like solveBoundary but searching BACKWARD for the most recent crossing
 * before `startDate`.
 *
 * Walks backward in STEP_MS chunks until a crossing is detected in [low, high],
 * then bisects forward from `low` to find the exact boundary instant.
 */
export function solveBoundaryBefore(
  startDate: Date,
  startValue: number,
  stepDegrees: number,
  valueAt: (d: Date) => number,
  maxSearchHours = DEFAULT_LUNATION_SEARCH_HOURS,
): Date | null {
  const STEP_MS   = 6 * 60 * 60 * 1000;
  const minLowMs  = startDate.getTime() - maxSearchHours * 60 * 60 * 1000;

  let high = startDate.getTime();
  let low  = high - STEP_MS;

  while (low >= minLowMs) {
    const lowVal  = valueAt(new Date(low));
    const highVal = valueAt(new Date(high));

    const floorLow  = Math.floor(normalizeAngle(lowVal) / stepDegrees);
    const floorHigh = Math.floor(normalizeAngle(highVal) / stepDegrees);

    if (floorLow !== floorHigh || normalizeAngle(highVal) < normalizeAngle(lowVal)) {
      // boundary crossed in this 6-h window — bisect forward from `low`
      return solveBoundary(new Date(low), normalizeAngle(lowVal), stepDegrees, valueAt, 12);
    }

    high = low;
    low -= STEP_MS;
  }

  return null;
}
