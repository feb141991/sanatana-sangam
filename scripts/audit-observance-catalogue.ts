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
import { findDeferredPublishedGap } from './deferred-publication-audit';
import { filterWithheldJoinedRows } from '../src/lib/calendar/withheld';
import { attachMaterialisationBatches } from '../src/lib/calendar/occurrence-reader';

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

type OccurrenceAuditRow = {
  id: string;
  definition_id: string;
  batch_id: string | null;
  date: string;
  occurrence_date: string | null;
  year: number | null;
  calendar_profile: string | null;
  spiritual_tradition: string | null;
  variant_key: string | null;
  computed_latitude: number | null;
  computed_longitude: number | null;
  computed_timezone: string | null;
  manual_date_override: string | null;
  review_status: string | null;
  verification_status: string | null;
  audit_status: string | null;
  publication_status: string | null;
  final_date_source: string | null;
  calculated_by: string | null;
  source_provenance: unknown;
  diagnostics: unknown;
  source_refs: unknown;
  observance_definitions: { slug?: string | null } | Array<{ slug?: string | null }> | null;
};

type DuplicateIdentityGroup = {
  definition_id: string;
  year: number | null;
  calendar_profile: string | null;
  occurrence_date: string | null;
  variant_key: string | null;
  computed_latitude: number | null;
  computed_longitude: number | null;
  computed_timezone: string | null;
  row_count: number;
};

