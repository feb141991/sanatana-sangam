/**
 * Phase 0 read-only ground-truth audit for the calendar-governance
 * simplification migration. Produces, in one reproducible pass:
 *
 *   (2) every rules.json definition: launch_status, calendar profile/
 *       tradition scope, rule_family, and golden_fixtures coverage
 *   (3) published observance_occurrences rows grouped into
 *       rule-backed / manual-seed-legacy / deferred-rule-backed-but-published
 *   (5) golden_fixtures coverage per festival: total rows, real vs.
 *       placeholder (TODO) citations, approved vs. not
 *
 * Read-only: SELECTs only, no writes, no schema changes, no rule/occurrence
 * modification. Companion items (1) runtime references to governance
 * terminology and (4) API/cron/UI read paths are reported separately in
 * prose (grep-based code survey, not meaningfully tabular).
 *
 * Run: npx tsx scripts/audit-phase0-ground-truth.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';

const BACKEND_ROOT = path.join(__dirname, '..');
loadEnv({ path: path.join(BACKEND_ROOT, '.env.local'), quiet: true });

const OUTPUT_DIR = path.join(BACKEND_ROOT, 'docs/audits/phase0-ground-truth');

type SubObservance = {
  slug: string;
  launch_status?: string;
  citation?: string;
};

type Rule = {
  slug: string;
  launch_status?: string;
  rule_family?: string;
  tradition?: string;
  sampradaya?: string;
  variant_key?: string;
  corrected_month_system?: string;
  sub_observances?: SubObservance[];
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const rulesPath = path.join(BACKEND_ROOT, 'packages/dharma-rules/src/festivals/rules.json');
  const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8')) as Rule[];
  const rulesBySlug = new Map<string, Rule[]>();
  for (const r of rules) {
    if (!rulesBySlug.has(r.slug)) rulesBySlug.set(r.slug, []);
    rulesBySlug.get(r.slug)!.push(r);
  }

  // lunar_tithi_span rules (e.g. navratri-begins) carry named sub_observances
  // (dussehra, durga-ashtami, maha-navami, ...) that are real, cited,
  // launch_status-bearing content -- but never appear as their own top-level
  // rules.json row. Checking only top-level slugs misclassified dussehra as
  // "no rule at all" (manual_seed_legacy) when it is in fact tithi 10 of the
  // navratri-begins span, launch_status: 'included', with a real Tier 1
  // citation -- caught before this report was finalized. Synthesized into a
  // pseudo-rule per sub-observance so downstream classification treats it
  // the same as a real rule.
  for (const r of rules) {
    if (r.rule_family !== 'lunar_tithi_span' || !r.sub_observances) continue;
    for (const sub of r.sub_observances) {
      if (!rulesBySlug.has(sub.slug)) rulesBySlug.set(sub.slug, []);
      rulesBySlug.get(sub.slug)!.push({
        slug: sub.slug,
        launch_status: sub.launch_status,
        rule_family: `${r.rule_family}:sub_observance_of:${r.slug}`,
      });
    }
  }

  const { data: definitions, error: defsError } = await db
    .from('observance_definitions')
    .select('id, slug, display_name, kind, tradition, active')
    .eq('active', true)
    .order('slug');
  if (defsError) throw defsError;
  const defIdToSlug = new Map((definitions ?? []).map((d: any) => [d.id, d.slug]));

  // --- (5) golden_fixtures coverage ---
  const { data: fixtures, error: fixturesError } = await db
    .from('golden_fixtures')
    .select('festival_id, year, approved, source');
  if (fixturesError) throw fixturesError;
  const fixturesByFestival = new Map<string, Array<{ year: number; approved: boolean; isPlaceholder: boolean }>>();
  for (const f of (fixtures ?? []) as any[]) {
    const citation = f.source?.citation as string | undefined;
    const isPlaceholder = !citation || citation.startsWith('TODO');
    if (!fixturesByFestival.has(f.festival_id)) fixturesByFestival.set(f.festival_id, []);
    fixturesByFestival.get(f.festival_id)!.push({ year: f.year, approved: !!f.approved, isPlaceholder });
  }

  // --- (2) rules.json definition rows, with fixture coverage joined in ---
  const ruleRows = (definitions ?? []).map((def: any) => {
    const ruleEntries = rulesBySlug.get(def.slug) ?? [];
    const launchStatuses = [...new Set(ruleEntries.map(r => r.launch_status ?? 'unspecified'))];
    const ruleFamilies = [...new Set(ruleEntries.map(r => r.rule_family ?? null).filter(Boolean))];
    const variants = ruleEntries.map(r => r.sampradaya ?? r.variant_key ?? null).filter(Boolean);
    const fx = fixturesByFestival.get(def.slug) ?? [];
    return {
      slug: def.slug,
      display_name: def.display_name,
      kind: def.kind,
      tradition: def.tradition,
      has_rule: ruleEntries.length > 0,
      launch_statuses: launchStatuses,
      rule_families: ruleFamilies,
      variant_count: ruleEntries.length,
      variants,
      fixture_total: fx.length,
      fixture_real_citations: fx.filter(f => !f.isPlaceholder).length,
      fixture_placeholder_citations: fx.filter(f => f.isPlaceholder).length,
      fixture_approved: fx.filter(f => f.approved).length,
      fixture_years: [...new Set(fx.map(f => f.year))].sort(),
    };
  });

  // --- (3) published occurrences grouped into 3 buckets ---
  const { data: occurrences, error: occError } = await db
    .from('observance_occurrences')
    .select('definition_id, date, year, calculated_by, calendar_profile')
    .eq('publication_status', 'published');
  if (occError) throw occError;

  type Bucket = 'rule_backed' | 'manual_seed_legacy' | 'deferred_rule_backed_but_published';
  const bucketCounts: Record<Bucket, number> = { rule_backed: 0, manual_seed_legacy: 0, deferred_rule_backed_but_published: 0 };
  const bucketSlugs: Record<Bucket, Set<string>> = { rule_backed: new Set(), manual_seed_legacy: new Set(), deferred_rule_backed_but_published: new Set() };

  for (const occ of (occurrences ?? []) as any[]) {
    const slug = defIdToSlug.get(occ.definition_id);
    if (!slug) continue;
    const ruleEntries = rulesBySlug.get(slug) ?? [];
    const hasRule = ruleEntries.length > 0;
    const allDeferred = hasRule && ruleEntries.every(r => r.launch_status === 'deferred');

    let bucket: Bucket;
    if (!hasRule) bucket = 'manual_seed_legacy';
    else if (allDeferred) bucket = 'deferred_rule_backed_but_published';
    else bucket = 'rule_backed';

    bucketCounts[bucket]++;
    bucketSlugs[bucket].add(slug);
  }

  const document = {
    generated_at: new Date().toISOString(),
    generator: 'scripts/audit-phase0-ground-truth.ts',
    definitions_total: ruleRows.length,
    rule_definitions: ruleRows,
    golden_fixtures_summary: {
      total_rows: (fixtures ?? []).length,
      distinct_festivals: fixturesByFestival.size,
      real_citation_rows: (fixtures ?? []).filter((f: any) => f.source?.citation && !String(f.source.citation).startsWith('TODO')).length,
      placeholder_citation_rows: (fixtures ?? []).filter((f: any) => !f.source?.citation || String(f.source.citation).startsWith('TODO')).length,
      approved_rows: (fixtures ?? []).filter((f: any) => f.approved).length,
    },
    published_occurrences_total: (occurrences ?? []).length,
    published_occurrences_by_bucket: {
      rule_backed: { row_count: bucketCounts.rule_backed, distinct_slugs: [...bucketSlugs.rule_backed].sort() },
      manual_seed_legacy: { row_count: bucketCounts.manual_seed_legacy, distinct_slugs: [...bucketSlugs.manual_seed_legacy].sort() },
      deferred_rule_backed_but_published: { row_count: bucketCounts.deferred_rule_backed_but_published, distinct_slugs: [...bucketSlugs.deferred_rule_backed_but_published].sort() },
    },
    published_occurrences_by_calculated_by: Object.fromEntries(
      Object.entries(
        (occurrences ?? []).reduce((acc: Record<string, number>, o: any) => {
          acc[o.calculated_by ?? 'null'] = (acc[o.calculated_by ?? 'null'] ?? 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => (b[1] as number) - (a[1] as number))
    ),
  };

  const sumCheck = bucketCounts.rule_backed + bucketCounts.manual_seed_legacy + bucketCounts.deferred_rule_backed_but_published;
  if (sumCheck !== document.published_occurrences_total) {
    throw new Error(`Sum check FAILED: bucket total ${sumCheck} !== published total ${document.published_occurrences_total}`);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const jsonPath = path.join(OUTPUT_DIR, 'ground-truth.json');
  fs.writeFileSync(jsonPath, `${JSON.stringify(document, null, 2)}\n`);

  console.log(`Wrote ${jsonPath}`);
  console.log(`\nDefinitions: ${document.definitions_total}`);
  console.log(`Golden fixtures: ${document.golden_fixtures_summary.total_rows} rows, ${document.golden_fixtures_summary.distinct_festivals} festivals, ${document.golden_fixtures_summary.real_citation_rows} real citations, ${document.golden_fixtures_summary.placeholder_citation_rows} placeholders, ${document.golden_fixtures_summary.approved_rows} approved`);
  console.log(`Published occurrences: ${document.published_occurrences_total} total`);
  console.log(`  rule_backed: ${bucketCounts.rule_backed} rows / ${bucketSlugs.rule_backed.size} slugs`);
  console.log(`  manual_seed_legacy: ${bucketCounts.manual_seed_legacy} rows / ${bucketSlugs.manual_seed_legacy.size} slugs`);
  console.log(`  deferred_rule_backed_but_published: ${bucketCounts.deferred_rule_backed_but_published} rows / ${bucketSlugs.deferred_rule_backed_but_published.size} slugs`);
  console.log(`  sum check: ${sumCheck === document.published_occurrences_total ? 'PASS' : 'FAIL'}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
