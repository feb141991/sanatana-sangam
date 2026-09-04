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
 * Every flag is scoped to an explicit (year, profile) pair, not a global
 * verdict, and appears AT MOST ONCE PER SLUG -- a variant-bearing slug
 * (Krishna Janmashtami: smarta_nishita + gaudiya_iskcon rows) produces one
 * flag of each applicable type, carrying an `evidence` array naming every
 * contributing rule row, not one duplicated flag per row (an earlier
 * version of this script emitted duplicates; fixed on review).
 *
 * `target_year_disputed` vs `future_year_disputed` are kept distinct: the
 * exact year this report concerns being in `disputed_years` is a different,
 * more load-bearing fact than some OTHER year being disputed (an earlier
 * version collapsed both into one `future_year_disputed` flag, hiding the
 * case that matters most).
 *
 * `no_structured_dispute_for_target_year` is deliberately NOT named
 * "confirmed" -- disputed_years being empty only means no specific year is
 * flagged as astronomically disputed; it says nothing about unresolved
 * methodology/profile-convention questions ("PENDING COUNCIL RATIFICATION"
 * can and does appear alongside empty disputed_years -- confirmed on
 * maha-shivaratri, a real false positive an earlier version of this script
 * produced by conflating the two).
 *
 * `has_citation`/`no_structured_citation` (renamed from the earlier,
 * overclaiming `no_current_year_source`) say only whether a `citation`
 * field is present -- `citation` is free text and can name a year other
 * than the target one (maha-shivaratri's own citation text describes a
 * 2027 occurrence while this report concerns 2026), so neither flag is a
 * year-specific claim about what the citation supports.
 *
 * A slug with a ratification_note always ALSO gets
 * `has_ratification_note_requiring_human_read`, and that note is carried
 * verbatim -- read it before treating any slug as settled. All
 * dispute/no-dispute flags carry `computed_location_profile` so it's clear
 * this audit run's evidence is scoped to one reference point (Ujjain, the
 * profile calculateOccurrencesWithEvaluator uses by default), not
 * validated across every calendar_profile.
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

interface DisputeEvidence {
  sampradaya_or_variant: string | null;
  citation: string | null;
  disputed_years: number[];
}

interface NoteEvidence {
  sampradaya_or_variant: string | null;
  ratification_note_verbatim: string;
}

interface SourceEvidence {
  sampradaya_or_variant: string | null;
  citation: string;
}

