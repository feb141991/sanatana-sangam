/**
 * Prompt 4 of the cross-profile-withholding remediation program: audits the
 * rule-level approval/source-evidence gate for publication.
 *
 * Classifies every rule in rules.json into exactly the three buckets Prompt
 * 4 names:
 *   1. computable   -- derivability === 'computed' (explicit) or undefined
 *                       (the current implicit default -- see finding below)
 *   2. requires_tradition_profile -- derivability === 'requires_tradition_profile'
 *   3. externally_curated -- derivability === 'externally_curated'
 *
 * This does NOT invent a new gate. `derivability` and its fail-closed check
 * already exist and are already live (src/lib/calendar/engine.ts:176,
 * `if (r.derivability !== undefined && r.derivability !== 'computed') return
 * false;`) -- a rule is excluded from computation/publication the instant
 * derivability names anything other than 'computed'. What this script adds
 * is VISIBILITY: today that check silently treats an UNSET derivability as
 * 'computed' by default, so no rule has ever needed to state its own
 * classification. This is not itself a bug in the gate's behavior (the
 * default is a defensible one), but it does mean "classify every rule" has
 * never actually happened -- confirmed below: 115 of 117 rules rely on the
 * implicit default rather than an explicit value.
 *
 * Separately audits source-evidence completeness for every rule that IS
 * currently shipping (`launch_status: 'included'`): does it carry a
 * `citation`? `validate-rules.ts` already enforces this, but ONLY for
 * variant rules (`isVariant && !rule.citation`) -- a deliberate, narrower
 * bar than "every publishable rule needs source evidence" (festival-rule-
 * schema.md #7, Prompt 4's own text). This script reports the gap between
 * that narrower bar and the broader one honestly, without fabricating a
 * citation for a single rule and without silently expanding CI to fail the
 * build on 57 already-shipping rules -- that is a product/governance
 * decision (whether every rule truly needs a per-occurrence-adjacent
 * citation, or whether some categories are legitimately exempt), not an
 * engineering call this script makes for anyone. See "Do not invent
 * sources, approvals, or calendar conventions" in this program's own
 * instructions, and docs/CALENDAR_ENGINE_ASSESSMENT.md 4.2's explicit
 * "engineering and AI agents must not fill [golden fixtures]" rule, which
 * this script treats as binding for citations too, by the same logic.
 *
 * Read-only: reads rules.json only, no DB connection, no writes.
 *
 * Run: npx tsx scripts/audit-rule-approval-and-source-evidence.ts
 */
import fs from 'node:fs';
import path from 'node:path';

const BACKEND_ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(BACKEND_ROOT, 'docs/audits/rule-approval-and-source-evidence-2026-09-24');
const RULES_PATH = path.join(BACKEND_ROOT, 'packages/dharma-rules/src/festivals/rules.json');

type Rule = {
  slug: string;
  variant_key?: string;
  sampradaya?: string;
  derivability?: 'computed' | 'requires_tradition_profile' | 'externally_curated';
  launch_status?: 'included' | 'deferred';
  citation?: string;
  ratification_note?: string;
  disputed_years?: number[];
  review?: { status?: string };
};

function ruleIdentity(r: Rule): string {
  const qualifier = r.variant_key ?? r.sampradaya;
  return qualifier ? `${r.slug}::${qualifier}` : r.slug;
}

function main() {
  const rules: Rule[] = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));

  const classification = {
    computed_explicit: [] as string[],
    computed_implicit_default: [] as string[],
    requires_tradition_profile: [] as string[],
    externally_curated: [] as string[],
  };
  for (const r of rules) {
    const id = ruleIdentity(r);
    if (r.derivability === 'requires_tradition_profile') classification.requires_tradition_profile.push(id);
    else if (r.derivability === 'externally_curated') classification.externally_curated.push(id);
    else if (r.derivability === 'computed') classification.computed_explicit.push(id);
    else classification.computed_implicit_default.push(id);
  }

  const included = rules.filter((r) => r.launch_status === 'included');
  const includedMissingCitation = included.filter((r) => !r.citation);
  const includedMissingDisputedYearCheck = included.filter((r) => r.disputed_years && r.disputed_years.length > 0);

  const blocked = rules.filter(
    (r) => r.derivability === 'requires_tradition_profile' || r.derivability === 'externally_curated',
  );

  const report = {
    _label: 'RULE APPROVAL / SOURCE-EVIDENCE AUDIT -- classification and gap report, not a new gate and not a citation-fabrication tool',
    generated_at: new Date().toISOString(),
    generator: 'scripts/audit-rule-approval-and-source-evidence.ts',
    total_rules: rules.length,
    classification: {
      computable_explicit: classification.computed_explicit.length,
      computable_implicit_default: classification.computed_implicit_default.length,
      requires_tradition_profile: classification.requires_tradition_profile.length,
      externally_curated: classification.externally_curated.length,
    },
    finding_implicit_default: {
      description:
        'Rules relying on the undefined-derivability-means-computed default in engine.ts:176, never explicitly classified.',
      count: classification.computed_implicit_default.length,
      of_total: rules.length,
    },
    blocked_rules: blocked.map((r) => ({
      id: ruleIdentity(r),
      derivability: r.derivability,
      reason: r.derivability === 'externally_curated'
        ? 'externally curated -- not engine-computable, governed by manual_date_override/locked_for_regeneration only'
        : 'requires a tradition-profile method this codebase does not yet implement as a computable rule',
    })),
    included_rules_missing_citation: {
      count: includedMissingCitation.length,
      of_included: included.length,
      note: 'validate-rules.ts currently requires a citation only for VARIANT rules (sampradaya/variant_key set), not every included rule. This is the gap between that narrower CI bar and festival-rule-schema.md #7\'s broader "every rule needs sources[]" requirement. Not fabricated or backfilled here.',
      slugs: includedMissingCitation.map(ruleIdentity),
    },
    included_rules_with_disputed_years: {
      count: includedMissingDisputedYearCheck.length,
      note: 'Presence of disputed_years does not itself block publication of OTHER years -- confirm the current/next year is not in the list before trusting a specific date.',
      detail: includedMissingDisputedYearCheck.map((r) => ({ id: ruleIdentity(r), disputed_years: r.disputed_years })),
    },
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const jsonPath = path.join(OUTPUT_DIR, 'receipt.json');
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${jsonPath}`);
  console.log(`\nTotal rules: ${rules.length}`);
  console.log(`  computable (explicit 'computed'): ${classification.computed_explicit.length}`);
  console.log(`  computable (implicit default, never classified): ${classification.computed_implicit_default.length}`);
  console.log(`  requires_tradition_profile (blocked): ${classification.requires_tradition_profile.length}`);
  console.log(`  externally_curated (blocked): ${classification.externally_curated.length}`);
  console.log(`\nBlocked rules:`);
  for (const b of report.blocked_rules) console.log(`  ${b.id}: ${b.reason}`);
  console.log(`\nIncluded rules missing a citation: ${includedMissingCitation.length} / ${included.length}`);
}

main();
