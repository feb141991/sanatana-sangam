#!/usr/bin/env node
/**
 * check-no-direct-push-in-producers.ts
 *
 * Architectural Release Gate:
 * Enforces that candidate producers NEVER directly import or dispatch push notifications.
 * All notification delivery MUST flow through the central Notification Candidate Resolver
 * and Promotion Pipeline.
 *
 * Checks:
 * - Scans all `src/lib/*-candidate-producer.ts` and `src/lib/series-candidate-producer.ts` files.
 * - Forbids imports of:
 *   - `@/lib/push-server` or any `push-server` relative path
 *   - `@/lib/push` (direct dispatch functions)
 *   - `expo-server-sdk`
 *   - `onesignal`
 *   - `sendPushNotification` or `dispatchPush`
 */

import fs from 'fs';
import path from 'path';

const FORBIDDEN_IMPORT_PATTERNS = [
  /from\s+['"][^'"]*push-server[^'"]*['"]/i,
  /from\s+['"][^'"]*\/push['"]/i,
  /from\s+['"]expo-server-sdk['"]/i,
  /from\s+['"]onesignal[^'"]*['"]/i,
  /import\s+.*\b(sendPushNotification|dispatchPush|sendExpoPush|sendOneSignalPush)\b/i,
  /require\(['"][^'"]*push-server[^'"]*['"]\)/i,
  /require\(['"]expo-server-sdk['"]\)/i,
];

function scanProducers(): { violations: Array<{ file: string; line: number; text: string }>; scannedFiles: string[] } {
  const libDir = path.resolve(process.cwd(), 'src/lib');
  const files = fs.readdirSync(libDir);

  const producerFiles = files.filter(
    (file) =>
      file.endsWith('-candidate-producer.ts') ||
      file === 'series-candidate-producer.ts'
  );

  const violations: Array<{ file: string; line: number; text: string }> = [];

  for (const filename of producerFiles) {
    const fullPath = path.join(libDir, filename);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
        if (pattern.test(line)) {
          violations.push({
            file: `src/lib/${filename}`,
            line: index + 1,
            text: line.trim(),
          });
        }
      }
    });
  }

  return { violations, scannedFiles: producerFiles };
}

function main() {
  console.log('=== CI Architectural Gate: Check No Direct Push in Candidate Producers ===');
  const { violations, scannedFiles } = scanProducers();

  console.log(`Scanned ${scannedFiles.length} candidate producer files:`);
  scannedFiles.forEach((f) => console.log(`  - src/lib/${f}`));

  if (violations.length > 0) {
    console.error('\n[FAILED] Architectural violation detected! Candidate producers must NOT import or dispatch push directly:');
    violations.forEach((v) => {
      console.error(`  ${v.file}:${v.line} -> ${v.text}`);
    });
    console.error('\nCandidate producers must strictly return NotificationCandidateRow objects for the central resolver.');
    process.exit(1);
  }

  console.log('\n[PASSED] Zero direct push imports found in all candidate producers.');
  console.log('All candidate producers adhere strictly to the central resolver architectural boundary.');
  process.exit(0);
}

main();
