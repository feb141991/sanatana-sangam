/**
 * D32 — per-calendar-profile month-system branching.
 *
 * For every `included` lunar_tithi / lunar_tithi_recurring rule with a
 * `corrected_month_system` declared, computes the rule's date under BOTH
 * amanta and purnimanta (calculateObservancesForYearCorrectedForSystem, new
 * this change -- see engine.ts). Where the two systems agree (true for every
 * Shukla-paksha rule by construction), there is nothing to do: the existing
 * single `legacy-ujjain` row already serves every profile correctly via the
 * read path's fallback. Only where they DIFFER does this script write one
 * extra row per lunar-capable calendar_profiles slug, tagged with that
 * profile's own slug and the date matching its declared month_system.
 *
 * Lunar-capable profiles (7 amanta + 2 purnimanta) -- excludes the 3 solar
 * profiles (tamil_solar, malayalam_solar, bengali_solar; solar-calendar date
 * derivation is a separate, out-of-scope problem -- see the D32 plan) and
 * `legacy-ujjain` itself, whose existing row (the rule's own default system)
 * is untouched by this script.
 *
 * Same reviewed batch/commit contract as every other scoped materialization
 * script this session (commitOccurrencesWithBatches, batchIdentityKey).
 * Insert-only -- never touches an existing row for any profile/year/rule.
 *
 * Run: npx tsx scripts/materialize-per-profile-month-system.mts [--commit]
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'node:path';
config({ path: resolve(process.cwd(), '.env.local') });

import { CANONICAL_RULES } from '../src/lib/calendar/rules';
import { calculateObservancesForYearCorrectedForSystem, RULE_ENGINE_VERSION } from '../src/lib/calendar/engine';
import { commitOccurrencesWithBatches, batchIdentityKey } from '../src/lib/calendar/materialize';

const TARGET_YEARS = [2026, 2027, 2028];
const COMMIT = process.argv.includes('--commit');

const LUNAR_CAPABLE_PROFILES: Array<{ slug: string; monthSystem: 'amanta' | 'purnimanta' }> = [
  { slug: 'gujarati_amanta', monthSystem: 'amanta' },
  { slug: 'marathi_amanta', monthSystem: 'amanta' },
  { slug: 'kannada_telugu_amanta', monthSystem: 'amanta' },
  { slug: 'kannada_amanta', monthSystem: 'amanta' },
  { slug: 'telugu_amanta', monthSystem: 'amanta' },
  { slug: 'odia', monthSystem: 'amanta' },
  { slug: 'global_sanatan', monthSystem: 'amanta' },
  { slug: 'north_indian_purnimanta', monthSystem: 'purnimanta' },
  { slug: 'nepali_bikram', monthSystem: 'purnimanta' },
];

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const targetRules = CANONICAL_RULES.filter(
  (r: any) =>
    r.launch_status === 'included' &&
    (r.rule_family === 'lunar_tithi' || r.rule_family === 'lunar_tithi_recurring') &&
    r.corrected_month_system !== undefined,
);
const targetSlugs = [...new Set(targetRules.map((r: any) => r.slug))];

const { data: defs, error: defsError } = await supabase
  .from('observance_definitions')
  .select('id, slug')
  .in('slug', targetSlugs);
if (defsError) throw defsError;
const definitionMap = new Map<string, string>((defs ?? []).map((d: any) => [d.slug, d.id]));

const missing = targetSlugs.filter(s => !definitionMap.has(s));
if (missing.length > 0) {
  console.error('Missing observance_definitions for:', missing);
  process.exit(1);
}

let totalInserted = 0;
let totalSkippedNoDivergence = 0;

for (const year of TARGET_YEARS) {
  console.log(`\n=== ${year} ===`);

  const amantaOccs = calculateObservancesForYearCorrectedForSystem(year, 'amanta')
    .filter(o => targetSlugs.includes(o.slug));
  const purnimantaOccs = calculateObservancesForYearCorrectedForSystem(year, 'purnimanta')
    .filter(o => targetSlugs.includes(o.slug));

  // CANONICAL_RULES has more than one rule object for some slugs (e.g.
  // krishna-janmashtami's Smarta/Gaudiya variants), which compute the same
  // date from identical date-computation fields -- dedupe per slug so a
  // recurring rule's genuinely-repeated dates survive but a duplicate rule
  // object doesn't double-insert.
  const amantaBySlug = new Map<string, string[]>();
  for (const o of amantaOccs) amantaBySlug.set(o.slug, [...new Set([...(amantaBySlug.get(o.slug) ?? []), o.date])].sort());
  const purnimantaBySlug = new Map<string, string[]>();
  for (const o of purnimantaOccs) purnimantaBySlug.set(o.slug, [...new Set([...(purnimantaBySlug.get(o.slug) ?? []), o.date])].sort());

  const divergentSlugs = targetSlugs.filter(slug => {
    const a = JSON.stringify(amantaBySlug.get(slug) ?? []);
    const p = JSON.stringify(purnimantaBySlug.get(slug) ?? []);
    return a !== p;
  });
  totalSkippedNoDivergence += targetSlugs.length - divergentSlugs.length;

  if (divergentSlugs.length === 0) {
    console.log('  no divergent rules this year -- nothing to materialize');
    continue;
  }
  console.log(`  divergent rules: ${divergentSlugs.join(', ')}`);

  const relevantDefIds = divergentSlugs.map(s => definitionMap.get(s)!);
  const { data: existingRows, error: existingError } = await supabase
    .from('observance_occurrences')
    .select('definition_id, calendar_profile, variant_key')
    .eq('year', year)
    .in('definition_id', relevantDefIds);
  if (existingError) throw existingError;
  const existingKeys = new Set(
    (existingRows ?? []).map((r: any) => `${r.definition_id}:${r.calendar_profile}:${r.variant_key}`),
  );

  const toInsert: any[] = [];
  const expectedByIdentity = new Map<string, number>();
  const identityMeta = new Map<string, any>();

  for (const slug of divergentSlugs) {
    const definitionId = definitionMap.get(slug)!;
    const dateBySystem = { amanta: amantaBySlug.get(slug) ?? [], purnimanta: purnimantaBySlug.get(slug) ?? [] };

    for (const profile of LUNAR_CAPABLE_PROFILES) {
      const dates = dateBySystem[profile.monthSystem];
      if (dates.length === 0) continue; // rule not publishable this year under this system (e.g. disputed)

      const existingKey = `${definitionId}:${profile.slug}:legacy-default`;
      const identity = {
        definition_id: definitionId, year, calendar_profile: profile.slug,
        spiritual_tradition: null, variant_key: 'legacy-default',
        computed_latitude: 23.1765, computed_longitude: 75.7885,
        computed_timezone: 'Asia/Kolkata', __slug: slug,
      };
      const identityKey = batchIdentityKey(identity);
      expectedByIdentity.set(identityKey, dates.length);
      identityMeta.set(identityKey, identity);

      if (existingKeys.has(existingKey)) {
        console.log(`  ${slug} [${profile.slug}]: already has a row, skipping`);
        continue;
      }

      for (const date of dates) {
        console.log(`  ${slug} [${profile.slug}, ${profile.monthSystem}]: ${date}${COMMIT ? '' : ' (dry run)'}`);
        toInsert.push({
          definition_id: definitionId,
          __slug: slug,
          __anchor: date,
          year,
          date,
          occurrence_date: date,
          calendar_profile: profile.slug,
          variant_key: 'legacy-default',
          is_primary_variant: true,
          computed_latitude: 23.1765,
          computed_longitude: 75.7885,
          computed_timezone: 'Asia/Kolkata',
          calculation_version: RULE_ENGINE_VERSION,
          calculated_by: 'scoped-per-profile-month-system-materialize',
          final_date_source: 'calculation_engine',
          audit_status: 'not_run',
          verification_status: 'not_checked',
          source_provenance: {
            source_name: 'calculation_engine',
            source_kind: 'curated',
          },
        });
      }
    }
  }

  if (!COMMIT) {
    console.log(`  ${toInsert.length} would be inserted for ${year} (pass --commit to write)`);
    continue;
  }

  if (toInsert.length === 0) {
    console.log('  nothing new to insert');
    continue;
  }

  const result = await commitOccurrencesWithBatches(supabase, {
    toInsert,
    toUpdate: [],
    toStamp: [],
    expectedByIdentity,
    identityMeta,
    versions: { engine: RULE_ENGINE_VERSION, rule: '1.0.0', astronomy: '1.0.0' },
  });
  console.log(`  inserted ${result.inserted}, updated ${result.updated}`);
  totalInserted += result.inserted;
}

console.log(`\nTotal inserted across all years: ${totalInserted}`);
console.log(`Rule/year pairs skipped (systems agree, nothing to do): ${totalSkippedNoDivergence}`);
