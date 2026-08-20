/**
 * Crosswalk between EVALUATOR_RULES variantId / profile.tradition strings ('smarta', 'vaishnava')
 * and rules.json canonical qualifiers ('smarta_nishita', 'gaudiya_iskcon').
 *
 * Background:
 * rules.json authoring originally tagged krishna-janmashtami with `sampradaya: 'smarta_nishita'`
 * and `sampradaya: 'gaudiya_iskcon'`. Independently, `materialize.ts` EVALUATOR_RULES defined
 * `variantId: 'smarta'` and `variantId: 'vaishnava'`.
 *
 * NOTE: For new code, prefer trusting the occurrence data's own variant_key (as computeEngineHint
 * in fixture-engine-hint.ts does). This crosswalk is provided for existing call sites that structurally
 * need to translate between the two authoring vocabularies.
 */

const EVALUATOR_TO_RULE_QUALIFIER: Record<string, Record<string, string>> = {
  'krishna-janmashtami': {
    smarta: 'smarta_nishita',
    vaishnava: 'gaudiya_iskcon',
    smarta_nishita: 'smarta_nishita',
    gaudiya_iskcon: 'gaudiya_iskcon',
  },
};

const RULE_TO_EVALUATOR_QUALIFIER: Record<string, Record<string, string>> = {
  'krishna-janmashtami': {
    smarta_nishita: 'smarta',
    gaudiya_iskcon: 'vaishnava',
    smarta: 'smarta',
    vaishnava: 'vaishnava',
  },
};

export function evaluatorVariantToRuleQualifier(slug: string, variantId: string | null | undefined): string | null {
  if (!variantId) return null;
  const trimmed = variantId.trim();
  return EVALUATOR_TO_RULE_QUALIFIER[slug]?.[trimmed] ?? trimmed;
}

export function ruleQualifierToEvaluatorVariant(slug: string, ruleQualifier: string | null | undefined): string | null {
  if (!ruleQualifier) return null;
  const trimmed = ruleQualifier.trim();
  return RULE_TO_EVALUATOR_QUALIFIER[slug]?.[trimmed] ?? trimmed;
}
