import assert from 'node:assert/strict';
import test from 'node:test';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';

test('declared series relations match legacy relative fields', () => {
  const children = CANONICAL_RULES.filter((rule) => rule.relation?.kind === 'series_child');
  assert.equal(children.length, 19);
  for (const rule of children) {
    assert.equal(rule.relation?.status, 'declared', rule.slug);
    assert.equal(rule.relation?.parent_slug, rule.relative_base_slug, rule.slug);
    assert.equal(rule.relation?.offset_days, rule.relative_offset_days, rule.slug);
  }
});
