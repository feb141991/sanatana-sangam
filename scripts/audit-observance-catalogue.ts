/**
 * Reproducible catalogue audit: classify every active observance_definitions
 * row into exactly one primary status, verified to sum to the real DB total
 * rather than hand-transcribed (an earlier prose-only pass in
 * docs/PRD_CALENDAR_MATERIALIZATION_INTEGRITY.md double-counted 9 Navratri
 * series-child pseudo-slugs and did not sum correctly -- this script exists
 * so that mistake can't recur silently).
 *
 * Read-only: SELECTs observance_definitions, reads rules.json, runs the
 * pure DB-free calculateOccurrencesWithEvaluator(). No writes anywhere.
 *
 * Primary status is strictly about WHAT THE ENGINE PRODUCES, not whether a
 * result is approved for publication -- "resolved" means "the engine
 * returned a date for this slug in the target year," nothing more. Reading
 * each ratification_note for pending-ratification/profile-scope caveats is
 * a separate, not-yet-automated pass (see `manual_seed_without_rule` in
 * PrimaryStatus below for why the no-rule bucket needed a deeper, scripted
 * second check against actual published occurrence data instead of staying
 * a flat guess -- an earlier version guessed "migration pollution" here and
 * was wrong).
 *
 * Run: npx tsx scripts/audit-observance-catalogue.ts [year]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import { calculateOccurrencesWithEvaluator } from '../src/lib/calendar/materialize';

const BACKEND_ROOT = path.join(__dirname, '..');
loadEnv({ path: path.join(BACKEND_ROOT, '.env.local'), quiet: true });

const YEAR = parseInt(process.argv[2] ?? '2026', 10);
const OUTPUT_DIR = path.join(BACKEND_ROOT, 'docs/audits/observance-catalogue');

type DbDefinition = {
  id: string;
  slug: string;
  display_name: string;
  kind: string;
  tradition: string;
  created_at: string;
};

type PrimaryStatus =
  | 'resolved'
  | 'deferred'
  | 'missing_rule'
  // A slug with no rules.json entry, but with existing published
  // observance_occurrences rows -- these are LIVE, currently-served dates
  // from a distinct manual-seed mechanism (calculated_by: 'legacy_sync',
  // real external source citations), not orphaned catalogue entries.
  // Confirmed 2026-09-04 (docs/PRD_CALENDAR_MATERIALIZATION_INTEGRITY.md §9)
  // that this project's earlier "migration-era pollution" guess for these
  // was wrong. NOT a safe deletion candidate -- see §9 for the reconciliation
  // work these actually need (two confirmed exact-date duplicates against a
  // rules.json-backed sibling slug, three unexplained day-level
  // discrepancies).
  | 'manual_seed_without_rule'
  | 'expected_zero'
  | 'engine_anomaly';

/**
 * A zero-output year is not inherently an engine anomaly. Entries belong here
 * only when a committed, reviewed source record explains the absence.
 */
const EXPECTED_ZERO_OUTPUT: Record<number, Map<string, string>> = {
  2026: new Map([
    [
      'saphala-ekadashi',
      'Expected zero for 2026: Pausha Krishna Paksha straddles the Gregorian boundary twice in 2027; the documented canonical 2027 occurrence is 2027-12-23. See docs/CALENDAR_ENGINE_ASSESSMENT.md (2026-08-11) and scripts/sweep-adhika-masa-collisions.ts.',
    ],
  ]),
};

