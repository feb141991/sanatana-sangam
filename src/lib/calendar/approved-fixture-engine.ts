import {
  calculateObservanceCandidateDiagnosticsForYear,
  ruleIdentityKey,
  type ObservanceCandidateDiagnostic,
} from './engine';
import { CANONICAL_RULES, type ObservanceRule } from './rules';

export const APPROVED_CALENDAR_PILOT_CASE_IDS = [
  'vijaya-ekadashi__2027__ujjain_india__north_indian_purnimanta',
  'yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__smarta',
  'yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__vaishnava_vidhava',
] as const;

const APPROVED_CALENDAR_PILOT_CASE_ID_SET = new Set<string>(APPROVED_CALENDAR_PILOT_CASE_IDS);

export function isApprovedCalendarPilotCaseId(caseId: unknown): caseId is typeof APPROVED_CALENDAR_PILOT_CASE_IDS[number] {
  return typeof caseId === 'string' && APPROVED_CALENDAR_PILOT_CASE_ID_SET.has(caseId);
}

export type ApprovedFixtureMonthSystem = 'amanta' | 'purnimanta' | 'solar';

export interface ApprovedFixtureEvaluationInput {
  caseId: string;
  festivalId: string;
  year: number;
  profile: {
    calendar: string;
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
    diagnostics = calculateObservanceCandidateDiagnosticsForYear(year);
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
  profileMonthSystem: ApprovedFixtureMonthSystem,
): ApprovedFixtureEvaluation {
  if (!input.approved || !input.expected?.civilDate) {
    throw new Error(`Fixture ${input.caseId} is not an approved dated decision`);
  }

  const rule = fixtureRule(input);
  const ruleMonthSystem = rule.corrected_month_system ?? null;
  if (ruleMonthSystem && ruleMonthSystem !== profileMonthSystem) {
    throw new Error(
      `Fixture ${input.caseId} requests ${profileMonthSystem}, but ${ruleIdentityKey(rule)} is ${ruleMonthSystem}`,
    );
  }

  const ruleKey = ruleIdentityKey(rule);
  const diagnostic = diagnosticsForYear(input.year)
    .find(candidate => candidate.ruleKey === ruleKey);

  if (!diagnostic) {
    throw new Error(`No engine diagnostic exists for ${input.caseId} (${ruleKey})`);
  }
  if (!diagnostic.selectedDate) {
    throw new Error(`Engine produced no selected date for ${input.caseId} (${ruleKey})`);
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
