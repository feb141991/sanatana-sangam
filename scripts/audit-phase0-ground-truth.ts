/**
 * Phase 0 read-only ground-truth audit for the calendar-governance
 * simplification migration. Produces, in one reproducible pass:
 *
 *   (2) every rules.json definition: launch_status, calendar profile/
 *       tradition scope, rule_family, and golden_fixtures coverage
 *   (3) published observance_occurrences rows classified by provenance
 *       and by the SPECIFIC rule variant each row's own variant_key/
 *       spiritual_tradition matches (see classifyOccurrence below)
 *   (5) golden_fixtures coverage per festival: total rows, real vs.
 *       placeholder (TODO) citations, approved vs. not
 *
 * Read-only: SELECTs only, no writes, no schema changes, no rule/occurrence
 * modification. Companion items (1) runtime references to governance
 * terminology and (4) API/cron/UI read paths are reported separately in
 * prose (grep-based code survey, not meaningfully tabular).
 *
 * Corrected after review (2026-09-05), two real contract defects fixed
 * before this was treated as a migration baseline:
 *
 * 1. The original classification was SLUG-level: a slug counted as
 *    deferred only if EVERY rule variant for it was deferred. A slug with
 *    one included and one deferred variant (e.g. a regional/sampradaya
 *    split) was counted as ordinary rule_backed even when the specific
 *    STORED ROW belonged to the deferred variant -- because the query
 *    never fetched variant_key/spiritual_tradition to check. Fixed:
 *    classifyOccurrence() now resolves each row to its specific matching
 *    rule variant first, and only falls back to slug-level aggregation
 *    (flagged as `ambiguous_variant_*`, never silently as clean
 *    `rule_backed`) when no specific variant can be matched.
 * 2. The old `manual_seed_legacy` bucket was inferred purely from "no rule
 *    exists for this slug" -- `calculated_by` was fetched but never
 *    checked. Renamed to `unruled_published`, split into
 *    `unruled_published_legacy_sync_confirmed` (calculated_by ===
 *    'legacy_sync', actually verified) and
 *    `unruled_published_other_provenance` (no rule, but NOT verified as
 *    that specific writer) so later cleanup work can't act on an unproven
 *    provenance assumption.
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

export type Rule = {
  slug: string;
  launch_status?: string;
  rule_family?: string;
  tradition?: string;
  sampradaya?: string;
  variant_key?: string;
  corrected_month_system?: string;
  sub_observances?: SubObservance[];
};

export type OccurrenceRow = {
  definition_id: string;
  calculated_by: string | null;
  variant_key: string | null;
  spiritual_tradition: string | null;
};

export type Bucket =
  | 'rule_backed'
  // A slug has 2+ rule variants and this row's variant_key/spiritual_tradition
  // didn't match any of them specifically (e.g. a generic 'legacy-default'
  // variant_key on a multi-variant rule). Deliberately NOT folded into
  // rule_backed: if the un-matched variants are all non-deferred, the
  // ambiguity is cosmetic; if any of them IS deferred, silently defaulting
  // to rule_backed would understate the deferred-publication gap, which is
  // exactly the failure mode this bucket exists to avoid.
  | 'ambiguous_variant_rule_backed'
  | 'ambiguous_variant_deferred_risk'
  | 'deferred_rule_backed_but_published'
  // Split from the old single manual_seed_legacy bucket: only rows whose
  // calculated_by is ACTUALLY verified as 'legacy_sync' land here. Every
  // other unruled row -- regardless of how plausible its provenance looks --
  // goes to unruled_published_other_provenance instead, so a later cleanup
  // pass can't inherit an unproven assumption about where the row came from.
  | 'unruled_published_legacy_sync_confirmed'
  | 'unruled_published_other_provenance';

/**
 * Classifies one published occurrence row against the rule(s) for its slug.
 * Pure function, no I/O -- see scripts/__tests__/audit-phase0-ground-truth.test.ts
 * for the three required cases (mixed included/deferred variants, an
 * unruled row NOT from legacy_sync, a true legacy_sync unruled row).
 */
