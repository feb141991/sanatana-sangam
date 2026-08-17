import {
  calculateObservanceCandidateDiagnosticsForYear,
  isMonthSystemInvariantForDate,
  ruleIdentityKey,
  type ObservanceCandidateDiagnostic,
} from './engine';
import { CANONICAL_RULES, type ObservanceRule } from './rules';
import type { ApprovedFixtureMonthSystem } from './approved-fixture-governance';

export interface ApprovedFixtureEvaluationInput {
  caseId: string;
  festivalId: string;
  year: number;
  profile: {
    // null for rules with no amanta/purnimanta/solar axis at all -- see the
    // profileMonthSystem doc below.
    calendar: string | null;
    tradition: string;
    variantKey?: string;
  };
  expected: {
    civilDate: string | null;
  } | null;
  approved: boolean;
}

export interface ApprovedFixtureEvaluation {
  rule: ObservanceRule;
  ruleKey: string;
  civilDate: string;
  candidateDates: string[];
  publicationWithheld: boolean;
  withheldReason: 'derivability' | 'deferred' | 'disputed_year' | null;
}

const diagnosticsByYear = new Map<number, ObservanceCandidateDiagnostic[]>();

function diagnosticsForYear(year: number): ObservanceCandidateDiagnostic[] {
  let diagnostics = diagnosticsByYear.get(year);
  if (!diagnostics) {
    // 'corrected' -- this evaluator's entire purpose is validating a
    // council-approved fixture (a sourced citation for the NEW engine)
    // against what the engine actually computes. The default 'legacy'
    // preference silently masked this: it only "worked" by accident for
    // rules where legacy happens to produce zero candidates (the 16 newly
    // added ekadashis, whose lunar_masa_name was deliberately left unset)
    // and fell back to corrected -- but for any older rule where legacy
    // computes a real, non-empty (and possibly wrong) date, that wrong
    // legacy value silently won instead of the sourced/corrected one. Found
    // via raksha-bandhan: legacy gave 2026-07-29 (a full masa off), while
    // the approved fixture's citation and the corrected engine both agree
    // on 2026-08-28. Fixed 2026-08-17.
    diagnostics = calculateObservanceCandidateDiagnosticsForYear(year, undefined, 'corrected');
    diagnosticsByYear.set(year, diagnostics);
  }
  return diagnostics;
}

function fixtureRule(input: ApprovedFixtureEvaluationInput): ObservanceRule {
  const variantKey = input.profile.variantKey?.trim() || null;
  const matches = CANONICAL_RULES.filter(rule => {
    if (rule.slug !== input.festivalId) return false;
    const qualifier = rule.variant_key ?? rule.sampradaya ?? null;
    return variantKey ? qualifier === variantKey : qualifier === null;
  });

  if (matches.length !== 1) {
    throw new Error(
      `Approved fixture ${input.caseId} must identify exactly one rule row; found ${matches.length}`,
    );
  }
  return matches[0];
}

/**
 * Evaluates one council-approved golden fixture without changing publication
 * gates. The ungated diagnostic path is intentional: a fixture approval is
 * scoped to one year/location/profile/variant and must not silently release the
 * same rule for every year.
 */
export function evaluateApprovedFixture(
  input: ApprovedFixtureEvaluationInput,
  // null is only safe for rules that declare no corrected_month_system at all
  // (solar_fixed, relative_to_other_observance, regional_calendar -- e.g. the
  // Nanakshahi-based Sikh rules, which have no amanta/purnimanta axis to be
  // ratified in the first place). The mismatch guard below still throws for
  // any rule that DOES declare a system, so this can't silently paper over a
  // fixture that genuinely needs a ratified calendar_profile.
  profileMonthSystem: ApprovedFixtureMonthSystem | null,
): ApprovedFixtureEvaluation {
  if (!input.approved || !input.expected?.civilDate) {
    throw new Error(`Fixture ${input.caseId} is not an approved dated decision`);
  }

  const rule = fixtureRule(input);
  const ruleKey = ruleIdentityKey(rule);
  const diagnostic = diagnosticsForYear(input.year)
    .find(candidate => candidate.ruleKey === ruleKey);

  if (!diagnostic) {
    throw new Error(`No engine diagnostic exists for ${input.caseId} (${ruleKey})`);
  }
  if (!diagnostic.selectedDate) {
    throw new Error(`Engine produced no selected date for ${input.caseId} (${ruleKey})`);
  }

  const ruleMonthSystem = rule.corrected_month_system ?? null;
  if (ruleMonthSystem && ruleMonthSystem !== profileMonthSystem) {
    // Not necessarily a real mismatch: amanta and purnimanta agree exactly
    // whenever the occurrence falls in śukla-pakṣa (D32's documented
    // conversion law). Only reject when the two systems could actually
    // have produced a different date -- kṛṣṇa-pakṣa occurrences, where the
    // system genuinely changes the answer, still require an exact match.
    if (!isMonthSystemInvariantForDate(rule, diagnostic.selectedDate)) {
      throw new Error(
        `Fixture ${input.caseId} requests ${profileMonthSystem}, but ${ruleKey} is ${ruleMonthSystem}`,
      );
    }
  }

  if (diagnostic.selectedDate !== input.expected.civilDate) {
    throw new Error(
      `Approved fixture ${input.caseId} expects ${input.expected.civilDate}; engine selected ${diagnostic.selectedDate}`,
    );
  }

  return {
    rule,
    ruleKey,
    civilDate: diagnostic.selectedDate,
    candidateDates: diagnostic.candidateDates,
    publicationWithheld: diagnostic.publicationWithheld,
    withheldReason: diagnostic.withheldReason,
  };
}
