/**
 * Eval: recurring tithi-based vrats (Ekadashi / Pradosh / Sankashti).
 *
 * Read-only. Generates dates from the calendar engine (panchang-derived) for the
 * current + next year, prints upcoming dates + named-observance overlaps, and
 * asserts per-year counts and max spacing so a regression (missed "skipped"
 * tithi or a doubled tithi) fails loudly. Writes nothing to the database.
 *
 * Run: node scripts/eval-recurring-vrats.mjs
 */
import { execSync } from 'child_process';
import { writeFileSync, existsSync, unlinkSync } from 'fs';

const ENTRY = '__recurring_vrats_eval.ts';
const BUNDLE = '__recurring_vrats_eval.cjs';

const entry = `
import { calculateObservancesForYear } from './src/lib/calendar/engine';
import { CANONICAL_RULES } from './src/lib/calendar/rules';

const recurringSlugs = CANONICAL_RULES.filter(r => r.rule_family === 'lunar_tithi_recurring').map(r => r.slug);
const thisYear = new Date().getUTCFullYear();
const years = [thisYear, thisYear + 1];
const all = years.flatMap(y => calculateObservancesForYear(y));
const today = new Date().toISOString().slice(0, 10);
const namedDates = new Set(all.filter(o => !recurringSlugs.includes(o.slug)).map(o => o.date));

const EXPECT: Record<string, { min: number; max: number; maxGap: number }> = {
  'ekadashi': { min: 22, max: 27, maxGap: 17 },
  'pradosh-vrat': { min: 22, max: 27, maxGap: 17 },
  'sankashti-chaturthi': { min: 11, max: 13, maxGap: 32 },
};

let failures = 0;
function assert(cond: boolean, msg: string) {
  console.log((cond ? '  ok  ' : '  FAIL ') + msg);
  if (!cond) failures++;
}

for (const slug of recurringSlugs) {
  const dates = all.filter(o => o.slug === slug).map(o => o.date).sort();
  const upcoming = dates.filter(d => d >= today);
  const overlap = dates.filter(d => namedDates.has(d));
  console.log('\\n== ' + slug + ' ==');
  console.log('  ' + years.join('/') + ' total: ' + dates.length + ' | next 8: ' + upcoming.slice(0, 8).join(' '));
  console.log('  named-observance overlaps (suppress at materialize): ' + (overlap.length ? overlap.join(' ') : 'none'));
  const e = EXPECT[slug];
  for (const y of years) {
    const yd = dates.filter(d => d.startsWith(String(y)));
    assert(yd.length >= e.min && yd.length <= e.max, slug + ' ' + y + ': count ' + yd.length + ' in [' + e.min + ',' + e.max + ']');
    let maxGap = 0;
    for (let i = 1; i < yd.length; i++) {
      const g = Math.round((+new Date(yd[i]) - +new Date(yd[i - 1])) / 864e5);
      if (g > maxGap) maxGap = g;
    }
    assert(maxGap <= e.maxGap, slug + ' ' + y + ': max gap ' + maxGap + 'd <= ' + e.maxGap + 'd');
  }
}
console.log('\\n' + (failures === 0 ? 'ALL ASSERTIONS PASSED' : failures + ' ASSERTION(S) FAILED'));
process.exit(failures === 0 ? 0 : 1);
`;

writeFileSync(ENTRY, entry);
let code = 0;
try {
  execSync(`./node_modules/.bin/esbuild "${ENTRY}" --bundle --platform=node --format=cjs --outfile="${BUNDLE}"`, { stdio: 'pipe' });
  execSync(`node ${BUNDLE}`, { stdio: 'inherit' });
} catch (err) {
  code = err?.status ?? 1;
} finally {
  for (const f of [ENTRY, BUNDLE]) if (existsSync(f)) unlinkSync(f);
}
process.exit(code);
