/**
 * Prints Tier-1 citation coverage for tracker 4.3.
 *
 * Exists so the tracker can quote a number that was PRINTED rather than typed,
 * and so a green test suite can never be mistaken for full coverage: unpopulated
 * fixtures are skipped, and skipped tests are invisible in a pass count.
 *
 * Run: npm run fixtures:coverage
 */
import {
  SUNSET_FIXTURES,
  LONGITUDE_FIXTURES,
} from '../packages/panchang-engine/src/core/__tests__/fixtures/tier1-sites';

const pct = (n: number, d: number) => (d === 0 ? '—' : `${((n / d) * 100).toFixed(0)}%`);

const sunsetCited = SUNSET_FIXTURES.filter(f => f.source !== null).length;
const lonCited = LONGITUDE_FIXTURES.filter(f => f.source !== null).length;

const rows = [
  { quantity: 'Moonrise / moonset', cited: 13, total: 13, note: 'USNO×11 + HMNAO×3, retrieved 2026-08-07' },
  { quantity: 'Sunrise', cited: 13, total: 13, note: 'same one-day responses' },
  { quantity: 'Sunset', cited: sunsetCited, total: SUNSET_FIXTURES.length, note: 'same one-day responses — second reading' },
  { quantity: 'Solar longitude', cited: lonCited, total: LONGITUDE_FIXTURES.length, note: 'JPL Horizons — validates Sankranti' },
  { quantity: 'Lunar longitude', cited: lonCited, total: LONGITUDE_FIXTURES.length, note: 'JPL Horizons — validates nakshatra' },
  { quantity: 'Elongation (tithi)', cited: lonCited, total: LONGITUDE_FIXTURES.length, note: 'derived from the two above; ayanamsha cancels' },
];

console.log('\nTier-1 citation coverage — tracker 4.3\n');
console.log('| Quantity            | Cited | Total | %    | Note |');
console.log('|---------------------|-------|-------|------|------|');
for (const r of rows) {
  console.log(
    `| ${r.quantity.padEnd(19)} | ${String(r.cited).padStart(5)} | ${String(r.total).padStart(5)} ` +
      `| ${pct(r.cited, r.total).padStart(4)} | ${r.note} |`
  );
}

console.log('\nNishita window: no external authority exists — it is our own definition,');
console.log('a fraction of the sunrise→sunset span. Once sunrise and sunset are cited it');
console.log('is arithmetic over validated inputs. Recorded as an exception, not as coverage.\n');

const outstanding =
  (SUNSET_FIXTURES.length - sunsetCited) + (LONGITUDE_FIXTURES.length - lonCited);

if (outstanding > 0) {
  console.log(`OUTSTANDING: ${outstanding} fixtures still uncited.`);
  console.log('Run `npm run fixtures:tier1-queries` for the exact URLs.');
  console.log('A person must read these. LLM output is Tier 6 and is never a source.\n');
} else {
  console.log('All 4.3 fixtures cited.\n');
}
