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
    testTimeout: 120_000,
  },
});
