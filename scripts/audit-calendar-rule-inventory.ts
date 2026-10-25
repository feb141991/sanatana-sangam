/**
 * Generate a concise, source-of-truth inventory of calendar rules and the
 * corresponding read-only production catalogue audit.
 *
 * Run scripts/audit-observance-catalogue.ts YEAR first to refresh live counts.
 * Engine counts are computed for the Ujjain reference location and are not
 * independent correctness evidence or permission to publish a date.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(__dirname, '..');
const YEAR = Number(process.argv[2] ?? '2026');
const rules = JSON.parse(fs.readFileSync(path.join(ROOT, 'packages/dharma-rules/src/festivals/rules.json'), 'utf8')) as Rule[];
const series = JSON.parse(fs.readFileSync(path.join(ROOT, 'packages/dharma-rules/src/festivals/series.json'), 'utf8')) as Series[];
const auditPath = path.join(ROOT, `docs/audits/observance-catalogue/${YEAR}.json`);
if (!fs.existsSync(auditPath)) {
  throw new Error(`Missing ${auditPath}; run: npx tsx scripts/audit-observance-catalogue.ts ${YEAR}`);
}
const dbAudit = JSON.parse(fs.readFileSync(auditPath, 'utf8')) as DatabaseAudit;

const resolvedCountBySlug = new Map(dbAudit.rows.map(row => [row.slug, new Set(row.resolved_dates).size]));

const childSlugs = new Set<string>();
for (const rule of rules) for (const child of rule.sub_observances ?? []) childSlugs.add(child.slug);
for (const group of series) for (const child of group.children) childSlugs.add(child.slug);
const slugCounts = new Map<string, number>();
for (const rule of rules) slugCounts.set(rule.slug, (slugCounts.get(rule.slug) ?? 0) + 1);
const duplicatedSlugs = [...slugCounts].filter(([, count]) => count > 1).map(([slug, count]) => `${slug} (${count} separately-qualified rule variants)`);
const recurring = rules.filter(rule => ['lunar_tithi_recurring', 'weekday_recurring'].includes(rule.rule_family));
const sharedLunarSlots = new Map<string, Set<string>>();
for (const rule of rules) {
  if (!rule.corrected_lunar_masa_name || rule.lunar_tithi_index == null) continue;
  const slot = `${rule.corrected_lunar_masa_name}|${rule.lunar_tithi_index}|${rule.corrected_month_system ?? 'amanta'}`;
  const slugs = sharedLunarSlots.get(slot) ?? new Set<string>();
  slugs.add(rule.slug);
  sharedLunarSlots.set(slot, slugs);
}
const sharedSlots = [...sharedLunarSlots].filter(([, slugs]) => slugs.size > 1);
const trueMissing = dbAudit.rows.filter(row => row.primary_status === 'missing_rule');
const seriesChildrenInDb = dbAudit.rows.filter(row => row.primary_status === 'series_child');
const deferredPublished = dbAudit.rows.filter(row => row.launch_status === 'deferred' && row.published_occurrences.total_rows > 0);
const deferredVisible = dbAudit.rows.filter(row => row.note?.startsWith('GOVERNANCE GAP'));

const lines: string[] = [
  `# Festival and Vrat Rule Inventory (${YEAR})`,
  '',
  `Generated from \`packages/dharma-rules/src/festivals/rules.json\`, \`series.json\`, the calendar engine, and the read-only catalogue audit at \`${auditPath.replace(`${ROOT}/`, '')}\`.`,
  '',
  '> Engine counts below use the Ujjain reference location. They describe calculated instances only; they are not independent date verification, human ratification, or publication approval.',
  '',
  '## Clean totals',
  '',
  `- **${rules.length} parent rules** across ${slugCounts.size} slugs. ${duplicatedSlugs.length ? `The ${duplicatedSlugs.length} repeated slug(s) are intentional, separately-qualified variants: ${duplicatedSlugs.join('; ')}.` : 'No repeated rule slugs.'}`,
  `- **${series.length} observance series** with ${series.reduce((n, item) => n + item.children.length, 0)} series-child entries. ${childSlugs.size} unique child slugs are represented across series and rule sub-observances; child rows are not extra parent rules.`,
  `- Kinds: ${summarize(rules, rule => rule.kind)}.`,
  `- Rule launch states: ${summarize(rules, rule => rule.launch_status ?? 'unspecified')}.`,
  `- Rule families: ${summarize(rules, rule => rule.rule_family)}.`,
  `- Shared lunar slots flagged by \`validate:rules\`: ${sharedSlots.length}. These are review flags, not duplicate findings.`,
  `- Exact duplicate published occurrence identities: ${dbAudit.published_duplicate_identity_groups.length}. The key includes definition, year, calendar profile, civil date, variant and calculation location.`,
  `- Production audit: ${dbAudit.db_active_definition_count} active definitions; ${dbAudit.primary_status_counts.resolved} engine-resolved, ${dbAudit.primary_status_counts.deferred} deferred, ${seriesChildrenInDb.length} series children, ${trueMissing.length} definitions with no rule or series entry; ${deferredPublished.length} deferred definitions have stored published rows, of which ${deferredVisible.length} pass the current read-time gate.`,
  '',
  '## Repeating observances',
  '',
  'A repeated date is expected for these recurrence rules. Keep one rule and multiple yearly instances; do not create a new rule or delete an instance just because it shares a festival/vrat family name.',
  '',
  '| Rule | Kind | Status | Family | Unique resolved dates in target year |',
  '|---|---|---|---|---|',
];
for (const rule of recurring) lines.push(`| ${identity(rule)} | ${rule.kind} | ${rule.launch_status} | ${rule.rule_family} | ${countsFor(rule)} |`);

lines.push('', '## Shared lunar slots to review', '', 'The rule validator warns when different slugs point at the same month/tithi/month-system slot. Some are legitimate co-occurrences or regional names; this list is not an instruction to delete or merge rules. Verify convention and source before changing any.', '', '| Slot | Rules sharing it |', '|---|---|');
for (const [slot, slugs] of sharedSlots) lines.push(`| ${slot.replaceAll('|', ' / ')} | ${[...slugs].map(slug => `\`${slug}\``).join(', ')} |`);
lines.push('', 'The known Gita Jayanti / Vaikuntha Ekadashi overlap is a sourcing question explicitly flagged in `scripts/validate-rules.ts`; do not resolve it by choosing a date from code inspection alone.');

lines.push('', '## All parent rules', '', '| Rule | Kind | Tradition | Status | Rule family | Convention / anchor | Evidence recorded | Unique resolved dates in target year |', '|---|---|---|---|---|---|---|---|');
for (const rule of rules) {
  const convention = conventionFor(rule);
  const evidence = [rule.citation ? 'citation' : '', rule.ratification_note ? 'review note' : ''].filter(Boolean).join(', ') || 'none recorded';
  lines.push(`| ${identity(rule)} | ${rule.kind} | ${rule.tradition} | ${rule.launch_status ?? 'unspecified'} | ${rule.rule_family} | ${convention} | ${evidence} | ${countsFor(rule)} |`);
}

lines.push('', '## Production cleanup queue', '');
if (deferredPublished.length === 0 && trueMissing.length === 0) {
  lines.push('No deferred-publication gaps or unmatched active definitions were found by this audit.');
} else {
  if (deferredPublished.length) {
  lines.push('### Deferred rule, but published occurrence rows exist', '', `**${deferredPublished.length} active definitions** have rows stored as published while their matching rule is deferred. The production read audit applies the exact calendar API gate: ${deferredPublished.reduce((n, row) => n + row.published_occurrences.read_visible_rows, 0)} of those rows pass it; the rest are withheld at read time. This is storage cleanup/reconciliation work, not proof that every stored row should be deleted. Check occurrence-level fixture approvals, profile, variant, and provenance before changing any row.`, '', '| Slug | Stored rows | Read-visible | Withheld | Distinct civil dates | Target-year dates and row counts |', '|---|---:|---:|---:|---:|---|');
    for (const row of deferredPublished) {
      const dates = row.published_occurrences.target_year_dates.map(item => `${item.date} (${item.rows} rows)`).join(', ') || 'none in target year';
      lines.push(`| ${row.slug} | ${row.published_occurrences.total_rows} | ${row.published_occurrences.read_visible_rows} | ${row.published_occurrences.withheld_rows} | ${row.published_occurrences.distinct_dates} | ${dates} |`);
    }
    lines.push('');
  }
  if (trueMissing.length) {
    lines.push('### Active definition has no rule or series entry', '', '| Slug | Name | Kind |', '|---|---|---|');
    for (const row of trueMissing) lines.push(`| ${row.slug} | ${row.display_name} | ${row.kind} |`);
    lines.push('');
  }
}
lines.push('Series-only active definitions are listed separately in the production audit as `series_child`; they are intentionally not reported as missing rules.');
lines.push('', '## How to read this inventory', '', '- **Rule** is a rule slug plus its variant qualifier when present. Same-slug variants are distinct calendar readings, not duplicate noise.', '- **Unique resolved dates** count distinct civil dates from the production catalogue audit for the target year, in its default Ujjain context. Same-day variant results are counted once in this inventory. A count of 0 does not by itself mean the rule is wrong; deferred rules intentionally produce none. Same-slug variants share the combined slug count.', '- **Evidence recorded** is a field-presence check only. It does not claim that a source was independently checked or that a human review happened.', '- **Production cleanup queue** identifies status/data inconsistencies for human review. Do not bulk-delete or publish rows based on this generated report alone.', '');

const outputPath = path.join(ROOT, `docs/audits/observance-catalogue/RULE_INVENTORY_${YEAR}.md`);
fs.writeFileSync(outputPath, lines.join('\n'));
console.log(`Wrote ${outputPath}`);

function summarize<T>(items: T[], keyOf: (item: T) => string): string {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(keyOf(item), (counts.get(keyOf(item)) ?? 0) + 1);
  return [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([key, count]) => `${key} ${count}`).join('; ');
}

function identity(rule: Rule): string {
  const qualifier = rule.variant_key ?? rule.sampradaya ?? rule.calendar_profile;
  return `\`${rule.slug}${qualifier ? `::${qualifier}` : ''}\``;
}

function countsFor(rule: Rule): string {
  const count = resolvedCountBySlug.get(rule.slug) ?? 0;
  const variants = slugCounts.get(rule.slug) ?? 1;
  return `${YEAR}: ${count}${variants > 1 ? ' (all variants combined)' : ''}`;
}

function conventionFor(rule: Rule): string {
  const bits = [rule.corrected_lunar_masa_name, rule.corrected_month_system, rule.lunar_tithi_index != null ? `tithi ${rule.lunar_tithi_index}` : null].filter(Boolean);
  if (rule.rule_family === 'relative_to_other_observance') bits.push(rule.relative_base_slug ? `base ${rule.relative_base_slug}${rule.relative_offset_days != null ? ` ${rule.relative_offset_days > 0 ? '+' : ''}${rule.relative_offset_days}d` : ''}` : 'base unspecified');
  if (rule.rule_family === 'solar_fixed') bits.push(rule.solar_month && rule.solar_day ? `solar ${rule.solar_month}/${rule.solar_day}` : 'solar date unspecified');
  if (rule.rule_family === 'solar_sankranti') bits.push(rule.sankranti_rashi_index != null ? `solar ingress ${rule.sankranti_rashi_index}` : 'solar ingress unspecified');
  if (rule.rule_family === 'lunar_tithi_span') bits.push(rule.span_tithis ? `span ${rule.span_tithis.join(',')}` : 'span unspecified');
  return bits.join(', ') || 'see rule fields';
}

interface Rule {
  slug: string; kind: string; tradition: string; launch_status?: string; rule_family: string;
  variant_key?: string; sampradaya?: string; calendar_profile?: string; citation?: string; ratification_note?: string;
  corrected_lunar_masa_name?: string; corrected_month_system?: string; lunar_tithi_index?: number;
  relative_base_slug?: string; relative_offset_days?: number; solar_month?: number; solar_day?: number;
  sankranti_rashi_index?: number; span_tithis?: number[];
  sub_observances?: Array<{ slug: string }>;
}
interface Series { definitionKey: string; children: Array<{ slug: string }> }
interface DatabaseAudit {
  db_active_definition_count: number;
  primary_status_counts: Record<string, number>;
  published_duplicate_identity_groups: Array<{ definition_id: string; row_count: number }>;
  rows: Array<{ slug: string; display_name: string; kind: string; launch_status: string | null; primary_status: string; resolved_dates: string[]; note: string | null; published_occurrences: { total_rows: number; read_visible_rows: number; withheld_rows: number; distinct_dates: number; target_year_dates: Array<{ date: string; rows: number }> } }>;
}
