/**
 * Root vitest config.
 *
 * Exists so app-level tests under `src/` can run. The workspace packages are
 * consumed through TypeScript path aliases rather than package `main`/`exports`
 * fields — `@sangam/dharma-rules` has neither — so Node cannot resolve them and
 * vitest fails at import time without the same aliases mirrored here.
 *
 * Keep in step with `compilerOptions.paths` in tsconfig.json. The package suites
 * (`verify:harness`, `verify:calendar`) run inside their own workspaces and are
 * unaffected by this file.
 */
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

const r = (p: string) => resolve(__dirname, p);

export default defineConfig({
  resolve: {
    alias: {
      '@sangam/dharma-rules': r('./packages/dharma-rules/src/conditions/index.ts'),
      '@sangam/panchang-engine': r('./packages/panchang-engine/src/index.ts'),
      '@sangam/sadhana-engine': r('./packages/sadhana-engine/src/index.ts'),
      '@sangam/pathshala-engine': r('./packages/pathshala-engine/src/index.ts'),
      '@sangam/pramana-core': r('./packages/pramana-core/src/index.ts'),
      '@': r('./src'),
    },
  },
  test: {
    // Only app-level tests. The packages own their suites; picking them up here
    // would run them twice under different resolution and invite drift.
    include: ['src/**/*.{test,spec}.ts'],
    environment: 'node',
    // Commit-mode materialisation computes a full year of panchanga per run, so
    // a single test can legitimately take tens of seconds. The default 5 s is
    // for unit tests; these are integration tests against a constraint oracle.
    testTimeout: 120_000,
  },
});
