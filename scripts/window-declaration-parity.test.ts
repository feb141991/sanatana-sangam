import assert from 'node:assert/strict';
import test from 'node:test';
import rules from '../packages/dharma-rules/src/festivals/rules.json';
import { validateWindowDeclarationParity } from './window-declaration-parity';

test('every declared window matches the executable tithi/month/window fields', () => {
  assert.deepEqual(validateWindowDeclarationParity(rules as any), []);
});

test('the Buddhist declaration-only batch is recorded without executable rewiring', () => {
  const declarationOnly = (rules as any[]).filter((rule) =>
    ['losar-tibetan-new-year', 'magha-puja', 'vesak-buddha-purnima', 'asalha-puja', 'vassa-begins-rains-retreat', 'ullambana-ancestor-day', 'pavarana-end-of-vassa'].includes(rule.slug),
  );
  assert.equal(declarationOnly.filter((rule) => rule.date_assignment?.status === 'proposed').length, 7);
  assert.equal(declarationOnly.filter((rule) => rule.evaluator_conditions).length, 0);
});

test('the approved calculation batch is wired to executable conditions', () => {
  const wired = (rules as any[]).filter((rule) =>
    rule.slug === 'raksha-bandhan' ||
    rule.slug === 'papmochani-ekadashi' ||
    (rule.slug === 'yogini-ekadashi' && rule.variant_key === 'vaishnava_vidhava') ||
    ['chhath-puja', 'vinayaka-chaturthi', 'vasant-panchami', 'akshaya-tritiya', 'hartalika-teej'].includes(rule.slug),
  );
  assert.equal(wired.filter((rule) => rule.slug !== 'papmochani-ekadashi' && !rule.evaluator_conditions).length, 0);
  assert.equal(wired.find((rule) => rule.slug === 'papmochani-ekadashi')?.corrected_month_system, 'purnimanta');
  assert.equal(wired.find((rule) => rule.slug === 'vinayaka-chaturthi')?.date_assignment?.mode, 'touches');
});

test('window source status and tier are recorded for every declaration', () => {
  for (const rule of rules as any[]) {
    if (!rule.date_assignment) continue;
    assert.equal(rule.window_source?.tier, 6, rule.slug);
    assert.equal(rule.window_source?.status, 'unsourced', rule.slug);
  }
});
