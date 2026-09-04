/**
 * Structured ratification-note classification for the `resolved` bucket of
 * docs/audits/observance-catalogue/<year>.json.
 *
 * Read-only, bounded: reads rules.json only, writes a report. No DB access,
 * no calendar-behavior change.
 *
 * Deliberately does NOT parse ratification_note prose into a verdict via
 * string-matching heuristics -- that is exactly the "infer approval from
 * prose" failure mode this pass exists to avoid. Only two machine-readable
 * rules.json fields drive any flag:
 *   - `disputed_years` (int[]): authoritative, author-declared dispute list.
 *   - `citation` (string): authoritative, author-declared source name.
 * `ratification_note` is carried through VERBATIM as an evidence field for
 * human review, never interpreted.
 *
 * Every flag is scoped to an explicit (source, year, profile) triple, not a
 * global verdict. `no_structured_dispute_for_target_year` is deliberately
 * NOT named "confirmed" -- disputed_years being empty only means no
 * specific year is flagged as astronomically disputed; it says nothing
 * about unresolved methodology/profile-convention questions ("PENDING
 * COUNCIL RATIFICATION" can and does appear alongside empty disputed_years
 * -- confirmed on maha-shivaratri, a real false positive an earlier version
 * of this script produced by conflating the two). A row with a
 * ratification_note always ALSO gets
 * `has_ratification_note_requiring_human_read`, and that note is carried
 * verbatim -- read it before treating any slug as settled. All flags carry
 * `computed_location_profile` so it's clear this audit run's evidence is
 * scoped to one reference point (Ujjain, the profile
 * calculateOccurrencesWithEvaluator uses by default), not validated across
 * every calendar_profile.
 *
 * Run: npx tsx scripts/classify-ratification-notes.ts [year]
 */
import fs from 'node:fs';
import path from 'node:path';

const BACKEND_ROOT = path.join(__dirname, '..');
const YEAR = parseInt(process.argv[2] ?? '2026', 10);
const CATALOGUE_PATH = path.join(BACKEND_ROOT, `docs/audits/observance-catalogue/${YEAR}.json`);
const OUTPUT_DIR = path.join(BACKEND_ROOT, 'docs/audits/ratification-notes');
const COMPUTED_LOCATION_PROFILE = 'legacy-ujjain reference point (23.1765, 75.7885, Asia/Kolkata) -- NOT validated across other calendar_profiles';

type RuleRow = {
  slug: string;
  sampradaya?: string;
  variant_key?: string;
  citation?: string;
  disputed_years?: number[];
  ratification_note?: string;
  launch_status?: string;
};

type Flag =
  // NOTE: this is weaker than it sounds. disputed_years is the ONLY
  // machine-readable per-year signal rules.json carries. Its absence means
  // "no specific year is flagged as astronomically disputed" -- it does
  // NOT mean "confirmed." A rule can be disputed on entirely different,
  // undeclared-per-year grounds (month-system/profile-convention questions,
  // "PENDING COUNCIL RATIFICATION") that disputed_years never captures.
  // Confirmed via a real false positive on maha-shivaratri: empty
  // disputed_years + a citation, yet its own ratification_note reads
  // "PENDING COUNCIL RATIFICATION -- not fully settled." An earlier version
  // of this flag was named `current_year_confirmed` and over-claimed
  // exactly this. Renamed, and its own type name is the caveat: read
  // ratification_note_verbatim before treating any slug as settled.
  | { type: 'no_structured_dispute_for_target_year'; source: string; year: number; profile: string }
  | { type: 'future_year_disputed'; source: string | null; disputed_years: number[] }
  | { type: 'profile_scope_unverified'; profile: string }
  | { type: 'no_current_year_source' }
  | { type: 'has_ratification_note_requiring_human_read' };

interface RuleRowEvidence {
  sampradaya_or_variant: string | null;
  citation: string | null;
  disputed_years: number[];
  target_year_in_disputed_years: boolean;
  has_ratification_note: boolean;
  ratification_note_verbatim: string | null;
}

interface SlugClassification {
  slug: string;
  target_year: number;
  computed_location_profile: string;
  rule_rows: RuleRowEvidence[];
  flags: Flag[];
}

