/**
 * One-time backfill: packages/dharma-rules/__fixtures__/golden/*.json ->
 * the golden_fixtures table.
 *
 * Idempotent (upsert on case_id) so it's safe to re-run if interrupted.
 * Run: npx tsx scripts/backfill-golden-fixtures.mts
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const GOLDEN_DIR = join(process.cwd(), 'packages/dharma-rules/__fixtures__/golden');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}
const supabase = createClient(url, key);

const files = readdirSync(GOLDEN_DIR).filter(f => f.endsWith('.json'));
console.log(`Found ${files.length} golden fixture files.`);

const rows = files.map(f => {
  const raw = JSON.parse(readFileSync(join(GOLDEN_DIR, f), 'utf-8'));
  return {
    case_id: raw.caseId,
    festival_id: raw.festivalId,
    year: raw.year,
    location: raw.location,
    profile: raw.profile,
    expected: raw.expected ?? null,
    tolerance: raw.tolerance,
    source: raw.source,
    reasoning: raw.reasoning,
    approved: raw.approved === true,
  };
});

// Sanity: every caseId must be unique before upserting, or a collision would
// silently drop one fixture's data into another's row.
const seen = new Set<string>();
for (const r of rows) {
  if (seen.has(r.case_id)) {
    console.error(`Duplicate caseId across files: ${r.case_id} -- refusing to backfill.`);
    process.exit(1);
  }
  seen.add(r.case_id);
}

const CHUNK = 50;
let inserted = 0;
for (let i = 0; i < rows.length; i += CHUNK) {
  const chunk = rows.slice(i, i + CHUNK);
  const { error } = await supabase.from('golden_fixtures').upsert(chunk, { onConflict: 'case_id' });
  if (error) {
    console.error(`Upsert failed at chunk starting ${i}:`, error);
    process.exit(1);
  }
  inserted += chunk.length;
  console.log(`  upserted ${inserted}/${rows.length}`);
}

const { count, error: countError } = await supabase
  .from('golden_fixtures')
  .select('*', { count: 'exact', head: true });
if (countError) {
  console.error('Post-backfill count check failed:', countError);
  process.exit(1);
}
console.log(`\nDone. golden_fixtures now has ${count} rows (source: ${rows.length} files).`);
if (count !== rows.length) {
  console.error('MISMATCH -- row count does not match file count. Investigate before trusting the table.');
  process.exit(1);
}
