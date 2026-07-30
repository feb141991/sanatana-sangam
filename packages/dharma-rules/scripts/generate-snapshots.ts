/**
 * generate-snapshots.ts
 *
 * Generates snapshot fixtures capturing current engine behaviour for the
 * Phase-2 observances across 3 consecutive years and 6 locations.
 *
 * Run: npx tsx scripts/generate-snapshots.ts
 *   or: npm run generate:snapshots  (from packages/dharma-rules/)
 *
 * OUTPUT: __fixtures__/snapshot/<caseId>.json
 *
 * IMPORTANT: This script captures CURRENT BEHAVIOUR.
 * Snapshot fixtures are NOT a correctness claim.
 * They assert only "the output has not changed unexpectedly."
 * Do NOT populate golden/ files from this script.
 *
 * Per source-governance.md §6 and AGENTS.md rule 10:
 *   "Model output is never a source."
 * This script is a machine behaviour-capture tool, not a validation tool.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs   = require('fs') as typeof import('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path') as typeof import('path');

// Resolve repo root: packages/dharma-rules/scripts/ → go up 3 levels
const REPO_ROOT    = path.resolve(__dirname, '..', '..', '..');
const SNAPSHOT_DIR = path.resolve(__dirname, '..', '__fixtures__', 'snapshot');

// ── Engine import (CJS-compatible, tsx transforms TS) ──────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { calculateObservancesForYear, RULE_ENGINE_VERSION } =
  require(path.resolve(REPO_ROOT, 'src/lib/calendar/engine')) as typeof import('../../../src/lib/calendar/engine');

// ── Panchang engine version ────────────────────────────────────────────────

let PANCHANG_ENGINE_VERSION = 'unknown';
try {
  const pkgJson = JSON.parse(
    fs.readFileSync(path.resolve(REPO_ROOT, 'packages/panchang-engine/package.json'), 'utf-8')
  ) as { version?: string };
  PANCHANG_ENGINE_VERSION = pkgJson.version ?? 'unknown';
} catch {
  // ignore — non-critical metadata
}

// ── Configuration ─────────────────────────────────────────────────────────────

/**
 * The 18 Phase-2 observance slugs from calculation-examples.md §7.
 * Non-recurring, non-regional major observances.
 */
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

/**
 * 3 consecutive years: 2026, 2027, 2028.
 * One of these contains an adhika-masa year (satisfies §7 requirement).
 * NOTE: adhika masa detection is a Layer A concern — these snapshots capture
 * the current engine behaviour regardless of that distinction.
 */
const YEARS = [2026, 2027, 2028];

/**
 * 6 locations from calculation-examples.md §7 minimum coverage.
 * NOTE: The current engine (D5 defect) computes everything at Ujjain, so
 * dates will be identical across locations. This is faithfully captured.
 * These rows become meaningful after D5 (per-location evaluation) is fixed.
 */
