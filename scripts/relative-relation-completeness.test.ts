import assert from 'node:assert/strict';
import test from 'node:test';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';

test('every relative rule has a declared relation category', () => {
  const relative = CANONICAL_RULES.filter((rule) => rule.rule_family === 'relative_to_other_observance');
  // 35 -> 33 -> 30: Anant Chaturdashi, Kartik Purnima and Mahalaya Amavasya became lunar_tithi rules (2026-11-17, commit 3dfc35b).
  assert.equal(relative.length, 30);
  for (const rule of relative) {
    assert.ok(rule.relation, `${rule.slug} has no relation declaration`);
    assert.equal(rule.relation?.parent_slug, rule.relative_base_slug, rule.slug);
    assert.equal(rule.relation?.offset_days, rule.relative_offset_days, rule.slug);
  }
});