export function classifyOccurrence(occ: OccurrenceRow, ruleEntries: Rule[]): Bucket {
  if (ruleEntries.length === 0) {
    return occ.calculated_by === 'legacy_sync'
      ? 'unruled_published_legacy_sync_confirmed'
      : 'unruled_published_other_provenance';
  }

  if (ruleEntries.length === 1) {
    return ruleEntries[0].launch_status === 'deferred' ? 'deferred_rule_backed_but_published' : 'rule_backed';
  }

  // 2+ variants for this slug: resolve THIS ROW to its specific variant via
  // variant_key first, then spiritual_tradition -- two SEPARATE lookup
  // attempts, not one combined `||` value. `occ.variant_key || occ.
  // spiritual_tradition` (an earlier version of this line) picks whichever
  // is truthy and tries only that one: a row with a present-but-generic
  // variant_key (e.g. 'legacy-default' on a legacy row that never recorded
  // a real variant) would never fall through to spiritual_tradition, even
  // when spiritual_tradition alone would have matched a real rule variant
  // exactly. Caught on review before this was treated as final.
  const matchField = (value: string | null | undefined) =>
    value ? ruleEntries.find(r => (r.variant_key ?? r.sampradaya) === value) : undefined;
  const matched = matchField(occ.variant_key) ?? matchField(occ.spiritual_tradition);

  if (matched) {
    return matched.launch_status === 'deferred' ? 'deferred_rule_backed_but_published' : 'rule_backed';
  }

  // Could not resolve to a specific variant. Fail toward visibility, not
  // toward the reassuring answer: if ANY variant for this slug is deferred,
  // this row's own governance status is genuinely unknown and must not be
  // reported as clean rule_backed.
  const anyDeferred = ruleEntries.some(r => r.launch_status === 'deferred');
  return anyDeferred ? 'ambiguous_variant_deferred_risk' : 'ambiguous_variant_rule_backed';
}

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

  // --- (3) published occurrences classified by provenance ---
  const { data: occurrences, error: occError } = await db
    .from('observance_occurrences')
    .select('definition_id, date, year, calculated_by, calendar_profile, variant_key, spiritual_tradition')
    .eq('publication_status', 'published');
  if (occError) throw occError;

  const bucketCounts: Record<Bucket, number> = {
    rule_backed: 0,
    ambiguous_variant_rule_backed: 0,
    ambiguous_variant_deferred_risk: 0,
    deferred_rule_backed_but_published: 0,
    unruled_published_legacy_sync_confirmed: 0,
    unruled_published_other_provenance: 0,
  };
  const bucketSlugs: Record<Bucket, Set<string>> = {
    rule_backed: new Set(),
    ambiguous_variant_rule_backed: new Set(),
    ambiguous_variant_deferred_risk: new Set(),
    deferred_rule_backed_but_published: new Set(),
    unruled_published_legacy_sync_confirmed: new Set(),
    unruled_published_other_provenance: new Set(),
  };

  for (const occ of (occurrences ?? []) as OccurrenceRow[]) {
    const slug = defIdToSlug.get(occ.definition_id);
    if (!slug) continue;
    const ruleEntries = rulesBySlug.get(slug) ?? [];
    const bucket = classifyOccurrence(occ, ruleEntries);
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
    published_occurrences_by_bucket: Object.fromEntries(
      (Object.keys(bucketCounts) as Bucket[]).map(b => [
        b,
        { row_count: bucketCounts[b], distinct_slugs: [...bucketSlugs[b]].sort() },
      ]),
    ),
    published_occurrences_by_calculated_by: Object.fromEntries(
      Object.entries(
        (occurrences ?? []).reduce((acc: Record<string, number>, o: any) => {
          acc[o.calculated_by ?? 'null'] = (acc[o.calculated_by ?? 'null'] ?? 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => (b[1] as number) - (a[1] as number))
    ),
  };

  const sumCheck = (Object.keys(bucketCounts) as Bucket[]).reduce((sum, b) => sum + bucketCounts[b], 0);
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
  for (const b of Object.keys(bucketCounts) as Bucket[]) {
    console.log(`  ${b}: ${bucketCounts[b]} rows / ${bucketSlugs[b].size} slugs`);
  }
  console.log(`  sum check: ${sumCheck === document.published_occurrences_total ? 'PASS' : 'FAIL'}`);
}

// Guards against running the full DB-querying main() as a side effect of
// importing this module for its exported pure functions (classifyOccurrence,
// Rule, OccurrenceRow) -- see audit-phase0-ground-truth.test.ts.
if (require.main === module) {
  main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
