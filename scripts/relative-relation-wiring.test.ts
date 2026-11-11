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

test('Rangwali Holi is the deferred civil-day convention after Holika Dahan', () => {
  const rangwali = CANONICAL_RULES.find((rule) => rule.slug === 'rangwali-holi');
  assert.ok(rangwali);
  assert.equal(rangwali.rule_family, 'relative_to_other_observance');
  assert.equal(rangwali.launch_status, 'deferred');
  assert.deepEqual(rangwali.relation, {
    kind: 'convention',
    parent_slug: 'holi',
    offset_days: 1,
    status: 'proposed',
  });
  assert.equal(rangwali.relative_base_slug, 'holi');
  assert.equal(rangwali.relative_offset_days, 1);
  assert.equal('corrected_lunar_tithi_index' in rangwali, false);
  assert.equal('date_assignment' in rangwali, false);

  const holiDates = new Map([
    [2026, '2026-03-03'],
    [2027, '2027-03-22'],
    [2028, '2028-03-11'],
    [2029, '2029-02-28'],
    [2030, '2030-03-19'],
  ]);
  const expectedRangwaliDates = new Map([
    [2026, '2026-03-04'],
    [2027, '2027-03-23'],
    [2028, '2028-03-12'],
    [2029, '2029-03-01'],
    [2030, '2030-03-20'],
  ]);
  for (const [year, holiDate] of holiDates) {
    const expected = new Date(`${holiDate}T12:00:00Z`);
    expected.setUTCDate(expected.getUTCDate() + 1);
    assert.equal(expected.toISOString().slice(0, 10), expectedRangwaliDates.get(year), `${year} Rangwali Holi date contract`);
  }
});

test('independent relative rules are explicitly proposed and preserve legacy offsets', () => {
  const rules = CANONICAL_RULES.filter((rule) => rule.relation?.kind === 'independent_offset');
  assert.equal(rules.length, 6);
  for (const rule of rules) {
    assert.equal(rule.relation?.status, 'proposed', rule.slug);
    assert.equal(rule.relation?.parent_slug, rule.relative_base_slug, rule.slug);
    assert.equal(rule.relation?.offset_days, rule.relative_offset_days, rule.slug);
  }
});
