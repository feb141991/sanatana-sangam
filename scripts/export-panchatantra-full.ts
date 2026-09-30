import { writeFileSync } from 'node:fs';
import { PANCHATANTRA_STORIES, MORE_PANCHATANTRA_STORIES } from '../src/lib/katha-library';

const ALL = [...PANCHATANTRA_STORIES, ...MORE_PANCHATANTRA_STORIES];

const rows = ALL.map((k) => ({
  id: k.id,
  title: k.title,
  titleHi: k.titleHi ?? null,
  preview: k.preview,
  body: k.body,
  bodyHi: k.bodyHi ?? null,
  phal: k.phal,
  phalHi: k.phalHi ?? null,
  durationMin: k.durationMin,
  tags: k.tags,
  portrait: k.portrait ?? null,
  bodyWordCount: k.body.join(' ').split(/\s+/).length,
}));

writeFileSync('scripts/panchatantra-full-export.json', JSON.stringify(rows, null, 2) + '\n');
console.log(`Exported ${rows.length} entries to scripts/panchatantra-full-export.json`);
console.log(`Missing bodyHi: ${rows.filter((r) => !r.bodyHi).length}`);
console.log(`Missing portrait: ${rows.filter((r) => !r.portrait).length}`);
console.log(`Body word count distribution: min=${Math.min(...rows.map(r=>r.bodyWordCount))}, max=${Math.max(...rows.map(r=>r.bodyWordCount))}`);
