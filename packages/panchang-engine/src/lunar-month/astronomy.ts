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

import julian from 'astronomia/julian';
import solar from 'astronomia/solar';
import moonposition from 'astronomia/moonposition';
import nutation from 'astronomia/nutation';

// ---------------------------------------------------------------------------
// Core angle helpers
// ---------------------------------------------------------------------------

/** Normalise any angle into [0, 360). */
export function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Unwrap `angle` forward past any 360° wrap so that it is >= `base`.
 * Used during bisection to keep monotonically increasing angles comparable.
 */
export function unwrapForward(angle: number, base: number): number {
  let v = angle;
  while (v < base) v += 360;
  return v;
}

// ---------------------------------------------------------------------------
// Lahiri ayanamsha — identical to index.ts:161-164 (do NOT diverge)
// ---------------------------------------------------------------------------

export function lahiriAyanamsha(jde: number): number {
  const t = (jde - 2451545.0) / 36525.0;
  return 23.85306 + 1.39722 * t + 0.00018 * t * t - 0.000005 * t * t * t;
}

// ---------------------------------------------------------------------------
// Astronomical positions at an instant
// ---------------------------------------------------------------------------

export interface AstroSnapshot {
  jde: number;
  sunTropical: number;
  moonTropical: number;
  ayanamsha: number;
  sunSidereal: number;
  moonSidereal: number;
  /** moon_tropical − sun_tropical, normalised [0, 360) */
  elongation: number;
}

export function computeAstronomy(date: Date): AstroSnapshot {
  const jde = julian.DateToJDE(date);
  const t   = (jde - 2451545.0) / 36525.0;

  const sunTropical  = normalizeAngle((solar.apparentLongitude(t) * 180) / Math.PI);
  const moonBase     = moonposition.position(jde).lon;
  const [deltaPsi]   = nutation.nutation(jde);
  const moonTropical = normalizeAngle(((moonBase + deltaPsi) * 180) / Math.PI);

  const ayanamsha    = lahiriAyanamsha(jde);
  const sunSidereal  = normalizeAngle(sunTropical - ayanamsha);
  const moonSidereal = normalizeAngle(moonTropical - ayanamsha);
  const elongation   = normalizeAngle(moonTropical - sunTropical);

  return { jde, sunTropical, moonTropical, ayanamsha, sunSidereal, moonSidereal, elongation };
}

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

  // Step 1: expand high until the angle has crossed the target
  let low  = startDate.getTime();
  let high = low + STEP_MS;

  while (high <= maxHighMs) {
    const highValue = unwrapForward(valueAt(new Date(high)), startValue);
    if (highValue >= target) break;
    high += STEP_MS;
  }

  if (high > maxHighMs) return null;

  // Step 2: bisect until bracket width ≤ tolerance
  while (high - low > TOLERANCE_MS) {
    const mid      = Math.floor((low + high) / 2);
    const midValue = unwrapForward(valueAt(new Date(mid)), startValue);
    if (midValue >= target) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return new Date(high);
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
