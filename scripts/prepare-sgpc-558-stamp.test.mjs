import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStampPlan, renderPlan } from './prepare-sgpc-558-stamp.mjs';

test('separates additive stamps from stale rows', () => {
  const rows = [
    { id: 'ok', tradition: 'sikh', date: '2027-01-15', manual_date_override: '2027-01-15', expected_558_date: '2027-01-15', publication_status: 'published' },
    { id: 'stale', tradition: 'sikh', date: '2027-01-05', expected_558_date: '2027-01-15', publication_status: 'published' },
    { id: 'other', tradition: 'hindu', date: '2027-01-05', expected_558_date: '2027-01-05', publication_status: 'published' },
  ];
  const plan = buildStampPlan(rows);
  assert.deepEqual(plan.stampable.map(row => row.id), ['ok']);
  assert.deepEqual(plan.stale.map(row => row.id), ['stale']);
});

test('emits pre-image guarded SQL without executing it', () => {
  const plan = renderPlan([{ id: 'ok', tradition: 'sikh', date: '2027-01-15', manual_date_override: '2027-01-15', expected_558_date: '2027-01-15', publication_status: 'published' }]);
  assert.match(plan.stampSql, /provenance', 'sgpc_edition/);
  assert.match(plan.stampSql, /AND date = '2027-01-15'/);
  assert.match(plan.holdSql, /^$/);
  assert.match(plan.rollbackSql, /calendar_provenance/);
});
