import assert from 'node:assert/strict';
import test from 'node:test';
import rules from '../packages/dharma-rules/src/festivals/rules.json';

const expectedProfiles = [
  'legacy-ujjain', 'tamil_solar', 'malayalam_solar', 'bengali_solar',
  'north_indian_purnimanta', 'gujarati_amanta', 'marathi_amanta',
  'kannada_telugu_amanta', 'kannada_amanta', 'telugu_amanta', 'odia',
  'nepali_bikram', 'global_sanatan',
];

test('Gita and Vaikunta profile scope is descriptive only', () => {
  for (const slug of ['gita-jayanti', 'vaikunta-ekadashi']) {
    const rule = rules.find((candidate) => candidate.slug === slug);
    assert.ok(rule, slug);
    assert.deepEqual(rule.calendar_profiles, expectedProfiles, slug);
    assert.equal(rule.profile_scope, 'descriptive', slug);
  }
});
