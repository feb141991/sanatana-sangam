import fs from 'node:fs';
import path from 'node:path';
import { computeAstronomy, getKaranaName, getMuhurtaWindows } from '@sangam/panchang-engine';
import { EVALUATOR_RULES } from '../src/lib/calendar/materialize.js';
import {
  LOCATIONS,
  PERIODS,
  YEARS,
  rules,
  namedRows,
  intervalForRule,
  candidateDates,
  dateInTz,
  localDateTime,
  periodWindow,
  findExtraYears,
} from './measure-ekadashi-windows.mts';

const BATCH_2_SLUGS = new Set([
  'raksha-bandhan',
  'guru-purnima',
  'chhath-puja',
  'chaitra-navratri-begins',
  'navratri-begins',
  'nag-panchami',
  'hartalika-teej',
  'narasimha-jayanti',
]);
const evaluatorSlugs = new Set(EVALUATOR_RULES.map((rule) => rule.slug));
const referenceOnlySlugs = new Set(rules.filter((rule: any) => rule.corrected_tithi_reference_time).map((rule: any) => rule.slug));
const namedKeys = new Set(namedRows.map((rule: any) => `${rule.slug}|${rule.variant_key ?? rule.sampradaya ?? ''}`));
const locations = LOCATIONS;
const CONTROL_RULES = rules.filter((rule: any) => evaluatorSlugs.has(rule.slug) || referenceOnlySlugs.has(rule.slug));

function isDirectAstronomical(rule: any): boolean {
  return Number.isFinite(Number(rule.corrected_lunar_tithi_index ?? rule.lunar_tithi_index)) ||
    Array.isArray(rule.recurring_tithi_indices) || Array.isArray(rule.span_tithis);
}
function hasRatifiedWindowNote(rule: any): boolean {
  const note = String(rule.ratification_note ?? '').toLowerCase();
  return /(ratified|council ruled|council reviewed|approved)/.test(note) &&
    /(sunrise|arunodaya|nishita|pradosha|moonrise|madhyahna|window|prevails|touches)/.test(note);
}
function applicablePeriods(rule: any): string[] {
  const periods = new Set<string>(['sunrise']);
  if (rule.corrected_tithi_reference_time) periods.add(rule.corrected_tithi_reference_time);
  if (namedKeys.has(`${rule.slug}|${rule.variant_key ?? rule.sampradaya ?? ''}`)) periods.add('arunodaya');
  if (rule.slug === 'raksha-bandhan') periods.add('aparahna');
  if (rule.slug === 'guru-purnima') periods.add('madhyahna');
  if (rule.slug === 'narasimha-jayanti') periods.add('nishita');
  const note = String(rule.ratification_note ?? '').toLowerCase();
  for (const period of ['madhyahna', 'aparahna', 'pradosha', 'nishita', 'moonrise', 'arunodaya']) {
    if (note.includes(period)) periods.add(period);
  }
  const evaluator = EVALUATOR_RULES.find((candidate) => candidate.slug === rule.slug);
  for (const variant of evaluator?.variants ?? []) {
    for (const condition of variant.conditions ?? []) {
      if (condition.type === 'tithi_presence') periods.add(condition.period);
    }
  }
  return [...periods].filter((period) => PERIODS.includes(period as any));
}
function targetRulesFor(rule: any): any[] {
  if (Array.isArray(rule.recurring_tithi_indices)) {
    return rule.recurring_tithi_indices.map((tithi: number) => ({ ...rule, lunar_tithi_index: tithi }));
  }
  if (Array.isArray(rule.span_tithis)) {
    return [{ ...rule, lunar_tithi_index: rule.lunar_tithi_index ?? rule.span_tithis[0] }];
  }
  return [rule];
}
function batchFor(rule: any): string | null {
  const key = `${rule.slug}|${rule.variant_key ?? rule.sampradaya ?? ''}`;
  if (namedKeys.has(key)) return 'batch-1-ekadashi';
  if (BATCH_2_SLUGS.has(rule.slug)) return 'batch-2-priority-observances';
  if (rule.launch_status === 'included' && !evaluatorSlugs.has(rule.slug) && !referenceOnlySlugs.has(rule.slug) &&
      ['lunar_tithi', 'lunar_tithi_recurring', 'lunar_tithi_span', 'nakshatra_based', 'weekday_recurring'].includes(rule.rule_family)) {
    return 'batch-3-remaining-included';
  }
  if (rule.launch_status === 'deferred' && !evaluatorSlugs.has(rule.slug) && !referenceOnlySlugs.has(rule.slug) &&
      ['lunar_tithi', 'lunar_tithi_recurring', 'lunar_tithi_span', 'nakshatra_based', 'weekday_recurring', 'regional_calendar', 'relative_to_other_observance', 'solar_fixed', 'solar_sankranti'].includes(rule.rule_family)) {
    return 'batch-4-deferred';
  }
  return null;
}
function overlapMinutes(a: { start: Date; end: Date }, b: { start: Date; end: Date }): number {
  return Math.max(0, (Math.min(a.end.getTime(), b.end.getTime()) - Math.max(a.start.getTime(), b.start.getTime())) / 60_000);
}
function vishtiAt(date: Date): boolean {
  return getKaranaName(Math.floor(computeAstronomy(date).elongation / 6) + 1) === 'Vishti';
}
function findVishtiIntervals(anchor: Date): Array<{ start: Date; end: Date }> {
  const intervals: Array<{ start: Date; end: Date }> = [];
  let cursor = new Date(anchor.getTime() - 3 * 86_400_000);
  const end = new Date(anchor.getTime() + 3 * 86_400_000);
  let previous = vishtiAt(cursor);
  let start = previous ? cursor : null;
  while (cursor < end) {
    const next = new Date(cursor.getTime() + 15 * 60_000);
    const current = vishtiAt(next);
    if (current !== previous) {
      const boundary = new Date((cursor.getTime() + next.getTime()) / 2);
      if (current) start = boundary;
      else if (start) { intervals.push({ start, end: boundary }); start = null; }
    }
    cursor = next;
    previous = current;
  }
  return intervals;
}
function classifyRow(rule: any, datesByPeriod: Record<string, string[]>, direct: boolean): string {
  if (!direct) return 'not-applicable';
  const baseline = datesByPeriod.sunrise ?? [];
  const changed = Object.keys(datesByPeriod).some((period) => JSON.stringify(datesByPeriod[period] ?? []) !== JSON.stringify(baseline));
  if (!changed) return 'window-insensitive';
  return hasRatifiedWindowNote(rule) ? 'sensitive-ratified-convention' : 'needs-authority-decision';
}

