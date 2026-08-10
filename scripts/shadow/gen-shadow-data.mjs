/**
 * Generates the shadow occurrence rows from the production structural summary.
 *
 * Node rather than Python because `.gitignore` carries a repo-wide `*.py`, so a
 * Python generator here is untracked -- which would have left the "one command"
 * harness unrunnable from a clean clone, reintroducing the exact defect
 * (unreproducible evidence) it was written to fix. Found by checking `git
 * ls-files` after committing rather than trusting `git add`.
 *
 * WHY A RECONSTRUCTION AND NOT A DUMP
 * -----------------------------------
 * The full production table serialises to 760 KB. Passing that through a tool
 * boundary is neither affordable nor reproducible; it would make the shadow a
 * one-off paste. So `prod_summary.txt` (slug:year:count:min:max, one line per
 * slug-year, pulled read-only) is the fixture and the rows are regenerated.
 *
 * FAITHFUL: row count (557 exactly), the slug set, the year distribution, and
 * the MULTIPLICITY of recurring slugs -- ekadashi 22/23/23, pradosh 23/20/21 --
 * which is what the identity and completeness work is about. The five withheld
 * rows keep their real state.
 *
 * NOT FAITHFUL: per-row provenance blobs and timestamps. No check reads them.
 * Stated rather than glossed: this proves the migration is additive and the
 * read-time logic correct; it is not a byte-for-byte production clone.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

const summary = readFileSync(join(here, 'prod_summary.txt'), 'utf8').trim().split('\n');
const rulesJson = JSON.parse(
  readFileSync(join(root, 'packages/dharma-rules/src/festivals/rules.json'), 'utf8'),
);
const rules = new Map(rulesJson.map(r => [r.slug, r]));

/** The five disputed rows, withheld and locked in production. */
const WITHHELD = new Set([
  'krishna-janmashtami|2027', 'guru-ravidas-jayanti|2027',
  'paryushana-parva-begins|2027', 'paryushana-parva-begins|2028',
  'karva-chauth|2028',
]);
/** Only these two carried review_status='reviewed' before the quarantine. */
const REVIEWED = new Set(['krishna-janmashtami|2027', 'guru-ravidas-jayanti|2027']);

const addDays = (iso, n) => {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const daysBetween = (a, b) =>
  Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);

const slugs = new Set();
const rows = [];
for (const line of summary) {
  const [slug, yearStr, countStr, dmin, dmax] = line.split(':');
  const year = Number(yearStr);
  const count = Number(countStr);
  slugs.add(slug);
  const span = daysBetween(dmin, dmax);
  for (let i = 0; i < count; i++) {
    rows.push([slug, year, count === 1 ? dmin : addDays(dmin, Math.round((span * i) / (count - 1)))]);
  }
}

// Dates must stay unique per (definition, year, profile, occurrence_date,
// variant) or the real UNIQUE constraint rejects them -- as production would.
const seen = new Set();
const uniq = [];
for (let [slug, year, d] of rows) {
  while (seen.has(`${slug}|${year}|${d}`)) d = addDays(d, 1);
  seen.add(`${slug}|${year}|${d}`);
  uniq.push([slug, year, d]);
}

const q = v => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);

const out = ['BEGIN;'];
for (const s of [...slugs].sort()) {
  const r = rules.get(s) ?? {};
  out.push(
    'INSERT INTO observance_definitions (slug, display_name, kind, tradition, active, emoji, description) ' +
      `VALUES (${q(s)}, ${q(r.display_name ?? s)}, ${q(r.kind ?? 'major')}, ` +
      `${q(r.tradition ?? 'hindu')}, true, ${q(r.emoji ?? 'X')}, ${q(r.description ?? '')});`,
  );
}
for (const [slug, year, d] of uniq) {
  const key = `${slug}|${year}`;
  const w = WITHHELD.has(key);
  out.push(
    'INSERT INTO observance_occurrences (definition_id, year, date, occurrence_date, calendar_profile, ' +
      'variant_key, is_primary_variant, review_status, verification_status, audit_status, final_date_source, ' +
      'publication_status, locked_for_regeneration, computed_latitude, computed_longitude, computed_timezone) ' +
      `SELECT id, ${year}, ${q(d)}, ${q(d)}, 'legacy-ujjain', 'legacy-default', true, ` +
      `${q(w ? 'needs_review' : REVIEWED.has(key) ? 'reviewed' : null)}, ` +
      `'not_checked', 'not_run', 'calculation_engine', ` +
      `${q(w ? 'withheld_disputed' : 'published')}, ${w ? 'true' : 'false'}, ` +
      `23.1765, 75.7885, 'Asia/Kolkata' FROM observance_definitions WHERE slug = ${q(slug)};`,
  );
}
out.push('COMMIT;');

writeFileSync(join(here, 'shadow-data.sql'), out.join('\n') + '\n');
console.log(`definitions ${slugs.size}   occurrence rows ${uniq.length}`);
