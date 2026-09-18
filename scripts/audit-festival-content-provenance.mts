import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type SourceRef = {
  sourceName?: unknown;
  url?: unknown;
  pageOrSection?: unknown;
  usagePermitted?: unknown;
};

type EditorialField = {
  status?: unknown;
  sourceRefs?: unknown;
  reviewRef?: unknown;
};

type FestivalRecord = Record<string, unknown> & {
  definitionKey?: unknown;
  mantra?: { translation?: EditorialField };
};

const sourcePath = resolve('packages/dharma-rules/src/festivals/festival-content.json');
const snapshot = JSON.parse(readFileSync(sourcePath, 'utf8')) as {
  version?: unknown;
  festivals?: unknown;
};
const editorialKeys = ['name', 'tagline', 'significance', 'rituals', 'dos', 'donts', 'pujaItems'] as const;
const allowedUsage = new Set(['public_domain', 'rights_cleared', 'licensed', 'citation_only']);

function isCompleteSourceRef(value: unknown): value is SourceRef {
  if (!value || typeof value !== 'object') return false;
  const ref = value as SourceRef;
  return typeof ref.sourceName === 'string' && ref.sourceName.trim().length > 0
    && typeof ref.url === 'string' && /^https:\/\//u.test(ref.url)
    && typeof ref.pageOrSection === 'string' && ref.pageOrSection.trim().length > 0
    && typeof ref.usagePermitted === 'string' && allowedUsage.has(ref.usagePermitted);
}

function inspectField(label: string, field: EditorialField, failures: string[]): boolean {
  const refs = Array.isArray(field.sourceRefs) ? field.sourceRefs : [];
  if (field.status === 'pending_source' || field.status === 'withheld') {
    if (refs.length > 0 || field.reviewRef !== undefined) {
      failures.push(`${label}: pending/withheld content carries source or review metadata that could be mistaken for approval`);
    }
    return false;
  }

  if (field.status === 'source_backed') {
    if (refs.length === 0 || !refs.every(isCompleteSourceRef)) {
      failures.push(`${label}: source_backed content lacks an HTTPS source, exact locator, or rights state`);
    }
    return true;
  }

  if (field.status === 'council_reviewed_editorial') {
    const reviewRef = typeof field.reviewRef === 'string' ? field.reviewRef : '';
    const reviewPath = reviewRef.startsWith('docs/content-reviews/') ? resolve(reviewRef) : '';
    if (!reviewPath || !existsSync(reviewPath)) {
      failures.push(`${label}: council review does not resolve to a durable docs/content-reviews record`);
    }
    if (refs.length === 0 || !refs.every(isCompleteSourceRef)) {
      failures.push(`${label}: council-reviewed content lacks complete source provenance`);
    }
    return true;
  }

  failures.push(`${label}: unknown editorial status ${String(field.status)}`);
  return false;
}

if (!Array.isArray(snapshot.festivals)) {
  throw new Error('festival-content.json must contain a festivals array');
}

const failures: string[] = [];
let fields = 0;
let displayable = 0;

for (const rawFestival of snapshot.festivals) {
  if (!rawFestival || typeof rawFestival !== 'object') {
    failures.push('festival entry is not an object');
    continue;
  }
  const festival = rawFestival as FestivalRecord;
  const slug = typeof festival.definitionKey === 'string' ? festival.definitionKey : '<missing-slug>';
  for (const key of editorialKeys) {
    const field = festival[key];
    if (!field || typeof field !== 'object') continue;
    fields += 1;
    if (inspectField(`${slug}.${key}`, field as EditorialField, failures)) displayable += 1;
  }
  if (festival.mantra?.translation) {
    fields += 1;
    if (inspectField(`${slug}.mantra.translation`, festival.mantra.translation, failures)) displayable += 1;
  }
}

console.log(JSON.stringify({
  version: snapshot.version,
  festivals: snapshot.festivals.length,
  editorialFields: fields,
  displayableFields: displayable,
  withheldFields: fields - displayable,
  failures,
}, null, 2));

if (failures.length > 0) process.exitCode = 1;
