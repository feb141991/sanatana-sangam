/**
 * generate-golden-placeholders.ts
 *
 * Creates placeholder golden fixture files for the 18 Phase-2 observances.
 * ALL `expected` values are null and `approved` is false.
 *
 * *** CRITICAL: DO NOT populate expected values from model output. ***
 * *** Per source-governance.md §6: model output is NEVER a source. ***
 * *** These files require human review against a cited Tier 1-4 source. ***
 *
 * Run: npx tsx scripts/generate-golden-placeholders.ts
 *
 * After running, for each file:
 *   1. Locate the festival date in a Tier 1-4 source (e.g. Rashtriya Panchang).
 *   2. Fill in `expected.civilDate` manually.
 *   3. Fill in the `source` block with the citation.
 *   4. Set `approved: true` after council sign-off.
 */

import fs from 'node:fs';
import path from 'node:path';

const GOLDEN_DIR = path.resolve(__dirname, '..', '__fixtures__', 'golden');

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

function main(): void {
  fs.mkdirSync(GOLDEN_DIR, { recursive: true });

  let generated = 0;
  let skipped   = 0;

  console.log('\n  📋 Golden placeholder generator');
  console.log('  *** CRITICAL: expected values are null. Human review required. ***');
  console.log('  *** Never populate expected values from model output.           ***\n');

  for (const year of GOLDEN_YEARS) {
    for (const slug of PHASE2_SLUGS) {
      for (const location of GOLDEN_LOCATIONS) {
        for (const profile of GOLDEN_PROFILES) {
          const caseId  = makeCaseId(slug, year, location, profile);
          const outPath = path.join(GOLDEN_DIR, `${caseId}.json`);

          if (fs.existsSync(outPath)) {
            skipped++;
            continue;
          }

          const placeholder = {
            $schema: 'https://shoonaya.app/schemas/fixture/golden/v1',
            caseId,
            festivalId: slug,
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
            // ── TODO: fill in expected after human review ──
            // "expected": {
            //   "civilDate": "YYYY-MM-DD",   ← from Tier 1-4 source only
            //   "monthLabel": null,
            //   "windows": null,
            //   "reasonCodes": null,
            //   "alternativeCount": null
            // },
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
          };

          fs.writeFileSync(outPath, JSON.stringify(placeholder, null, 2) + '\n', 'utf-8');
          generated++;
        }
      }
    }
  }

  console.log(`  ✅ Created: ${generated} golden placeholder(s)`);
  if (skipped > 0) {
    console.log(`  ⏭️  Skipped: ${skipped} (already existed)`);
  }
  console.log('\n  Next steps for each file:');
  console.log('    1. Find the date in Rashtriya Panchang or another Tier 1-4 source.');
  console.log('    2. Manually set expected.civilDate to the cited date.');
  console.log('    3. Update the source block with the full citation.');
  console.log('    4. Submit for council review, then set approved: true.\n');
}

main();

export {};
