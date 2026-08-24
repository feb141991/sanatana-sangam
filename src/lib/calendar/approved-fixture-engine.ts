import {
  calculateObservanceCandidateDiagnosticsForYear,
  calculateObservanceSelectedDateForMonthSystem,
  isMonthSystemInvariantForDate,
  ruleIdentityKey,
  type ObservanceCandidateDiagnostic,
} from './engine';
import { CANONICAL_RULES, evaluatorVariantToRuleQualifier, type ObservanceRule } from './rules';
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
  const rawVariantKey = input.profile.variantKey?.trim() || null;
  const rawMatches = CANONICAL_RULES.filter(rule => {
    if (rule.slug !== input.festivalId) return false;
    const qualifier = rule.variant_key ?? rule.sampradaya ?? null;
    return rawVariantKey ? qualifier === rawVariantKey : qualifier === null;
  });

  if (rawMatches.length === 1) {
    return rawMatches[0];
  }

  // Check sub-observances of spans (e.g. dussehra in sharad-navratri)
  for (const parent of CANONICAL_RULES) {
    if (parent.rule_family === "lunar_tithi_span" && parent.sub_observances) {
      const sub = parent.sub_observances.find(s => s.slug === input.festivalId);
      if (sub) {
        return {
          ...parent,
          slug: sub.slug,
          display_name: sub.display_name,
          emoji: sub.emoji ?? parent.emoji,
          description: sub.description ?? parent.description,
          kind: sub.kind ?? parent.kind,
          lunar_tithi_index: sub.tithi,
          corrected_lunar_tithi_index: sub.tithi,
        };
      }
    }
  }

  // Crosswalk fallback for known divergent naming conventions (e.g. krishna-janmashtami's
  // EVALUATOR_RULES/profile 'smarta'/'vaishnava' vs rules.json 'smarta_nishita'/'gaudiya_iskcon'):
  if (rawVariantKey) {
    const crosswalked = evaluatorVariantToRuleQualifier(input.festivalId, rawVariantKey);
    if (crosswalked && crosswalked !== rawVariantKey) {
      const crossMatches = CANONICAL_RULES.filter(rule => {
        if (rule.slug !== input.festivalId) return false;
        const qualifier = rule.variant_key ?? rule.sampradaya ?? null;
        return qualifier === crosswalked;
      });
      if (crossMatches.length === 1) {
        return crossMatches[0];
      }
    }
  }

  throw new Error(
    `Approved fixture ${input.caseId} must identify exactly one rule row; found ${rawMatches.length}`,
  );
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
  let effectiveSelectedDate = diagnostic.selectedDate;

  if (ruleMonthSystem && ruleMonthSystem !== profileMonthSystem) {
    // Not necessarily a real mismatch: amanta and purnimanta agree exactly
    // whenever the occurrence falls in śukla-pakṣa (D32's documented
    // conversion law). Only recompute when the two systems could actually
    // have produced a different date -- kṛṣṇa-pakṣa occurrences, where the
    // system genuinely changes the answer.
    if (!isMonthSystemInvariantForDate(rule, diagnostic.selectedDate)) {
      // D32 fixture-validation fix: corrected_month_system lives on the
      // rule, not the profile, so the rule's own selected date is simply
      // the wrong thing to check a differently-systemed profile's citation
      // against. Recompute under the fixture's OWN declared system instead
      // of rejecting outright -- see
      // calculateObservanceSelectedDateForMonthSystem's doc comment.
      // 'solar'-system profiles have no amanta/purnimanta axis to recompute
      // under, so they fall through to the original rejection.
      const profileDate = (profileMonthSystem === 'amanta' || profileMonthSystem === 'purnimanta')
        ? calculateObservanceSelectedDateForMonthSystem(rule, input.year, profileMonthSystem)
        : null;
      if (!profileDate) {
        throw new Error(
          `Fixture ${input.caseId} requests ${profileMonthSystem}, but ${ruleKey} is ${ruleMonthSystem} (and produced no date under ${profileMonthSystem} for ${input.year})`,
        );
      }
      effectiveSelectedDate = profileDate;
    }
  }

  if (effectiveSelectedDate !== input.expected.civilDate) {
    throw new Error(
      `Approved fixture ${input.caseId} expects ${input.expected.civilDate}; engine selected ${effectiveSelectedDate}`,
    );
  }

  return {
    rule,
    ruleKey,
    civilDate: effectiveSelectedDate,
    candidateDates: diagnostic.candidateDates,
    publicationWithheld: diagnostic.publicationWithheld,
    withheldReason: diagnostic.withheldReason,
  };
}
