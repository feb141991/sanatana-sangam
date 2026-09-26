/**
 * Read-only preflight for migration 20260924120000. The predicates match the
 * migration's forward WHERE clause (including marker exclusion) exactly.
 * This script never writes to Supabase.
 *
 * Run: npx tsx scripts/dry-run-legacy-seed-provenance-relabel.ts
 */
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';

const ROOT = path.join(__dirname, '..');
const MIGRATION_MARKER = 'legacy_seed_corrected_20260924120000';
const DUPLICATE_TAG = 'withheld_cross_profile_reviewed_duplicate_20260909';
loadEnv({ path: path.join(ROOT, '.env.local'), quiet: true });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const [targets, alreadyMarked] = await Promise.all([
    db.from('observance_occurrences').select('id', { count: 'exact', head: true })
      .filter('diagnostics', 'cs', JSON.stringify([DUPLICATE_TAG]))
      .eq('final_date_source', 'legacy_seed')
      .eq('calculated_by', 'lazy_materialize_on_read')
      .eq('calculation_version', '1.0.0')
      .not('diagnostics', 'cs', JSON.stringify([MIGRATION_MARKER])),
    db.from('observance_occurrences').select('id', { count: 'exact', head: true })
      .filter('diagnostics', 'cs', JSON.stringify([MIGRATION_MARKER])),
  ]);
  if (targets.error) throw targets.error;
  if (alreadyMarked.error) throw alreadyMarked.error;
  console.log(JSON.stringify({
    mode: 'read-only migration preflight',
    migration: '20260924120000_correct_legacy_seed_provenance_label.sql',
    exact_forward_selector_count: targets.count,
    preexisting_migration_marker_count: alreadyMarked.count,
    expected_forward_count: 47,
    safe_to_apply_count_guard: targets.count === 47 && alreadyMarked.count === 0,
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Read-only preflight failed');
  process.exitCode = 1;
});
