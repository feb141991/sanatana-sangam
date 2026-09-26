import { describe, it, expect } from 'vitest';
import { CANONICAL_RULES } from '../rules';
import { calculateObservancesForYear } from '../engine';

/**
 * Baseline tripwire (docs/REVIEW_CHECKLIST.md #3.8 pattern), not a pass/fail
 * content gate. Confirmed 2026-09-24 via
 * scripts/audit-rule-approval-and-source-evidence.ts -- see
 * docs/audits/rule-approval-and-source-evidence-2026-09-24/receipt.json.
 *
 * These numbers are expected to CHANGE as scholar/product work classifies
 * more rules and sources more citations -- a change here is real progress
 * or a real regression, not drift to silently absorb. When this test goes
 * red, re-run the audit script, update the expected numbers, and say in the
 * commit message which rules moved and why (mirroring the harness
 * 988->574 reconciliation in CALENDAR_ENGINE_ASSESSMENT.md #3.8).
 */
describe('rule approval / source-evidence baseline (tripwire, not a content gate)', () => {
  it('derivability classification counts', () => {
    const counts = { explicit: 0, implicitDefault: 0, requiresTraditionProfile: 0, externallyCurated: 0 };
    for (const r of CANONICAL_RULES) {
      if (r.derivability === 'requires_tradition_profile') counts.requiresTraditionProfile++;
      else if (r.derivability === 'externally_curated') counts.externallyCurated++;
      else if (r.derivability === 'computed') counts.explicit++;
      else counts.implicitDefault++;
    }
    expect(counts).toEqual({
      explicit: 0,
      implicitDefault: 115,
      requiresTraditionProfile: 1,
      externallyCurated: 1,
    });
  });

  it('the two blocked rules are exactly pavarana-end-of-vassa and kathina', () => {
    const blocked = CANONICAL_RULES
      .filter((r) => r.derivability === 'requires_tradition_profile' || r.derivability === 'externally_curated')
      .map((r) => r.slug)
      .sort();
    expect(blocked).toEqual(['kathina', 'pavarana-end-of-vassa']);
  });

  // Behavioral proof, not just a data check: the derivability gate
  // (engine.ts:176) must actually exclude these two from the engine's real
  // computed output, in the actual production entry point -- not just be
  // classified correctly in rules.json. One real year, not two -- a second
  // year added rigor but roughly doubled this already-expensive
  // (full-astronomy, ~100s+) test's cost; confirmed it pushed this test
  // over even a 240s budget when run alongside the rest of the suite under
  // load. One year is already non-vacuous (see the both-directions check
  // below) and is the same scope materialize-commit.test.ts's own
  // full-year integration test uses.
  it('the two blocked rules never appear in calculateObservancesForYear output (fail-closed, both directions)', () => {
    const occurrences2026 = calculateObservancesForYear(2026);
    for (const occ of occurrences2026) {
      expect(occ.slug).not.toBe('pavarana-end-of-vassa');
      expect(occ.slug).not.toBe('kathina');
    }
    // "Both directions" (#3.3): confirm the assertion above could actually
    // fail -- a rule that's ALLOWED through (derivability 'computed'/
    // undefined) genuinely does appear, proving this isn't vacuously true
    // because the whole engine call returned nothing.
    expect(occurrences2026.length).toBeGreaterThan(0);
  }, 240000);

  it('included rules missing a citation', () => {
    const included = CANONICAL_RULES.filter((r) => r.launch_status === 'included');
    const missing = included.filter((r) => !r.citation);
    expect(included.length).toBe(70);
    expect(missing.length).toBe(57);
  });
});
