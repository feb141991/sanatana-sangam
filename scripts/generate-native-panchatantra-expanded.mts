/**
 * Generates the offline Panchatantra expanded-story snapshot for shoonaya-mobile.
 *
 * Backend owns the content: expanded body/bodyHi/portrait/durationMin live in
 * packages/dharma-rules/src/stories/panchatantra-expanded.json, and the real
 * title/moral come from katha-library.ts. Native receives a generated snapshot
 * and never invents a title or moral for offline rendering.
 *
 * Usage:
 *   npx tsx scripts/generate-native-panchatantra-expanded.mts          # write
 *   npx tsx scripts/generate-native-panchatantra-expanded.mts --check  # exit 1 on drift
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MORE_PANCHATANTRA_STORIES, PANCHATANTRA_STORIES } from '../src/lib/katha-library';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(__dirname, '../packages/dharma-rules/src/stories/panchatantra-expanded.json');
const nativeTarget = [
  resolve(__dirname, '../../../shoonaya-mobile/assets/data/panchatantra-expanded-snapshot.json'),
  resolve('/Users/Business(C)/shoonaya-mobile/assets/data/panchatantra-expanded-snapshot.json'),
].find((candidate) => existsSync(dirname(candidate)));

if (!nativeTarget) throw new Error('Could not locate shoonaya-mobile/assets/data');

interface ExpandedEntry {
  id: string;
  portrait: string;
  durationMin: number;
  body: string[];
  bodyHi: string[];
}

const source = JSON.parse(readFileSync(sourcePath, 'utf8')) as { entries: ExpandedEntry[] };
const katha = new Map([...PANCHATANTRA_STORIES, ...MORE_PANCHATANTRA_STORIES].map((k) => [k.id, k]));

const snapshot = source.entries.map((entry) => {
  const base = katha.get(entry.id);
  if (!base) throw new Error(`Expanded story ${entry.id} has no katha-library entry`);
  if (!base.titleHi || !base.phalHi) throw new Error(`${entry.id} is missing titleHi/phalHi in katha-library`);
  return {
    id: entry.id,
    title: base.title,
    titleHi: base.titleHi,
    phal: base.phal,
    phalHi: base.phalHi,
    portrait: entry.portrait,
    durationMin: entry.durationMin,
    body: entry.body,
    bodyHi: entry.bodyHi,
  };
});

const missing = [...katha.keys()].filter((id) => !snapshot.some((s) => s.id === id));
if (missing.length > 0) throw new Error(`katha-library stories without expanded content: ${missing.join(', ')}`);

const output = `${JSON.stringify(snapshot, null, 2)}\n`;

if (process.argv.includes('--check')) {
  const current = existsSync(nativeTarget) ? readFileSync(nativeTarget, 'utf8') : '';
  if (current !== output) {
    console.error(`DRIFT: ${nativeTarget} does not match the backend-generated snapshot`);
    process.exit(1);
  }
  console.log(`OK: native Panchatantra snapshot matches backend (${snapshot.length} stories)`);
} else {
  writeFileSync(nativeTarget, output);
  console.log(`Generated ${snapshot.length} stories -> ${nativeTarget}`);
}
