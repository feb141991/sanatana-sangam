/** Read-only local comparison of proposed Diwali child windows. */
import fs from 'node:fs';
import path from 'node:path';
import { evaluateVariant, type RuleCondition } from '@sangam/dharma-rules';
import { calculateObservancesForYear } from '../src/lib/calendar/engine';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';
import { REFERENCE_LOCATION_UJJAIN } from '../src/lib/panchang';

const years = [2026, 2027, 2028];
const targets = ['dhanteras', 'govardhan-puja', 'bhai-dooj'];
const diwaliDates = new Map<number, string>();
const outputsByYear = new Map<number, ReturnType<typeof calculateObservancesForYear>>();

for (const year of years) {
  const output = calculateObservancesForYear(year, REFERENCE_LOCATION_UJJAIN);
  outputsByYear.set(year, output);
  const diwali = output.find((row) => row.slug === 'diwali');
  if (diwali) diwaliDates.set(year, diwali.date);
}

function addDays(date: string, offset: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

const rows = years.flatMap((year) => targets.map((slug) => {
  const rule = CANONICAL_RULES.find((candidate) => candidate.slug === slug)!;
  const policy = rule.date_assignment!;
  const anchor = diwaliDates.get(year);
  const conditions: RuleCondition[] = [
    { type: 'lunar_month', value: policy.lunar_month, monthSystem: policy.month_system },
    { type: 'paksha', value: policy.paksha },
    { type: 'tithi_presence', tithi: policy.tithi, period: policy.period, mode: policy.mode },
  ];
  const proposedDates: string[] = [];
  const basisConstrainedDates: string[] = [];
  const windowConditions: RuleCondition[] = [
    { type: 'tithi_presence', tithi: policy.tithi, period: policy.period, mode: policy.mode },
  ];
  if (anchor) {
    for (let offset = -5; offset <= 5; offset++) {
      const date = addDays(anchor, offset);
      const windowResult = evaluateVariant({ ruleId: slug, festivalId: slug, conditions: windowConditions }, date, REFERENCE_LOCATION_UJJAIN);
      const basisResult = evaluateVariant({ ruleId: slug, festivalId: slug, conditions }, date, REFERENCE_LOCATION_UJJAIN);
      if (windowResult.qualified === true) proposedDates.push(date);
      if (basisResult.qualified === true) basisConstrainedDates.push(date);
    }
  }
  const actualDates = (outputsByYear.get(year) ?? [])
    .filter((row) => row.slug === slug)
    .map((row) => row.date)
    .sort();
  const selectedDates = proposedDates.length > 0 ? [proposedDates[0]] : [];
  return {
    year,
    slug,
    status: policy.status,
    anchor,
    proposedDates,
    selectedDates,
    actualDates,
    basisConstrainedDates,
    comparison: JSON.stringify(selectedDates) === JSON.stringify(actualDates)
      ? (JSON.stringify(basisConstrainedDates) === JSON.stringify(selectedDates) ? 'match' : 'window_match_basis_boundary_unresolved')
      : 'difference_or_unresolved',
  };
}));

const result = {
  status: 'computed_not_verified',
  readOnly: true,
  location: REFERENCE_LOCATION_UJJAIN,
  years,
  rows,
};
const outDir = path.join(process.cwd(), 'docs/audits/calendar-diwali-window-policies');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, '2026-2028.json'), `${JSON.stringify(result, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, 'DIWALI_WINDOW_POLICY_AUDIT.md'), [
  '# Diwali Window Policy Audit',
  '',
  'Computed locally at Ujjain. This is not independent verification and does not authorize date changes.',
  '',
  '| Year | Rule | Qualifying window dates | Selected by tie-break | Basis-constrained dates | Current dates | Comparison |',
  '|---:|---|---|---|---|---|---|',
  ...rows.map((row) => `| ${row.year} | \`${row.slug}\` | ${row.proposedDates.join(', ') || 'none'} | ${row.selectedDates.join(', ') || 'none'} | ${row.basisConstrainedDates.join(', ') || 'none'} | ${row.actualDates.join(', ') || 'none'} | **${row.comparison}** |`),
  '',
].join('\n'));
console.log(JSON.stringify({ output: 'docs/audits/calendar-diwali-window-policies/2026-2028.json', rows: rows.length }, null, 2));
