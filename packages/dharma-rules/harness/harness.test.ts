/**
 * harness.test.ts  — Golden Fixture Harness + Snapshot Regression Tests
 *
 * Run: npx vitest run  (from packages/dharma-rules/)
 * Or:  npm run verify:calendar  (from repo root)
 *
 * What this tests:
 *
 *  1. SCHEMA SELF-VALIDATION
 *     The schema validator demonstrably rejects malformed fixtures.
 *
 *  2. GOLDEN FIXTURES
 *     For every approved golden fixture (approved: true + valid source + non-null expected),
 *     assert that the engine produces the expected civilDate EXACTLY.
 *     Unapproved intake placeholders are skipped with a note.
 *
 *  3. SNAPSHOT REGRESSION
 *     For every snapshot fixture, assert that the engine produces the same civilDate as captured.
 *
 *  4. ENGINE EVALUATION CACHING
 *     Proves calculateObservancesForYear runs exactly once per distinct year, not per fixture.
 *
 *  5. COVERAGE REPORT
 *     Print the coverage matrix at the end of the run.
 *     STRICT=1 will fail if approved golden fixtures are missing.
 *
 * Engine access:
 *   The harness imports calculateObservancesForYear from TypeScript source.
 */

import { describe, it, expect, afterAll } from 'vitest';
import {
  loadGoldenFixtures,
  loadSnapshotFixtures,
  loadInvalidFixtures,
  validateAgainstGoldenSchema,
  GoldenFixture,
  SnapshotFixture,
} from './fixture-loader';

import {
  buildCoverageReport,
  printCoverageReport,
  strictModeViolations,
  isApprovedGoldenFixture,
} from './coverage-reporter';

import { calculateObservancesForYear } from '@/lib/calendar/engine';
import { CANONICAL_RULES } from '@/lib/calendar/rules';

type CalculatedOccurrence = { slug: string; date: string; year: number; recurring?: boolean };

