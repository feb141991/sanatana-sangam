/**
 * coverage-reporter.ts
 *
 * Produces a coverage report showing which observance definitions have:
 *   A) approved golden coverage (correctness verified against a Tier 1-4 source)
 *   B) pending golden intake placeholders (unapproved, expected=null)
 *   C) snapshot only (current behaviour captured as D3/D5 tripwires)
 *   D) none
 *
 * Vocabulary:
 *   - Golden coverage requires approved=true, non-null expected civilDate, and Tier 1-4 source.
 *   - Unapproved placeholders are intake items, NOT golden coverage.
 *   - Snapshot fixtures contain 972 assertions, representing 54 independent engine values
 *     (18 slugs × 3 years; locations/profiles are tripwires for D3/D5 per-location evaluation).
 */

import { GoldenFixture, SnapshotFixture } from './fixture-loader.js';

export type CoverageLevel = 'golden' | 'pending_golden' | 'snapshot_only' | 'none';

export function isApprovedGoldenFixture(f: GoldenFixture): boolean {
  return (
    f.approved === true &&
    typeof f.expected?.civilDate === 'string' &&
    f.expected.civilDate.length > 0 &&
    f.source != null &&
    f.source.tier >= 1 &&
    f.source.tier <= 4
  );
}

export interface ObservanceCoverage {
  slug: string;
  displayName?: string;
  coverage: CoverageLevel;
  approvedGoldenCount: number;
  pendingGoldenCount: number;
  snapshotCount: number;
  approvedGoldenYears: number[];
  pendingGoldenYears: number[];
  snapshotYears: number[];
}

export interface CoverageReport {
  generatedAt: string;
  totalObservances: number;
  withApprovedGolden: number;
  withPendingGoldenOnly: number;
  withSnapshotOnly: number;
  withNothing: number;
  approvedGoldenCases: number;
  pendingGoldenCases: number;
  snapshotCases: number;
  independentEngineValuesCount: number;
  rows: ObservanceCoverage[];
}

export function buildCoverageReport(
  allSlugs: string[],
  goldenFixtures: GoldenFixture[],
  snapshotFixtures: SnapshotFixture[],
): CoverageReport {
  const goldenBySlugsMap = new Map<string, GoldenFixture[]>();
  const snapshotBySlugsMap = new Map<string, SnapshotFixture[]>();

  for (const f of goldenFixtures) {
    const arr = goldenBySlugsMap.get(f.festivalId) ?? [];
    arr.push(f);
    goldenBySlugsMap.set(f.festivalId, arr);
  }

  for (const f of snapshotFixtures) {
    const arr = snapshotBySlugsMap.get(f.festivalId) ?? [];
    arr.push(f);
    snapshotBySlugsMap.set(f.festivalId, arr);
  }

  const rows: ObservanceCoverage[] = allSlugs.map(slug => {
    const goldenList   = goldenBySlugsMap.get(slug) ?? [];
    const snapshotList = snapshotBySlugsMap.get(slug) ?? [];

    const approvedGolden = goldenList.filter(isApprovedGoldenFixture);
    const pendingGolden  = goldenList.filter(f => !isApprovedGoldenFixture(f));

    let coverage: CoverageLevel;
    if (approvedGolden.length > 0) {
      coverage = 'golden';
    } else if (pendingGolden.length > 0) {
      coverage = 'pending_golden';
    } else if (snapshotList.length > 0) {
      coverage = 'snapshot_only';
    } else {
      coverage = 'none';
    }

    const approvedYears = Array.from(new Set(approvedGolden.map(f => f.year))).sort((a, b) => a - b);
    const pendingYears  = Array.from(new Set(pendingGolden.map(f => f.year))).sort((a, b) => a - b);
    const snapshotYears = Array.from(new Set(snapshotList.map(f => f.year))).sort((a, b) => a - b);

    return {
      slug,
      coverage,
      approvedGoldenCount: approvedGolden.length,
      pendingGoldenCount: pendingGolden.length,
      snapshotCount: snapshotList.length,
      approvedGoldenYears: approvedYears,
      pendingGoldenYears: pendingYears,
      snapshotYears,
    };
  });

  const withApprovedGolden    = rows.filter(r => r.coverage === 'golden').length;
  const withPendingGoldenOnly = rows.filter(r => r.coverage === 'pending_golden').length;
  const withSnapshotOnly      = rows.filter(r => r.coverage === 'snapshot_only').length;
  const withNothing           = rows.filter(r => r.coverage === 'none').length;

  const approvedGoldenCases = goldenFixtures.filter(isApprovedGoldenFixture).length;
  const pendingGoldenCases  = goldenFixtures.length - approvedGoldenCases;
  const snapshotCases       = snapshotFixtures.length;

  // Compute distinct (slug, year) combinations in snapshot fixtures
  const independentValues = new Set(snapshotFixtures.map(f => `${f.festivalId}__${f.year}`)).size;

  return {
    generatedAt: new Date().toISOString(),
    totalObservances: allSlugs.length,
    withApprovedGolden,
    withPendingGoldenOnly,
    withSnapshotOnly,
    withNothing,
    approvedGoldenCases,
    pendingGoldenCases,
    snapshotCases,
    independentEngineValuesCount: independentValues,
    rows,
  };
}