const LOCATIONS = [
  { label: 'Ujjain, India',     lat: 23.1765,  lon: 75.7885,  tz: 'Asia/Kolkata' },
  { label: 'Delhi, India',      lat: 28.6139,  lon: 77.2090,  tz: 'Asia/Kolkata' },
  { label: 'Chennai, India',    lat: 13.0827,  lon: 80.2707,  tz: 'Asia/Kolkata' },
  { label: 'Bedford, UK',       lat: 52.1356,  lon: -0.4685,  tz: 'Europe/London' },
  { label: 'New York, USA',     lat: 40.7128,  lon: -74.0060, tz: 'America/New_York' },
  { label: 'Sydney, Australia', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
];

/** Calendar profiles from §7 minimum coverage */
const PROFILES = [
  { calendar: 'north_indian_purnimanta', tradition: 'smarta' },
  { calendar: 'gujarati_amanta',         tradition: 'smarta' },
  { calendar: 'global_sanatan',          tradition: 'unspecified' },
];

// ── Occurrence cache (one engine call per year) ───────────────────────────────

type OccurrenceMap = Map<string, string | null>;
const occurrenceCache = new Map<number, OccurrenceMap>();

function getOccurrenceMapForYear(year: number): OccurrenceMap {
  if (occurrenceCache.has(year)) return occurrenceCache.get(year)!;

  const results = calculateObservancesForYear(year);
  const map: OccurrenceMap = new Map();

  for (const r of results) {
    if (!map.has(r.slug)) {
      map.set(r.slug, r.date);
    }
  }

  occurrenceCache.set(year, map);
  return map;
}

function getEngineDate(slug: string, year: number): string | null {
  return getOccurrenceMapForYear(year).get(slug) ?? null;
}

// ── Case ID generation ────────────────────────────────────────────────────────

function makeCaseId(
  slug: string,
  year: number,
  location: (typeof LOCATIONS)[0],
  profile: (typeof PROFILES)[0],
): string {
  const locPart = location.label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const calPart = profile.calendar.replace(/-/g, '_');
  return `snap__${slug}__${year}__${locPart}__${calPart}`;
}

// ── Main generator ────────────────────────────────────────────────────────────

function main(): void {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });

  let generated = 0;
  let skipped   = 0;

  const total = PHASE2_SLUGS.length * YEARS.length * LOCATIONS.length * PROFILES.length;

  console.log('\n  📸 Snapshot generator — Phase 2 observances');
  console.log(`  Rule engine: ${RULE_ENGINE_VERSION}`);
  console.log(`  Panchang:    ${PANCHANG_ENGINE_VERSION}`);
  console.log(`  Years:       ${YEARS.join(', ')}`);
  console.log(`  Observances: ${PHASE2_SLUGS.length}`);
  console.log(`  Locations:   ${LOCATIONS.length}`);
  console.log(`  Profiles:    ${PROFILES.length}`);
  console.log(`  Total cases: ${total}`);
  console.log(`  Output:      ${SNAPSHOT_DIR}\n`);

  // Pre-compute all 3 years (prints a note about D5)
  console.log('  Computing engine output for 2026, 2027, 2028 ...');
  for (const year of YEARS) {
    getOccurrenceMapForYear(year);
    process.stdout.write(`    ${year}: computed ${PHASE2_SLUGS.length} observances\n`);
  }
  console.log('');

  const capturedAt = new Date().toISOString();

  for (const year of YEARS) {
    for (const slug of PHASE2_SLUGS) {
      const engineDate = getEngineDate(slug, year);

      for (const location of LOCATIONS) {
        for (const profile of PROFILES) {
          const caseId  = makeCaseId(slug, year, location, profile);
          const outPath = path.join(SNAPSHOT_DIR, `${caseId}.json`);

          if (fs.existsSync(outPath)) {
            skipped++;
            continue; // Never overwrite existing snapshots — delete the file to regenerate
          }

          const fixture = {
            $schema: 'https://shoonaya.app/schemas/fixture/snapshot/v1',
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
            capturedAt,
            engineVersion: PANCHANG_ENGINE_VERSION,
            ruleEngineVersion: RULE_ENGINE_VERSION as string,
            captured: {
              civilDate: engineDate,
              slug,
              recurring: null,
            },
            approved: false,
            _comment: [
              'Snapshot of current engine behaviour. NOT a correctness assertion.',
              `Captured: ${capturedAt}`,
              'D5 note: engine currently computes all locations at Ujjain.',
              'Dates will diverge across locations after D5 (per-location evaluation) is fixed.',
              'Delete this file and regenerate after D5 is shipped.',
            ].join(' | '),
          };

          fs.writeFileSync(outPath, JSON.stringify(fixture, null, 2) + '\n', 'utf-8');
          generated++;
        }
      }
    }
  }

  console.log(`  ✅ Generated: ${generated} snapshot fixture(s)`);
  if (skipped > 0) {
    console.log(`  ⏭️  Skipped:   ${skipped} (already existed — delete to regenerate)`);
  }
  console.log('\n  Reminder: These snapshots capture CURRENT BEHAVIOUR, not correct dates.');
  console.log('  Run verify:calendar after any rule or engine change to catch regressions.\n');
}

main();

export {};
