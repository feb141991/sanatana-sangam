/**
 * Read-only local audit of declared relative relations.
 * Results are computed, not independently verified, and never change dates.
 */
import fs from 'node:fs';
import path from 'node:path';
import { calculateObservancesForYear } from '../src/lib/calendar/engine';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';
import { REFERENCE_LOCATION_UJJAIN } from '../src/lib/panchang';

const years = [2026, 2027, 2028];
const relativeRules = CANONICAL_RULES.filter((rule) => rule.relation);

const rows = years.flatMap((year) => {
  const output = calculateObservancesForYear(year, REFERENCE_LOCATION_UJJAIN);
  const datesBySlug = new Map<string, string[]>();
  for (const row of output) datesBySlug.set(row.slug, [...(datesBySlug.get(row.slug) ?? []), row.date]);

  return relativeRules.map((rule) => {
    const parentDates = [...new Set(datesBySlug.get(rule.relation!.parent_slug!) ?? [])].sort();
    const expectedDates = parentDates.map((date) => {
      const value = new Date(`${date}T00:00:00Z`);
      value.setUTCDate(value.getUTCDate() + (rule.relation!.offset_days ?? 0));
      return value.toISOString().slice(0, 10);
    });
    const actualDates = [...new Set(datesBySlug.get(rule.slug) ?? [])].sort();
    const status = parentDates.length === 0
      ? 'parent_no_date'
      : actualDates.length === 0
        ? 'child_no_date'
        : JSON.stringify(actualDates) === JSON.stringify(expectedDates)
          ? 'match'
          : 'difference';
    return {
      year,
      slug: rule.slug,
      relationKind: rule.relation!.kind,
      status,
      parentSlug: rule.relation!.parent_slug,
      parentDates,
      expectedDates,
      actualDates,
      launchStatus: rule.launch_status ?? null,
    };
  });
});

const result = {
  status: 'computed_not_verified',
  readOnly: true,
  location: REFERENCE_LOCATION_UJJAIN,
  years,
  relationCount: relativeRules.length,
  rows,
};
const outDir = path.join(process.cwd(), 'docs/audits/calendar-relative-relations');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, '2026-2028.json'), `${JSON.stringify(result, null, 2)}\n`);

const counts = Object.fromEntries([...new Set(rows.map((row) => row.status))].map((status) => [status, rows.filter((row) => row.status === status).length]));
const md = [
  '# Relative Relation Audit',
  '',
  'Computed locally at the Ujjain reference location. This is not independent verification and authorizes no date changes.',
  '',
  `Rules: **${relativeRules.length}** · Years: **2026–2028**`,
  `Status counts: ${Object.entries(counts).map(([key, value]) => `\`${key}\` ${value}`).join(' · ')}`,
  '',
  '| Year | Rule | Kind | Parent dates | Expected dates | Actual dates | Status |',
  '|---:|---|---|---|---|---|---|',
  ...rows.map((row) => `| ${row.year} | \`${row.slug}\` | ${row.relationKind} | ${row.parentDates.join(', ') || '—'} | ${row.expectedDates.join(', ') || '—'} | ${row.actualDates.join(', ') || '—'} | **${row.status}** |`),
  '',
].join('\n');
fs.writeFileSync(path.join(outDir, 'RELATIVE_RELATION_AUDIT.md'), `${md}\n`);
console.log(JSON.stringify({ output: 'docs/audits/calendar-relative-relations/2026-2028.json', counts }, null, 2));
