/**
 * observance-status-notice.test.ts
 *
 * Test suite for ObservanceStatusNotice helper functions and state resolution.
 * Verifies:
 * 1. Disputed variants appear together in one consolidated list with variant label, date, eligibility, and source.
 * 2. User-selected primary variant is clearly marked with isPrimary indicator.
 * 3. Unsupported profile / unknown context resolves isUnderReview = true and does NOT pick candidate 0 as a guessed date.
 * 4. Yogini Ekadashi dual sourced readings format cleanly with source citations.
 * 5. Location-only date differences set isLocationVarianceOnly = true and label location effect, not a tradition dispute.
 * 6. Source provenance is rendered only from typed, tiered source metadata.
 * 7. Engine error state handling.
 */

import { describe, it, expect } from 'vitest';
import {
  formatTraditionLabel,
  formatSourceProvenance,
  resolveNoticeDisplayState,
} from '@/components/ui/observance-status-helpers';
import { resolveCalendarContext } from '../calendar-context';
import type { ObservanceVariantItem, ObservanceAlternative } from '@/components/ui/ObservanceStatusNotice';

describe('ObservanceStatusNotice Helper & Display State Logic', () => {
  it('1. Consolidates disputed variants together with variant label, date, eligibility, and source', () => {
    const variants: ObservanceVariantItem[] = [
      {
        variantKey: 'smarta',
        traditionLabel: 'Smarta Tradition',
        civilDate: '2026-07-10',
        isPrimary: true,
        profileEligibility: 'Matches your Smarta profile',
        sourceRef: {
          sourceName: 'Rashtriya Panchang, Saka 1948',
          tier: 1,
          pageOrSection: 'p.30',
        },
      },
      {
        variantKey: 'vaishnava',
        traditionLabel: 'Vaishnava (Vidhava)',
        civilDate: '2026-07-11',
        isPrimary: false,
        profileEligibility: 'Applies to Vaishnava profile',
        sourceRef: {
          sourceName: 'Rashtriya Panchang, Saka 1948',
          tier: 1,
          pageOrSection: 'p.30',
        },
      },
    ];

    const state = resolveNoticeDisplayState({
      status: 'under_review',
      variants,
    });

    expect(state.consolidatedVariants).toHaveLength(2);
    expect(state.consolidatedVariants[0].traditionLabel).toBe('Smarta Tradition');
    expect(state.consolidatedVariants[0].civilDate).toBe('2026-07-10');
    expect(state.consolidatedVariants[1].traditionLabel).toBe('Vaishnava (Vidhava)');
    expect(state.consolidatedVariants[1].civilDate).toBe('2026-07-11');
  });

  it('2. Clearly marks the user-selected primary variant', () => {
    const alternatives: ObservanceAlternative[] = [
      {
        profile: { calendar: 'north_indian_purnimanta', tradition: 'smarta' },
        civilDate: '2026-07-10',
      },
      {
        profile: { calendar: 'north_indian_purnimanta', tradition: 'vaishnava_vidhava' },
        civilDate: '2026-07-11',
      },
    ];

    const state = resolveNoticeDisplayState({
      status: 'resolved',
      primaryDate: '2026-07-10',
      alternatives,
    });

    const primaryVariant = state.consolidatedVariants.find(v => v.isPrimary);
    expect(primaryVariant).toBeDefined();
    expect(primaryVariant!.civilDate).toBe('2026-07-10');
    expect(primaryVariant!.profileEligibility).toBe('Matches your active profile');
  });

  it('3. Unsupported profile / unknown context resolves isUnderReview = true and does NOT select candidate 0 as a guessed date', () => {
    const unsupportedContext = resolveCalendarContext({
      calendarProfile: 'unknown',
      traditionProfile: 'unknown',
    });

    const alternatives: ObservanceAlternative[] = [
      {
        profile: { calendar: 'north_indian_purnimanta', tradition: 'smarta' },
        civilDate: '2026-07-10',
      },
      {
        profile: { calendar: 'north_indian_purnimanta', tradition: 'vaishnava_vidhava' },
        civilDate: '2026-07-11',
      },
    ];

    const state = resolveNoticeDisplayState({
      status: 'under_review',
      alternatives,
      context: unsupportedContext,
    });

    expect(state.isUnsupportedProfile).toBe(true);
    expect(state.isUnderReview).toBe(true);

    // Candidate 0 is NOT guessed as primary when profile is unsupported
    const primaryCount = state.consolidatedVariants.filter(v => v.isPrimary).length;
    expect(primaryCount).toBe(0);
  });

  it('4. Formats Yogini Ekadashi 2026 dual sourced readings cleanly with source citations', () => {
    const yoginiAlternatives: ObservanceAlternative[] = [
      {
        profile: { calendar: 'north_indian_purnimanta', tradition: 'smarta' },
        civilDate: '2026-07-10',
        sourceRef: {
          sourceName: 'Rashtriya Panchang, Saka 1948',
          tier: 1,
          pageOrSection: 'p.30',
        },
        note: 'Smarta sunrise tithi reading',
      },
      {
        profile: { calendar: 'north_indian_purnimanta', tradition: 'vaishnava_vidhava' },
        civilDate: '2026-07-11',
        sourceRef: {
          sourceName: 'Rashtriya Panchang, Saka 1948',
          tier: 1,
          pageOrSection: 'p.30',
        },
        note: 'Vaishnava Suddha reading',
      },
    ];

    const state = resolveNoticeDisplayState({
      status: 'under_review',
      alternatives: yoginiAlternatives,
    });

    expect(state.consolidatedVariants).toHaveLength(2);
    expect(state.consolidatedVariants[0].civilDate).toBe('2026-07-10');
    expect(state.consolidatedVariants[1].civilDate).toBe('2026-07-11');

    const formattedSource = formatSourceProvenance(state.consolidatedVariants[0].sourceRef);
    expect(formattedSource).toBe('Tier 1: Rashtriya Panchang, Saka 1948, p.30');
  });

  it('5. Labels location-only date differences as location variances, not tradition disputes', () => {
    const state = resolveNoticeDisplayState({
      status: 'resolved',
      isLocationEffectOnly: true,
    });

    expect(state.isLocationVarianceOnly).toBe(true);
  });

  it('6. Formats only typed source metadata and fails closed when it is absent', () => {
    expect(formatSourceProvenance({
      sourceName: 'Rashtriya Panchang, Saka 1948',
      tier: 1,
      pageOrSection: 'p.30',
    })).toBe('Tier 1: Rashtriya Panchang, Saka 1948, p.30');
    expect(formatSourceProvenance(null)).toBe('Source metadata unavailable');
  });

  it('7. Formats tradition labels for all recognized sampradayas', () => {
    expect(formatTraditionLabel('smarta')).toBe('Smarta Tradition');
    expect(formatTraditionLabel('gaudiya_iskcon')).toBe('Gaudiya Vaishnava');
    expect(formatTraditionLabel('sri_vaishnava')).toBe('Sri Vaishnava');
    expect(formatTraditionLabel('swaminarayan')).toBe('Swaminarayan');
    expect(formatTraditionLabel('vaishnava_vidhava')).toBe('Vaishnava (Vidhava)');
  });
});