/** Pretty-print the coverage report to console. */
export function printCoverageReport(report: CoverageReport): void {
  const COL_SLUG    = 34;
  const COL_COV     = 18;
  const COL_APP     = 7;
  const COL_PEND    = 7;
  const COL_SNAP    = 7;
  const COL_YEARS   = 18;

  const pad = (s: string, n: number) => s.slice(0, n).padEnd(n);
  const line = (cols: string[]) => console.log(cols.join(' │ '));
  const hr   = () => console.log('─'.repeat(COL_SLUG + COL_COV + COL_APP + COL_PEND + COL_SNAP + COL_YEARS + 20));

  console.log('\n');
  console.log('═'.repeat(105));
  console.log('  CALENDAR FIXTURE COVERAGE REPORT');
  console.log(`  Generated: ${report.generatedAt}`);
  console.log('═'.repeat(105));
  console.log(`  Total observances tracked        : ${report.totalObservances}`);
  console.log(`  ✅ Approved golden (sourced)      : ${report.withApprovedGolden}`);
  console.log(`  📋 Pending intake placeholders    : ${report.withPendingGoldenOnly}`);
  console.log(`  📸 Snapshot only (current engine) : ${report.withSnapshotOnly}`);
  console.log(`  ❌ No coverage at all            : ${report.withNothing}`);
  console.log('── FIXTURE METRICS ──────────────────────────────────────────────────────────────────────');
  console.log(`  Approved golden cases (sourced)  : ${report.approvedGoldenCases}`);
  console.log(`  Pending intake placeholders      : ${report.pendingGoldenCases}`);
  console.log(`  Snapshot assertion files         : ${report.snapshotCases}`);
  console.log(`  Independent engine values        : ${report.independentEngineValuesCount} (18 slugs × 3 years; locs/profiles are D3/D5 tripwires)`);
  console.log('─'.repeat(105));

  hr();
  line([
    pad('slug', COL_SLUG),
    pad('coverage status', COL_COV),
    pad('golden', COL_APP),
    pad('pend', COL_PEND),
    pad('snap', COL_SNAP),
    pad('snapshot years', COL_YEARS),
  ]);
  hr();

  for (const row of report.rows) {
    let icon = '❌';
    let label = 'none';

    if (row.coverage === 'golden') {
      icon = '✅';
      label = 'approved_golden';
    } else if (row.coverage === 'pending_golden') {
      icon = '📋';
      label = 'pending_golden';
    } else if (row.coverage === 'snapshot_only') {
      icon = '📸';
      label = 'snapshot_only';
    }

    line([
      pad(row.slug, COL_SLUG),
      pad(`${icon} ${label}`, COL_COV),
      pad(String(row.approvedGoldenCount), COL_APP),
      pad(String(row.pendingGoldenCount), COL_PEND),
      pad(String(row.snapshotCount), COL_SNAP),
      pad(row.snapshotYears.join(', '), COL_YEARS),
    ]);
  }

  hr();
  console.log('\n');
}

/**
 * STRICT mode: list every approved rule that lacks a golden fixture.
 * Wire to FAILING CI with STRICT=1.
 */
export function strictModeViolations(
  approvedRuleSlugs: string[],
  goldenFixtures: GoldenFixture[],
): string[] {
  const slugsWithApprovedGolden = new Set(
    goldenFixtures.filter(isApprovedGoldenFixture).map(f => f.festivalId),
  );
  return approvedRuleSlugs.filter(slug => !slugsWithApprovedGolden.has(slug));
}
