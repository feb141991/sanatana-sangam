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
