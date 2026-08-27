import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/**
 * Regression test for incident ce_ce629613-431a-4dc1-8cb9-6fb442412d5a (and
 * 3 further reproductions): Home crashed 100% of the time DivineDiyaCanvas
 * mounted, with "Cannot read properties of undefined (reading
 * 'ReactCurrentBatchConfig')" / WebKit's "undefined is not an object
 * (evaluating 'd.ReactCurrentBatchConfig')".
 *
 * Root cause: @react-three/fiber's react-reconciler depends on
 * scheduler@^0.21.0, which npm could not dedupe against react-dom's
 * scheduler@^0.23.2, so two separate `scheduler` module instances existed.
 * react-reconciler's renderer ends up reading React's shared internals
 * (ReactCurrentBatchConfig) through the wrong scheduler instance, which
 * isn't wired up the way react-dom's actual instance is -- hence undefined.
 *
 * This test asserts react-dom and react-reconciler resolve to the exact
 * same `scheduler` module file. It must fail before the fix (two different
 * resolved paths) and pass after (a single deduped path).
 */
test('react-dom and react-reconciler (via @react-three/fiber) share one scheduler instance', () => {
  const schedulerViaReactDom = require.resolve('scheduler', {
    paths: [require.resolve('react-dom')],
  });
  const schedulerViaReconciler = require.resolve('scheduler', {
    paths: [require.resolve('react-reconciler')],
  });

  assert.equal(
    schedulerViaReconciler,
    schedulerViaReactDom,
    `react-reconciler resolves a different scheduler instance (${schedulerViaReconciler}) than react-dom (${schedulerViaReactDom}) -- this is what breaks ReactCurrentBatchConfig for any @react-three/fiber component, e.g. DivineDiyaCanvas on Home.`,
  );
});
