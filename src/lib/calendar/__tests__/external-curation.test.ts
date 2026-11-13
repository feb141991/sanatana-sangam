import { describe, expect, it } from 'vitest';
import { calculateObservancesForYearCorrected, isPublishable } from '../engine';
import { CANONICAL_RULES } from '../rules';
import { EXTERNALLY_CURATED_SLUGS, allExternallyCuratedReadiness, UJJAIN_REFERENCE } from '../external-curation';

describe('externally curated annual observances', () => {
  it('keeps the approved annual scope exact and reports card readiness', () => {
    expect([...EXTERNALLY_CURATED_SLUGS]).toEqual([
      'shani-jayanti', 'vat-savitri-amavasya', 'vat-savitri-purnima', 'nag-panchami',
      'guru-purnima', 'vivah-panchami', 'gupt-navratri-ashadha-begins',
      'gupt-navratri-magha-begins', 'jagannath-rath-yatra',
    ]);
    expect(allExternallyCuratedReadiness()).toHaveLength(9);
    expect(UJJAIN_REFERENCE).toMatchObject({
      calendar_profile: 'legacy-ujjain',
      variant_key: 'legacy-default',
      computed_timezone: 'Asia/Kolkata',
    });
  });

  it('does not publish a computed occurrence for an externally curated rule', () => {
    for (const slug of EXTERNALLY_CURATED_SLUGS) {
      const rule = CANONICAL_RULES.find((candidate) => candidate.slug === slug);
      expect(rule, slug).toBeDefined();
      expect(rule?.derivability).toBe('externally_curated');
      expect(isPublishable(rule!)).toBe(false);
    }
    const computed = calculateObservancesForYearCorrected(2026, {
      lat: UJJAIN_REFERENCE.computed_latitude,
      lon: UJJAIN_REFERENCE.computed_longitude,
      tz: UJJAIN_REFERENCE.computed_timezone,
    });
    expect(computed.some((row) => EXTERNALLY_CURATED_SLUGS.includes(row.slug as never))).toBe(false);
  }, 120000);
});
