import { describe, it, expect } from 'vitest';
import {
  getSamagriForObservance,
  getAllSacredProducts,
  getSacredProductBySlug,
} from './resolver';

describe('Shoonaya Kosh - Sacred Samagri Resolver', () => {
  it('loads all catalog items with verified pricing and provenance', () => {
    const products = getAllSacredProducts();
    expect(products.length).toBeGreaterThanOrEqual(8);

    for (const item of products) {
      expect(item.id).toBeTruthy();
      expect(item.slug).toBeTruthy();
      expect(item.priceInr).toBeGreaterThan(0);
      expect(item.priceUsd).toBeGreaterThan(0);
      expect(item.provenance.origin).toBeTruthy();
      expect(item.provenance.certifiedPure).toBe(true);
      expect(item.provenance.purityGuarantee).toBeTruthy();
    }
  });

  it('resolves Satyanarayan pooja kit for satyanarayan and purnima observances', () => {
    const satyaResult = getSamagriForObservance('satyanarayan', '2026-12-15');
    expect(satyaResult).not.toBeNull();
    expect(satyaResult?.kit.id).toBe('kit-satyanarayan');
    expect(satyaResult?.kit.itemsIncluded?.length).toBeGreaterThanOrEqual(5);
    expect(satyaResult?.ritualContext.recommendedOrderDeadline).toBe('2026-12-11');
    expect(satyaResult?.companionEssentials.length).toBe(2);

    const purnimaResult = getSamagriForObservance('purnima');
    expect(purnimaResult).not.toBeNull();
    expect(purnimaResult?.kit.id).toBe('kit-satyanarayan');
  });

  it('resolves Pradosh and Shivratri kit with authentic abhishek samagri', () => {
    const pradoshResult = getSamagriForObservance('pradosh');
    expect(pradoshResult).not.toBeNull();
    expect(pradoshResult?.kit.id).toBe('kit-shivratri-pradosh');
    expect(pradoshResult?.kit.itemsIncluded?.some((i) => i.name.includes('Vibhuti'))).toBe(true);

    const shivratriResult = getSamagriForObservance('maha-shivratri');
    expect(shivratriResult).not.toBeNull();
    expect(shivratriResult?.kit.id).toBe('kit-shivratri-pradosh');
  });

  it('resolves Ekadashi box with authentic Tulsi items', () => {
    const ekadashiResult = getSamagriForObservance('nirjala-ekadashi');
    expect(ekadashiResult).not.toBeNull();
    expect(ekadashiResult?.kit.id).toBe('kit-ekadashi');
  });

  it('resolves Navratri kit with Himalayan havan herbs', () => {
    const navratriResult = getSamagriForObservance('navratri-begins');
    expect(navratriResult).not.toBeNull();
    expect(navratriResult?.kit.id).toBe('kit-navratri-havan');
  });

  it('returns null for an observance with no specialized kit', () => {
    const unknown = getSamagriForObservance('unmatched-observance-slug');
    expect(unknown).toBeNull();
  });

  it('fetches single product by slug accurately', () => {
    const gangaJal = getSacredProductBySlug('certified-gangotri-ganga-jal');
    expect(gangaJal).not.toBeNull();
    expect(gangaJal?.category).toBe('ganga-jal');
    expect(gangaJal?.provenance.origin).toContain('Gangotri');
  });
});
