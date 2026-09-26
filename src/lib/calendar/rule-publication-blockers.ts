/**
 * Returns structured reasons a rule must not be treated as eligible for
 * publication. An empty list means only that these known blockers are absent;
 * it does NOT prove source validity, human/council ratification, or date
 * correctness. The rule model currently has no structured ratification field.
 */
import type { ObservanceRule } from './rules';

export function findKnownRulePublicationBlockers(rule: ObservanceRule | null, year: number): string[] {
  if (!rule) return ['no exact rule found for this slug/variant'];

  const blockers: string[] = [];
  if (rule.launch_status !== 'included') {
    blockers.push(`launch_status is ${rule.launch_status ?? 'undefined'}, not 'included'`);
  }
  if (rule.derivability !== undefined && rule.derivability !== 'computed') {
    blockers.push(`derivability is '${rule.derivability}', not computable`);
  }
  if ((rule.disputed_years ?? []).includes(year)) {
    blockers.push(`${year} is in this rule's disputed_years`);
  }
  if (!rule.citation) {
    blockers.push('rule has no citation');
  }
  return blockers;
}
