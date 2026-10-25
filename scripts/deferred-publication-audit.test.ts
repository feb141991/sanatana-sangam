import assert from 'node:assert/strict';
import test from 'node:test';
import { findDeferredPublishedGap } from './deferred-publication-audit';

test('deferred rule with read-visible published rows is flagged even if the engine resolves it', () => {
  const gap = findDeferredPublishedGap(['deferred'], [
    { date: '2026-03-20' },
    { date: '2027-04-07' },
  ]);

  assert.deepEqual(gap, {
    publishedCount: 2,
    publishedDates: ['2026-03-20', '2027-04-07'],
    note: "GOVERNANCE GAP: this rule is launch_status:'deferred', yet 2 stored published occurrence row(s) pass the current calendar read-time gate.",
  });
});

test('included or mixed included/deferred rules are not incorrectly classified as fully deferred', () => {
  const published = [{ date: '2026-03-20' }];
  assert.equal(findDeferredPublishedGap(['included'], published), null);
  assert.equal(findDeferredPublishedGap(['included', 'deferred'], published), null);
});

test('deferred rule without published rows is not reported as a publication gap', () => {
  assert.equal(findDeferredPublishedGap(['deferred'], []), null);
});
