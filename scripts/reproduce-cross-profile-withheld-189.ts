/**
 * Read-only reproduction for Prompt 1 of the cross-profile-withholding
 * remediation program: every production row tagged
 * `withheld_cross_profile_reviewed_duplicate_20260909` (189 rows, all
 * `withheld_disputed`), compared against this checkout's own
 * `calculateObservancesForYear(year, { lat, lon, tz })`
 * (src/lib/calendar/engine.ts) at each row's own stored coordinates.
 *
 * IMPORTANT DISTINCTION, same as the sibling krishna-janmashtami reproduction
 * script: this proves the current engine, run today, reproduces (or does
 * not reproduce) each row's stored date at its stored coordinates AND
 * compatible rule variant. It does NOT prove the stored date -- or the
 * engine's date -- is correct against an authoritative external source, and
 * it does NOT evaluate anything `calendar_profile`-aware:
 * `calculateObservancesForYear` takes a raw lat/lon/tz, not a profile string.
 *
 * Read-only: one SELECT against observance_occurrences (joined to
 * observance_definitions for slug), pure-function engine calls, one output
 * file. No table is written by this script.
 *
 * Run: npx tsx scripts/reproduce-cross-profile-withheld-189.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import { calculateObservancesForYear } from '../src/lib/calendar/engine';
import { variantsMatch } from '../src/lib/calendar/reconciliation-variant';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

const BACKEND_ROOT = path.join(__dirname, '..');
loadEnv({ path: path.join(BACKEND_ROOT, '.env.local'), quiet: true });

const OUTPUT_DIR = path.join(BACKEND_ROOT, 'docs/audits/observance-cross-profile-engine-reproduction-2026-09-24');
const DIAGNOSTIC_TAG = 'withheld_cross_profile_reviewed_duplicate_20260909';

type StoredRow = {
  id: string;
  slug: string;
  year: number;
  date: string;
  calendar_profile: string | null;
  spiritual_tradition: string | null;
  variant_key: string | null;
  calculation_version: string | null;
  calculated_by: string | null;
  final_date_source: string | null;
  computed_latitude: number | null;
  computed_longitude: number | null;
  computed_timezone: string | null;
  publication_status: string | null;
};

type EngineOccurrence = { slug: string; ruleKey: string; date: string };

function storedRowFromUnknown(value: unknown): StoredRow {
  if (!value || typeof value !== 'object') throw new Error('Unexpected occurrence row shape');
  const row = value as Record<string, unknown>;
  const definition = row.observance_definitions;
  if (!definition || typeof definition !== 'object' || typeof (definition as Record<string, unknown>).slug !== 'string') {
    throw new Error('Occurrence row is missing its joined definition slug');
  }
  const requiredStrings = ['id', 'date'] as const;
  for (const field of requiredStrings) {
    if (typeof row[field] !== 'string') throw new Error(`Occurrence row has invalid ${field}`);
  }
  if (typeof row.year !== 'number') throw new Error('Occurrence row has invalid year');
  for (const field of ['computed_latitude', 'computed_longitude'] as const) {
    if (row[field] !== null && typeof row[field] !== 'number') throw new Error(`Occurrence row has invalid ${field}`);
  }
  const nullableString = (field: string) => {
    const fieldValue = row[field];
    if (fieldValue !== null && fieldValue !== undefined && typeof fieldValue !== 'string') {
      throw new Error(`Occurrence row has invalid ${field}`);
    }
    return fieldValue == null ? null : fieldValue;
  };
  return {
    id: row.id as string,
    slug: (definition as Record<string, unknown>).slug as string,
    year: row.year,
    date: row.date as string,
    calendar_profile: nullableString('calendar_profile'),
    spiritual_tradition: nullableString('spiritual_tradition'),
    variant_key: nullableString('variant_key'),
    calculation_version: nullableString('calculation_version'),
    calculated_by: nullableString('calculated_by'),
    final_date_source: nullableString('final_date_source'),
    computed_latitude: row.computed_latitude as number | null,
    computed_longitude: row.computed_longitude as number | null,
    computed_timezone: nullableString('computed_timezone'),
    publication_status: nullableString('publication_status'),
  };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const rawRows: unknown[] = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db
      .from('observance_occurrences')
      .select(
        'id, year, date, calendar_profile, spiritual_tradition, variant_key, calculation_version, calculated_by, final_date_source, computed_latitude, computed_longitude, computed_timezone, publication_status, observance_definitions!inner(slug)',
      )
      .filter('diagnostics', 'cs', JSON.stringify([DIAGNOSTIC_TAG]))
      .order('id')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const batch = (data ?? []) as unknown[];
    rawRows.push(...batch);
    if (batch.length < pageSize) break;
  }
  const rows = rawRows.map(storedRowFromUnknown);

  // Cache engine runs per (year, lat, lon, tz) -- the 189 rows share only a
  // handful of distinct coordinate/year combinations, so this avoids
  // recomputing the whole year's rule set once per row.
  const engineCache = new Map<string, EngineOccurrence[]>();
  function engineOutputFor(year: number, lat: number, lon: number, tz: string) {
    const key = `${year}|${lat}|${lon}|${tz}`;
    if (!engineCache.has(key)) {
      engineCache.set(key, calculateObservancesForYear(year, { lat, lon, tz }));
    }
    return engineCache.get(key)!;
  }

  const results = rows.map((row) => {
    const selector = sha256(`public.observance_occurrences:${row.id}`);
    if (row.computed_latitude == null || row.computed_longitude == null || row.computed_timezone == null) {
      return { selector, row, engine_matches: [] as string[], classification: 'stored_coordinates_missing' as const };
    }
    const engineOccurrences = engineOutputFor(row.year, row.computed_latitude, row.computed_longitude, row.computed_timezone);
    const sameSlug = engineOccurrences.filter((o) => o.slug === row.slug);
    const sameVariant = sameSlug.filter((o) => variantsMatch(row.variant_key, o.ruleKey));
    const engineDates = [...new Set(sameVariant.map((o) => o.date))];
    const classification: 'exact_match' | 'slug_absent_from_engine' | 'stored_variant_absent_from_engine' | 'stored_date_absent_from_engine_output' =
      sameSlug.length === 0
        ? 'slug_absent_from_engine'
        : sameVariant.length === 0
          ? 'stored_variant_absent_from_engine'
          : engineDates.includes(row.date)
          ? 'exact_match'
          : 'stored_date_absent_from_engine_output';
    return {
      selector,
      row,
      engine_matches_for_slug: [...new Set(sameSlug.map((o) => o.date))],
      engine_matches_for_variant: engineDates,
      classification,
    };
  });

  const counts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.classification] += 1;
    return acc;
  }, {
    exact_match: 0,
    slug_absent_from_engine: 0,
    stored_variant_absent_from_engine: 0,
    stored_date_absent_from_engine_output: 0,
    stored_coordinates_missing: 0,
  });
  const relabelTargets = rows.filter((row) =>
    row.final_date_source === 'legacy_seed' &&
    row.calculated_by === 'lazy_materialize_on_read' &&
    row.calculation_version === '1.0.0',
  );

  const document = {
    _label: 'CURRENT ENGINE OUTPUT AT STORED COORDINATES -- NOT AN AUTHORITATIVE-SOURCE VERIFICATION, NOT A calendar_profile-AWARE EVALUATION',
    _explanation:
      "This file records whether this checkout's calculateObservancesForYear(year, {lat, lon, tz}) reproduces each row's stored date at its own stored coordinates and compatible rule variant, today. It does not verify the stored date -- or the engine's date -- against an authoritative external source. calendar_profile is recorded for reference only: the engine entry point accepts a year and raw location, not a profile.",
    generated_at: new Date().toISOString(),
    generator: 'scripts/reproduce-cross-profile-withheld-189.ts',
    diagnostic_tag: DIAGNOSTIC_TAG,
    total_rows: rows.length,
    classification_counts: counts,
    proposed_provenance_relabel_count: relabelTargets.length,
    provenance_relabel_target_selectors: relabelTargets.map((row) => sha256(`public.observance_occurrences:${row.id}`)),
    rows: results.map((r) => ({
      selector_sha256: r.selector,
      slug: r.row.slug,
      year: r.row.year,
      stored_date: r.row.date,
      stored_calendar_profile: r.row.calendar_profile,
      stored_variant_key: r.row.variant_key,
      stored_timezone: r.row.computed_timezone,
      stored_lat: r.row.computed_latitude,
      stored_lon: r.row.computed_longitude,
      stored_final_date_source: r.row.final_date_source,
      stored_calculated_by: r.row.calculated_by,
      stored_calculation_version: r.row.calculation_version,
      stored_publication_status: r.row.publication_status,
      engine_dates_for_slug: r.engine_matches_for_slug,
      engine_dates_for_variant: r.engine_matches_for_variant,
      classification: r.classification,
    })),
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const jsonPath = path.join(OUTPUT_DIR, 'receipt.json');
  fs.writeFileSync(jsonPath, `${JSON.stringify(document, null, 2)}\n`);

  console.log(`Wrote ${jsonPath}`);
  console.log(`\nTotal rows: ${rows.length}`);
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);
  console.log('\nNon-exact-match rows:');
  for (const r of results.filter((x) => x.classification !== 'exact_match')) {
    console.log(
      `  [${r.selector.slice(0, 12)}] ${r.row.slug} ${r.row.date} @ (${r.row.computed_latitude}, ${r.row.computed_longitude}) ${r.row.computed_timezone} profile=${r.row.calendar_profile} variant=${r.row.variant_key} -> ${r.classification} engine_dates=${JSON.stringify(r.engine_matches_for_variant)}`,
    );
  }
}

if (require.main === module) {
  main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
