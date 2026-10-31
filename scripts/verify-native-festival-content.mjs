/**
 * verify-native-festival-content.mjs
 *
 * Programmatic staleness and provenance check:
 * 1. Confirms shoonaya-mobile/lib/festival-content.generated.ts matches packages/dharma-rules/src/festivals/festival-content.json
 * 2. Confirms 100% of rules in rules.json are present in the Native snapshot
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rulesPath = resolve(__dirname, '../packages/dharma-rules/src/festivals/rules.json');
const backendContentPath = resolve(__dirname, '../packages/dharma-rules/src/festivals/festival-content.json');

const candidateTargetPaths = [
  resolve(__dirname, '../../../shoonaya-mobile/lib/festival-content.generated.ts'),
  resolve('/Users/Business(C)/shoonaya-mobile/lib/festival-content.generated.ts'),
];
const nativeContentPath = candidateTargetPaths.find(p => existsSync(p)) ?? candidateTargetPaths[1];

if (!existsSync(nativeContentPath)) {
  console.error(`❌ Native snapshot file not found at ${nativeContentPath}`);
  process.exit(1);
}

const rules = JSON.parse(readFileSync(rulesPath, 'utf-8'));
const backendContent = JSON.parse(readFileSync(backendContentPath, 'utf-8'));
const nativeContentRaw = readFileSync(nativeContentPath, 'utf-8');

console.log('=== NATIVE FESTIVAL CONTENT SNAPSHOT AUDIT ===');

let errors = 0;

// Extract snapshot JSON from native generated file
const marker = 'export const FESTIVAL_CONTENT_SNAPSHOT: FestivalContentSnapshot = ';
const markerIdx = nativeContentRaw.indexOf(marker);
if (markerIdx === -1) {
  console.error('❌ Failed to locate FESTIVAL_CONTENT_SNAPSHOT marker in generated file');
  process.exit(1);
}

const jsonStart = markerIdx + marker.length;
const jsonEnd = nativeContentRaw.indexOf(' as const;', jsonStart);
if (jsonEnd === -1) {
  console.error('❌ Failed to locate closing "as const;" in generated file');
  process.exit(1);
}

const nativeParsed = JSON.parse(nativeContentRaw.substring(jsonStart, jsonEnd));

// 1. Snapshot parity check
if (!isDeepStrictEqual(backendContent, nativeParsed)) {
  console.error('❌ Stale snapshot: Native festival-content.generated.ts does not match backend festival-content.json');
  errors++;
} else {
  console.log('✔ Parity: Native snapshot is byte-equivalent to backend festival-content.json');
}

// 2. Rule coverage check
const nativeKeys = new Set(nativeParsed.festivals.map(f => f.definitionKey));
for (const rule of rules) {
  if (!nativeKeys.has(rule.slug)) {
    console.error(`❌ Rule "${rule.slug}" (${rule.display_name}) is missing from Native snapshot`);
    errors++;
  }
}

if (errors === 0) {
  console.log(`✔ Coverage: All ${rules.length} rules (${nativeKeys.size} unique keys) verified in Native snapshot`);
  console.log('=== AUDIT PASSED ===\n');
} else {
  console.error(`\n❌ AUDIT FAILED with ${errors} error(s)\n`);
  process.exit(1);
}

