import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { config as loadDotenv } from 'dotenv';
loadDotenv({ path: resolve(__dirname, '../.env.local') });

import {
  loadGoldenFixtures,
  loadSnapshotFixtures,
  loadCalendarProfileFixtureDefinitions,
  GoldenFixture,
  SnapshotFixture,
} from '../packages/dharma-rules/harness/fixture-loader';
import { calculateObservancesForYear } from '../src/lib/calendar/engine';
import { CANONICAL_RULES, evaluatorVariantToRuleQualifier } from '../src/lib/calendar/rules';
import { evaluateApprovedFixture } from '../src/lib/calendar/approved-fixture-engine';

export interface HarnessFailureDiagnostic {
  caseId: string;
  slug: string;
  year: number;
  location: { label?: string; lat?: number; lon?: number; tz?: string };
  profile: { calendar?: string | null; tradition?: string; variantKey?: string };
  sampradaya?: string | null;
  fixtureType: 'approved_golden' | 'snapshot' | 'invariant' | 'contract';
  expectedDate: string | null;
  actualDate: string | null;
  selectedRuleKey: string | null;
  candidateCount: number;
  ruleMatchesCount: number;
  sourceRefs: any[];
  reviewDecisionRef?: string | null;
  errorMessage: string;
  divergenceCommit?: string | null;
  classification:
    | 'stale_fixture'
    | 'missing_or_renamed_rule'
    | 'engine_regression'
    | 'intentional_ratified_change'
    | 'duplicate_identity'
    | 'unresolved';
  classificationReason: string;
}

