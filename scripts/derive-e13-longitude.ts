/**
 * Re-derives the synthetic longitude used by edge-case fixture E13.
 *
 * WHAT E13 IS FOR
 * ---------------
 * `astronomy-conventions.md` §1.2 says a tithi boundary landing within 60 s of
 * sunrise has UNDEFINED ownership and needs scholar ratification [S]. E13 proves
 * the engine can actually produce that situation, by placing an observer at a
 * longitude where sunrise coincides with a Chaturthi→Panchami boundary.
 *
 * The longitude is SYNTHETIC. No observer lives there and no authority publishes
 * it — it is tuned so the gap is small. That makes it a derived constant, not a
 * cited one, and it must be re-derived whenever the ephemeris changes.
 *
 * WHY IT NEEDED RE-DERIVING
 * -------------------------
 * D30 moved the engine's solar longitude from Meeus's truncated series to full
 * VSOP87 (2.2x outside the §1.2 Sankranti budget before; now agreeing with JPL
 * Horizons). Elongation moves 12.19°/day, so a ~24" solar shift moves a tithi
 * boundary by roughly 47 s. The old constant 45.117 produced a 77.878 s gap
 * under the corrected ephemeris — the scenario stopped demonstrating the very
 * thing it exists to demonstrate.
 *
 * The fix is NOT to loosen the 60 s assertion. That would delete the test's
 * meaning. It is to move the observer back to where the coincidence occurs.
 *
 * THE EVIDENCE
 * ------------
 * The tithi boundary is geocentric, so it does not depend on the observer at
 * all — it is fixed by the Sun and Moon longitudes, which are now validated
 * against JPL Horizons (packages/panchang-engine/.../tier1-validation.test.ts).
 * Sunrise is what moves: ~4 minutes per degree of longitude. So the derivation
 * is a one-dimensional solve, and the printed residual is the proof.
 *
 * Run: npx tsx scripts/derive-e13-longitude.ts
 */
import { getSunriseForDateStr } from '../packages/panchang-engine/src/index';
import { computeAstronomy } from '../packages/panchang-engine/src/core/astronomy';
import { solveBoundary } from '../packages/panchang-engine/src/lunar-month/astronomy';

const DATE = '2026-05-06';
const LAT = 23.176;
const TZ = 'Asia/Kolkata';
const OLD_LON = 45.117;

// The boundary E13 targets: the Chaturthi -> Panchami crossing near this morning.
// Geocentric, so the observer's longitude is irrelevant to it.
const searchFrom = new Date(`${DATE}T02:00:00Z`);
const boundary = solveBoundary(
  searchFrom,
  computeAstronomy(searchFrom).elongation,
  12,
  d => computeAstronomy(d).elongation,
);

if (!boundary) {
  console.error('No tithi boundary found — E13 cannot be derived.');
  process.exit(1);
}

const gapAt = (lon: number): number | null => {
  const { sunrise } = getSunriseForDateStr(DATE, { lat: LAT, lon, tz: TZ });
  if (!sunrise) return null;
  return (sunrise.getTime() - boundary.getTime()) / 1000; // signed seconds
};

console.log(`\nE13 derivation — ${DATE}, lat ${LAT}\n`);
console.log(`  tithi boundary (geocentric, JPL-validated ephemeris):`);
console.log(`    ${boundary.toISOString()}\n`);

const oldGap = gapAt(OLD_LON);
console.log(`  old constant  lon ${OLD_LON}  -> sunrise ${oldGap! >= 0 ? '+' : ''}${oldGap!.toFixed(3)} s from boundary`);
console.log(`  (|gap| ${Math.abs(oldGap!).toFixed(3)} s exceeds the 60 s window, so the fixture no longer demonstrates §1.2)\n`);

// Sunrise moves ~240 s per degree of longitude, later as you go WEST (smaller
// longitude). Solve for the crossing by bisection on the signed gap.
let lo = OLD_LON - 2;
let hi = OLD_LON + 2;
const gLo = gapAt(lo);
const gHi = gapAt(hi);
if (gLo === null || gHi === null || Math.sign(gLo) === Math.sign(gHi)) {
  console.error(`Cannot bracket a zero crossing between ${lo} and ${hi} (gaps ${gLo}, ${gHi}).`);
  process.exit(1);
}

for (let i = 0; i < 60; i++) {
  const mid = (lo + hi) / 2;
  const g = gapAt(mid);
  if (g === null) break;
  if (Math.sign(g) === Math.sign(gLo)) lo = mid; else hi = mid;
}

const derived = Number(((lo + hi) / 2).toFixed(4));
const finalGap = gapAt(derived)!;

console.log(`  derived constant  lon ${derived}  -> sunrise ${finalGap >= 0 ? '+' : ''}${finalGap.toFixed(3)} s from boundary`);
console.log(`  |gap| ${Math.abs(finalGap).toFixed(3)} s  ${Math.abs(finalGap) < 60 ? 'WITHIN' : 'OUTSIDE'} the 60 s §1.2 window\n`);

console.log(`  sensitivity: 1 degree of longitude = ~240 s of sunrise, so this`);
console.log(`  constant is good to ~0.004 deg per second of tolerance.\n`);
console.log(`  Set E13's \`lon\` to ${derived} and keep the assertion at < 60 s.\n`);
