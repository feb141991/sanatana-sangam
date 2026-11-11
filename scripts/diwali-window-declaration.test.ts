import assert from 'node:assert/strict';
import test from 'node:test';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';

test('Diwali children have explicit proposed windows without changing active offsets', () => {
  for (const slug of ['dhanteras', 'govardhan-puja', 'bhai-dooj']) {
    const rule = CANONICAL_RULES.find((candidate) => candidate.slug === slug);
    assert.ok(rule?.date_assignment, slug);
    assert.equal(rule.date_assignment?.status, 'proposed', slug);
    assert.equal(rule.date_assignment?.basis, 'lunar_tithi', slug);
    assert.equal(rule.date_assignment?.tie_break, 'first_qualifying_date', slug);
    assert.equal(rule.relation?.status, 'proposed', slug);
  }
});
