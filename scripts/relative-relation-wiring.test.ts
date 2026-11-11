import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';

const materializeSource = readFileSync(resolve(__dirname, '../src/lib/calendar/materialize.ts'), 'utf8');

test('evaluator consumes declared relation parent and offset', () => {
  assert.match(materializeSource, /relation\?\.parent_slug/);
  assert.match(materializeSource, /relation\?\.offset_days/);
});

test('independent relative rules are explicitly proposed and preserve legacy offsets', () => {
  const rules = CANONICAL_RULES.filter((rule) => rule.relation?.kind === 'independent_offset');
  assert.equal(rules.length, 8);
  for (const rule of rules) {
    assert.equal(rule.relation?.status, 'proposed', rule.slug);
    assert.equal(rule.relation?.parent_slug, rule.relative_base_slug, rule.slug);
    assert.equal(rule.relation?.offset_days, rule.relative_offset_days, rule.slug);
  }
});