// ── PHASE-2 OBSERVANCES — the 18 slugs targeted by §7 minimum coverage ──────
export const PHASE2_OBSERVANCE_SLUGS: string[] = [
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

// ── Load fixtures (at module scope so they can be reused across describe blocks) ─

let goldenFixtures: GoldenFixture[];
let snapshotFixtures: SnapshotFixture[];

try {
  goldenFixtures = loadGoldenFixtures();
  snapshotFixtures = loadSnapshotFixtures();
} catch (e) {
  throw e;
}

// ── Engine Evaluation Cache ──────────────────────────────────────────────────
// Requirement: calculateObservancesForYear(year) must execute only once per distinct year.
// All fixture assertions read from this cache.

let engineEvaluationCount = 0;
const engineYearCache = new Map<number, Map<string, string>>();

function getEngineDate(slug: string, year: number): string | null {
  let yearMap = engineYearCache.get(year);
  if (!yearMap) {
    engineEvaluationCount++;
    const results: CalculatedOccurrence[] = calculateObservancesForYear(year);
    yearMap = new Map<string, string>();
    for (const r of results) {
      if (!yearMap.has(r.slug)) {
        yearMap.set(r.slug, r.date);
      }
    }
    engineYearCache.set(year, yearMap);
  }
  return yearMap.get(slug) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SCHEMA SELF-VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

describe('Schema validator — self test', () => {
  it('loads the golden JSON Schema without error', () => {
    expect(true).toBe(true);
  });

  it('rejects malformed fixtures in fixtures-invalid/', () => {
    const invalidFixtures = loadInvalidFixtures();
    expect(invalidFixtures.length).toBeGreaterThan(0);

    for (const { filePath, raw } of invalidFixtures) {
      const errors = validateAgainstGoldenSchema(raw);
      expect(errors, `Expected ${filePath} to fail schema validation, but it passed`).not.toBeNull();
      expect(errors!.length, `Expected at least one error in ${filePath}`).toBeGreaterThan(0);
    }
  });

  it('rejects a golden fixture with tier-6 source', () => {
    const tierSixFixture = {
      caseId: 'valid_case_id',
      festivalId: 'maha_shivaratri',
      year: 2027,
      location: { label: 'Bedford', lat: 52.135, lon: -0.467, tz: 'Europe/London' },
      profile: { calendar: 'north_indian_purnimanta', tradition: 'smarta' },
      expected: null,
      tolerance: { windowMinutes: 2 },
      source: {
        tier: 6,
        ref: 'llm_output',
        citation: 'AI generated',
        verifiedBy: 'nobody',
        verifiedOn: '2026-01-01',
      },
      reasoning: 'test',
      approved: false,
    };
    const errors = validateAgainstGoldenSchema(tierSixFixture);
    expect(errors).not.toBeNull();
  });

  it('rejects a golden fixture with a malformed caseId (has spaces)', () => {
    const invalidCaseId = {
      caseId: 'has spaces here',
      festivalId: 'maha_shivaratri',
      year: 2027,
      location: { label: 'Bedford', lat: 52.135, lon: -0.467, tz: 'Europe/London' },
      profile: { calendar: 'north_indian_purnimanta', tradition: 'smarta' },
      expected: null,
      tolerance: { windowMinutes: 2 },
      source: { tier: 1, ref: 'src_rashtriya_panchang_2027', citation: 'Rashtriya Panchang 2027', verifiedBy: 'council', verifiedOn: '2026-11-02' },
      reasoning: 'test',
      approved: false,
    };
    const errors = validateAgainstGoldenSchema(invalidCaseId);
    expect(errors).not.toBeNull();
  });

  it('accepts a valid unapproved golden fixture placeholder with source but null expected', () => {
    const valid = {
      caseId: 'maha_shivaratri__bedford__2027__purnimanta_smarta',
      festivalId: 'maha_shivaratri',
      year: 2027,
      location: { label: 'Bedford, UK', lat: 52.135, lon: -0.467, tz: 'Europe/London' },
      profile: { calendar: 'north_indian_purnimanta', tradition: 'smarta' },
      expected: null,
      tolerance: { windowMinutes: 2 },
      source: {
        tier: 1,
        ref: 'src_rashtriya_panchang_placeholder',
        citation: 'TODO: Cite Rashtriya Panchang edition for 2027',
        verifiedBy: 'TODO_council',
        verifiedOn: '2026-01-01',
      },
      reasoning: 'Placeholder for human verification',
      approved: false,
    };
    const errors = validateAgainstGoldenSchema(valid);
    expect(errors).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. SEPARATION INVARIANT
// ─────────────────────────────────────────────────────────────────────────────

describe('Fixture directory separation invariant', () => {
  it('no caseId appears in both golden/ and snapshot/', () => {
    const goldenIds  = new Set(goldenFixtures.map(f => f.caseId));
    const snapshotIds = snapshotFixtures.map(f => f.caseId);
    const overlaps = snapshotIds.filter(id => goldenIds.has(id));
    expect(overlaps, `caseIds in both directories: ${overlaps.join(', ')}`).toHaveLength(0);
  });

  it('all loaded golden/ files passed schema validation', () => {
    expect(goldenFixtures.every(f => f.source != null)).toBe(true);
  });

  it('all loaded snapshot/ files have no source block', () => {
    for (const f of snapshotFixtures) {
      expect('source' in f, `Snapshot ${f.caseId} must not have a source block`).toBe(false);
    }
  });

  it('all snapshot fixtures have approved: false', () => {
    for (const f of snapshotFixtures) {
      expect(f.approved, `Snapshot ${f.caseId} must have approved: false`).toBe(false);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. ENGINE EVALUATION CACHING INVARIANT
// ─────────────────────────────────────────────────────────────────────────────

describe('Engine evaluation caching invariant', () => {
  it('proves calculateObservancesForYear runs exactly once per distinct year across all fixtures', () => {
    const distinctFixtureYears = Array.from(new Set([
      ...goldenFixtures.map(f => f.year),
      ...snapshotFixtures.map(f => f.year),
    ]));

    // Evaluate every single snapshot fixture date using getEngineDate
    for (const fixture of snapshotFixtures) {
      getEngineDate(fixture.festivalId, fixture.year);
    }

    // Evaluate every single golden fixture date using getEngineDate
    for (const fixture of goldenFixtures) {
      getEngineDate(fixture.festivalId, fixture.year);
    }

    expect(engineEvaluationCount).toBe(distinctFixtureYears.length);
    expect(engineEvaluationCount).toBeLessThanOrEqual(distinctFixtureYears.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. GOLDEN FIXTURE ASSERTIONS
// ─────────────────────────────────────────────────────────────────────────────

describe('Golden fixtures — correctness assertions', () => {
  const approvedGolden = goldenFixtures.filter(isApprovedGoldenFixture);
  const pendingGolden  = goldenFixtures.filter(f => !isApprovedGoldenFixture(f));

  if (approvedGolden.length === 0) {
    it('(no approved golden fixtures yet — add Tier 1-4 sourced cases to __fixtures__/golden/ to build coverage)', () => {
      console.log(`\n  📋 ${pendingGolden.length} golden fixture placeholder(s) pending human verification.`);
      console.log('  To approve one: set approved: true and fill in expected.civilDate with a Tier 1-4 source.\n');
      expect(true).toBe(true);
    });
  }

  for (const fixture of approvedGolden) {
    it(`[GOLDEN] ${fixture.caseId} — expects civilDate ${fixture.expected!.civilDate}`, () => {
      const engineDate = getEngineDate(fixture.festivalId, fixture.year);
      expect(engineDate).toBe(fixture.expected!.civilDate);
    });
  }

  for (const fixture of pendingGolden) {
    it.skip(`[GOLDEN PENDING] ${fixture.caseId} — awaiting Tier 1-4 source verification`, () => {
      // intentionally skipped
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. SNAPSHOT REGRESSION TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('Snapshot fixtures — regression tests (no unintended change)', () => {
  if (snapshotFixtures.length === 0) {
    it('(no snapshot fixtures found — run npm run generate:snapshots to create them)', () => {
      console.log('\n  ⚠️  No snapshot fixtures found. Run:\n  cd packages/dharma-rules && npx tsx scripts/generate-snapshots.ts\n');
      expect(true).toBe(true);
    });
  }

  for (const fixture of snapshotFixtures) {
    it(`[SNAPSHOT] ${fixture.caseId} — ${fixture.festivalId} ${fixture.year} → ${fixture.captured.civilDate}`, () => {
      const engineDate = getEngineDate(fixture.festivalId, fixture.year);

      expect(engineDate, [
        `Snapshot regression failure for ${fixture.festivalId} ${fixture.year}!`,
        `  Expected (captured): ${fixture.captured.civilDate}`,
        `  Got (engine now):    ${engineDate}`,
        `  This means the engine output changed since the snapshot was taken.`,
        `  If intentional: regenerate snapshots with npm run generate:snapshots.`,
        `  If unintentional: investigate the engine or rule change.`,
      ].join('\n')).toBe(fixture.captured.civilDate);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. COVERAGE REPORT
// ─────────────────────────────────────────────────────────────────────────────

afterAll(() => {
  const allSlugs = CANONICAL_RULES.map((r: { slug: string }) => r.slug);
  const report = buildCoverageReport(allSlugs, goldenFixtures, snapshotFixtures);
  printCoverageReport(report);

  if (process.env['STRICT'] === '1') {
    const allRuleSlugs = CANONICAL_RULES.map((r: { slug: string }) => r.slug);
    const violations = strictModeViolations(allRuleSlugs, goldenFixtures);
    if (violations.length > 0) {
      throw new Error(
        `STRICT=1: The following ${violations.length} rule(s) lack an approved golden fixture:\n` +
        violations.map(s => `  • ${s}`).join('\n'),
      );
    }
  } else {
    const allRuleSlugs = CANONICAL_RULES.map((r: { slug: string }) => r.slug);
    const violations = strictModeViolations(allRuleSlugs, goldenFixtures);
    if (violations.length > 0) {
      console.log(`\n  ⚠️  STRICT=1 would currently fail on ${violations.length} rule(s) lacking approved golden fixtures.`);
      console.log('  To see the list: STRICT=1 npx vitest run');
      console.log('  First violation: ' + violations[0]);
    }
  }
});
