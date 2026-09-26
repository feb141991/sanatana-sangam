/** Rule-identity matching for offline cross-profile audit scripts. */
export function ruleVariant(ruleKey: string): string {
  const separator = ruleKey.indexOf('::');
  return separator < 0 ? 'legacy-default' : ruleKey.slice(separator + 2);
}

export function variantsMatch(storedVariant: string | null, engineRuleKey: string): boolean {
  const stored = storedVariant ?? 'legacy-default';
  const calculated = ruleVariant(engineRuleKey);
  return stored === calculated ||
    ((stored === 'legacy-default' || stored === 'standard') &&
     (calculated === 'legacy-default' || calculated === 'standard'));
}
