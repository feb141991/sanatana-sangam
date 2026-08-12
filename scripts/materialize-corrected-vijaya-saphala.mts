/**
 * Scoped materialization for the two remaining named Ekadashis that compute
 * NOTHING under the live, USE_CORRECTED_MASA=false engine (confirmed via a
 * legacy-vs-corrected diff across all 48 `included` rules for 2026):
 *
 * - vijaya-ekadashi: legacy=[] corrected=[2026-02-13, ...]. Citation covers
 *   its 2027 date (2027-03-04, a genuine vrddhi tithi) and confirms
 *   corrected_prefer_last_match is a verified no-op in 2026/2028 -- so the
 *   algorithm is trustworthy for those years even without a direct citation.
 * - saphala-ekadashi: legacy=[] corrected=[] for 2026, but [2027-01-03] for
 *   2027 -- matching its citation exactly (Pausha Krishna Ekadashi lands at
 *   the very start of Jan 2027 this cycle, so 2026 genuinely has none; this
 *   is expected, not a bug). Only 2027+ has anything to materialize.
 *
 * Same reviewed batch/commit contract as materialize-corrected-ekadashis.mts
 * (commitOccurrencesWithBatches). Nothing else in observance_occurrences is
 * touched -- every other rule's currently-published date is untouched.
 *
 * Run: npx tsx scripts/materialize-corrected-vijaya-saphala.mts [--commit]
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'node:path';
config({ path: resolve(process.cwd(), '.env.local') });

import { calculateObservancesForYearCorrected, RULE_ENGINE_VERSION } from '../src/lib/calendar/engine';
import { commitOccurrencesWithBatches, batchIdentityKey } from '../src/lib/calendar/materialize';

const TARGET_SLUGS = ['vijaya-ekadashi', 'saphala-ekadashi'];
const TARGET_YEARS = [2026, 2027, 2028];
const DEFAULT_PROFILE = 'legacy-ujjain';
const DEFAULT_VARIANT = 'legacy-default';
const COMMIT = process.argv.includes('--commit');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const { data: defs, error: defsError } = await supabase
  .from('observance_definitions')
  .select('id, slug')
  .in('slug', TARGET_SLUGS);
if (defsError) throw defsError;
const definitionMap = new Map<string, string>((defs ?? []).map((d: any) => [d.slug, d.id]));

const missing = TARGET_SLUGS.filter(s => !definitionMap.has(s));
if (missing.length > 0) {
  console.error('Missing observance_definitions for:', missing);
  process.exit(1);
}

let totalInserted = 0;

for (const year of TARGET_YEARS) {
  console.log(`\n=== ${year} ===`);
  const calculated = calculateObservancesForYearCorrected(year)
    .filter(occ => TARGET_SLUGS.includes(occ.slug));

  const { data: existingRows, error: existingError } = await supabase
    .from('observance_occurrences')
    .select('id, definition_id, year, date, calendar_profile, variant_key')
    .eq('year', year)
    .in('definition_id', [...definitionMap.values()]);
  if (existingError) throw existingError;
  const existingKeys = new Set(
    (existingRows ?? []).map((r: any) => `${r.definition_id}:${r.calendar_profile}:${r.variant_key}`),
  );

  const toInsert: any[] = [];
  const expectedByIdentity = new Map<string, number>();
  const identityMeta = new Map<string, any>();

  for (const occ of calculated) {
    const definitionId = definitionMap.get(occ.slug)!;
    const identity = {
      definition_id: definitionId, year, calendar_profile: DEFAULT_PROFILE,
      spiritual_tradition: null, variant_key: DEFAULT_VARIANT,
      computed_latitude: 23.1765, computed_longitude: 75.7885,
      computed_timezone: 'Asia/Kolkata', __slug: occ.slug,
    };
    const key = batchIdentityKey(identity);
    expectedByIdentity.set(key, 1);
    identityMeta.set(key, identity);

    const existingKey = `${definitionId}:${DEFAULT_PROFILE}:${DEFAULT_VARIANT}`;
    if (existingKeys.has(existingKey)) {
      console.log(`  ${occ.slug}: already has a row, skipping (not touching existing data)`);
      continue;
    }

    console.log(`  ${occ.slug}: ${occ.date}${COMMIT ? '' : ' (dry run)'}`);
    toInsert.push({
      definition_id: definitionId,
      __slug: occ.slug,
      __anchor: occ.date,
      year: occ.year,
      date: occ.date,
      occurrence_date: occ.date,
      calendar_profile: DEFAULT_PROFILE,
      variant_key: DEFAULT_VARIANT,
      is_primary_variant: true,
      computed_latitude: 23.1765,
      computed_longitude: 75.7885,
      computed_timezone: 'Asia/Kolkata',
      calculation_version: RULE_ENGINE_VERSION,
      calculated_by: 'scoped-corrected-vijaya-saphala-materialize',
      final_date_source: 'calculation_engine',
      audit_status: 'not_run',
      verification_status: 'not_checked',
      source_provenance: {
        source_name: 'calculation_engine',
        source_kind: 'curated',
      },
    });
  }

  if (calculated.length === 0) {
    console.log('  no corrected occurrences this year (expected for saphala-ekadashi in 2026)');
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
