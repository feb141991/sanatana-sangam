/**
 * One-off, read/write verification of the manifest+batch completeness
 * mechanism (isYearMaterialized / ensureYearMaterialized in
 * resolve-occurrences.ts) against the LIVE production database, run once
 * right after applying migration 20260905180000_calendar_materialisation_manifests.
 *
 * Uses a synthetic, clearly-marked calendar_profile/location combination
 * that cannot collide with any real profile or the legacy-ujjain festival-
 * mirror trigger (see resolve-occurrences.ts's FESTIVAL_MIRROR_CALENDAR_PROFILE
 * comment), so it never touches the legacy `festivals` table at all. Every
 * row this script writes is deleted at the end -- this is a verification
 * script, not a seed/backfill script.
 *
 * Run: DOTENV_CONFIG_PATH=.env.local npx tsx scripts/verify-materialisation-manifest-live.mts
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database';
import {
  isYearMaterialized,
  ensureYearMaterialized,
} from '../src/lib/calendar/resolve-occurrences';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Supabase URL and service role key are required');

const supabase = createClient<Database>(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const YEAR = 2026;
// calendar_profile is FK-constrained to public.calendar_profiles -- must be a
// real, registered, non-legacy-ujjain slug (avoiding legacy-ujjain sidesteps
// the festival-mirror trigger entirely, see resolve-occurrences.ts's
// FESTIVAL_MIRROR_CALENDAR_PROFILE comment). The LOCATION below is what
// makes this combination genuinely never-seen.
const PROFILE = 'global_sanatan';
const LOCATION = { lat: 12.3456, lon: 65.4321, tz: 'UTC' };

let failed = false;
function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log(`  PASS  ${label}`);
  } else {
    failed = true;
    console.log(`  FAIL  ${label}`, detail ?? '');
  }
}

async function main() {
  console.log(`Verifying against year=${YEAR} profile=${PROFILE} location=${JSON.stringify(LOCATION)}`);

  // 1. Never-seen combination must report not materialized.
  const before = await isYearMaterialized({ supabase: supabase as any, year: YEAR, calendarProfile: PROFILE, location: LOCATION });
  check('acceptance-4a: never-seen combo is NOT materialized', before === false, before);

  // 2. Materialize it for real.
  await ensureYearMaterialized({ supabase: supabase as any, year: YEAR, calendarProfile: PROFILE, location: LOCATION });

  // 3. Now it must report materialized.
  const after1 = await isYearMaterialized({ supabase: supabase as any, year: YEAR, calendarProfile: PROFILE, location: LOCATION });
  check('acceptance-4b: same combo IS materialized after ensureYearMaterialized', after1 === true, after1);

  // 4. A manifest row must exist with a complete status and a real hash/count.
  const { data: manifestRows, error: manifestErr } = await supabase
    .from('observance_materialisation_manifests')
    .select('*')
    .eq('year', YEAR)
    .eq('calendar_profile', PROFILE)
    .eq('computed_latitude', LOCATION.lat)
    .eq('computed_longitude', LOCATION.lon)
    .eq('computed_timezone', LOCATION.tz);
  check('manifest row exists', !manifestErr && (manifestRows?.length ?? 0) === 1, manifestErr ?? manifestRows);
  const manifest = manifestRows?.[0];
  check('manifest status is complete', manifest?.status === 'complete', manifest?.status);
  check('manifest expected_identity_count > 0', (manifest?.expected_identity_count ?? 0) > 0, manifest?.expected_identity_count);
  check('manifest expected_identity_hash is non-empty', Boolean(manifest?.expected_identity_hash), manifest?.expected_identity_hash);
  check('manifest day_boundary_version populated', manifest?.day_boundary_version === '1.0.0', manifest?.day_boundary_version);

  // 5. Batch rows must exist, matching the manifest's expected count, all complete.
  const { data: batchRows, error: batchErr } = await supabase
    .from('observance_materialisation_batches')
    .select('*')
    .eq('year', YEAR)
    .eq('calendar_profile', PROFILE)
    .eq('computed_latitude', LOCATION.lat)
    .eq('computed_longitude', LOCATION.lon)
    .eq('computed_timezone', LOCATION.tz);
  check('batch rows written', !batchErr && (batchRows?.length ?? 0) > 0, batchErr ?? batchRows?.length);
  check(
    'batch row count matches manifest expected_identity_count',
    (batchRows?.length ?? -1) === (manifest?.expected_identity_count ?? -2),
    { batches: batchRows?.length, expected: manifest?.expected_identity_count }
  );
  check(
    'every batch is complete',
    (batchRows ?? []).every((b: any) => b.status === 'complete'),
    (batchRows ?? []).map((b: any) => b.status)
  );
  check(
    'every batch carries day_boundary_version',
    (batchRows ?? []).every((b: any) => b.day_boundary_version === '1.0.0'),
    (batchRows ?? []).map((b: any) => b.day_boundary_version)
  );

  // 6. Re-running ensureYearMaterialized on an already-complete combo must
  //    short-circuit (no duplicate batch/manifest rows created).
  await ensureYearMaterialized({ supabase: supabase as any, year: YEAR, calendarProfile: PROFILE, location: LOCATION });
  const { data: manifestRowsAfterRerun } = await supabase
    .from('observance_materialisation_manifests')
    .select('id')
    .eq('year', YEAR)
    .eq('calendar_profile', PROFILE)
    .eq('computed_latitude', LOCATION.lat)
    .eq('computed_longitude', LOCATION.lon)
    .eq('computed_timezone', LOCATION.tz);
  check('re-running does not duplicate the manifest row', (manifestRowsAfterRerun?.length ?? 0) === 1, manifestRowsAfterRerun?.length);

  // 7. acceptance-6: a manifest that expects more identities than exist as
  //    complete batches (simulate a missing batch) must NOT be materialized.
  if (manifest) {
    await supabase
      .from('observance_materialisation_manifests')
      .update({ expected_identity_count: (manifest.expected_identity_count ?? 0) + 1 })
      .eq('id', manifest.id);
    const staleCount = await isYearMaterialized({ supabase: supabase as any, year: YEAR, calendarProfile: PROFILE, location: LOCATION });
    check('acceptance-6: manifest expecting more identities than exist as complete batches is NOT materialized', staleCount === false, staleCount);
    // restore
    await supabase
      .from('observance_materialisation_manifests')
      .update({ expected_identity_count: manifest.expected_identity_count })
      .eq('id', manifest.id);
  }

  // 8. acceptance-7: stale provenance on any of the four fields must not be materialized.
  if (manifest) {
    for (const field of ['engine_version', 'rule_version', 'astronomy_version', 'day_boundary_version'] as const) {
      await supabase.from('observance_materialisation_manifests').update({ [field]: 'stale-test-value' }).eq('id', manifest.id);
      const staleResult = await isYearMaterialized({ supabase: supabase as any, year: YEAR, calendarProfile: PROFILE, location: LOCATION });
      check(`acceptance-7: stale ${field} is NOT materialized`, staleResult === false, staleResult);
      await supabase.from('observance_materialisation_manifests').update({ [field]: (manifest as any)[field] }).eq('id', manifest.id);
    }
    // sanity: restoring all four fields returns it to materialized.
    const restored = await isYearMaterialized({ supabase: supabase as any, year: YEAR, calendarProfile: PROFILE, location: LOCATION });
    check('provenance restored -> materialized again', restored === true, restored);
  }

  // 9. acceptance-8: matching count but mismatched hash must not be materialized.
  if (manifest) {
    await supabase.from('observance_materialisation_manifests').update({ expected_identity_hash: 'deadbeef'.repeat(8) }).eq('id', manifest.id);
    const hashMismatch = await isYearMaterialized({ supabase: supabase as any, year: YEAR, calendarProfile: PROFILE, location: LOCATION });
    check('acceptance-8: matching count but mismatched hash is NOT materialized', hashMismatch === false, hashMismatch);
    await supabase.from('observance_materialisation_manifests').update({ expected_identity_hash: manifest.expected_identity_hash }).eq('id', manifest.id);
    const restoredHash = await isYearMaterialized({ supabase: supabase as any, year: YEAR, calendarProfile: PROFILE, location: LOCATION });
    check('hash restored -> materialized again', restoredHash === true, restoredHash);
  }

  // ── cleanup: this is a verification script, not a seed script ───────────
  // PROFILE is a real, shared calendar_profile (FK-constrained), so every
  // delete below is scoped by LOCATION too, not just profile+year -- a
  // profile+year-only delete could otherwise remove real production rows
  // for this same profile at a genuinely different location.
  const { error: delOccErr } = await supabase
    .from('observance_occurrences')
    .delete()
    .eq('calendar_profile', PROFILE)
    .eq('year', YEAR)
    .eq('computed_latitude', LOCATION.lat)
    .eq('computed_longitude', LOCATION.lon)
    .eq('computed_timezone', LOCATION.tz);
  const { error: delBatchErr } = await supabase
    .from('observance_materialisation_batches')
    .delete()
    .eq('calendar_profile', PROFILE)
    .eq('year', YEAR)
    .eq('computed_latitude', LOCATION.lat)
    .eq('computed_longitude', LOCATION.lon)
    .eq('computed_timezone', LOCATION.tz);
  const { error: delManifestErr } = await supabase
    .from('observance_materialisation_manifests')
    .delete()
    .eq('calendar_profile', PROFILE)
    .eq('year', YEAR)
    .eq('computed_latitude', LOCATION.lat)
    .eq('computed_longitude', LOCATION.lon)
    .eq('computed_timezone', LOCATION.tz);
  check('cleanup: occurrence rows removed', !delOccErr, delOccErr);
  check('cleanup: batch rows removed', !delBatchErr, delBatchErr);
  check('cleanup: manifest row removed', !delManifestErr, delManifestErr);

  console.log(failed ? '\nRESULT: FAIL' : '\nRESULT: PASS');
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error('Uncaught error:', err);
  process.exit(1);
});
