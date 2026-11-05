import { describe, it, expect } from 'vitest';
import { getKinshipTier } from './kinship';

describe('getKinshipTier', () => {
  it('returns human kinship tier for Gen 1 (Root Ancestors)', () => {
    const tier = getKinshipTier(1);
    expect(tier.label).toBe('Root Ancestor');
    expect(tier.hindiLabel).toBe('मूल पूर्वज');
    expect(tier.tooltip).toContain('Kutumb Vansh');
  });

  it('returns Grandparents tier for Gen 2', () => {
    const tier = getKinshipTier(2);
    expect(tier.label).toBe('Grandparents');
    expect(tier.hindiLabel).toBe('दादा-दादी');
  });

  it("returns Parents' Gen tier for Gen 3", () => {
    const tier = getKinshipTier(3);
    expect(tier.label).toBe("Parents' Gen");
    expect(tier.hindiLabel).toBe('माता-पिता');
  });

  it('returns Current Gen tier for Gen 4', () => {
    const tier = getKinshipTier(4);
    expect(tier.label).toBe('Current Gen');
    expect(tier.hindiLabel).toBe('समकालीन');
  });

  it('returns Next Gen tier for Gen 5', () => {
    const tier = getKinshipTier(5);
    expect(tier.label).toBe('Next Gen');
    expect(tier.hindiLabel).toBe('संतान');
  });

  it('returns Grandchildren tier for Gen 6', () => {
    const tier = getKinshipTier(6);
    expect(tier.label).toBe('Grandchildren');
  });
});
