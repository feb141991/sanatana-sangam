/**
 * D32 audit: for every krishna-paksha rule, what date does each month system give?
 *
 * A rule's `corrected_lunar_masa_name` is a STRING, and it only identifies a
 * lunation once you know which reckoning it is written in. Amanta ends the month
 * at the new moon; purnimanta ends it at the full moon. They label the same dark
 * fortnight differently (purnimanta = amanta + 1), so a mismatch between the name
 * and the declared system is always exactly one month.
 *
 * Shukla-paksha rules are unaffected -- both systems agree there -- so this only
 * lists tithi > 15.
 *
 * Two rules are included as CONTROLS, where the correct answer is already known:
 *   krishna-janmashtami  -> 2026-09-04 (confirmed by the user)
 *   shani-jayanti        -> 2026-05-16 (confirmed by the user, already fixed)
 * If the method reproduces those two, it can be trusted for the rest.
 *
 * Run: npx tsx scripts/audit-month-system.ts
 */
import {
  precomputePanchangCorrectedForYear,
  calculateObservancesForYearLegacy,
  LunarTithiHandler,
} from '../src/lib/calendar/engine';
import { CANONICAL_RULES, ObservanceRule } from '../src/lib/calendar/rules';

const YEARS = [2026, 2027, 2028];

const KNOWN: Record<string, string> = {
  'krishna-janmashtami': '2026-09-04',
  'shani-jayanti': '2026-05-16',
  'vat-savitri-amavasya': '2026-05-16',
};

const krishna = CANONICAL_RULES.filter(
  r => r.corrected_lunar_masa_name && (r.lunar_tithi_index ?? 0) > 15
);

/** Same shape as the engine's private toCorrectedRule. */
const corrected = (r: ObservanceRule): ObservanceRule => ({
  ...r,
  lunar_masa_name: r.corrected_lunar_masa_name ?? r.lunar_masa_name,
  lunar_tithi_index: r.corrected_lunar_tithi_index ?? r.lunar_tithi_index,
  prefer_last_match:
    r.corrected_prefer_last_match !== undefined ? r.corrected_prefer_last_match : r.prefer_last_match,
  allow_skipped_tithi:
    r.corrected_allow_skipped_tithi !== undefined ? r.corrected_allow_skipped_tithi : r.allow_skipped_tithi,
});

const pick = (dates: string[], r: ObservanceRule, year: number): string | null => {
  const inYear = dates.filter(d => new Date(d + 'T00:00:00Z').getUTCFullYear() === year);
  if (inYear.length === 0) return null;
  return r.prefer_last_match ? inYear[inYear.length - 1] : inYear[0];
};

interface Row { slug: string; declared: string; name: string; tithi: number;
  legacy: (string | null)[]; amanta: (string | null)[]; purnimanta: (string | null)[]; }

const rows = new Map<string, Row>();

for (const year of YEARS) {
  const days = precomputePanchangCorrectedForYear(year);
  const daysP = days.map(d => ({ ...d, panchang: { ...d.panchang, masaName: d.panchang.masaNamePurnimanta } }));
  const legacy = calculateObservancesForYearLegacy(year);

  for (const rule of krishna) {
    const r = corrected(rule);
    const sampradaya = (rule as { sampradaya?: string }).sampradaya;
    const key = `${rule.slug}${sampradaya ? ' [' + sampradaya + ']' : ''}`;
    if (!rows.has(key)) {
      rows.set(key, {
        slug: key,
        declared: rule.corrected_month_system ?? '(unset)',
        name: String(r.lunar_masa_name),
        tithi: Number(r.lunar_tithi_index),
        legacy: [], amanta: [], purnimanta: [],
      });
    }
    const row = rows.get(key)!;
    row.legacy.push(legacy.find(o => o.slug === rule.slug)?.date ?? null);
    row.amanta.push(pick(LunarTithiHandler.evaluate(r, days), r, year));
    row.purnimanta.push(pick(LunarTithiHandler.evaluate(r, daysP), r, year));
  }
}

const f = (v: (string | null)[]) => v.map(x => x ?? '—').join('  ');

console.log('\n' + '='.repeat(100));
console.log('MONTH-SYSTEM AUDIT — krishna-paksha rules only (shukla rules agree in both systems)');
console.log('='.repeat(100));

for (const row of rows.values()) {
  const known = KNOWN[row.slug.split(' [')[0]];
  const amantaMatches = known ? row.amanta[0] === known : null;
  const purniMatches = known ? row.purnimanta[0] === known : null;

  console.log(`\n${row.slug}`);
  console.log(`  rule says month "${row.name}", tithi ${row.tithi}, declared system: ${row.declared}`);
  console.log(`                     ${YEARS.join('      ')}`);
  console.log(`  legacy (shipping)  ${f(row.legacy)}`);
  console.log(`  if AMANTA          ${f(row.amanta)}${amantaMatches ? '   <== matches known answer' : ''}`);
  console.log(`  if PURNIMANTA      ${f(row.purnimanta)}${purniMatches ? '   <== matches known answer' : ''}`);
  if (known) {
    const verdict = amantaMatches ? 'amanta' : purniMatches ? 'purnimanta' : 'NEITHER — investigate';
    const ok = verdict === row.declared;
    console.log(`  KNOWN 2026 = ${known}  -> system should be ${verdict}  ${ok ? '(declared correctly)' : '(DECLARED WRONG)'}`);
  } else {
    const differs = row.amanta[0] !== row.purnimanta[0];
    console.log(`  NEEDS A KNOWN DATE. ${differs ? 'The two systems disagree, so this choice matters.' : 'Both agree — choice does not affect the date.'}`);
  }
}

console.log('\n' + '='.repeat(100));
console.log('For each rule without a known date: tell me the real 2026 date and I will set the');
console.log('system to whichever row matches. No religious ruling needed beyond that one date.');
console.log('='.repeat(100) + '\n');
