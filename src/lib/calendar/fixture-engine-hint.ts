import { calculateObservanceCandidateDiagnosticsForYear, ruleIdentityKey, type ObservanceCandidateDiagnostic } from './engine';
import { CANONICAL_RULES } from './rules';

// Read-only convenience for the calendar-governance admin UI: what does the
// engine currently compute for a festival/year, so a human reviewer has a
// starting point before going to check a real Tier 1-4 publication -- this
// is NEVER written to golden_fixtures.expected and NEVER used to approve
// anything. A fixture's `expected` must stay an independently-sourced answer
// key; self-deriving it from the engine's own output is the exact failure
// this repo already hit once (see D11/D23 in
// docs/CALENDAR_ENGINE_ASSESSMENT.md -- fixtures "self-derived with
// fabricated ... provenance" had to be caught and reverted).
export interface EngineHint {
  civilDate: string | null;
  candidateDates: string[];
  publicationWithheld: boolean;
  error?: string;
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

function rulesFor(festivalId: string, qualifier: string | null) {
  return CANONICAL_RULES.filter((rule) => {
    if (rule.slug !== festivalId) return false;
    const ruleQualifier = rule.variant_key ?? rule.sampradaya ?? null;
    return qualifier ? ruleQualifier === qualifier : ruleQualifier === null;
  });
}

export function computeEngineHint(festivalId: string, year: number, variantKey?: string | null): EngineHint {
  const qualifier = variantKey?.trim() || null;
  // golden_fixtures.profile.tradition carries a real variant qualifier for
  // multi-variant rules (e.g. yogini-ekadashi's smarta/vaishnava_vidhava
  // split) but is just a generic default ("smarta", "unspecified") for the
  // majority of single-variant rules that have no variant_key/sampradaya at
  // all -- so a qualifier that matches nothing is retried unqualified rather
  // than treated as an error.
  let matches = rulesFor(festivalId, qualifier);
  if (matches.length === 0 && qualifier) {
    matches = rulesFor(festivalId, null);
  }

  if (matches.length !== 1) {
    return {
      civilDate: null,
      candidateDates: [],
      publicationWithheld: false,
      error: `Expected exactly one rule for ${festivalId}${qualifier ? ` (${qualifier})` : ''}; found ${matches.length}`,
    };
  }

  const ruleKey = ruleIdentityKey(matches[0]);
  const diagnostic = diagnosticsForYear(year).find((d) => d.ruleKey === ruleKey);

  if (!diagnostic) {
    return { civilDate: null, candidateDates: [], publicationWithheld: false, error: 'No engine diagnostic for this rule/year' };
  }

  return {
    civilDate: diagnostic.selectedDate,
    candidateDates: diagnostic.candidateDates,
    publicationWithheld: diagnostic.publicationWithheld,
  };
}
