/** Build a no-guess decision matrix for major Hindu lunar observances. */
import fs from 'node:fs';
import path from 'node:path';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';

const rows = CANONICAL_RULES
  .filter((rule) =>
    (rule.rule_family === 'lunar_tithi' || rule.rule_family === 'lunar_tithi_recurring') &&
    !rule.evaluator_conditions &&
    !rule.date_assignment &&
    rule.tradition === 'hindu' &&
    rule.kind === 'major',
  )
  .map((rule) => ({
    slug: rule.slug,
    displayName: rule.display_name,
    launchStatus: rule.launch_status ?? null,
    correctedTithi: rule.corrected_lunar_tithi_index ?? null,
    legacyTithi: rule.lunar_tithi_index ?? null,
    correctedMonth: rule.corrected_lunar_masa_name ?? null,
    correctedMonthSystem: rule.corrected_month_system ?? null,
    ritualPeriod: null,
    mode: null,
    skippedTithi: rule.corrected_skipped_tithi_policy ?? rule.skipped_tithi_policy ?? null,
    tieBreak: rule.corrected_prefer_last_match !== undefined
      ? (rule.corrected_prefer_last_match ? 'last_qualifying_date' : 'first_qualifying_date')
      : null,
    profileScope: 'not declared',
    reviewer: null,
    status: 'window_missing',
  }));

const result = {
  status: 'review_required',
  readOnly: true,
  ruleCount: rows.length,
  rows,
};
const outDir = path.join(process.cwd(), 'docs/audits/calendar-major-hindu-window-matrix');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'matrix.json'), `${JSON.stringify(result, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, 'MAJOR_HINDU_WINDOW_MATRIX.md'), [
  '# Major Hindu Lunar Window Matrix',
  '',
  'No ritual period or mode is inferred in this matrix. These fields require a named reviewer and source before implementation.',
  '',
  '| Rule | Launch | Legacy tithi | Corrected tithi | Month/system | Period | Mode | Tie-break | Status |',
  '|---|---|---:|---:|---|---|---|---|---|',
  ...rows.map((row) => `| \`${row.slug}\` | ${row.launchStatus ?? '—'} | ${row.legacyTithi ?? '—'} | ${row.correctedTithi ?? '—'} | ${row.correctedMonth ?? '—'} / ${row.correctedMonthSystem ?? '—'} | — | — | ${row.tieBreak ?? '—'} | **${row.status}** |`),
  '',
].join('\n'));
console.log(JSON.stringify({ output: 'docs/audits/calendar-major-hindu-window-matrix/matrix.json', ruleCount: rows.length }, null, 2));
