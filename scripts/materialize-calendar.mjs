/**
 * Calendar Engine — materialize correct dates to Supabase
 * Run: node scripts/materialize-calendar.mjs
 *
 * Steps:
 * 1. Mark all non-locked legacy_seed occurrences as calculation_engine (so they can be updated)
 * 2. Bundle + run the TypeScript engine via esbuild
 * 3. Upsert calculated dates for 2025, 2026, 2027
 */

import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const YEARS = [2025, 2026, 2027];
const ROOT = process.cwd();
const ENTRY_PATH = resolve(ROOT, '__engine-entry.ts');
const BUNDLE_PATH = resolve(ROOT, '__engine-bundle.cjs');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

async function supabaseGet(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Prefer: 'count=exact' }
  });
  return r.json();
}

async function supabasePatch(table, filter, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(body)
  });
  return r.status;
}

async function supabaseUpsert(table, rows) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows)
  });
  if (!r.ok) {
    const t = await r.text();
    console.error('Upsert error:', t);
  }
  return r.status;
}

// ── Step 1: unlock legacy_seed rows so engine can overwrite them ──────────────
console.log('Step 1: Unlocking legacy_seed occurrences...');
const status = await supabasePatch(
  'observance_occurrences',
  'final_date_source=eq.legacy_seed&locked_for_regeneration=is.null',
  { final_date_source: 'calculation_engine' }
);
console.log(`  PATCH status: ${status}`);

// Also unlock any that have locked_for_regeneration = false
await supabasePatch(
  'observance_occurrences',
  'final_date_source=eq.legacy_seed&locked_for_regeneration=eq.false',
  { final_date_source: 'calculation_engine' }
);

// ── Step 2: Bundle the TypeScript engine to plain JS ─────────────────────────
console.log('\nStep 2: Bundling engine...');

const entryTs = `
import { materializeOccurrencesForYears } from './src/lib/calendar/materialize';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const result = await materializeOccurrencesForYears({
    supabase,
    targetYears: ${JSON.stringify(YEARS)},
    calculatedBy: 'manual_engine_run_v2',
    commit: true,
  });
  console.log(JSON.stringify(result, null, 2));
}

run().catch(e => { console.error(e); process.exit(1); });
`;

// Write entry file into project root so relative imports resolve correctly
writeFileSync(ENTRY_PATH, entryTs);

try {
  execSync(
    `./node_modules/.bin/esbuild "__engine-entry.ts" ` +
    `--bundle --platform=node --format=cjs --outfile=__engine-bundle.cjs ` +
    `--external:@supabase/supabase-js ` +
    `--tsconfig=tsconfig.json 2>&1`,
    { cwd: ROOT, stdio: 'inherit' }
  );
} catch (e) {
  try { unlinkSync(ENTRY_PATH); } catch {}
  console.error('Bundle failed:', e.message);
  process.exit(1);
}

// ── Step 3: Run the bundled engine ───────────────────────────────────────────
console.log('\nStep 3: Running engine for years', YEARS, '...');
try {
  execSync(`node __engine-bundle.cjs`, {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
    }
  });
} catch (e) {
  console.error('Engine run failed:', e.message);
  process.exit(1);
}

// cleanup
try {
  if (existsSync(ENTRY_PATH)) unlinkSync(ENTRY_PATH);
  if (existsSync(BUNDLE_PATH)) unlinkSync(BUNDLE_PATH);
} catch {}

console.log('\nDone.');