const outDir = path.resolve('docs/audits/calendar-window-measurement');
fs.mkdirSync(outDir, { recursive: true });
const jsonlPath = path.join(outDir, 'all-batches.jsonl');
fs.writeFileSync(jsonlPath, '');
const rows: any[] = [];
const selectedRules = rules.filter((rule: any) => batchFor(rule));
const controls = CONTROL_RULES.filter((rule: any) => !selectedRules.some((selected: any) => selected.slug === rule.slug && (selected.variant_key ?? selected.sampradaya ?? '') === (rule.variant_key ?? rule.sampradaya ?? '')));
const extraFacts = findExtraYears();
const extraYears = [...new Set([extraFacts.skippedTithi?.year, extraFacts.repeatedTithi?.year, extraFacts.adhikaMonth?.year, extraFacts.midnightStraddle?.year].filter((year): year is number => typeof year === 'number'))];
const measurementYears = [...new Set([...YEARS, ...extraYears])].sort();
for (const rule of selectedRules) {
  const batch = batchFor(rule)!;
  for (const year of measurementYears) {
    const targetRules = targetRulesFor(rule);
    const allIntervals = targetRules.flatMap((target) => isDirectAstronomical(target) ? intervalForRule(target, year) : []);
    for (const location of locations) {
      const direct = isDirectAstronomical(rule);
      const applicable = applicablePeriods(rule);
      const datesByPeriod = direct
        ? Object.fromEntries(applicable.map((period) => [period, candidateDates(allIntervals, period as any, location)]))
        : {};
      const bhadra = rule.slug === 'raksha-bandhan'
        ? findVishtiIntervals(allIntervals[0] ? new Date((allIntervals[0].startsAt.getTime() + allIntervals[0].endsAt.getTime()) / 2) : new Date(Date.UTC(year, 7, 1)))
        : [];
      const bhadraOverlapByPeriod: Record<string, number> = {};
      if (bhadra.length > 0) {
        for (const period of applicable) {
          bhadraOverlapByPeriod[period] = (datesByPeriod[period] ?? []).reduce((sum, civilDate) => {
            const window = periodWindow(period as any, civilDate, location);
            return sum + (window ? bhadra.reduce((inner, span) => inner + overlapMinutes(window, span), 0) : 0);
          }, 0);
        }
      }
      const changedPeriods = applicable.filter((period) => JSON.stringify(datesByPeriod[period] ?? []) !== JSON.stringify(datesByPeriod.sunrise ?? []));
      const windowDifferencePairs = changedPeriods.map((period) => ({ from: 'sunrise', to: period, maxDays: Math.max(0, ...((datesByPeriod[period] ?? []).flatMap((date) => (datesByPeriod.sunrise ?? []).map((baseline) => Math.abs((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${baseline}T00:00:00Z`)) / 86_400_000)))) ) }));
      const row = {
        computed: true,
        batch,
        rule: rule.slug,
        variant: rule.variant_key ?? rule.sampradaya ?? null,
        launchStatus: rule.launch_status,
        ruleFamily: rule.rule_family,
        year,
        location: location.name,
        targetTithi: rule.corrected_lunar_tithi_index ?? rule.lunar_tithi_index ?? rule.span_tithis?.[0] ?? null,
        recurringTithis: rule.recurring_tithi_indices ?? null,
        spanTithis: rule.span_tithis ?? null,
        lunarMonth: rule.corrected_lunar_masa_name ?? rule.lunar_masa_name ?? null,
        monthSystem: rule.corrected_month_system ?? rule.month_system ?? null,
        applicablePeriods: applicable,
        declaredReference: rule.corrected_tithi_reference_time ?? null,
        evaluatorBacked: evaluatorSlugs.has(rule.slug),
        referenceOnly: referenceOnlySlugs.has(rule.slug),
        ratifiedConventionInNote: hasRatifiedWindowNote(rule),
        directAstronomicalMeasurement: direct,
        intervals: allIntervals.map((interval: any) => ({ startsAt: interval.startsAt.toISOString(), endsAt: interval.endsAt.toISOString(), startsLocal: localDateTime(interval.startsAt, location.tz), endsLocal: localDateTime(interval.endsAt, location.tz), month: interval.month })),
        datesByPeriod,
        changedPeriods,
        windowDifferencePairs,
        windowSensitivity: !direct ? 'not-applicable' : changedPeriods.length > 0 ? 'sensitive' : 'insensitive',
        provenanceStatus: hasRatifiedWindowNote(rule) ? 'ratified-convention-note' : rule.citation ? 'citation-present-not-window-reviewed' : 'unsourced',
        bhadraSpans: bhadra.map((span) => ({ startsAt: span.start.toISOString(), endsAt: span.end.toISOString(), startsLocal: localDateTime(span.start, location.tz), endsLocal: localDateTime(span.end, location.tz) })),
        bhadraOverlapMinutesByPeriod: bhadraOverlapByPeriod,
        classification: classifyRow(rule, datesByPeriod, direct),
        notVerified: ['No external source was opened in this session.', 'No source reference or window was written to rule data.', 'No production rows were read or changed.', ...(rule.slug === 'raksha-bandhan' ? ['Vishti spans are computed engine output; no Bhadra observance policy was selected.'] : [])],
      };
      rows.push(row);
      fs.appendFileSync(jsonlPath, `${JSON.stringify(row)}\n`);
    }
  }
}

for (const rule of controls) {
  for (const year of measurementYears) {
    const targetRules = targetRulesFor(rule);
    const allIntervals = targetRules.flatMap((target) => isDirectAstronomical(target) ? intervalForRule(target, year) : []);
    for (const location of locations) {
      const direct = isDirectAstronomical(rule);
      const applicable = applicablePeriods(rule);
      const datesByPeriod = direct ? Object.fromEntries(applicable.map((period) => [period, candidateDates(allIntervals, period as any, location)])) : {};
      const changedPeriods = applicable.filter((period) => JSON.stringify(datesByPeriod[period] ?? []) !== JSON.stringify(datesByPeriod.sunrise ?? []));
      const row = {
        computed: true,
        batch: 'control-evaluator-and-reference-time',
        rule: rule.slug,
        variant: rule.variant_key ?? rule.sampradaya ?? null,
        launchStatus: rule.launch_status,
        ruleFamily: rule.rule_family,
        year,
        location: location.name,
        evaluatorBacked: evaluatorSlugs.has(rule.slug),
        referenceOnly: referenceOnlySlugs.has(rule.slug),
        controlConditions: EVALUATOR_RULES.find((candidate) => candidate.slug === rule.slug)?.variants?.flatMap((variant) => variant.conditions) ?? null,
        applicablePeriods: applicable,
        datesByPeriod,
        changedPeriods,
        windowSensitivity: !direct ? 'not-applicable' : changedPeriods.length > 0 ? 'sensitive' : 'insensitive',
        provenanceStatus: hasRatifiedWindowNote(rule) ? 'ratified-convention-note' : rule.citation ? 'citation-present-not-window-reviewed' : 'unsourced',
        classification: classifyRow(rule, datesByPeriod, direct),
        notVerified: ['No external source was opened.', 'No rule data or production data was changed.'],
      };
      rows.push(row);
      fs.appendFileSync(jsonlPath, `${JSON.stringify(row)}\n`);
    }
  }
}

const ruleSummary = [...new Set(rows.map((row) => `${row.rule}|${row.variant ?? ''}`))].map((key) => {
  const ruleRows = rows.filter((row) => `${row.rule}|${row.variant ?? ''}` === key);
  const first = ruleRows[0];
  const windowSensitivity = ruleRows.some((row) => row.windowSensitivity === 'sensitive')
    ? 'sensitive'
    : ruleRows.every((row) => row.windowSensitivity === 'not-applicable')
      ? 'not-applicable'
      : 'insensitive';
  const provenanceStatuses = [...new Set(ruleRows.map((row) => row.provenanceStatus))];
  const ratifiedConvention = provenanceStatuses.includes('ratified-convention-note');
  const classification = windowSensitivity === 'not-applicable'
    ? 'not-applicable'
    : !ruleRows.some((row) => row.windowSensitivity === 'sensitive')
      ? 'window-insensitive'
      : ratifiedConvention
        ? 'sensitive-ratified-convention'
        : 'needs-authority-decision';
  const disagreementYears = [...new Set(ruleRows.filter((row) => row.windowSensitivity === 'sensitive').map((row) => row.year))];
  const disagreementLocations = [...new Set(ruleRows.filter((row) => row.windowSensitivity === 'sensitive').map((row) => row.location))];
  const applicablePeriods = [...new Set(ruleRows.flatMap((row) => row.applicablePeriods ?? []))];
  const differencePairs = [...new Set(ruleRows.flatMap((row) => (row.windowDifferencePairs ?? []).map((pair: any) => `${pair.from}->${pair.to} (${pair.maxDays}d)`)))];
  return {
    batch: first.batch,
    rule: first.rule,
    variant: first.variant,
    launchStatus: first.launchStatus,
    classification,
    windowSensitivity,
    provenanceStatuses,
    applicablePeriods,
    disagreementYears,
    disagreementLocations,
    differencePairs,
    changedRows: ruleRows.filter((row) => row.changedPeriods.length > 0).length,
    rows: ruleRows.length,
  };
});
const counts = Object.fromEntries(['window-insensitive', 'sensitive-ratified-convention', 'needs-authority-decision', 'not-applicable'].map((classification) => [classification, ruleSummary.filter((row) => row.classification === classification).length]));
const sensitivityCounts = Object.fromEntries(['insensitive', 'sensitive', 'not-applicable'].map((sensitivity) => [sensitivity, ruleSummary.filter((row) => row.windowSensitivity === sensitivity).length]));
const summary = {
  computed: true,
  baseline: { rulesJsonCount: rules.length, declaredFromRuleFields: rules.filter((r: any) => r.corrected_tithi_reference_time).length, evaluatorSlugs: [...evaluatorSlugs], workingTreeClaimNotMeasuredHere: 'The requested 16 declared windows/125 rules describe the dirty working tree; this audit worktree is intentionally based on HEAD d39edb9, which contains 124 rules and five reference-time fields.' },
  batches: ['batch-1-ekadashi', 'batch-2-priority-observances', 'batch-3-remaining-included', 'batch-4-deferred'],
  locations: locations.map((location) => location.name),
  years: measurementYears,
  candidatePeriods: PERIODS,
  counts,
  sensitivityCounts,
  ruleSummary,
  totalRows: rows.length,
  jsonl: 'all-batches.jsonl',
  extraTestYears: extraFacts,
};
fs.writeFileSync(path.join(outDir, 'all-batches.json'), JSON.stringify({ summary, rows }, null, 2) + '\n');
const md = [
  '# Calendar Window Measurement — Batches 1–4',
  '',
  '> Computed, read-only output. No rule, source, date, database, publication, or production data was changed.',
  '',
  `This run used the isolated HEAD worktree at d39edb9: **${rules.length} rules** and **${summary.baseline.declaredFromRuleFields} reference-time fields**. The dirty working tree’s claimed 125/16 state was not imported because the phase explicitly requires measurement from a separate HEAD worktree.`,
  '',
  '| Window measurement / provenance result | Rule count |',
  '|---|---:|',
  ...Object.entries(counts).map(([key, value]) => `| ${key} | ${value} |`),
  '',
  '| Window sensitivity only | Rule count |',
  '|---|---:|',
  ...Object.entries(sensitivityCounts).map(([key, value]) => `| ${key} | ${value} |`),
  '',
  `The JSONL contains **${rows.length}** incremental rows: one per selected rule/year/location. Candidate periods were sunrise, madhyahna, aparahna, pradosha (engine default 72 minutes), nishita, moonrise, and arunodaya.`,
  '',
  '## Batch scope',
  '',
  '- Batch 1: 24 named Ekadashi slugs / 25 rows, with generic `ekadashi` treated as the evaluator control.',
  '- Batch 2: Raksha Bandhan, Guru Purnima, Chhath Puja, Chaitra/Navratri spans, Nag Panchami, Hartalika Teej, and Narasimha Jayanti.',
  '- Batch 3: remaining included lunar/nakshatra/weekday rules without evaluator or reference-time declarations.',
  '- Batch 4: deferred rules in the same scope, measured without publication.',
  '',
  '## Interpretation',
  '',
  'The report keeps two independent dimensions. `windowSensitivity` answers whether the applicable candidates disagree, while `provenanceStatuses` answers whether the rule has a source/review record. A rule can be window-insensitive and still unsourced; it must not be treated as approved. A sensitive rule with a ratified convention in its notes is ready for a separate `window_source` object, not automatically ready for a date change. Unsupported regional, relation, solar, and weekday bases are marked `not-applicable` for tithi-window measurement and retain their separate provenance status.',
  '',
  'Raksha Bandhan includes computed Vishti/Bhadra spans and overlap minutes by candidate period. No Bhadra policy or fallback was selected.',
  '',
  'For each rule, `all-batches.json` reports the number of disagreeing years and locations, applicable candidate periods, candidate pairs, and maximum civil-day difference. Those fields separate within-location window differences from location-driven differences.',
  '',
  '## Not verified',
  '',
  '- No external page was opened in this session; Tier-1 candidates remain names only.',
  '- No window was written into `rules.json`; no source reference was attached to a rule.',
  '- No production reads or writes occurred.',
  '- Dashami-viddha, parana, sampradaya-specific Ekadashi selection, and institutional/regional conventions remain unresolved unless explicitly represented in the computed metadata.',
  '',
  'Detailed rows: `all-batches.jsonl` and `all-batches.json`. Batch 1’s prior detailed artifacts remain alongside these files.',
].join('\n');
fs.writeFileSync(path.join(outDir, 'ALL-BATCHES.md'), `${md}\n`);
console.log(JSON.stringify(summary, null, 2));
