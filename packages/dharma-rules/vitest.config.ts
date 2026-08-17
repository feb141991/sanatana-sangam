import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '../..');

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(ROOT, 'src'),
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'harness/**/*.test.ts'],
    globals: false,
    environment: 'node',
    pool: 'forks',
    // Annual astronomy suites repeatedly request the same pure year tables.
    // One non-isolated worker lets the bounded caches serve later test files
    // instead of recomputing identical years in competing child processes.
    maxWorkers: 1,
    isolate: false,
    // 2026-08-17: USE_CORRECTED_MASA flipped true, and calculateObservancesForYear's
    // mixed dispatch now computes up to three full-year passes per year
    // (legacy, corrected, and -- for the D34 madhyahna rules -- a third
    // noon-sampled pass) instead of one. ~21s/year measured directly, up
    // from ~10s. 120s was already tight for the caching-invariant test's
    // full fixture sweep; 300s gives real headroom without masking a
    // genuine hang.
    testTimeout: 300_000,
  },
});
