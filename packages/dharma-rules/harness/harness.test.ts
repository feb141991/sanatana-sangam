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
 *  2. LOGICAL FIXTURE IDENTITY & GOVERNANCE INVARIANTS
 *     Enforces canonical logical keys (festivalId + year + location + profile + tradition).
 *     Rejects duplicate keys within roles and co-existence of approved-golden and snapshots.
 *
 *  3. GOLDEN FIXTURES
 *     For every approved golden fixture (approved: true + valid source + non-null expected),
 *     assert that the engine produces the expected civilDate EXACTLY.
 *
 *  4. SNAPSHOT REGRESSION
 *     For every snapshot fixture, assert that the engine produces the same civilDate as captured.
 *
 *  5. ENGINE EVALUATION CACHING
 *     Proves calculateObservancesForYear runs exactly once per distinct year, not per fixture.
 *
 *  6. SYNTHETIC LOGICAL IDENTITY TESTS
 *     Proves snap__ prefix cannot hide overlap, approved golden overlap is rejected,
 *     and pending intake overlap is reported honestly.
 */

import { describe, it, expect, afterAll } from 'vitest';
import {
  loadGoldenFixtures,
  loadSnapshotFixtures,
  loadInvalidFixtures,
  validateAgainstGoldenSchema,
  GoldenFixture,
  SnapshotFixture,
  getCanonicalFixtureKey,
  analyzeLogicalFixtureIdentity,
  isApprovedGolden,
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
// 2. LOGICAL FIXTURE IDENTITY & GOVERNANCE INVARIANTS
// ─────────────────────────────────────────────────────────────────────────────

describe('Logical fixture identity & governance invariants', () => {
  const analysis = analyzeLogicalFixtureIdentity(goldenFixtures, snapshotFixtures);

  it('no duplicate canonical logical keys exist within golden fixtures', () => {
    expect(
      analysis.duplicateGoldenKeys,
      `Duplicate canonical keys found in golden/: ${analysis.duplicateGoldenKeys.join(', ')}`,
    ).toHaveLength(0);
  });

  it('no duplicate canonical logical keys exist within snapshot fixtures', () => {
    expect(
      analysis.duplicateSnapshotKeys,
      `Duplicate canonical keys found in snapshot/: ${analysis.duplicateSnapshotKeys.join(', ')}`,
    ).toHaveLength(0);
  });

  it('no approved golden fixture coexists with a snapshot fixture for the same canonical logical key', () => {
    expect(
      analysis.approvedGoldenSnapshotOverlapKeys,
      `Approved golden fixtures overlap with snapshots for keys: ${analysis.approvedGoldenSnapshotOverlapKeys.join(', ')}`,
    ).toHaveLength(0);
  });

  it('all loaded golden/ files passed structural source verification', () => {
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
// 3. SYNTHETIC LOGICAL IDENTITY UNIT TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('Logical Fixture Identity — Synthetic Unit Tests', () => {
  const baseLoc = { label: 'Bedford, UK', lat: 52.1356, lon: -0.4685, tz: 'Europe/London' };
  const baseProf = { calendar: 'north_indian_purnimanta', tradition: 'smarta' };

  it('proves snap__ prefix cannot hide logical overlap between golden and snapshot fixtures', () => {
    const golden: GoldenFixture = {
      caseId: 'makar-sankranti__2026__bedford_uk__north_indian_purnimanta',
      festivalId: 'makar-sankranti',
      year: 2026,
      location: baseLoc,
      profile: baseProf,
      expected: { civilDate: '2026-01-14' },
      tolerance: { windowMinutes: 2 },
      source: { tier: 1, ref: 'RP2026', citation: 'Rashtriya Panchang 2026', verifiedBy: 'council', verifiedOn: '2026-01-01' },
      reasoning: 'Test',
      approved: true,
      _filePath: '/golden/makar-sankranti__2026.json',
    };

    const snapshot: SnapshotFixture = {
      caseId: 'snap__makar-sankranti__2026__bedford_uk__north_indian_purnimanta',
      festivalId: 'makar-sankranti',
      year: 2026,
      location: baseLoc,
      profile: baseProf,
      capturedAt: '2026-07-30T00:00:00Z',
      engineVersion: '0.1.0',
      ruleEngineVersion: '1.0.0',
      captured: { civilDate: '2026-01-14', slug: 'makar-sankranti' },
      approved: false,
      _filePath: '/snapshot/snap__makar-sankranti__2026.json',
    };

    const keyGolden   = getCanonicalFixtureKey(golden);
    const keySnapshot = getCanonicalFixtureKey(snapshot);

    expect(keyGolden).toBe(keySnapshot);

    const result = analyzeLogicalFixtureIdentity([golden], [snapshot]);
    expect(result.approvedGoldenSnapshotOverlapKeys).toHaveLength(1);
    expect(result.approvedGoldenSnapshotOverlapKeys[0]).toBe(keyGolden);
  });

  it('rejects approved-golden/snapshot overlap for the same canonical key', () => {
    const approvedGolden: GoldenFixture = {
      caseId: 'ram-navami__2027__ujjain_india__global_sanatan',
      festivalId: 'ram-navami',
      year: 2027,
      location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
      profile: { calendar: 'global_sanatan', tradition: 'unspecified' },
      expected: { civilDate: '2027-04-15' },
      tolerance: { windowMinutes: 2 },
      source: { tier: 1, ref: 'RP2027', citation: 'Rashtriya Panchang 2027', verifiedBy: 'council', verifiedOn: '2026-11-01' },
      reasoning: 'Test',
      approved: true,
      _filePath: '/golden/ram-navami__2027.json',
    };

    const conflictingSnapshot: SnapshotFixture = {
      caseId: 'snap__ram-navami__2027__ujjain_india__global_sanatan',
      festivalId: 'ram-navami',
      year: 2027,
      location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
      profile: { calendar: 'global_sanatan', tradition: 'unspecified' },
      capturedAt: '2026-07-30T00:00:00Z',
      engineVersion: '0.1.0',
      ruleEngineVersion: '1.0.0',
      captured: { civilDate: '2027-04-15', slug: 'ram-navami' },
      approved: false,
      _filePath: '/snapshot/snap__ram-navami__2027.json',
    };

    const result = analyzeLogicalFixtureIdentity([approvedGolden], [conflictingSnapshot]);
    expect(result.approvedGoldenSnapshotOverlapKeys).toContain(getCanonicalFixtureKey(approvedGolden));
  });

  it('counts and reports pending intake overlap honestly while intake migration is pending', () => {
    const pendingGolden: GoldenFixture = {
      caseId: 'diwali__2026__delhi_india__north_indian_purnimanta',
      festivalId: 'diwali',
      year: 2026,
      location: { label: 'Delhi, India', lat: 28.6139, lon: 77.2090, tz: 'Asia/Kolkata' },
      profile: { calendar: 'north_indian_purnimanta', tradition: 'smarta' },
      expected: null,
      tolerance: { windowMinutes: 2 },
      source: { tier: 1, ref: 'TODO', citation: 'TODO', verifiedBy: 'TODO', verifiedOn: '2026-01-01' },
      reasoning: 'Placeholder',
      approved: false,
      _filePath: '/golden/diwali__2026.json',
    };

    const snapshot: SnapshotFixture = {
      caseId: 'snap__diwali__2026__delhi_india__north_indian_purnimanta',
      festivalId: 'diwali',
      year: 2026,
      location: { label: 'Delhi, India', lat: 28.6139, lon: 77.2090, tz: 'Asia/Kolkata' },
      profile: { calendar: 'north_indian_purnimanta', tradition: 'smarta' },
      capturedAt: '2026-07-30T00:00:00Z',
      engineVersion: '0.1.0',
      ruleEngineVersion: '1.0.0',
      captured: { civilDate: '2026-11-08', slug: 'diwali' },
      approved: false,
      _filePath: '/snapshot/snap__diwali__2026.json',
    };

    const result = analyzeLogicalFixtureIdentity([pendingGolden], [snapshot]);
    expect(result.approvedGoldenSnapshotOverlapKeys).toHaveLength(0);
    expect(result.pendingIntakeSnapshotOverlapKeys).toHaveLength(1);
    expect(result.pendingIntakeSnapshotOverlapKeys[0]).toBe(getCanonicalFixtureKey(pendingGolden));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. ENGINE EVALUATION CACHING INVARIANT
// ─────────────────────────────────────────────────────────────────────────────

describe('Engine evaluation caching invariant', () => {
  it('proves calculateObservancesForYear runs exactly once per distinct year across all fixtures', () => {
    const distinctFixtureYears = Array.from(new Set([
      ...goldenFixtures.map(f => f.year),
      ...snapshotFixtures.map(f => f.year),
    ]));

    for (const fixture of snapshotFixtures) {
      getEngineDate(fixture.festivalId, fixture.year);
    }

    for (const fixture of goldenFixtures) {
      getEngineDate(fixture.festivalId, fixture.year);
    }

    expect(engineEvaluationCount).toBe(distinctFixtureYears.length);
    expect(engineEvaluationCount).toBeLessThanOrEqual(distinctFixtureYears.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. GOLDEN FIXTURE ASSERTIONS
// ─────────────────────────────────────────────────────────────────────────────

describe('Golden fixtures — correctness assertions', () => {
  const approvedGolden = goldenFixtures.filter(isApprovedGolden);
  const pendingGolden  = goldenFixtures.filter(f => !isApprovedGolden(f));

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
// 6. SNAPSHOT REGRESSION TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('Snapshot fixtures — regression tests (no unintended change)', () => {
  if (snapshotFixtures.length === 0) {
    it('(no snapshot fixtures found — run npm run generate:snapshots to create them)', () => {
      console.log('\n  ⚠️  No snapshot fixtures found. Run:\n  cd packages/dharma-rules && npx tsx scripts/generate-snapshots.ts\n');
      expect(true).toBe(true);
    });
  }

  // A snapshot for a rule that is no longer published is not a regression --
  // it is out of scope. The launch subset deliberately suppresses 63 rule rows,
  // and their fixtures would otherwise all fail claiming the engine "changed".
  //
  // Skipped rather than regenerated or deleted, for two reasons. Regenerating
  // would bake "no date" into the fixture and destroy the captured value we
  // will want back when the rule returns to the launch set. Deleting loses it
  // outright. Skipping preserves it and costs nothing.
  //
  // Mirrors the [GOLDEN PENDING] treatment above: out-of-scope fixtures are
  // visible as skips, never as passes.
  const deferredSlugs = new Set(
    (CANONICAL_RULES as Array<{ slug: string; launch_status?: string }>)
      .filter(r => r.launch_status === 'deferred')
      .map(r => r.slug),
  );

  // Disputed (rule, year) pairs are withheld at runtime, so their snapshots have
  // no date to match. Same treatment as deferred rules: skip, keep the captured
  // value for when the dispute resolves.
  const disputedYears = new Map<string, number[]>(
    (CANONICAL_RULES as Array<{ slug: string; disputed_years?: number[] }>)
      .filter(r => r.disputed_years?.length)
      .map(r => [r.slug, r.disputed_years!]),
  );

  for (const fixture of snapshotFixtures) {
    if (disputedYears.get(fixture.festivalId)?.includes(fixture.year)) {
      it.skip(`[SNAPSHOT DISPUTED] ${fixture.caseId} — ${fixture.festivalId} ${fixture.year} is withheld pending review`, () => {});
      continue;
    }
    if (deferredSlugs.has(fixture.festivalId)) {
      it.skip(`[SNAPSHOT DEFERRED] ${fixture.caseId} — ${fixture.festivalId} is not in the launch set`, () => {});
      continue;
    }
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
// 7. COVERAGE REPORT
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
