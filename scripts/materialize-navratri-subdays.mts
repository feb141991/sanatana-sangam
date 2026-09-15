/**
 * Scoped materialization for the 9 Navadurga-day sub-observances of
 * `navratri-begins` (Day 1 through Day 9) that have no top-level `rules.json` entry --
 * their dates come only from `buildOccurrencesMapCorrected`'s sub_observances
 * flattening (engine.ts), which is vrddhi/kshaya-aware. 2026 has a tithi
 * vrddhi at Saptami, which shifts Durga Ashtami from a naive Oct 18 to the
 * true Oct 19 -- confirmed by harness/lunar-span.test.ts. Naive day-offset
 * math (relative_to_other_observance) gets this wrong; this script commits
 * only the engine's own already-correct computation.
 *
 * Commits ONLY these 9 slugs' calculateObservancesForYearCorrected() output
 * through commitOccurrencesWithBatches. Existing engine-owned rows on the
 * same date are restamped into complete batches without changing their dates
 * or publication fields. New rows are withheld pending named human review.
 * Dry-run is the default. materializeOccurrencesForYears is NOT used here,
 * since it has no slug filter and can update the stored date of any other
 * already-published 2026 occurrence.
 *
 * Run: npx tsx scripts/materialize-navratri-subdays.mts [--commit]
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'node:path';
config({ path: resolve(process.cwd(), '.env.local') });

import { calculateObservancesForYearCorrected, RULE_ENGINE_VERSION } from '../src/lib/calendar/engine';
import { commitOccurrencesWithBatches } from '../src/lib/calendar/materialize';
import { currentMaterializationProvenance } from '../src/lib/calendar/materialisation-batch';
import {
  NAVRATRI_SUBDAY_SLUGS, NAVRATRI_REFERENCE_LOCATION, planNavratriSubdays,
  type ExistingSubdayRow,
} from './navratri-subdays-plan';

const TARGET_YEARS = [2026];
const COMMIT = process.argv.includes('--commit');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const { data: defs, error: defsError } = await supabase
  .from('observance_definitions')
  .select('id, slug')
  .in('slug', [...NAVRATRI_SUBDAY_SLUGS]);
if (defsError) throw defsError;
const definitionMap = new Map<string, string>((defs ?? []).map(d => [d.slug, d.id]));

const missing = NAVRATRI_SUBDAY_SLUGS.filter(s => !definitionMap.has(s));
if (missing.length > 0) {
  console.error('Missing observance_definitions for:', missing);
  process.exit(1);
}

let totalInserted = 0;

for (const year of TARGET_YEARS) {
  console.log(`\n=== ${year} ===`);
  const calculated = calculateObservancesForYearCorrected(year, NAVRATRI_REFERENCE_LOCATION)
    .filter(occ => NAVRATRI_SUBDAY_SLUGS.some(slug => slug === occ.slug));
  const absentCalculated = NAVRATRI_SUBDAY_SLUGS.filter(slug => !calculated.some(occ => occ.slug === slug));
  if (absentCalculated.length) throw new Error(`Corrected engine omitted Navratri subdays: ${absentCalculated.join(', ')}`);

  const { data: existingRows, error: existingError } = await supabase
    .from('observance_occurrences')
    .select('id, definition_id, year, date, occurrence_date, calendar_profile, spiritual_tradition, variant_key, computed_latitude, computed_longitude, computed_timezone, locked_for_regeneration, manual_date_override, final_date_source, publication_status, review_status, verification_status')
    .eq('year', year)
    .in('definition_id', [...definitionMap.values()]);
  if (existingError) throw existingError;
  const plan = planNavratriSubdays(calculated, definitionMap, (existingRows ?? []) as ExistingSubdayRow[], RULE_ENGINE_VERSION);
  for (const row of plan.toInsert) console.log(`  ${row.__slug}: ${row.date} — new, withheld`);
  for (const row of plan.toStamp) console.log(`  ${row.slug}: ${row.date} — existing, restamp only`);

  if (!COMMIT) {
    console.log(`  ${plan.toInsert.length} would be inserted; ${plan.toStamp.length} would be restamped (pass --commit to write)`);
    continue;
  }

  const provenance = currentMaterializationProvenance(RULE_ENGINE_VERSION);
  const result = await commitOccurrencesWithBatches(supabase, {
    toInsert: plan.toInsert,
    toUpdate: [],
    toStamp: plan.toStamp,
    expectedByIdentity: plan.expectedByIdentity,
    identityMeta: plan.identityMeta,
    versions: {
      engine: provenance.engineVersion,
      rule: provenance.ruleVersion,
      astronomy: provenance.astronomyVersion,
      dayBoundary: provenance.dayBoundaryVersion,
    },
  });
  console.log(`  inserted ${result.inserted}, updated ${result.updated}`);
  totalInserted += result.inserted;
}

console.log(`\nTotal inserted across all years: ${totalInserted}`);
