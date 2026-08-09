/**
 * Sweep: which rules silently LOSE an occurrence to a kshaya tithi?
 *
 * A tithi can begin and end between two consecutive daily scan instants, so it
 * never appears at scan time. That is a real astronomical event, not a bug --
 * tithis run ~23.6 to ~26 hours. When it happens, a `lunar_tithi` rule keyed to
 * that tithi produces NO date for the year and says nothing about it.
 *
 * `allow_skipped_tithi` exists for exactly this and routes to the engine's
 * skipped-tithi path. The generic `ekadashi` rule sets it; the 17 named ekadashi
 * rules did not, which is how Apara Ekadashi vanished from 2026 (tithi 26 is
 * kshaya in nija Jyeshtha that year) and Yogini from 2027.
 *
 * This prints EVERY lunar_tithi rule whose occurrence count changes when the flag
 * is forced on, so the fix can be applied to the class rather than the instance.
 *
 * Run: npx tsx scripts/sweep-skipped-tithi.ts
 */
import { precomputePanchangCorrectedForYear, LunarTithiHandler } from '../src/lib/calendar/engine';
import { CANONICAL_RULES, ObservanceRule } from '../src/lib/calendar/rules';

const YEARS = [2026, 2027, 2028];

const corrected = (r: ObservanceRule): ObservanceRule => ({
  ...r,
  lunar_masa_name: r.corrected_lunar_masa_name ?? r.lunar_masa_name,
  lunar_tithi_index: r.corrected_lunar_tithi_index ?? r.lunar_tithi_index,
  prefer_last_match:
    r.corrected_prefer_last_match !== undefined ? r.corrected_prefer_last_match : r.prefer_last_match,
  allow_skipped_tithi:
    r.corrected_allow_skipped_tithi !== undefined ? r.corrected_allow_skipped_tithi : r.allow_skipped_tithi,
});

const inYear = (dates: string[], y: number) =>
  dates.filter(d => new Date(d + 'T00:00:00Z').getUTCFullYear() === y);

const targets = CANONICAL_RULES.filter(r => r.rule_family === 'lunar_tithi');

interface Finding { slug: string; year: number; without: number; with_: number; gained: string[]; }
const findings: Finding[] = [];

for (const year of YEARS) {
  const days = precomputePanchangCorrectedForYear(year);
  const daysP = days.map(d => ({ ...d, panchang: { ...d.panchang, masaName: d.panchang.masaNamePurnimanta } }));

  for (const rule of targets) {
    const base = corrected(rule);
    const src = rule.corrected_month_system === 'purnimanta' ? daysP : days;

    const off = inYear(LunarTithiHandler.evaluate({ ...base, allow_skipped_tithi: false }, src), year);
    const on = inYear(LunarTithiHandler.evaluate({ ...base, allow_skipped_tithi: true }, src), year);

    if (on.length !== off.length) {
      findings.push({
        slug: rule.slug, year,
        without: off.length, with_: on.length,
        gained: on.filter(d => !off.includes(d)),
      });
    }
  }
}

console.log(`\nSwept ${targets.length} lunar_tithi rules across ${YEARS.join(', ')}\n`);

if (findings.length === 0) {
  console.log('No rule changes occurrence count when allow_skipped_tithi is forced on.');
} else {
  console.log('| rule | year | occurrences without | with | date gained |');
  console.log('|---|---|---|---|---|');
  for (const f of findings) {
    console.log(`| ${f.slug} | ${f.year} | ${f.without} | ${f.with_} | ${f.gained.join(', ') || '—'} |`);
  }
  const affected = [...new Set(findings.map(f => f.slug))];
  console.log(`\n${findings.length} rule-years affected, across ${affected.length} distinct rules:`);
  console.log('  ' + affected.join('\n  '));
  console.log('\nThese are dates the observance genuinely has but the calendar omits.');
}

// Which rules currently DECLARE the flag, for the record.
//
// NOTE: check the CORRECTED-RESOLVED value, not the raw field. A rule may carry
// `corrected_allow_skipped_tithi: true` instead, which toCorrectedRule maps onto
// `allow_skipped_tithi`. Reading the raw field alone misreported guru-ravidas-jayanti,
// magha-puja and mahavir-jayanti as broken when they were already protected.
const declared = CANONICAL_RULES
  .filter(r => corrected(r).allow_skipped_tithi === true)
  .map(r => r.slug);
console.log(`\nRules currently setting allow_skipped_tithi: ${declared.length ? declared.join(', ') : 'none'}`);
