import { describe, expect, it } from 'vitest';
import { mapOccurrenceToFestival } from './festivals';

describe('mapOccurrenceToFestival notification scope', () => {
  it('preserves profile scope from the occurrence and definition filter', () => {
    const mapped = mapOccurrenceToFestival({
      id: 'occurrence-1',
      date: '2026-11-08',
      calendar_profile: 'north_indian_purnimanta',
      spiritual_tradition: 'hindu',
      variant_key: 'smarta_nishita',
      observance_definitions: {
        display_name: 'Maha Shivaratri',
        kind: 'major',
        tradition: 'all',
        sampradaya_filter: 'smarta',
      },
    });

    expect(mapped.calendar_profile).toBe('north_indian_purnimanta');
    expect(mapped.tradition).toBe('hindu');
    expect(mapped.sampradaya).toBe('smarta');
  });
});

import { deduplicateTithiVrats } from './observance-notification-source';

describe('deduplicateTithiVrats', () => {
  it('suppresses generic amavasya-vrat when specific mahalaya-amavasya is on the same date', () => {
    const input = [
      {
        id: 'occ-1',
        date: '2026-10-10',
        slug: 'mahalaya-amavasya',
        name: 'Mahalaya Amavasya',
        route_slug: 'amavasya',
      },
      {
        id: 'occ-2',
        date: '2026-10-10',
        slug: 'amavasya-vrat',
        name: 'Amavasya',
        route_slug: 'amavasya',
      },
    ];

    const result = deduplicateTithiVrats(input);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('mahalaya-amavasya');
  });

  it('preserves generic amavasya-vrat when no specific observance exists on that date', () => {
    const input = [
      {
        id: 'occ-regular',
        date: '2026-11-09',
        slug: 'amavasya-vrat',
        name: 'Amavasya',
        route_slug: 'amavasya',
      },
    ];

    const result = deduplicateTithiVrats(input);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('amavasya-vrat');
  });

  it('suppresses generic purnima-vrat when kartik-purnima is on the same date', () => {
    const input = [
      {
        id: 'occ-p1',
        date: '2026-11-24',
        slug: 'kartik-purnima',
        name: 'Kartik Purnima',
        route_slug: 'purnima',
      },
      {
        id: 'occ-p2',
        date: '2026-11-24',
        slug: 'purnima-vrat',
        name: 'Purnima Vrat',
        route_slug: 'purnima',
      },
    ];

    const result = deduplicateTithiVrats(input);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('kartik-purnima');
  });

  it('suppresses generic ekadashi when nirjala-ekadashi is on the same date', () => {
    const input = [
      {
        id: 'occ-e1',
        date: '2026-06-25',
        slug: 'nirjala-ekadashi',
        name: 'Nirjala Ekadashi',
        route_slug: 'nirjala-ekadashi',
      },
      {
        id: 'occ-e2',
        date: '2026-06-25',
        slug: 'ekadashi',
        name: 'Ekadashi',
        route_slug: 'ekadashi',
      },
    ];

    const result = deduplicateTithiVrats(input);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('nirjala-ekadashi');
  });
});
