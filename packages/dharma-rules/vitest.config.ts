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
  },
});
