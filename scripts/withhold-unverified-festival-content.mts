import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

type EditorialField = {
  status: string;
  sourceRefs: unknown[];
  reviewRef?: string;
  translationStatus?: Record<string, string>;
};

type FestivalRecord = Record<string, unknown> & {
  mantra?: { translation?: EditorialField };
};

type FestivalSnapshot = {
  version: string;
  festivals: FestivalRecord[];
};

const sourcePath = resolve('packages/dharma-rules/src/festivals/festival-content.json');
const snapshot = JSON.parse(readFileSync(sourcePath, 'utf8')) as FestivalSnapshot;
const editorialKeys = ['name', 'tagline', 'significance', 'rituals', 'dos', 'donts', 'pujaItems'] as const;

let withheld = 0;

function withhold(field: EditorialField | undefined): void {
  if (!field) return;
  field.status = 'pending_source';
  field.sourceRefs = [];
  delete field.reviewRef;
  if (field.translationStatus) {
    for (const language of Object.keys(field.translationStatus)) {
      field.translationStatus[language] = 'pending';
    }
  }
  withheld += 1;
}

for (const festival of snapshot.festivals) {
  for (const key of editorialKeys) {
    withhold(festival[key] as EditorialField | undefined);
  }
  withhold(festival.mantra?.translation);
}

snapshot.version = '2.0.0';
writeFileSync(sourcePath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ version: snapshot.version, festivals: snapshot.festivals.length, withheld }, null, 2));
