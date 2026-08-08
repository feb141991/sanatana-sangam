/**
 * Tripwire for the USE_CORRECTED_MASA gate.
 *
 * WHY THIS EXISTS
 * ---------------
 * `calculateObservancesForYear` dispatches on the gate. When the gate is on it
 * returns the corrected result, so any script that diffs it against
 * `calculateObservancesForYearCorrected` becomes a SELF-COMPARISON and reports
 * zero movement — the diff would claim the correction changed nothing, at
 * exactly the moment someone needs it to be truthful.
 *
 * That was real. Measured for 2026: 74 differing (slug@date) pairs with the gate
 * off, 0 with it on. Fixed by adding `calculateObservancesForYearLegacy`, which
 * ignores the gate, and repointing the diff scripts at it.
 *
 * This script fails (exit 1) if that distinction ever collapses again.
 *
 * Run: npx tsx scripts/verify-masa-gate.ts
 */
import {
  calculateObservancesForYear,
  calculateObservancesForYearLegacy,
  calculateObservancesForYearCorrected,
  USE_CORRECTED_MASA,
} from '../src/lib/calendar/engine';

const YEAR = 2026;

const key = (o: { slug: string; date: string }) => `${o.slug}@${o.date}`;
const setOf = (list: Array<{ slug: string; date: string }>) => new Set(list.map(key));

function countDiff(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const k of a) if (!b.has(k)) n++;
  for (const k of b) if (!a.has(k)) n++;
  return n;
}

const legacy = setOf(calculateObservancesForYearLegacy(YEAR));
const corrected = setOf(calculateObservancesForYearCorrected(YEAR));
const shipped = setOf(calculateObservancesForYear(YEAR));

const legacyVsCorrected = countDiff(legacy, corrected);
const shippedVsLegacy = countDiff(shipped, legacy);
const shippedVsCorrected = countDiff(shipped, corrected);

console.log(`USE_CORRECTED_MASA           : ${USE_CORRECTED_MASA}`);
console.log(`year                         : ${YEAR}`);
console.log('');
console.log(`Legacy   occurrences         : ${legacy.size}`);
console.log(`Corrected occurrences        : ${corrected.size}`);
console.log(`Shipped  occurrences         : ${shipped.size}`);
console.log('');
console.log(`Legacy  vs Corrected  (diff) : ${legacyVsCorrected}   <- must be > 0, gate-independent`);
console.log(`Shipped vs Legacy     (diff) : ${shippedVsLegacy}`);
console.log(`Shipped vs Corrected  (diff) : ${shippedVsCorrected}`);
console.log('');

let failed = false;

// The invariant that matters: the two named paths must stay distinguishable no
// matter which way the gate points. If this hits 0, either the correction became
// a no-op or Legacy started dispatching on the gate again.
if (legacyVsCorrected === 0) {
  console.error('FAIL: Legacy and Corrected are indistinguishable. Any diff between them');
  console.error('      is a self-comparison. Check that calculateObservancesForYearLegacy');
  console.error('      does not read USE_CORRECTED_MASA.');
  failed = true;
}

// Shipped must track whichever path the gate selects, exactly.
const expectedDiff = USE_CORRECTED_MASA ? shippedVsCorrected : shippedVsLegacy;
if (expectedDiff !== 0) {
  console.error(
    `FAIL: gate is ${USE_CORRECTED_MASA}, so shipped output should equal the ` +
      `${USE_CORRECTED_MASA ? 'CORRECTED' : 'LEGACY'} path exactly, but ${expectedDiff} pairs differ.`
  );
  failed = true;
}

if (failed) process.exit(1);

console.log('PASS: legacy and corrected remain distinguishable, and shipped tracks the gate.');
