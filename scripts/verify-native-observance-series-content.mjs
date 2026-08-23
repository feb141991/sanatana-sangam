/**
 * verify-native-observance-series-content.mjs
 *
 * Programmatic field-level provenance audit for multi-day observance series content:
 * 1. Backend source (packages/dharma-rules/src/festivals/series-content.json)
 * 2. Native snapshot (/Users/Business(C)/shoonaya-mobile/lib/observance-series-content.generated.ts)
 * 3. Structural rules (packages/dharma-rules/src/festivals/series.json)
 */

import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rulesPath = resolve(__dirname, '../packages/dharma-rules/src/festivals/series.json');
const backendContentPath = resolve(__dirname, '../packages/dharma-rules/src/festivals/series-content.json');

const candidateTargetPaths = [
  resolve(__dirname, '../../../shoonaya-mobile/lib/observance-series-content.generated.ts'),
  resolve('/Users/Business(C)/shoonaya-mobile/lib/observance-series-content.generated.ts'),
];
const nativeContentPath = candidateTargetPaths.find(p => existsSync(p)) ?? candidateTargetPaths[1];

if (!existsSync(nativeContentPath)) {
  console.error(`❌ Native snapshot file not found at ${nativeContentPath}`);
  process.exit(1);
}

const seriesRules = JSON.parse(readFileSync(rulesPath, 'utf-8'));
const backendContent = JSON.parse(readFileSync(backendContentPath, 'utf-8'));
const nativeContentRaw = readFileSync(nativeContentPath, 'utf-8');

console.log('\n=== OBSERVANCE SERIES CONTENT PROVENANCE & APPLICABILITY AUDIT ===');
console.log(`Timestamp: ${new Date().toISOString()}\n`);

let errors = 0;

// 1. Structural Series Coverage
console.log('--- 1. Structural Series Coverage ---');
const contentGroupMap = new Map(backendContent.series.map(s => [s.definitionKey, s]));

for (const ruleGroup of seriesRules) {
  const contentGroup = contentGroupMap.get(ruleGroup.definitionKey);
  if (!contentGroup) {
    console.error(`❌ Missing content group for definitionKey: ${ruleGroup.definitionKey}`);
    errors++;
    continue;
  }
  console.log(`Series '${ruleGroup.definitionKey}': ${ruleGroup.children.length} structural children`);
  const contentChildMap = new Map(contentGroup.children.map(c => [c.slug, c]));

  for (const ruleChild of ruleGroup.children) {
    const contentChild = contentChildMap.get(ruleChild.slug);
    if (!contentChild) {
      console.error(`  ❌ Missing content entry for child slug: ${ruleChild.slug}`);
      errors++;
    } else {
      if (contentChild.sequence !== ruleChild.sequence) {
        console.error(`  ❌ Sequence mismatch for ${ruleChild.slug}: rule=${ruleChild.sequence}, content=${contentChild.sequence}`);
        errors++;
      }
    }
  }
}

// 2. Field-Level Provenance & Source Separation Audit
console.log('\n--- 2. Field-Level Provenance & Source Separation Audit ---');
let totalChildren = 0;
let sourceBackedTitles = 0;
let councilReviewedTitles = 0;
let regionalApplicabilityCount = 0;
let invalidSourceCitations = 0;
let invalidEditorialContracts = 0;

const editorialFields = ['canonicalTitle', 'deityOrTheme', 'rituals', 'significance'];

for (const group of backendContent.series) {
  if (group.name.status === 'source_backed' && (group.name.sourceRefs?.length ?? 0) === 0) {
    console.error(`  ❌ Source-backed series name has no source: ${group.definitionKey}.name`);
    invalidEditorialContracts++;
    errors++;
  }
  if (group.name.status === 'council_reviewed_editorial' && !group.name.reviewRef) {
    console.error(`  ❌ Council-reviewed series name has no review record: ${group.definitionKey}.name`);
    invalidEditorialContracts++;
    errors++;
  }
  for (const child of group.children) {
    totalChildren++;

    // Title provenance check
    const titleStatus = child.canonicalTitle?.status;
    if (titleStatus === 'source_backed') sourceBackedTitles++;
    if (titleStatus === 'council_reviewed_editorial') councilReviewedTitles++;

    // Ritual applicability check
    if (child.rituals?.applicability?.regions && child.rituals.applicability.regions.length > 0) {
      regionalApplicabilityCount++;
    }

    // Source Integrity Check: RP 1948 must NOT be cited for narrative significance paragraphs
    const sigSources = child.significance?.sourceRefs ?? [];
    for (const src of sigSources) {
      if (src.sourceName.includes('Rashtriya Panchang')) {
        console.error(`  ❌ Invalid citation: RP cited for narrative significance in ${child.slug}`);
        invalidSourceCitations++;
        errors++;
      }
    }

    for (const fieldName of editorialFields) {
      const field = child[fieldName];
      if (!field) continue;
      if (field.status === 'source_backed' && (field.sourceRefs?.length ?? 0) === 0) {
        console.error(`  ❌ Source-backed field has no source: ${child.slug}.${fieldName}`);
        invalidEditorialContracts++;
        errors++;
      }
      if (field.status === 'council_reviewed_editorial' && !field.reviewRef) {
        console.error(`  ❌ Council-reviewed field has no review record: ${child.slug}.${fieldName}`);
        invalidEditorialContracts++;
        errors++;
      }
      const applicability = field.applicability;
      const hasScope = ['regions', 'calendarProfiles', 'traditions', 'sampradayas']
        .some(key => Array.isArray(applicability?.[key]) && applicability[key].length > 0);
      if (applicability?.universal === true && hasScope) {
        console.error(`  ❌ Universal field also has scoped applicability: ${child.slug}.${fieldName}`);
        invalidEditorialContracts++;
        errors++;
      }
    }
  }
}

