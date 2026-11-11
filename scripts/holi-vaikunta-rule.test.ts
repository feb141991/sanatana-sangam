import test from 'node:test';
import assert from 'node:assert/strict';
import rules from '../packages/dharma-rules/src/festivals/rules.json';

const rule = (slug: string) => {
  const match = rules.find((candidate) => candidate.slug === slug);
  assert.ok(match, `missing rule: ${slug}`);
  return match;
};

const ALL_PROFILES = [
  'legacy-ujjain', 'tamil_solar', 'malayalam_solar', 'bengali_solar',
  'north_indian_purnimanta', 'gujarati_amanta', 'marathi_amanta',
  'kannada_telugu_amanta', 'kannada_amanta', 'telugu_amanta', 'odia',
  'nepali_bikram', 'global_sanatan',
];

test('Holi is explicitly Holika Dahan and Rangwali Holi is a separate deferred rule', () => {
  const holika = rule('holi');
  const rangwali = rule('rangwali-holi');

  assert.equal(holika.display_name, 'Holika Dahan — Holi');
  assert.deepEqual(holika.date_assignment, {
    status: 'founder_approved',
    basis: 'lunar_tithi',
    tithi: 15,
    paksha: 'shukla',
    lunar_month: 'Phalguna',
    month_system: 'amanta',
    period: 'pradosha',
    mode: 'touches',
    skipped_tithi: 'first_qualifying_date',
    tie_break: 'first_qualifying_date',
  });
  // Approved 2026-11-11: Purnima at pradosha with no Bhadra, Bhadra-puccha fallback (puccha length proposed, 72 minutes).
  assert.deepEqual(holika.evaluator_conditions, [
    { type: 'lunar_month', value: 'Phalguna', monthSystem: 'amanta' },
    { type: 'holika_dahan', pucchaMinutes: 72 },
  ]);
  assert.equal(rangwali.display_name, 'Rangwali Holi');
  assert.equal(rangwali.launch_status, 'deferred');
  // Rangwali Holi is the civil day after Holika Dahan (convention relation, ae394bb), not an independent tithi rule.
  assert.equal(rangwali.rule_family, 'relative_to_other_observance');
  assert.equal(rangwali.relative_base_slug, 'holi');
  assert.equal(rangwali.relative_offset_days, 1);
  assert.deepEqual(holika.calendar_profiles, ALL_PROFILES);
  assert.equal(holika.profile_scope, 'descriptive');
  assert.deepEqual(rangwali.calendar_profiles, ALL_PROFILES);
  assert.equal(rangwali.profile_scope, 'descriptive');
});

test('Gita Jayanti and approved Mokshada Vaikunta remain distinct declarations', () => {
  const gita = rule('gita-jayanti');
  const vaikunta = rule('vaikunta-ekadashi');

  assert.equal(gita.corrected_lunar_masa_name, 'Margashirsha');
  assert.equal(gita.date_assignment?.tithi, 11);
  assert.equal(gita.launch_status, 'deferred');
  assert.equal(vaikunta.corrected_lunar_masa_name, 'Margashirsha');
  assert.equal(vaikunta.lunar_tithi_index, 11);
  assert.equal(vaikunta.date_assignment?.status, 'ratified');
  assert.match(vaikunta.ratification_note ?? '', /Council reviewed and approved by Pt\. Prince Sharma/);
  assert.deepEqual(gita.calendar_profiles, ALL_PROFILES);
  assert.deepEqual(vaikunta.calendar_profiles, ALL_PROFILES);
  assert.equal(vaikunta.profile_scope, 'descriptive');
});

test('Holla Mohalla remains unchanged until Rangwali Holi is reviewed', () => {
  const holla = rule('holla-mohalla');
  assert.equal(holla.relative_base_slug, 'holi');
  assert.equal(holla.relation?.parent_slug, 'holi');
  assert.equal(holla.relation?.status, 'proposed');
});
