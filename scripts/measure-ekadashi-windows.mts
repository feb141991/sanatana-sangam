import fs from 'node:fs';
import path from 'node:path';
import {
  computeAstronomy,
  getLunarMonth,
  getMoonRiseSet,
  getMuhurtaWindows,
  getSunriseForDateStr,
  parseCivilDateUtc,
  offsetCivilDateStr,
  type LocationInput,
} from '@sangam/panchang-engine';

type Location = { name: string; lat: number; lon: number; tz: string };
type PeriodName = 'sunrise' | 'madhyahna' | 'aparahna' | 'pradosha' | 'nishita' | 'moonrise' | 'arunodaya';
type Rule = Record<string, any>;

export const LOCATIONS: Location[] = [
  { name: 'ujjain', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
  { name: 'kolkata', lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata' },
  { name: 'delhi', lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata' },
];
export const YEARS = [2026, 2027, 2028, 2029, 2030];
export const PERIODS: PeriodName[] = ['sunrise', 'madhyahna', 'aparahna', 'pradosha', 'nishita', 'moonrise', 'arunodaya'];
const DAY = 86_400_000;
const HOUR = 3_600_000;
export const rules = JSON.parse(fs.readFileSync(path.resolve('packages/dharma-rules/src/festivals/rules.json'), 'utf8')) as Rule[];
export const namedRows = rules.filter((rule) => rule.slug.includes('ekadashi') && rule.slug !== 'ekadashi');
const genericRule = rules.find((rule) => rule.slug === 'ekadashi');

const astroCache = new Map<number, ReturnType<typeof computeAstronomy>>();
const monthCache = new Map<string, ReturnType<typeof getLunarMonth>>();
function astronomy(date: Date) {
  const key = date.getTime();
  const cached = astroCache.get(key);
  if (cached) return cached;
  const result = computeAstronomy(date);
  astroCache.set(key, result);
  return result;
}
function lunarMonth(date: Date, system: 'amanta' | 'purnimanta') {
  const key = `${date.getTime()}|${system}`;
  const cached = monthCache.get(key);
  if (cached) return cached;
  const result = getLunarMonth(date, system);
  monthCache.set(key, result);
  return result;
}
function angularDelta(value: number, target: number): number {
  return ((value - target + 540) % 360) - 180;
}
function bisectBoundary(left: Date, right: Date, target: number): Date {
  let lo = left.getTime();
  let hi = right.getTime();
  const loSign = Math.sign(angularDelta(astronomy(new Date(lo)).elongation, target));
  for (let i = 0; i < 45; i += 1) {
    const mid = (lo + hi) / 2;
    const sign = Math.sign(angularDelta(astronomy(new Date(mid)).elongation, target));
    if (sign === loSign) lo = mid;
    else hi = mid;
  }
  return new Date((lo + hi) / 2);
}
function currentTithi(date: Date): number {
  return Math.floor(astronomy(date).elongation / 12) + 1;
}
function boundaryAround(date: Date, target: number, direction: 'before' | 'after'): Date {
  const step = direction === 'before' ? -HOUR : HOUR;
  let right = date;
  let rightDelta = angularDelta(astronomy(right).elongation, target);
  for (let i = 0; i < 240; i += 1) {
    const left = new Date(right.getTime() + step);
    const leftDelta = angularDelta(astronomy(left).elongation, target);
    if (leftDelta === 0 || Math.sign(leftDelta) !== Math.sign(rightDelta)) {
      return direction === 'before' ? bisectBoundary(left, right, target) : bisectBoundary(right, left, target);
    }
    right = left;
    rightDelta = leftDelta;
  }
  throw new Error(`Could not find tithi boundary ${target} ${direction}`);
}
export function dateInTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(date);
}
export function localDateTime(date: Date, tz: string): string {
  return date.toLocaleString('sv-SE', { timeZone: tz, hour12: false });
}
function normalizeMonth(name: string | null): string {
  return (name ?? '').replace(/^Adhika\s+/i, '').toLowerCase();
}
function sameMonth(rule: Rule, interval: { startsAt: Date; endsAt: Date }): { matches: boolean; actual: any } {
  const system = (rule.corrected_month_system ?? rule.month_system ?? 'amanta') as 'amanta' | 'purnimanta';
  const expected = rule.corrected_lunar_masa_name ?? rule.lunar_masa_name;
  if (!expected) return { matches: true, actual: { system, expected: null, month: null } };
  const midpoint = new Date((interval.startsAt.getTime() + interval.endsAt.getTime()) / 2);
  const result = lunarMonth(midpoint, system);
  const monthName = result.ok ? result.monthName : null;
  return { matches: normalizeMonth(monthName) === normalizeMonth(expected), actual: { system, expected, monthName, ok: result.ok, isAdhika: result.ok ? result.isAdhika : null } };
}
export function intervalForRule(rule: Rule, year: number): Array<{ startsAt: Date; endsAt: Date; month: any }> {
  const target = Number(rule.corrected_lunar_tithi_index ?? rule.lunar_tithi_index);
  if (!Number.isFinite(target)) return [];
  const first = new Date(Date.UTC(year, 0, 1) - 3 * DAY);
  const last = new Date(Date.UTC(year + 1, 0, 1) + 3 * DAY);
  const results: Array<{ startsAt: Date; endsAt: Date; month: any }> = [];
  let cursor = first;
  let inTarget = currentTithi(cursor) === target;
  let start = inTarget ? boundaryAround(cursor, (target - 1) * 12, 'before') : null;
  while (cursor < last) {
    const next = new Date(cursor.getTime() + 3 * HOUR);
    const nextInTarget = currentTithi(next) === target;
    if (!inTarget && nextInTarget) {
      start = boundaryAround(next, (target - 1) * 12, 'before');
    }
    if (inTarget && !nextInTarget && start) {
      const end = boundaryAround(cursor, (target % 30) * 12 % 360, 'after');
      const interval = { startsAt: start, endsAt: end };
      const month = sameMonth(rule, interval);
      if (month.matches && interval.endsAt > new Date(Date.UTC(year, 0, 1)) && interval.startsAt < new Date(Date.UTC(year + 1, 0, 1))) {
        results.push({ ...interval, month: month.actual });
      }
      start = null;
    }
    cursor = next;
    inTarget = nextInTarget;
  }
  return results;
}
export function periodWindow(period: PeriodName, civilDate: string, location: Location): { start: Date; end: Date } | null {
  const input: LocationInput = { lat: location.lat, lon: location.lon, tz: location.tz };
  if (period === 'sunrise') {
    const sunrise = getSunriseForDateStr(civilDate, input).sunrise;
    return { start: sunrise, end: sunrise };
  }
  if (period === 'moonrise') {
    const moon = getMoonRiseSet(new Date(`${civilDate}T12:00:00Z`), location.lat, location.lon, location.tz);
    if (moon.ok && moon.moonrise) return { start: moon.moonrise, end: moon.moonrise };
    return null;
  }
  if (period === 'arunodaya') {
    const sunrise = getSunriseForDateStr(civilDate, input).sunrise;
    return { start: new Date(sunrise.getTime() - 96 * 60_000), end: sunrise };
  }
  // Use a noon UTC sample for the civil date, matching the canonical Holi
  // audit. Passing parseCivilDateUtc(civilDate) would sample the preceding
  // local civil date in India and shift the sunrise-derived window.
  const result = getMuhurtaWindows(new Date(`${civilDate}T12:00:00Z`), location.lat, location.lon, location.tz);
  if (!result.ok) return null;
  const window = result.windows[period];
  return window ? { start: window.start, end: window.end } : null;
}
function overlaps(interval: { startsAt: Date; endsAt: Date }, window: { start: Date; end: Date }): boolean {
  if (window.start.getTime() === window.end.getTime()) return interval.startsAt <= window.start && window.start < interval.endsAt;
  return interval.startsAt < window.end && window.start < interval.endsAt;
}
export function candidateDates(intervals: Array<{ startsAt: Date; endsAt: Date }>, period: PeriodName, location: Location): string[] {
  const dates = new Set<string>();
  for (const interval of intervals) {
    const first = dateInTz(new Date(interval.startsAt.getTime() - DAY), location.tz);
    const last = dateInTz(new Date(interval.endsAt.getTime() + DAY), location.tz);
    for (let date = first; date <= last; date = offsetCivilDateStr(date, 1)) {
      const window = periodWindow(period, date, location);
      if (window && overlaps(interval, window)) dates.add(date);
    }
  }
  return [...dates].sort();
}
function genericEvaluatorSunriseDates(year: number, location: Location): string[] {
  const genericIntervals = [
    ...intervalForRule({ lunar_tithi_index: 11 }, year),
    ...intervalForRule({ lunar_tithi_index: 26 }, year),
  ];
  return candidateDates(genericIntervals, 'sunrise', location);
}
export function findExtraYears(): any {
  const facts: any = { computed: true, yearsScanned: [2026, 2040], skippedTithi: null, repeatedTithi: null, adhikaMonth: null, midnightStraddle: null };
  const location = LOCATIONS[0];
  const input: LocationInput = { lat: location.lat, lon: location.lon, tz: location.tz };
  let previous: { date: string; tithi: number } | null = null;
  for (let year = 2026; year <= 2040; year += 1) {
    for (let day = 0; day < 366; day += 1) {
      const date = new Date(Date.UTC(year, 0, 1 + day));
      if (date.getUTCFullYear() !== year) break;
      const civil = date.toISOString().slice(0, 10);
      const sunrise = getSunriseForDateStr(civil, input).sunrise;
      const tithi = currentTithi(sunrise);
      if (previous) {
        const delta = (tithi - previous.tithi + 30) % 30;
        if (delta === 0 && !facts.repeatedTithi) facts.repeatedTithi = { year, previous: previous.date, date: civil, tithi };
        if (delta > 1 && !facts.skippedTithi) facts.skippedTithi = { year, previous: previous.date, date: civil, previousTithi: previous.tithi, tithi };
      }
      previous = { date: civil, tithi };
      if (!facts.adhikaMonth && day % 15 === 0) {
        const month = lunarMonth(sunrise, 'amanta');
        if (month.ok && month.isAdhika) facts.adhikaMonth = { year, date: civil, month: month.monthName };
      }
    }
  }
  for (const rule of namedRows) {
    const intervals = intervalForRule(rule, 2026);
    const interval = intervals.find((item) => dateInTz(item.startsAt, location.tz) !== dateInTz(item.endsAt, location.tz));
    if (interval) {
      facts.midnightStraddle = { year: 2026, rule: rule.slug, startsAt: interval.startsAt.toISOString(), endsAt: interval.endsAt.toISOString(), startLocal: localDateTime(interval.startsAt, location.tz), endLocal: localDateTime(interval.endsAt, location.tz) };
      break;
    }
  }
  return facts;
}

if (process.argv[1]?.endsWith('measure-ekadashi-windows.mts')) {
const outDir = path.resolve('docs/audits/calendar-window-measurement');
fs.mkdirSync(outDir, { recursive: true });
const jsonlPath = path.join(outDir, 'batch-1-ekadashi.jsonl');
fs.writeFileSync(jsonlPath, '');
const rows: any[] = [];
for (const rule of namedRows) {
  for (const year of YEARS) {
    const intervals = intervalForRule(rule, year);
    for (const location of LOCATIONS) {
      const datesByPeriod = Object.fromEntries(PERIODS.map((period) => [period, candidateDates(intervals, period, location)]));
      const baseline = datesByPeriod.sunrise;
      const genericSunriseDates = genericEvaluatorSunriseDates(year, location);
      const changedPeriods = PERIODS.filter((period) => JSON.stringify(datesByPeriod[period]) !== JSON.stringify(baseline));
      const row = {
        computed: true,
        rule: rule.slug,
        variant: rule.variant_key ?? rule.sampradaya ?? null,
        year,
        location: location.name,
        targetTithi: rule.corrected_lunar_tithi_index ?? rule.lunar_tithi_index ?? null,
        paksha: (rule.corrected_lunar_tithi_index ?? rule.lunar_tithi_index ?? 0) <= 15 ? 'shukla' : 'krishna',
        lunarMonth: rule.corrected_lunar_masa_name ?? rule.lunar_masa_name ?? null,
        monthSystem: rule.corrected_month_system ?? rule.month_system ?? 'amanta',
        declaredReference: rule.corrected_tithi_reference_time ?? null,
        allowSkippedTithi: rule.corrected_allow_skipped_tithi ?? rule.allow_skipped_tithi ?? null,
        preferLastMatch: rule.corrected_prefer_last_match ?? rule.prefer_last_match ?? null,
        evaluatorSupported: rule.slug === 'ekadashi' || Boolean(rule.evaluator_conditions),
        intervalCount: intervals.length,
        intervals: intervals.map((interval) => ({ startsAt: interval.startsAt.toISOString(), endsAt: interval.endsAt.toISOString(), startsLocal: localDateTime(interval.startsAt, location.tz), endsLocal: localDateTime(interval.endsAt, location.tz), month: interval.month })),
        datesByPeriod,
        genericEvaluatorSunriseDates: genericSunriseDates,
        genericEvaluatorContainsNamedSunriseDates: baseline.every((date) => genericSunriseDates.includes(date)),
        dateChoiceChanges: changedPeriods.length > 0,
        changedPeriods,
        classification: changedPeriods.length > 0 ? 'window-sensitive-needs-engine' : 'window-insensitive',
        evidence: changedPeriods.length > 0 ? 'At least one candidate ritual reference gives a different civil date from sunrise in this computed sample.' : 'All candidate references produced the same civil date in this computed sample.',
        notVerified: ['No external source was read in this session.', 'No ritual window was approved or written.', 'No production rows were read or changed.', 'The engine does not expose Dashami-viddha/parana policy as a named rule field for these rows.'],
      };
      rows.push(row);
      fs.appendFileSync(jsonlPath, `${JSON.stringify(row)}\n`);
    }
  }
}

const summary = {
  computed: true,
  batch: '1 — named Ekadashi rules',
  namedSlugCount: new Set(namedRows.map((r) => r.slug)).size,
  namedVariantRowCount: namedRows.length,
  genericEvaluatorControl: genericRule ? { slug: genericRule.slug, evaluatorCondition: 'tithi 11 at sunrise, paksha-ambiguous, recurring' } : null,
  genericEvaluatorComparison: 'Each named row is compared against the generic evaluator’s sunrise dates below; containment means the generic recurring rule can produce the named sunrise date, not that it models the named month, variant, or Dashami-viddha policy.',
  rules: [...new Set(namedRows.map((r) => r.slug))],
  locations: LOCATIONS.map((l) => l.name),
  years: YEARS,
  candidatePeriods: PERIODS,
  counts: {
    insensitiveRules: 0,
    sensitiveSupportedRules: 0,
    sensitiveNeedsEngineRules: 0,
    needsAuthorityDecisionRules: 0,
    needsSourceRules: 0,
  },
  ruleSummary: [] as any[],
  extraTestYears: findExtraYears(),
  jsonl: 'batch-1-ekadashi.jsonl',
};
for (const slug of summary.rules) {
  const ruleRows = rows.filter((row) => row.rule === slug);
  const sensitive = ruleRows.some((row) => row.dateChoiceChanges);
  const hasExplicitReference = ruleRows.some((row) => row.declaredReference);
  const classification = !sensitive
    ? 'window-insensitive'
    : hasExplicitReference
      ? 'window-sensitive-supported'
      : 'needs-authority-decision';
  const item = {
    rule: slug,
    variantRows: [...new Set(ruleRows.map((row) => row.variant))],
    classification,
    changedRows: ruleRows.filter((row) => row.dateChoiceChanges).length,
    totalRows: ruleRows.length,
    evidence: sensitive
      ? 'Candidate period choices disagree in at least one computed year/location, and the rule has no declared reference window or tie-break.'
      : 'All measured candidate periods produced the same computed civil date for every year/location row.',
  };
  summary.ruleSummary.push(item);
  if (classification === 'window-insensitive') summary.counts.insensitiveRules += 1;
  else if (classification === 'window-sensitive-supported') summary.counts.sensitiveSupportedRules += 1;
  else if (classification === 'needs-authority-decision') summary.counts.needsAuthorityDecisionRules += 1;
  else if (classification === 'window-sensitive-needs-engine') summary.counts.sensitiveNeedsEngineRules += 1;
  else summary.counts.needsSourceRules += 1;
}
fs.writeFileSync(path.join(outDir, 'batch-1-ekadashi.json'), JSON.stringify({ summary, rows }, null, 2) + '\n');
const md = [
  '# Batch 1 — Ekadashi Window Measurement',
  '',
  '> Computed read-only output. No rule data, dates, source references, or production data were changed.',
  '',
  `Named scope: ${summary.namedSlugCount} slugs / ${summary.namedVariantRowCount} rule rows. The generic recurring ekadashi evaluator is reported as a control, not included in the named matrix.`,
  '',
  `Rule-level counts: window-insensitive **${summary.counts.insensitiveRules}**, window-sensitive-supported **${summary.counts.sensitiveSupportedRules}**, window-sensitive-needs-engine **${summary.counts.sensitiveNeedsEngineRules}**, needs authority decision **${summary.counts.needsAuthorityDecisionRules}**, needs source **${summary.counts.needsSourceRules}**.`,
  '',
  'Candidate references measured: sunrise, madhyahna, aparahna, pradosha (the engine default 72-minute window), nishita, moonrise, and arunodaya. The requested 48/144-minute pradosha alternatives are not applied to Ekadashi because this batch measures the engine-expressible candidates and does not invent an Ekadashi pradosha policy.',
  '',
  '## Rule metadata',
  '',
  '| Rule | Variant | Tithi | Month/system | Declared reference | Skip policy | Tie-break | Evaluator-backed |',
  '|---|---|---:|---|---|---|---|---|',
  ...namedRows.map((r) => `| ${r.slug} | ${r.variant_key ?? r.sampradaya ?? '—'} | ${r.corrected_lunar_tithi_index ?? r.lunar_tithi_index ?? '—'} (${(r.corrected_lunar_tithi_index ?? r.lunar_tithi_index ?? 0) <= 15 ? 'Shukla' : 'Krishna'}) | ${r.corrected_lunar_masa_name ?? r.lunar_masa_name ?? '—'} / ${r.corrected_month_system ?? r.month_system ?? 'amanta'} | ${r.corrected_tithi_reference_time ?? 'none'} | ${r.corrected_allow_skipped_tithi ?? r.allow_skipped_tithi ?? 'none'} | ${r.corrected_prefer_last_match ?? r.prefer_last_match ?? 'default'} | no (generic control only) |`),
  '',
  '## Extra years selected from astronomy',
  '',
  'The scanner searched Ujjain sunrise tithis from 2026–2040 for a repeated tithi (same tithi at consecutive sunrises), a skipped tithi (forward jump greater than one), an adhika month, and a target interval crossing a local midnight. The exact computed facts are in `batch-1-ekadashi.json`.',
  '',
  '## Evaluator control and window gaps',
  '',
  'The generic `ekadashi` rule is the only evaluator-backed control: tithi 11 at sunrise, paksha-ambiguous, recurring. None of the 25 named rule rows has an `evaluator_conditions` declaration, so none of them is currently covered by a named evaluator window. The JSON rows show whether each named sunrise date is contained in the generic evaluator output; that is a date-overlap observation, not proof that the generic rule models the named month, variant, or Dashami-viddha policy.',
  '',
  '## What was not verified',
  '',
  '- No Drik Panchang, School of Vedic Sciences, Rashtriya Panchang, or other external page was opened in this batch.',
  '- No Dashami-viddha or parana policy was inferred from the date output.',
  '- No source was treated as authority; no new window was written to `rules.json`.',
  '- Deferred rules were not published or read from production; this batch only measures named rule computation.',
  '',
  'Full per-rule/year/location candidate dates are in `batch-1-ekadashi.json` and the incremental `batch-1-ekadashi.jsonl`.',
].join('\n');
fs.writeFileSync(path.join(outDir, 'BATCH-1-EKADASHI.md'), `${md}\n`);
console.log(JSON.stringify(summary, null, 2));
}
