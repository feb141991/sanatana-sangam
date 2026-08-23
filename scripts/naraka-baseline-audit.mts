import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import rules from '../packages/dharma-rules/src/festivals/rules.json';
import { evaluateVariant, type RuleCondition } from '@sangam/dharma-rules';
import { calculateObservancesForYear } from '../src/lib/calendar/engine';
import { calculateOccurrencesWithEvaluator } from '../src/lib/calendar/materialize';

config({ path: resolve(process.cwd(), '.env.local') });

const CANONICAL_SLUG = 'naraka-chaturdashi';
const ALIASES = ['choti-diwali', 'chhoti-diwali', 'kali-chaudas', 'roop-chaudas', 'roop-chaturdashi'];
const EXISTING_FAMILY = ['dhanteras', 'diwali', 'govardhan-puja', 'bhai-dooj', 'bandhi-chhor-divas'];
const SOURCE_DATE = '2026-11-08';
const SOURCE_PDF = '/Users/princesharma/Downloads/RP 1948 SE Final.pdf';
const EXPECTED_SOURCE_SHA256 = 'a8816abe4fae7fc0f0e4349a3d91eef00cfc0044a5f050b1b3bfe826847f9eaa';
const UJJAIN = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
const BEDFORD = { lat: 52.1356, lon: -0.4685, tz: 'Europe/London' };
const SWEEP_DATES = Array.from({ length: 14 }, (_, index) => {
  const date = new Date('2026-11-02T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + index);
  return date.toISOString().slice(0, 10);
});

const narakaConditions: RuleCondition[] = [
  { type: 'lunar_month', value: 'Ashwin', monthSystem: 'amanta' },
  { type: 'paksha', value: 'krishna' },
  { type: 'tithi_presence', tithi: 14, period: 'arunodaya', mode: 'prevails' },
];

function findCandidate(location: typeof UJJAIN): string | null {
  for (const civilDate of SWEEP_DATES) {
    const result = evaluateVariant({
      ruleId: 'naraka_chaturdashi__standard',
      festivalId: CANONICAL_SLUG,
      conditions: narakaConditions,
    }, civilDate, location);
    if (result.qualified === true) return civilDate;
  }
  return null;
}

function listSourceFiles(root: string): string[] {
  const ignored = new Set(['.git', '.next', 'node_modules', 'graphify-out']);
  const files: string[] = [];
  for (const entry of readdirSync(root)) {
    if (ignored.has(entry)) continue;
    const path = resolve(root, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) files.push(...listSourceFiles(path));
    else if (/\.(?:ts|tsx|js|mjs|mts|json|md|sql)$/.test(entry)) files.push(path);
  }
  return files;
}

async function databaseInventory() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Read-only inventory requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');

  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const definitions = await client
    .from('observance_definitions')
    .select('id', { count: 'exact', head: true })
    .eq('slug', CANONICAL_SLUG);
  if (definitions.error) throw definitions.error;

  // PostgREST cannot filter the joined slug without an explicit join in a head
  // count, so resolve the definition ids first when the canonical row exists.
  const { data: definitionRows, error: definitionError } = await client
    .from('observance_definitions')
    .select('id')
    .eq('slug', CANONICAL_SLUG);
  if (definitionError) throw definitionError;
  const ids = (definitionRows ?? []).map(row => row.id);
  let occurrenceCount = 0;
  if (ids.length > 0) {
    const counted = await client
      .from('observance_occurrences')
      .select('id', { count: 'exact', head: true })
      .in('definition_id', ids);
    if (counted.error) throw counted.error;
    occurrenceCount = counted.count ?? 0;
  }

  return {
    definitionCount: definitions.count ?? 0,
    occurrenceCount,
    readOnly: true,
  };
}

const sourceFiles = listSourceFiles(process.cwd());
const aliasInventory = Object.fromEntries(ALIASES.map(alias => [
  alias,
  sourceFiles.filter(path => readFileSync(path, 'utf8').toLowerCase().includes(alias)).map(path => path.replace(`${process.cwd()}/`, '')),
]));
const productionRows = calculateObservancesForYear(2026, UJJAIN);
const evaluatorRows = calculateOccurrencesWithEvaluator(2026, UJJAIN);
const directCandidates = { ujjain: findCandidate(UJJAIN), bedford: findCandidate(BEDFORD) };
const pdfSha256 = existsSync(SOURCE_PDF)
  ? createHash('sha256').update(readFileSync(SOURCE_PDF)).digest('hex')
  : null;
const db = await databaseInventory();
const canonicalRule = rules.find(rule => rule.slug === CANONICAL_SLUG);
const familyOutput = productionRows
  .filter(row => EXISTING_FAMILY.includes(row.slug))
  .map(row => ({ slug: row.slug, date: row.date, ruleKey: row.ruleKey }))
  .sort((a, b) => a.slug.localeCompare(b.slug));
const productionNaraka = {
  calculated: productionRows.filter(row => row.slug === CANONICAL_SLUG),
  resolved: evaluatorRows.resolved.filter(row => row.slug === CANONICAL_SLUG),
  unresolved: evaluatorRows.unresolved.filter(row => row.slug === CANONICAL_SLUG),
};
const checks = {
  sourceChecksumMatches: pdfSha256 === EXPECTED_SOURCE_SHA256,
  sourceDateReproducedAtUjjain: directCandidates.ujjain === SOURCE_DATE,
  canonicalRuleIsIncluded: canonicalRule?.launch_status === 'included',
  aliasesAreNotRuleRows: !rules.some(rule => ALIASES.includes(rule.slug)),
  existingFamilyComplete: familyOutput.length === EXISTING_FAMILY.length,
  productionPathsPublishOneNaraka:
    productionNaraka.calculated.length === 1
    && productionNaraka.calculated[0]?.date === SOURCE_DATE
    && productionNaraka.resolved.length === 1
    && productionNaraka.resolved[0]?.date === SOURCE_DATE
    && productionNaraka.unresolved.length === 0,
  productionDatabaseHasNoOrphanOccurrence: db.definitionCount > 0 || db.occurrenceCount === 0,
};

const report = {
  generatedAt: new Date().toISOString(),
  inventory: {
    totalRuleRows: rules.length,
    canonicalRuleRows: rules.filter(rule => rule.slug === CANONICAL_SLUG).length,
    aliasRuleRows: rules.filter(rule => ALIASES.includes(rule.slug)).length,
    aliasReferences: aliasInventory,
    database: db,
  },
  source: { path: SOURCE_PDF, expectedSha256: EXPECTED_SOURCE_SHA256, actualSha256: pdfSha256, sourcedCivilDate: SOURCE_DATE },
  computed: { directCandidates, familyOutput, productionNaraka },
  checks,
  deploymentState: db.definitionCount === 0
    ? 'migration_unapplied'
    : db.occurrenceCount === 0
      ? 'definition_registered_awaiting_materialisation'
      : 'materialised',
  passed: Object.values(checks).every(Boolean),
};

console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