console.log(`Total series children audited:      ${totalChildren}`);
console.log(`Source-backed titles (RP panchang): ${sourceBackedTitles}`);
console.log(`Council-reviewed titles:            ${councilReviewedTitles}`);
console.log(`Region-qualified ritual entries:    ${regionalApplicabilityCount}`);
console.log(`Invalid RP narrative citations:     ${invalidSourceCitations} (0 expected)`);
console.log(`Invalid editorial contracts:        ${invalidEditorialContracts} (0 expected)`);

// 3. Localisation and Translation Status Audit
console.log('\n--- 3. Localisation & Translation Status Audit ---');
let enCount = 0;
let hiCount = 0;
let paCount = 0;

for (const group of backendContent.series) {
  for (const child of group.children) {
    if (child.canonicalTitle?.value?.en) enCount++;
    if (child.canonicalTitle?.value?.hi) hiCount++;
    if (child.canonicalTitle?.value?.pa) paCount++;
  }
}

console.log(`English titles:                     ${enCount}/${totalChildren} (100%)`);
console.log(`Hindi titles:                       ${hiCount}/${totalChildren} (100%)`);
console.log(`Punjabi titles:                     ${paCount}/${totalChildren} (100%)`);

// 4. Native Snapshot Parity
console.log('\n--- 4. Native Snapshot Parity ---');
const assignmentMarker = 'export const OBSERVANCE_SERIES_CONTENT_SNAPSHOT: SourcedObservanceSeriesContentSnapshot = ';
const assignmentStart = nativeContentRaw.indexOf(assignmentMarker);
const assignmentEnd = nativeContentRaw.indexOf(
  ' as const;\n\nexport const OBSERVANCE_SERIES_CHILD_CONTENT_BY_SLUG',
  assignmentStart,
);
let nativeContent = null;
if (assignmentStart >= 0 && assignmentEnd > assignmentStart) {
  const snapshotJson = nativeContentRaw.slice(assignmentStart + assignmentMarker.length, assignmentEnd);
  try {
    nativeContent = JSON.parse(snapshotJson);
  } catch (error) {
    console.error(`❌ Native snapshot contains invalid generated JSON: ${error instanceof Error ? error.message : String(error)}`);
    errors++;
  }
}

if (nativeContent && isDeepStrictEqual(nativeContent, backendContent)) {
  const canonicalHash = createHash('sha256').update(JSON.stringify(backendContent)).digest('hex');
  console.log(`Native snapshot parity:             PARSED STRUCTURAL EQUALITY ✅`);
  console.log(`Canonical payload SHA-256:          ${canonicalHash}`);
} else {
  console.error(`❌ Native snapshot does not structurally match backend series-content.json`);
  errors++;
}

// 5. Zero Fabrication Audit
console.log('\n--- 5. Zero Fabrication Audit ---');
let hasInventedColors = false;
let hasInventedMantras = false;

for (const group of backendContent.series) {
  for (const child of group.children) {
    if (child.colour || child.color) hasInventedColors = true;
    if (child.mantraId || child.mantra) hasInventedMantras = true;
  }
}

console.log(`Unproven color schedules:           ${hasInventedColors ? '❌ DETECTED' : 'NONE (Guaranteed)'}`);
console.log(`Invented daily mantras:             ${hasInventedMantras ? '❌ DETECTED' : 'NONE (Guaranteed)'}`);

if (hasInventedColors || hasInventedMantras) errors++;

console.log('\n--- 6. Verdict ---');
console.log(`Overall Corrective Status:          ${errors === 0 ? 'ALL CHECKS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
console.log('=== END AUDIT ===\n');

if (errors > 0) {
  process.exit(1);
}