interface CatalogueRow {
  slug: string;
  display_name: string;
  kind: string;
  tradition: string;
  created_at: string;
  primary_status: PrimaryStatus;
  launch_status: string | null;
  resolved_dates: string[];
  manual_seed_dates: Array<{ date: string; calculated_by: string | null; source_provenance: unknown }>;
  note: string | null;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: definitions, error: defsError } = await db
    .from('observance_definitions')
    .select('id, slug, display_name, kind, tradition, created_at')
    .eq('active', true)
    .order('slug');
  if (defsError) throw defsError;
  const defs = (definitions ?? []) as DbDefinition[];

  // Existing published occurrence data, independent of what the engine can
  // (re)compute -- this is what actually distinguishes an orphaned catalogue
  // row from a slug that is live today via a manual-seed mechanism the
  // engine knows nothing about. Queried for every definition, not just
  // no-rule ones, so a future definition that loses its rule but keeps old
  // data is caught the same way.
  const { data: publishedOccurrences, error: occError } = await db
    .from('observance_occurrences')
    .select('definition_id, date, calculated_by, source_provenance')
    .eq('publication_status', 'published');
  if (occError) throw occError;
  const publishedByDefinitionId = new Map<string, Array<{ date: string; calculated_by: string | null; source_provenance: unknown }>>();
  for (const row of (publishedOccurrences ?? []) as Array<{ definition_id: string; date: string; calculated_by: string | null; source_provenance: unknown }>) {
    if (!publishedByDefinitionId.has(row.definition_id)) publishedByDefinitionId.set(row.definition_id, []);
    publishedByDefinitionId.get(row.definition_id)!.push({ date: row.date, calculated_by: row.calculated_by, source_provenance: row.source_provenance });
  }

  const rulesPath = path.join(BACKEND_ROOT, 'packages/dharma-rules/src/festivals/rules.json');
  const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8')) as Array<{
    slug: string;
    launch_status?: string;
  }>;
  const ruleSlugs = new Set(rules.map(r => r.slug));
  const launchStatusBySlug = new Map<string, Set<string>>();
  for (const r of rules) {
    if (!launchStatusBySlug.has(r.slug)) launchStatusBySlug.set(r.slug, new Set());
    launchStatusBySlug.get(r.slug)!.add(r.launch_status ?? 'unspecified');
  }

  const { resolved } = calculateOccurrencesWithEvaluator(YEAR);
  const resolvedDatesBySlug = new Map<string, string[]>();
  for (const occ of resolved) {
    if (!resolvedDatesBySlug.has(occ.slug)) resolvedDatesBySlug.set(occ.slug, []);
    resolvedDatesBySlug.get(occ.slug)!.push(occ.date);
  }
  const dbSlugSet = new Set(defs.map(d => d.slug));
  const engineSlugsNotInDb = [...resolvedDatesBySlug.keys()].filter(s => !dbSlugSet.has(s));

  // Migration-era catalogue pollution check for the missing_rule bucket:
  // the corrected_2026_festival_migration batch (bad occurrence data,
  // deleted from production 2026-09-04) ran at 2026-06-24 09:58:33 UTC.
  // A missing_rule definition created within this window is migration-
  // correlated evidence only. It is not proof that the row is orphaned or
  // safe to delete; foreign-key/reference analysis remains required.
  const MIGRATION_WINDOW_START = new Date('2026-06-24T09:00:00Z').getTime();
  const MIGRATION_WINDOW_END = new Date('2026-06-24T10:30:00Z').getTime();

  const rows: CatalogueRow[] = [];
  for (const def of defs) {
    const dates = resolvedDatesBySlug.get(def.slug) ?? [];
    const hasRule = ruleSlugs.has(def.slug);
    const launchStatuses = launchStatusBySlug.get(def.slug);
    const expectedZeroNote = EXPECTED_ZERO_OUTPUT[YEAR]?.get(def.slug);
    const manualSeedDates = publishedByDefinitionId.get(def.id) ?? [];

    let primary_status: PrimaryStatus;
    let note: string | null = null;

    if (dates.length > 0) {
      primary_status = 'resolved';
    } else if (!hasRule) {
      if (manualSeedDates.length > 0) {
        // Confirmed 2026-09-04: this is the live, correct classification for
        // this shape, not 'missing_rule'. See PrimaryStatus's own doc comment
        // and docs/PRD_CALENDAR_MATERIALIZATION_INTEGRITY.md §9 for the full
        // reconciliation finding -- NOT a safe deletion/cleanup candidate.
        primary_status = 'manual_seed_without_rule';
        note = `${manualSeedDates.length} published occurrence row(s) exist from a manual-seed mechanism (${[...new Set(manualSeedDates.map(d => d.calculated_by))].join(', ')}), unrelated to this engine. Needs reconciliation against any rules.json-backed sibling slug before treating either source as authoritative -- see PRD §9.`;
      } else {
        primary_status = 'missing_rule';
        const createdAtMs = new Date(def.created_at).getTime();
        if (createdAtMs >= MIGRATION_WINDOW_START && createdAtMs <= MIGRATION_WINDOW_END) {
          note = 'created_at falls within the corrected_2026_festival_migration window (2026-06-24 09:00-10:30 UTC). This is migration correlation only, and no published occurrence data exists for this slug at all -- inspect references before concluding anything further.';
        }
      }
    } else if (expectedZeroNote) {
      primary_status = 'expected_zero';
      note = expectedZeroNote;
    } else if (launchStatuses?.has('deferred') && launchStatuses.size === 1) {
      primary_status = 'deferred';
      if (manualSeedDates.length > 0) {
        note = `GOVERNANCE GAP: this rule is launch_status:'deferred' (must never present a final date per this project's own governance rules), yet ${manualSeedDates.length} published occurrence row(s) already exist for it. Not resolved by this script -- see PRD §9's open item on deferred rules with pre-existing published rows.`;
      }
    } else {
      primary_status = 'engine_anomaly';
      note = 'Has a rules.json entry, launch_status is not purely deferred, but produced zero occurrences for the target year. Requires the same bounded multi-year diagnosis saphala-ekadashi got before concluding anything -- do not assume defect or non-defect from this row alone.';
    }

    rows.push({
      slug: def.slug,
      display_name: def.display_name,
      kind: def.kind,
      tradition: def.tradition,
      created_at: def.created_at,
      primary_status,
      launch_status: launchStatuses ? [...launchStatuses].join(',') : null,
      resolved_dates: dates,
      manual_seed_dates: manualSeedDates,
      note,
    });
  }

  const counts: Record<PrimaryStatus, number> = { resolved: 0, deferred: 0, missing_rule: 0, manual_seed_without_rule: 0, expected_zero: 0, engine_anomaly: 0 };
  for (const r of rows) counts[r.primary_status]++;
  const total = rows.length;
  const sumCheck = counts.resolved + counts.deferred + counts.missing_rule + counts.manual_seed_without_rule + counts.expected_zero + counts.engine_anomaly;

  const document = {
    generated_at: new Date().toISOString(),
    target_year: YEAR,
    generator: 'scripts/audit-observance-catalogue.ts',
    db_active_definition_count: total,
    engine_resolved_slugs_not_in_db: engineSlugsNotInDb,
    primary_status_counts: counts,
    sum_check_passes: sumCheck === total,
    rows,
  };

  if (!document.sum_check_passes) {
    throw new Error(`Sum check FAILED: ${sumCheck} !== ${total}. Do not trust this report -- classification logic has a gap.`);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const jsonPath = path.join(OUTPUT_DIR, `${YEAR}.json`);
  const mdPath = path.join(OUTPUT_DIR, `${YEAR}.md`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(document, null, 2)}\n`);
  fs.writeFileSync(mdPath, markdown(document));

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
  console.log(`\nCounts: ${JSON.stringify(counts)}  (sum=${sumCheck}, db_total=${total}, match=${document.sum_check_passes})`);
  if (engineSlugsNotInDb.length > 0) {
    console.log(`\nEngine-resolved slugs NOT in DB active-definitions set (excluded from the above, likely series-child pseudo-slugs): ${engineSlugsNotInDb.join(', ')}`);
  }
}

function markdown(doc: ReturnType<typeof buildDocForTypeInference>): string {
  const lines: string[] = [];
  lines.push(`# Observance catalogue audit — ${doc.target_year}`);
  lines.push('');
  lines.push(`Generated: ${doc.generated_at} by \`${doc.generator}\`.`);
  lines.push('');
  lines.push(`DB active definitions: ${doc.db_active_definition_count}. Sum check: ${doc.sum_check_passes ? 'PASS' : 'FAIL'}.`);
  lines.push('');
  lines.push('| Primary status | Count |');
  lines.push('|---|---|');
  for (const [status, count] of Object.entries(doc.primary_status_counts)) {
    lines.push(`| ${status} | ${count} |`);
  }
  lines.push('');
  if (doc.engine_resolved_slugs_not_in_db.length > 0) {
    lines.push(`**Engine-resolved slugs excluded (not real DB definitions):** ${doc.engine_resolved_slugs_not_in_db.join(', ')}`);
    lines.push('');
  }
  lines.push('## Full rows');
  lines.push('');
  lines.push('| Slug | Status | Launch status | Resolved date(s) | Manual-seed date(s) | Note |');
  lines.push('|---|---|---|---|---|---|');
  for (const r of doc.rows) {
    const seedDates = r.manual_seed_dates.map(d => d.date).join(', ') || '—';
    lines.push(`| ${r.slug} | ${r.primary_status} | ${r.launch_status ?? '—'} | ${r.resolved_dates.join(', ') || '—'} | ${seedDates} | ${r.note ?? ''} |`);
  }
  lines.push('');
  return lines.join('\n');
}

// Type-inference helper only; never called.
function buildDocForTypeInference() {
  return {
    generated_at: '',
    target_year: 0,
    generator: '',
    db_active_definition_count: 0,
    engine_resolved_slugs_not_in_db: [] as string[],
    primary_status_counts: {} as Record<PrimaryStatus, number>,
    sum_check_passes: false,
    rows: [] as CatalogueRow[],
  };
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