type PrimaryStatus =
  | 'resolved'
  | 'deferred'
  | 'missing_rule'
  | 'series_child'
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
  published_occurrences: {
    total_rows: number;
    read_visible_rows: number;
    withheld_rows: number;
    distinct_dates: number;
    target_year_dates: Array<{ date: string; rows: number }>;
  };
  note: string | null;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const defs: DbDefinition[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from('observance_definitions')
      .select('id, slug, display_name, kind, tradition, created_at')
      .eq('active', true)
      .order('slug')
      .order('id')
      .range(from, from + 999);
    if (error) throw error;
    const page = (data ?? []) as DbDefinition[];
    defs.push(...page);
    if (page.length < 1000) break;
  }
  // All published occurrence data, independent of what the engine currently
  // computes. Query every definition so stale rows remain visible to audit.
  const publishedByDefinitionId = new Map<string, Array<OccurrenceAuditRow>>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from('observance_occurrences')
      .select('id, definition_id, batch_id, date, occurrence_date, year, calendar_profile, spiritual_tradition, variant_key, computed_latitude, computed_longitude, computed_timezone, manual_date_override, review_status, verification_status, audit_status, publication_status, final_date_source, calculated_by, source_provenance, diagnostics, source_refs, observance_definitions(slug)')
      .eq('publication_status', 'published')
      .order('id')
      .range(from, from + 999);
    if (error) throw error;
    const page = (data ?? []) as OccurrenceAuditRow[];
    for (const row of page) {
      if (!publishedByDefinitionId.has(row.definition_id)) publishedByDefinitionId.set(row.definition_id, []);
      publishedByDefinitionId.get(row.definition_id)!.push(row);
    }
    if (page.length < 1000) break;
  }
  const identityGroups = new Map<string, DuplicateIdentityGroup>();
  for (const row of [...publishedByDefinitionId.values()].flat()) {
    const key = JSON.stringify([
      row.definition_id, row.year, row.calendar_profile, row.occurrence_date,
      row.variant_key, row.computed_latitude, row.computed_longitude, row.computed_timezone,
    ]);
    const existing = identityGroups.get(key);
    if (existing) existing.row_count++;
    else identityGroups.set(key, {
      definition_id: row.definition_id,
      year: row.year,
      calendar_profile: row.calendar_profile,
      occurrence_date: row.occurrence_date,
      variant_key: row.variant_key,
      computed_latitude: row.computed_latitude,
      computed_longitude: row.computed_longitude,
      computed_timezone: row.computed_timezone,
      row_count: 1,
    });
  }
  const duplicateIdentityGroups = [...identityGroups.values()].filter(group => group.row_count > 1);

  const rulesPath = path.join(BACKEND_ROOT, 'packages/dharma-rules/src/festivals/rules.json');
  const seriesPath = path.join(BACKEND_ROOT, 'packages/dharma-rules/src/festivals/series.json');
  const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8')) as Array<{
    slug: string;
    launch_status?: string;
    sub_observances?: Array<{ slug: string; launch_status?: string }>;
  }>;
  const series = JSON.parse(fs.readFileSync(seriesPath, 'utf-8')) as Array<{
    definitionKey: string;
    children: Array<{ slug: string }>;
  }>;
  const ruleSlugs = new Set(rules.map(r => r.slug));
  const launchStatusBySlug = new Map<string, Set<string>>();
  const seriesSlugs = new Set(series.flatMap(item => item.children.map(child => child.slug)));
  for (const r of rules) {
    if (!launchStatusBySlug.has(r.slug)) launchStatusBySlug.set(r.slug, new Set());
    launchStatusBySlug.get(r.slug)!.add(r.launch_status ?? 'unspecified');
    for (const child of r.sub_observances ?? []) {
      ruleSlugs.add(child.slug);
      if (!launchStatusBySlug.has(child.slug)) launchStatusBySlug.set(child.slug, new Set());
      launchStatusBySlug.get(child.slug)!.add(child.launch_status ?? r.launch_status ?? 'unspecified');
    }
  }

  // Apply the production read-time gate's dynamic batch/fixture checks to the
  // deferred-rule subset. These fields are computed, not stored as columns.
  const deferredDefinitions = defs.filter(def => {
    const statuses = launchStatusBySlug.get(def.slug);
    return statuses?.size === 1 && statuses.has('deferred');
  });
  const deferredOccurrenceRows = deferredDefinitions.flatMap(def => publishedByDefinitionId.get(def.id) ?? []);
  const readMetadataRows = deferredOccurrenceRows.length > 0
    ? await attachMaterialisationBatches(deferredOccurrenceRows)
    : [];
  const readMetadataById = new Map(readMetadataRows.map(row => [row.id, row]));

  const { resolved } = calculateOccurrencesWithEvaluator(YEAR);
  const resolvedDatesBySlug = new Map<string, string[]>();
  for (const occ of resolved) {
    if (!resolvedDatesBySlug.has(occ.slug)) resolvedDatesBySlug.set(occ.slug, []);
    resolvedDatesBySlug.get(occ.slug)!.push(occ.date);
  }
  for (const [slug, dates] of resolvedDatesBySlug) {
    resolvedDatesBySlug.set(slug, [...new Set(dates)].sort());
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
    const publishedRows = publishedByDefinitionId.get(def.id) ?? [];
    // Match the strict read-time gate used by calendar APIs. A row may be
    // marked published in storage yet correctly withheld from users; exact
    // approved fixtures and the founder-scoped Pitru conclusion are allowed.
    const rowsWithReadMetadata = publishedRows.map(row => readMetadataById.get(row.id) ?? row);
    const readVisiblePublishedRows = filterWithheldJoinedRows(rowsWithReadMetadata);
    const deferredPublicationGap = findDeferredPublishedGap(
      launchStatuses ? [...launchStatuses] : null,
      readVisiblePublishedRows,
    );
    const targetYearRows = new Map<string, number>();
    for (const row of publishedRows) {
      if (row.date.startsWith(`${YEAR}-`)) targetYearRows.set(row.date, (targetYearRows.get(row.date) ?? 0) + 1);
    }
    const publishedSummary = {
      total_rows: publishedRows.length,
      read_visible_rows: readVisiblePublishedRows.length,
      withheld_rows: publishedRows.length - readVisiblePublishedRows.length,
      distinct_dates: new Set(publishedRows.map(row => row.date)).size,
      target_year_dates: [...targetYearRows.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, rows]) => ({ date, rows })),
    };

    let primary_status: PrimaryStatus;
    // Keep this independent of primary_status: an engine-produced date does
    // not make an exclusively deferred rule safe to publish.
    let note: string | null = deferredPublicationGap?.note ?? null;

    if (dates.length > 0) {
      primary_status = 'resolved';
    } else if (!hasRule) {
      if (publishedRows.length > 0 && !seriesSlugs.has(def.slug)) {
        // Confirmed 2026-09-04: this is the live, correct classification for
        // this shape, not 'missing_rule'. See PrimaryStatus's own doc comment
        // and docs/PRD_CALENDAR_MATERIALIZATION_INTEGRITY.md §9 for the full
        // reconciliation finding -- NOT a safe deletion/cleanup candidate.
        primary_status = 'manual_seed_without_rule';
        note = `${publishedRows.length} published occurrence row(s) exist, but there is no direct rule or series-child definition. Needs reconciliation against any rules.json-backed sibling slug before treating either source as authoritative -- see PRD §9.`;
      } else if (seriesSlugs.has(def.slug)) {
        primary_status = 'series_child';
        note = 'This is a child occurrence in festivals/series.json, not a standalone rules.json rule. Its date is governed by the parent series and should not be counted as a missing rule.';
      } else {
        primary_status = 'missing_rule';
        const createdAtMs = new Date(def.created_at).getTime();
        if (createdAtMs >= MIGRATION_WINDOW_START && createdAtMs <= MIGRATION_WINDOW_END) {
          note = 'created_at falls within the corrected_2026_festival_migration window (2026-06-24 09:00-10:30 UTC). This is migration correlation only, and no published occurrence data exists for this slug at all -- inspect references before concluding anything further.';
        }
      }
    } else if (expectedZeroNote) {
      primary_status = 'expected_zero';
      note = note ? `${note} ${expectedZeroNote}` : expectedZeroNote;
    } else if (launchStatuses?.has('deferred') && launchStatuses.size === 1) {
      primary_status = 'deferred';
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
      published_occurrences: publishedSummary,
      note,
    });
  }

  const counts: Record<PrimaryStatus, number> = { resolved: 0, deferred: 0, missing_rule: 0, series_child: 0, manual_seed_without_rule: 0, expected_zero: 0, engine_anomaly: 0 };
  for (const r of rows) counts[r.primary_status]++;
  const total = rows.length;
  const sumCheck = counts.resolved + counts.deferred + counts.missing_rule + counts.series_child + counts.manual_seed_without_rule + counts.expected_zero + counts.engine_anomaly;

  const document = {
    generated_at: new Date().toISOString(),
    target_year: YEAR,
    generator: 'scripts/audit-observance-catalogue.ts',
    db_active_definition_count: total,
    engine_resolved_slugs_not_in_db: engineSlugsNotInDb,
    published_duplicate_identity_groups: duplicateIdentityGroups,
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
  lines.push(`Published duplicate materialization identities: ${doc.published_duplicate_identity_groups.length}. Identity uses definition/year/profile/date/variant/location, matching the database uniqueness key.`);
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
  lines.push('| Slug | Kind | Status | Rule status | Engine dates in target year | Published rows (all years) | Published target-year dates (rows/date) | Note |');
  lines.push('|---|---|---|---|---|---|');
  for (const r of doc.rows) {
    const targetDates = r.published_occurrences.target_year_dates.map(item => `${item.date} (${item.rows})`).join(', ') || '—';
    lines.push(`| ${r.slug} | ${r.kind} | ${r.primary_status} | ${r.launch_status ?? '—'} | ${r.resolved_dates.join(', ') || '—'} | ${r.published_occurrences.total_rows} stored / ${r.published_occurrences.read_visible_rows} read-visible / ${r.published_occurrences.withheld_rows} withheld | ${targetDates} | ${r.note ?? ''} |`);
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
    published_duplicate_identity_groups: [] as DuplicateIdentityGroup[],
    primary_status_counts: {} as Record<PrimaryStatus, number>,
    sum_check_passes: false,
    rows: [] as CatalogueRow[],
  };
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