async function main() {
  const catalogue = JSON.parse(fs.readFileSync(CATALOGUE_PATH, 'utf-8')) as {
    rows: Array<{ slug: string; primary_status: string }>;
  };
  const resolvedSlugs = new Set(
    catalogue.rows.filter(r => r.primary_status === 'resolved').map(r => r.slug),
  );

  const rulesPath = path.join(BACKEND_ROOT, 'packages/dharma-rules/src/festivals/rules.json');
  const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8')) as RuleRow[];
  const rowsBySlug = new Map<string, RuleRow[]>();
  for (const r of rules) {
    if (!rowsBySlug.has(r.slug)) rowsBySlug.set(r.slug, []);
    rowsBySlug.get(r.slug)!.push(r);
  }

  const classifications: SlugClassification[] = [];

  for (const slug of [...resolvedSlugs].sort()) {
    const ruleRows = rowsBySlug.get(slug) ?? [];
    const evidence: RuleRowEvidence[] = ruleRows.map(r => {
      const disputedYears = r.disputed_years ?? [];
      return {
        sampradaya_or_variant: r.sampradaya ?? r.variant_key ?? null,
        citation: r.citation ?? null,
        disputed_years: disputedYears,
        target_year_in_disputed_years: disputedYears.includes(YEAR),
        has_ratification_note: Boolean(r.ratification_note),
        ratification_note_verbatim: r.ratification_note ?? null,
      };
    });

    const flags: Flag[] = [];

    for (const row of evidence) {
      if (row.target_year_in_disputed_years) {
        // Target year itself is structurally disputed -- this is the
        // opposite of "confirmed," surfaced distinctly from the
        // future-year case.
        flags.push({ type: 'future_year_disputed', source: row.citation, disputed_years: row.disputed_years });
      } else if (row.disputed_years.length > 0) {
        // Some OTHER year is disputed; target year is not on that list.
        flags.push({ type: 'future_year_disputed', source: row.citation, disputed_years: row.disputed_years });
      }
      if (row.citation && !row.target_year_in_disputed_years) {
        flags.push({ type: 'no_structured_dispute_for_target_year', source: row.citation, year: YEAR, profile: COMPUTED_LOCATION_PROFILE });
      }
      if (row.has_ratification_note) {
        flags.push({ type: 'has_ratification_note_requiring_human_read' });
      }
    }

    const anySource = evidence.some(e => e.citation || e.has_ratification_note);
    if (!anySource) {
      flags.push({ type: 'no_current_year_source' });
    }

    // Scoped caveat applied uniformly: this audit run only computed against
    // one reference point. Always present unless a future pass adds real
    // cross-profile verification.
    flags.push({ type: 'profile_scope_unverified', profile: COMPUTED_LOCATION_PROFILE });

    classifications.push({
      slug,
      target_year: YEAR,
      computed_location_profile: COMPUTED_LOCATION_PROFILE,
      rule_rows: evidence,
      flags,
    });
  }

  const withNoSource = classifications.filter(c => c.flags.some(f => f.type === 'no_current_year_source'));
  const withFutureDisputed = classifications.filter(c => c.flags.some(f => f.type === 'future_year_disputed'));
  const withNoStructuredDispute = classifications.filter(c => c.flags.some(f => f.type === 'no_structured_dispute_for_target_year'));
  const withRatificationNote = classifications.filter(c => c.flags.some(f => f.type === 'has_ratification_note_requiring_human_read'));

  const document = {
    generated_at: new Date().toISOString(),
    target_year: YEAR,
    generator: 'scripts/classify-ratification-notes.ts',
    input_catalogue: `docs/audits/observance-catalogue/${YEAR}.json`,
    resolved_slug_count: resolvedSlugs.size,
    summary: {
      no_current_year_source: withNoSource.length,
      future_year_disputed: withFutureDisputed.length,
      no_structured_dispute_for_target_year: withNoStructuredDispute.length,
      has_ratification_note_requiring_human_read: withRatificationNote.length,
      profile_scope_unverified: classifications.length, // applies to all, by design
    },
    classifications,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const jsonPath = path.join(OUTPUT_DIR, `${YEAR}.json`);
  const mdPath = path.join(OUTPUT_DIR, `${YEAR}.md`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(document, null, 2)}\n`);
  fs.writeFileSync(mdPath, markdown(document));

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
  console.log(`\nSummary: ${JSON.stringify(document.summary)}`);
}

function markdown(doc: {
  generated_at: string;
  target_year: number;
  generator: string;
  resolved_slug_count: number;
  summary: Record<string, number>;
  classifications: SlugClassification[];
}): string {
  const lines: string[] = [];
  lines.push(`# Ratification-note evidence — ${doc.target_year}`);
  lines.push('');
  lines.push(`Generated: ${doc.generated_at} by \`${doc.generator}\`. Scope: the ${doc.resolved_slug_count} slugs classified \`resolved\` in the ${doc.target_year} catalogue audit.`);
  lines.push('');
  lines.push('**Every flag below is evidence, not a verdict.** `no_structured_dispute_for_target_year` means a named source exists and `disputed_years` does not list this year -- it does NOT mean confirmed or settled: a rule can be disputed on undeclared-per-year grounds (methodology, profile convention, "PENDING COUNCIL RATIFICATION") that `disputed_years` never captures. Read `ratification_note_verbatim` on any row flagged `has_ratification_note_requiring_human_read` before treating it as anything more than "engine resolved."');
  lines.push('');
  lines.push('| Flag | Count |');
  lines.push('|---|---|');
  for (const [flag, count] of Object.entries(doc.summary)) lines.push(`| ${flag} | ${count} |`);
  lines.push('');
  lines.push('## Per-slug evidence');
  lines.push('');
  for (const c of doc.classifications) {
    lines.push(`### ${c.slug}`);
    lines.push('');
    lines.push(`Flags: ${c.flags.map(f => `\`${f.type}\``).join(', ')}`);
    lines.push('');
    for (const row of c.rule_rows) {
      lines.push(`- **${row.sampradaya_or_variant ?? '(no variant)'}**: citation=${row.citation ? `"${row.citation}"` : 'none'}, disputed_years=${JSON.stringify(row.disputed_years)}, target_year_disputed=${row.target_year_in_disputed_years}`);
      if (row.ratification_note_verbatim) {
        lines.push(`  > ${row.ratification_note_verbatim.replace(/\n/g, ' ')}`);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
