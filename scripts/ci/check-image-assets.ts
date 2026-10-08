#!/usr/bin/env node
/**
 * check-image-assets.ts
 *
 * Image asset integrity gate (rules and rationale: src/lib/image-asset-integrity.ts,
 * AGENTS.md section 12).
 *
 *   npm run check:assets            fail only on problems NOT in KNOWN_BROKEN_IMAGES
 *   npm run check:assets -- --strict   fail on every problem, including the known ones
 *
 * Runs at the start of `prebuild`, so a new JPEG-named-.png or opaque cut-out
 * fails the Vercel build instead of reaching users (and, once copied, the Native
 * app's Android build).
 */

import path from 'node:path';

import { MISMATCH_ADVICE, type AssetProblem } from '../../src/lib/image-asset-integrity';
import { KNOWN_BROKEN_IMAGES, scanImageAssets } from '../../src/lib/image-asset-scan';

function print(problems: AssetProblem[]): void {
  for (const problem of problems) {
    console.error(`  ${problem.code.padEnd(15)} ${problem.path}`);
    console.error(`  ${' '.repeat(15)} ${problem.message}\n`);
  }
}

function main(): void {
  const strict = process.argv.includes('--strict');
  const root = path.resolve(__dirname, '../..');
  const { scanned, problems } = scanImageAssets(root);

  const known = new Set(KNOWN_BROKEN_IMAGES);
  const failing = strict ? problems : problems.filter((problem) => !known.has(problem.path));
  const tolerated = strict ? 0 : problems.length - failing.length;

  if (failing.length === 0) {
    const note = tolerated > 0 ? `; ${tolerated} known problem(s) tolerated (run with --strict to list them)` : '';
    console.log(`Image asset check passed: ${scanned} images scanned${note}.`);
    return;
  }

  console.error(`Image asset check FAILED: ${failing.length} ${strict ? '' : 'new '}problem(s) in ${scanned} images scanned.\n`);
  print(failing);
  if (failing.some((problem) => problem.code === 'FORMAT_MISMATCH')) console.error(`${MISMATCH_ADVICE}\n`);
  console.error('Fix the files above (see AGENTS.md section 12), then run `npm run check:assets` again. Do not add them to KNOWN_BROKEN_IMAGES.');
  process.exitCode = 1;
}

main();