async function runDiagnosis() {
  console.log('=== CALENDAR HARNESS FAILURE DIAGNOSIS (PHASE A) ===');

  const goldenFixtures: GoldenFixture[] = await loadGoldenFixtures();
  const snapshotFixtures: SnapshotFixture[] = loadSnapshotFixtures();
  const calendarProfileDefinitions = await loadCalendarProfileFixtureDefinitions();
  const calendarProfileBySlug = new Map(
    calendarProfileDefinitions.map(profile => [profile.slug, profile])
  );

  const engineYearCache = new Map<number, Map<string, string>>();
  function getEngineDate(slug: string, year: number): string | null {
    let yearMap = engineYearCache.get(year);
    if (!yearMap) {
      const results = calculateObservancesForYear(year);
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

  const failures: HarnessFailureDiagnostic[] = [];
  let totalEvaluated = 0;
  let passedCount = 0;
  let skippedCount = 0;

  // 1. Evaluate Approved Golden Fixtures
  const approvedGoldens = goldenFixtures.filter(f => f.approved && f.expected?.civilDate);
  console.log(`Auditing ${approvedGoldens.length} approved golden fixtures...`);

  for (const fixture of approvedGoldens) {
    totalEvaluated++;
    try {
      let monthSystem: 'amanta' | 'purnimanta' | null = null;
      if (fixture.profile.calendar !== null) {
        const profile = calendarProfileBySlug.get(fixture.profile.calendar);
        if (!profile || profile.scholarlyStatus !== 'approved' || !profile.monthSystem) {
          throw new Error(`Invalid/unapproved profile: ${fixture.profile.calendar}`);
        }
        monthSystem = profile.monthSystem as 'amanta' | 'purnimanta';
      }

      const evalResult = evaluateApprovedFixture(fixture, monthSystem);
      if (evalResult.civilDate !== fixture.expected?.civilDate) {
        throw new Error(`Date mismatch: expected ${fixture.expected?.civilDate}, got ${evalResult.civilDate}`);
      }
      passedCount++;
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      
      // Determine candidate count and matching rules
      const rawVariantKey = fixture.profile.variantKey?.trim() || null;
      const rawMatches = CANONICAL_RULES.filter(rule => {
        if (rule.slug !== fixture.festivalId) return false;
        const qualifier = rule.variant_key ?? rule.sampradaya ?? null;
        return rawVariantKey ? qualifier === rawVariantKey : qualifier === null;
      });

      // Classify failure
      let classification: HarnessFailureDiagnostic['classification'] = 'unresolved';
      let classificationReason = '';

      if (rawMatches.length === 0) {
        classification = 'missing_or_renamed_rule';
        classificationReason = `Found 0 matching rule rows for festivalId '${fixture.festivalId}' and qualifier '${rawVariantKey}'. Rule slug or variant may have diverged.`;
      } else if (rawMatches.length > 1) {
        classification = 'duplicate_identity';
        classificationReason = `Found ${rawMatches.length} matching rule rows. Ambiguous fixture matching.`;
      } else if (errorMsg.includes('expects') && errorMsg.includes('engine selected')) {
        classification = 'engine_regression';
        classificationReason = errorMsg;
      } else {
        classification = 'unresolved';
        classificationReason = errorMsg;
      }

      failures.push({
        caseId: fixture.caseId,
        slug: fixture.festivalId,
        year: fixture.year,
        location: fixture.location,
        profile: fixture.profile,
        sampradaya: (fixture as any).profile?.sampradaya ?? null,
        fixtureType: 'approved_golden',
        expectedDate: fixture.expected?.civilDate ?? null,
        actualDate: errorMsg.match(/engine selected (\d{4}-\d{2}-\d{2})/)?.[1] ?? null,
        selectedRuleKey: rawMatches[0]?.slug ?? null,
        candidateCount: rawMatches.length,
        ruleMatchesCount: rawMatches.length,
        sourceRefs: fixture.source ? [fixture.source] : [],
        reviewDecisionRef: fixture.caseId,
        errorMessage: errorMsg,
        classification,
        classificationReason,
      });
    }
  }

  // 2. Evaluate Snapshot Fixtures
  console.log(`Auditing ${snapshotFixtures.length} snapshot fixtures...`);
  const deferredSlugs = new Set(
    (CANONICAL_RULES as Array<{ slug: string; launch_status?: string }>)
      .filter(r => r.launch_status === 'deferred')
      .map(r => r.slug)
  );
  const disputedYears = new Map<string, number[]>(
    (CANONICAL_RULES as Array<{ slug: string; disputed_years?: number[] }>)
      .filter(r => r.disputed_years?.length)
      .map(r => [r.slug, r.disputed_years!])
  );

  for (const fixture of snapshotFixtures) {
    if (disputedYears.get(fixture.festivalId)?.includes(fixture.year)) {
      skippedCount++;
      continue;
    }
    if (deferredSlugs.has(fixture.festivalId)) {
      skippedCount++;
      continue;
    }
    totalEvaluated++;

    const engineDate = getEngineDate(fixture.festivalId, fixture.year);
    if (engineDate !== fixture.captured.civilDate) {
      let classification: HarnessFailureDiagnostic['classification'] = 'unresolved';
      let classificationReason = '';

      if (fixture.festivalId === 'dussehra' && fixture.year === 2026 && engineDate === '2026-10-21') {
        classification = 'intentional_ratified_change';
        classificationReason = 'Dussehra 2026 corrected to 2026-10-21 per Rashtriya Panchang Saka 1948 (p.7 Index #51: Vijaya Dasami). Snapshot has stale 2026-10-20.';
      } else {
        classification = 'engine_regression';
        classificationReason = `Engine output changed from captured ${fixture.captured.civilDate} to ${engineDate}.`;
      }

      failures.push({
        caseId: fixture.caseId,
        slug: fixture.festivalId,
        year: fixture.year,
        location: fixture.location,
        profile: fixture.profile,
        sampradaya: null,
        fixtureType: 'snapshot',
        expectedDate: fixture.captured.civilDate,
        actualDate: engineDate,
        selectedRuleKey: fixture.festivalId,
        candidateCount: 1,
        ruleMatchesCount: 1,
        sourceRefs: [],
        reviewDecisionRef: null,
        errorMessage: `Snapshot regression: captured ${fixture.captured.civilDate} vs engine ${engineDate}`,
        classification,
        classificationReason,
      });
    } else {
      passedCount++;
    }
  }

  console.log('\n=== STRUCTURED SUMMARY ===');
  console.log(`Total Fixtures Evaluated: ${totalEvaluated}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Failed: ${failures.length}`);

  console.log('\n=== FAILURES BY CLASSIFICATION ===');
  const grouped: Record<string, HarnessFailureDiagnostic[]> = {};
  for (const f of failures) {
    grouped[f.classification] = grouped[f.classification] || [];
    grouped[f.classification].push(f);
  }

  for (const [cls, list] of Object.entries(grouped)) {
    console.log(`\n[${cls.toUpperCase()}] (${list.length} cases):`);
    for (const item of list) {
      console.log(`  • Case ID: ${item.caseId}`);
      console.log(`    Slug: ${item.slug}, Year: ${item.year}, Profile: ${item.profile.calendar || 'none'}`);
      console.log(`    Expected: ${item.expectedDate}, Actual: ${item.actualDate}`);
      console.log(`    Error: ${item.errorMessage}`);
      console.log(`    Reason: ${item.classificationReason}`);
    }
  }

  // Output full structured JSON
  console.log('\n=== COMPLETE STRUCTURED JSON ===');
  console.log(JSON.stringify(failures, null, 2));
}

runDiagnosis().catch(err => {
  console.error('Fatal diagnostic error:', err);
  process.exit(1);
});
