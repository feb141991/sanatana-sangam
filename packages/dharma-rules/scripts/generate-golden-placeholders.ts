/**
 * generate-golden-placeholders.ts
 *
 * Inserts placeholder golden_fixtures rows for the 18 Phase-2 observances.
 * ALL `expected` values are null and `approved` is false.
 *
 * *** CRITICAL: DO NOT populate expected values from model output. ***
 * *** Per source-governance.md §6: model output is NEVER a source. ***
 * *** These rows require human review against a cited Tier 1-4 source, via
 * *** /admin/calendar-governance. ***
 *
 * Run: npx tsx scripts/generate-golden-placeholders.ts
 *
 * After running, for each row (in the admin GUI, not by hand-editing files --
 * golden fixtures moved to public.golden_fixtures):
 *   1. Locate the festival date in a Tier 1-4 source (e.g. Rashtriya Panchang).
 *   2. Fill in `expected.civilDate` manually.
 *   3. Fill in the `source` block with the citation.
 *   4. Set `approved: true` after council sign-off.
 */

import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: resolve(__dirname, '../../../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}
const supabase = createClient(url, key);

// Priority locations for golden fixtures (the ones most likely to differ in results)
const GOLDEN_LOCATIONS = [
  { label: 'Ujjain, India',  lat: 23.1765, lon: 75.7885,  tz: 'Asia/Kolkata' },
  { label: 'Bedford, UK',    lat: 52.1356, lon: -0.4685,  tz: 'Europe/London' },
];

const GOLDEN_PROFILES = [
  { calendar: 'north_indian_purnimanta', tradition: 'smarta' },
  { calendar: 'gujarati_amanta',         tradition: 'smarta' },
];

const GOLDEN_YEARS = [2026, 2027, 2028];

const PHASE2_SLUGS: string[] = [
  'makar-sankranti',
  'vasant-panchami',
  'maha-shivaratri',
  'holi',
  'gudi-padwa',
  'chaitra-navratri-begins',
  'ram-navami',
  'hanuman-jayanti',
  'akshaya-tritiya',
  'guru-purnima',
  'raksha-bandhan',
  'krishna-janmashtami',
  'ganesh-chaturthi',
  'hartalika-teej',
  'onam',
  'dussehra',
  'diwali',
  'chhath-puja',
];

function makeCaseId(
  slug: string,
  year: number,
  location: (typeof GOLDEN_LOCATIONS)[0],
  profile: (typeof GOLDEN_PROFILES)[0],
): string {
  const locPart = location.label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const calPart = profile.calendar.replace(/-/g, '_');
  return `${slug}__${year}__${locPart}__${calPart}`;
}

async function main(): Promise<void> {
  const rows: Array<Record<string, unknown>> = [];

  for (const year of GOLDEN_YEARS) {
    for (const slug of PHASE2_SLUGS) {
      for (const location of GOLDEN_LOCATIONS) {
        for (const profile of GOLDEN_PROFILES) {
          const caseId = makeCaseId(slug, year, location, profile);
          rows.push({
            case_id: caseId,
            festival_id: slug,
            year,
            location: {
              label: location.label,
              lat: location.lat,
              lon: location.lon,
              tz: location.tz,
            },
            profile: {
              calendar: profile.calendar,
              tradition: profile.tradition,
            },
            expected: null,
            tolerance: { windowMinutes: 2 },
            source: {
              tier: 1,
              ref: `TODO_${slug}_${year}`,
              citation: `TODO: Cite Tier 1-4 source for ${slug} ${year}`,
              verifiedBy: 'TODO: council_identifier',
              verifiedOn: '2000-01-01', // placeholder; update when verified
            },
            reasoning: `TODO: Explain why the engine produces the expected date for ${slug} ${year} at ${location.label} under ${profile.calendar}.`,
            approved: false,
          });
        }
      }
    }
  }

  console.log('\n  📋 Golden placeholder generator (writing to golden_fixtures)');
  console.log('  *** CRITICAL: expected values are null. Human review required. ***');
  console.log('  *** Never populate expected values from model output.           ***\n');

  // ignoreDuplicates: an existing row (already sourced or mid-review) must
  // never be silently overwritten back to a TODO placeholder by a re-run.
  const { data, error } = await supabase
    .from('golden_fixtures')
    .upsert(rows, { onConflict: 'case_id', ignoreDuplicates: true })
    .select('case_id');

  if (error) {
    console.error('Insert failed:', error);
    process.exit(1);
  }

  const inserted = data?.length ?? 0;
  console.log(`  ✅ Inserted: ${inserted} new golden placeholder row(s)`);
  console.log(`  ⏭️  Skipped: ${rows.length - inserted} (already existed)`);
  console.log('\n  Next steps for each row:');
  console.log('    1. Find the date in Rashtriya Panchang or another Tier 1-4 source.');
  console.log('    2. In /admin/calendar-governance, set expected.civilDate to the cited date.');
  console.log('    3. Update the source block with the full citation.');
  console.log('    4. Submit for council review, then set approved: true.\n');
}

main();

export {};
