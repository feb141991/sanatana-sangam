import assert from 'node:assert/strict';
import test from 'node:test';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';

test('Dhanteras keeps its explicit proposed window and Diwali offset', () => {
  const rule = CANONICAL_RULES.find((candidate) => candidate.slug === 'dhanteras');
  assert.ok(rule?.date_assignment);
  assert.equal(rule.date_assignment?.status, 'proposed');
  assert.equal(rule.date_assignment?.basis, 'lunar_tithi');
  assert.equal(rule.date_assignment?.tie_break, 'first_qualifying_date');
  assert.equal(rule.relation?.status, 'proposed');
});

test('Govardhan Puja and Bhai Dooj are founder-approved udaya-tithi rules, not Diwali offsets', () => {
  const expected: Record<string, number> = { 'govardhan-puja': 1, 'bhai-dooj': 2 };
  for (const [slug, tithi] of Object.entries(expected)) {
    const rule = CANONICAL_RULES.find((candidate) => candidate.slug === slug);
    assert.ok(rule, slug);
    assert.equal(rule.rule_family, 'lunar_tithi', slug);
    assert.equal(rule.relation, undefined, slug);
    assert.equal(rule.relative_base_slug, undefined, slug);
    assert.equal(rule.corrected_lunar_masa_name, 'Kartika', slug);
    assert.equal(rule.corrected_month_system, 'amanta', slug);
    assert.equal(rule.lunar_tithi_index, tithi, slug);
    assert.equal(rule.date_assignment?.status, 'founder_approved', slug);
    assert.equal(rule.date_assignment?.lunar_month, 'Kartika', slug);
    assert.equal(rule.date_assignment?.period, 'sunrise', slug);
    assert.equal(rule.date_assignment?.mode, 'at', slug);
  }
});
