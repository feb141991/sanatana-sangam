/** Build the remaining lunar-window inventory without inventing ritual policies. */
import fs from 'node:fs';
import path from 'node:path';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';

const rules = CANONICAL_RULES.filter((rule) =>
  (rule.rule_family === 'lunar_tithi' || rule.rule_family === 'lunar_tithi_recurring') &&
  !rule.evaluator_conditions &&
  !rule.date_assignment,
);

const rows = rules.map((rule) => ({
  slug: rule.slug,
  displayName: rule.display_name,
  tradition: rule.tradition,
  sampradaya: rule.sampradaya ?? null,
  ruleFamily: rule.rule_family,
  launchStatus: rule.launch_status ?? null,
  legacyTithi: rule.lunar_tithi_index ?? null,
  correctedTithi: rule.corrected_lunar_tithi_index ?? null,
  legacyMonth: rule.lunar_masa_name ?? null,
  correctedMonth: rule.corrected_lunar_masa_name ?? null,
  correctedMonthSystem: rule.corrected_month_system ?? null,
  skippedTithi: rule.corrected_skipped_tithi_policy ?? rule.skipped_tithi_policy ?? null,
  tieBreak: rule.corrected_prefer_last_match !== undefined
    ? `corrected:${rule.corrected_prefer_last_match ? 'last' : 'first'}`
    : rule.prefer_last_match !== undefined
      ? `legacy:${rule.prefer_last_match ? 'last' : 'first'}`
      : null,
  windowStatus: 'missing_window' as const,
}));

const result = {
  status: 'inventory_only',
  readOnly: true,
  ruleCount: rows.length,
  rows,
};
const outDir = path.join(process.cwd(), 'docs/audits/calendar-lunar-window-gaps');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'inventory.json'), `${JSON.stringify(result, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, 'LUNAR_WINDOW_GAP_INVENTORY.md'), [
  '# Lunar Window Gap Inventory',
  '',
  'Inventory only. No ritual window is inferred, no date is changed, and no production data is written.',
  '',
  `Rules requiring explicit window review: **${rows.length}**`,
  '',
  '| Rule | Tradition | Legacy tithi | Corrected tithi | Corrected month/system | Tie-break | Launch |',
  '|---|---|---:|---:|---|---|---|',
  ...rows.map((row) => `| \`${row.slug}\` | ${row.tradition} | ${row.legacyTithi ?? '—'} | ${row.correctedTithi ?? '—'} | ${row.correctedMonth ?? '—'} / ${row.correctedMonthSystem ?? '—'} | ${row.tieBreak ?? '—'} | ${row.launchStatus ?? '—'} |`),
  '',
].join('\n'));
console.log(JSON.stringify({ output: 'docs/audits/calendar-lunar-window-gaps/inventory.json', ruleCount: rows.length }, null, 2));
