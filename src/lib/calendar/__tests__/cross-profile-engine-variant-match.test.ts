import { describe, expect, it } from 'vitest';
import { ruleVariant, variantsMatch } from '../reconciliation-variant';

describe('cross-profile reproduction variant identity', () => {
  it('parses a qualified engine rule key and treats an unqualified key as the generic default', () => {
    expect(ruleVariant('krishna-janmashtami::smarta_nishita')).toBe('smarta_nishita');
    expect(ruleVariant('purnima-vrat')).toBe('legacy-default');
  });

  it('matches only the same named variant', () => {
    expect(variantsMatch('smarta_nishita', 'krishna-janmashtami::smarta_nishita')).toBe(true);
    expect(variantsMatch('gaudiya_iskcon', 'krishna-janmashtami::smarta_nishita')).toBe(false);
  });

  it('accepts only the explicitly documented generic alias between standard and legacy-default', () => {
    expect(variantsMatch('standard', 'purnima-vrat')).toBe(true);
    expect(variantsMatch('legacy-default', 'purnima-vrat::standard')).toBe(true);
    expect(variantsMatch('custom', 'purnima-vrat')).toBe(false);
  });
});
