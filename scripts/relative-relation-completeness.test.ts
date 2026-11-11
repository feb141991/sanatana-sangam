import assert from 'node:assert/strict';
import test from 'node:test';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';

test('every relative rule has a declared relation category', () => {
  const relative = CANONICAL_RULES.filter((rule) => rule.rule_family === 'relative_to_other_observance');
  assert.equal(relative.length, 35);
  for (const rule of relative) {
    assert.ok(rule.relation, `${rule.slug} has no relation declaration`);
    assert.equal(rule.relation?.parent_slug, rule.relative_base_slug, rule.slug);
    assert.equal(rule.relation?.offset_days, rule.relative_offset_days, rule.slug);
  }
});