// One flag PER TYPE per slug (not per rule row) -- a slug with two variant
// rows (e.g. Krishna Janmashtami's smarta_nishita/gaudiya_iskcon) must not
// produce two copies of the same flag. Each flag instead carries an
// `evidence` array naming every contributing variant/row.
type Flag =
  // The target year ITSELF is in a rule row's disputed_years -- distinct
  // from a future year being disputed. Emitting this via the same
  // `future_year_disputed` type (an earlier version of this script did)
  // hides the one case that matters most: the year this report is actually
  // about is structurally disputed, not just some other year.
  | { type: 'target_year_disputed'; year: number; evidence: DisputeEvidence[] }
  // Some OTHER year (not the target) is in disputed_years for this slug.
  | { type: 'future_year_disputed'; evidence: DisputeEvidence[] }
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
  // exactly this. Read ratification_note_verbatim before treating any slug
  // as settled.
  | { type: 'no_structured_dispute_for_target_year'; year: number; profile: string; evidence: DisputeEvidence[] }
  | { type: 'profile_scope_unverified'; profile: string }
  // Renamed from `no_current_year_source`. The old name implied a
  // year-specific claim ("no source FOR this year") the data model cannot
  // support: `citation` is free text and can name a year other than the
  // target (e.g. maha-shivaratri's own citation text describes a 2027
  // occurrence). This flag means only "no rule row for this slug carries a
  // non-empty citation field" -- nothing about which year any citation, if
  // present, actually supports.
  | { type: 'no_structured_citation' }
  | { type: 'has_citation'; evidence: SourceEvidence[] }
  | { type: 'has_ratification_note_requiring_human_read'; evidence: NoteEvidence[] };

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

    // Aggregate contributing rows PER FLAG TYPE first, then emit at most one
    // flag of each type -- a variant-bearing slug (Krishna Janmashtami: two
    // rows) must produce one flag with two evidence entries, not two flags.
    const targetYearDisputedEvidence: DisputeEvidence[] = [];
    const futureYearDisputedEvidence: DisputeEvidence[] = [];
    const noDisputeEvidence: DisputeEvidence[] = [];
    const citationEvidence: SourceEvidence[] = [];
    const noteEvidence: NoteEvidence[] = [];

    for (const row of evidence) {
      const disputeEvidence: DisputeEvidence = {
        sampradaya_or_variant: row.sampradaya_or_variant,
        citation: row.citation,
        disputed_years: row.disputed_years,
      };
      if (row.target_year_in_disputed_years) {
        targetYearDisputedEvidence.push(disputeEvidence);
      } else if (row.disputed_years.length > 0) {
        futureYearDisputedEvidence.push(disputeEvidence);
      } else if (row.citation) {
        noDisputeEvidence.push(disputeEvidence);
      }
      if (row.citation) {
        citationEvidence.push({ sampradaya_or_variant: row.sampradaya_or_variant, citation: row.citation });
      }
      if (row.ratification_note_verbatim) {
        noteEvidence.push({ sampradaya_or_variant: row.sampradaya_or_variant, ratification_note_verbatim: row.ratification_note_verbatim });
      }
    }

    if (targetYearDisputedEvidence.length > 0) {
      flags.push({ type: 'target_year_disputed', year: YEAR, evidence: targetYearDisputedEvidence });
    }
    if (futureYearDisputedEvidence.length > 0) {
      flags.push({ type: 'future_year_disputed', evidence: futureYearDisputedEvidence });
    }
    if (noDisputeEvidence.length > 0) {
      flags.push({ type: 'no_structured_dispute_for_target_year', year: YEAR, profile: COMPUTED_LOCATION_PROFILE, evidence: noDisputeEvidence });
    }
    if (citationEvidence.length > 0) {
      flags.push({ type: 'has_citation', evidence: citationEvidence });
    } else {
      flags.push({ type: 'no_structured_citation' });
    }
    if (noteEvidence.length > 0) {
      flags.push({ type: 'has_ratification_note_requiring_human_read', evidence: noteEvidence });
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

  const countWithFlag = (type: Flag['type']) =>
    classifications.filter(c => c.flags.some(f => f.type === type)).length;

  const document = {
    generated_at: new Date().toISOString(),
    target_year: YEAR,
    generator: 'scripts/classify-ratification-notes.ts',
    input_catalogue: `docs/audits/observance-catalogue/${YEAR}.json`,
    resolved_slug_count: resolvedSlugs.size,
    summary: {
      target_year_disputed: countWithFlag('target_year_disputed'),
      future_year_disputed: countWithFlag('future_year_disputed'),
      no_structured_dispute_for_target_year: countWithFlag('no_structured_dispute_for_target_year'),
      has_citation: countWithFlag('has_citation'),
      no_structured_citation: countWithFlag('no_structured_citation'),
      has_ratification_note_requiring_human_read: countWithFlag('has_ratification_note_requiring_human_read'),
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
  lines.push('**Every flag below is evidence, not a verdict, and appears at most once per slug** (with every contributing variant/rule row listed in its `evidence` array, not duplicated as separate flags). `target_year_disputed` means this exact year is in `disputed_years` for at least one rule row. `no_structured_dispute_for_target_year` means `disputed_years` does not list this year -- it does NOT mean confirmed or settled: a rule can be disputed on undeclared-per-year grounds (methodology, profile convention, "PENDING COUNCIL RATIFICATION") that `disputed_years` never captures. `has_citation`/`no_structured_citation` say only whether a `citation` field is present -- `citation` is free text and can name a year other than the target one (confirmed on maha-shivaratri, whose own citation text describes a 2027 occurrence), so neither flag is a year-specific claim. Read `ratification_note_verbatim` on any slug flagged `has_ratification_note_requiring_human_read` before treating it as anything more than "engine resolved."');
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
