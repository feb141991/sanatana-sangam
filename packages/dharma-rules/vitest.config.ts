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
    // Several invariants compute a full year of panchanga, which lands close to
    // the 5 s default -- one of them intermittently timed out on a loaded
    // machine, so a green run here was partly luck. These are integration tests
    // against real astronomy, not unit tests; the default is the wrong budget.
    testTimeout: 60_000,
  },
});
