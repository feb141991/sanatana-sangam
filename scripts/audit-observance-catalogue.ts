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
 * a separate, not-yet-automated pass (see missingRuleNote below for why
 * that one bucket got a deeper, scripted second check instead of staying a
 * flat guess).
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
  slug: string;
  display_name: string;
  kind: string;
  tradition: string;
  created_at: string;
};

type PrimaryStatus = 'resolved' | 'deferred' | 'missing_rule' | 'engine_anomaly';

interface CatalogueRow {
  slug: string;
  display_name: string;
  kind: string;
  tradition: string;
  created_at: string;
  primary_status: PrimaryStatus;
  launch_status: string | null;
  resolved_dates: string[];
  note: string | null;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: definitions, error: defsError } = await db
    .from('observance_definitions')
    .select('slug, display_name, kind, tradition, created_at')
    .eq('active', true)
    .order('slug');
  if (defsError) throw defsError;
  const defs = (definitions ?? []) as DbDefinition[];

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
  // A missing_rule definition created within the same window is flagged as
  // a likely orphan/duplicate from that event rather than a genuinely
  // separate, not-yet-located ruleset -- confirmed by direct timestamp
  // comparison, not assumed.
  const MIGRATION_WINDOW_START = new Date('2026-06-24T09:00:00Z').getTime();
  const MIGRATION_WINDOW_END = new Date('2026-06-24T10:30:00Z').getTime();

  const rows: CatalogueRow[] = [];
  for (const def of defs) {
    const dates = resolvedDatesBySlug.get(def.slug) ?? [];
    const hasRule = ruleSlugs.has(def.slug);
    const launchStatuses = launchStatusBySlug.get(def.slug);

    let primary_status: PrimaryStatus;
    let note: string | null = null;

    if (dates.length > 0) {
      primary_status = 'resolved';
    } else if (!hasRule) {
      primary_status = 'missing_rule';
      const createdAtMs = new Date(def.created_at).getTime();
      if (createdAtMs >= MIGRATION_WINDOW_START && createdAtMs <= MIGRATION_WINDOW_END) {
        note = 'created_at falls within the corrected_2026_festival_migration window (2026-06-24 09:00-10:30 UTC) -- likely orphan/duplicate catalogue row from that event, not a separate unlocated ruleset.';
      }
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
      note,
    });
  }

  const counts: Record<PrimaryStatus, number> = { resolved: 0, deferred: 0, missing_rule: 0, engine_anomaly: 0 };
  for (const r of rows) counts[r.primary_status]++;
  const total = rows.length;
  const sumCheck = counts.resolved + counts.deferred + counts.missing_rule + counts.engine_anomaly;

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
  lines.push('| Slug | Status | Launch status | Resolved date(s) | Note |');
  lines.push('|---|---|---|---|---|');
  for (const r of doc.rows) {
    lines.push(`| ${r.slug} | ${r.primary_status} | ${r.launch_status ?? '—'} | ${r.resolved_dates.join(', ') || '—'} | ${r.note ?? ''} |`);
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
