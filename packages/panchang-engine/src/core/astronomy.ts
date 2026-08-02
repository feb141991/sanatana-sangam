/**
 * core/astronomy.ts
 *
 * Single internal astronomy core for @sangam/panchang-engine.
 *
 * Layer discipline: Layer A (astronomical facts). Computes ephemeris-backed solar/lunar
 * longitudes, ayanamsha, and elongation. Knows nothing about month names, calendar
 * profiles, or festival rules.
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
// Lahiri ayanamsha
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
