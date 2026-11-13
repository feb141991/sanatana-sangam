import assert from 'node:assert/strict';
import test from 'node:test';
import rules from '../packages/dharma-rules/src/festivals/rules.json';
import { validateWindowDeclarationParity } from './window-declaration-parity';

test('every declared window matches the executable tithi/month/window fields', () => {
  assert.deepEqual(validateWindowDeclarationParity(rules as any), []);
});

test('held Papmochani and Vaishnava Yogini declarations remain absent', () => {
  const held = (rules as any[]).filter((rule) =>
    rule.slug === 'papmochani-ekadashi' || (rule.slug === 'yogini-ekadashi' && rule.variant_key === 'vaishnava_vidhava'),
  );
  assert.equal(held.filter((rule) => rule.date_assignment).length, 0);
});

test('window source status and tier are recorded for every declaration', () => {
  for (const rule of rules as any[]) {
    if (!rule.date_assignment) continue;
    assert.equal(rule.window_source?.tier, 6, rule.slug);
    assert.equal(rule.window_source?.status, 'unsourced', rule.slug);
  }
});
