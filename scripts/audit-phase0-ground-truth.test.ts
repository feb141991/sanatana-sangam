/**
 * Regression coverage for the two contract defects a review found in the
 * Phase 0 ground-truth audit before it was treated as a migration baseline:
 *
 * 1. classifyOccurrence resolved deferred status at the SLUG level only --
 *    a slug with one included and one deferred variant was reported as
 *    ordinary rule_backed even when the stored row belonged to the
 *    deferred variant, because the query never fetched variant_key/
 *    spiritual_tradition to check which variant a row actually was.
 * 2. The "no rule" bucket was reported as manual_seed_legacy purely from
 *    "no rule exists," never checking that calculated_by was actually
 *    'legacy_sync' -- an unruled row from ANY other writer would have been
 *    misreported as if it came from that specific legacy mechanism.
 *
 * Run: npx tsx --test scripts/audit-phase0-ground-truth.test.ts
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyOccurrence, type OccurrenceRow, type Rule } from './audit-phase0-ground-truth';

function occ(overrides: Partial<OccurrenceRow> = {}): OccurrenceRow {
  return {
    definition_id: 'def-1',
    calculated_by: null,
    variant_key: null,
    spiritual_tradition: null,
    ...overrides,
  };
}

test('resolves a row to its INCLUDED variant when a slug has both included and deferred variants', () => {
  const rules: Rule[] = [
    { slug: 'x', launch_status: 'included', variant_key: 'smarta' },
    { slug: 'x', launch_status: 'deferred', variant_key: 'regional' },
  ];
  assert.equal(classifyOccurrence(occ({ variant_key: 'smarta' }), rules), 'rule_backed');
});

test('resolves a row to its DEFERRED variant when a slug has both included and deferred variants -- the exact case the slug-level check missed', () => {
  const rules: Rule[] = [
    { slug: 'x', launch_status: 'included', variant_key: 'smarta' },
    { slug: 'x', launch_status: 'deferred', variant_key: 'regional' },
  ];
  assert.equal(classifyOccurrence(occ({ variant_key: 'regional' }), rules), 'deferred_rule_backed_but_published');
});

test('falls back to spiritual_tradition when variant_key is present but generic/non-matching -- not a combined || value', () => {
  // The exact case an earlier version of this line missed:
  // `occ.variant_key || occ.spiritual_tradition` picks variant_key here
  // (it's truthy) and never tries spiritual_tradition at all, even though
  // spiritual_tradition alone matches a real rule variant exactly.
  const rules: Rule[] = [
    { slug: 'x', launch_status: 'included', sampradaya: 'smarta_nishita' },
    { slug: 'x', launch_status: 'deferred', sampradaya: 'gaudiya_iskcon' },
  ];
  const result = classifyOccurrence(
    occ({ variant_key: 'legacy-default', spiritual_tradition: 'smarta_nishita' }),
    rules,
  );
  assert.equal(result, 'rule_backed');
});

test('flags ambiguous-and-deferred-risk, never silently rule_backed, when the row cannot be matched to a specific variant and one variant is deferred', () => {
  const rules: Rule[] = [
    { slug: 'x', launch_status: 'included', variant_key: 'smarta' },
    { slug: 'x', launch_status: 'deferred', variant_key: 'regional' },
  ];
  // variant_key on the row doesn't match either rule's variant_key -- e.g. a
  // generic 'legacy-default' value on a genuinely multi-variant rule.
  assert.equal(classifyOccurrence(occ({ variant_key: 'legacy-default' }), rules), 'ambiguous_variant_deferred_risk');
});

test('reports unruled_published_other_provenance for an unruled row NOT written by legacy_sync', () => {
  assert.equal(classifyOccurrence(occ({ calculated_by: 'manual_engine_run_v2' }), []), 'unruled_published_other_provenance');
});

test('reports unruled_published_legacy_sync_confirmed only for a TRUE legacy_sync unruled row', () => {
  assert.equal(classifyOccurrence(occ({ calculated_by: 'legacy_sync' }), []), 'unruled_published_legacy_sync_confirmed');
});

test('classifies a single-variant deferred rule directly, no ambiguity possible', () => {
  const rules: Rule[] = [{ slug: 'x', launch_status: 'deferred' }];
  assert.equal(classifyOccurrence(occ(), rules), 'deferred_rule_backed_but_published');
});

test('classifies a single-variant included rule directly, no ambiguity possible', () => {
  const rules: Rule[] = [{ slug: 'x', launch_status: 'included' }];
  assert.equal(classifyOccurrence(occ(), rules), 'rule_backed');
});
