import { describe, expect, it } from 'vitest';
import { selectDisplayObservances } from '../display-observances';
import type { ClientObservanceResult } from '../observance-formatter';

function row(overrides: Partial<ClientObservanceResult>): ClientObservanceResult {
  return {
    date: '2026-08-28',
    civilDate: '2026-08-28',
    slug: 'raksha-bandhan',
    festivalId: 'raksha-bandhan',
    display_name: 'Raksha Bandhan',
    emoji: '🪢',
    description: '',
    kind: 'major',
    tradition: 'hindu',
    route_kind: 'festival',
    route_slug: 'raksha-bandhan',
    status: 'resolved',
    candidateDates: [],
    reviewPlacementDate: null,
    location: { label: 'Ujjain', lat: 23.17, lon: 75.78, tz: 'Asia/Kolkata' },
    profile: { calendar: 'legacy-ujjain', tradition: 'hindu' },
    versions: { panchangaCore: '1', calendarProfile: '1', ruleEngine: '1', rule: '1' },
    reasons: [],
    alternatives: [],
    diagnostics: [],
    sourceRefs: [],
    reviewStatus: 'reviewed',
    isPrimary: false,
    ...overrides,
  } as ClientObservanceResult;
}

describe('selectDisplayObservances', () => {
  it('collapses profile and location rows into one primary card', () => {
    const output = selectDisplayObservances([
      row({ id: 'legacy' }),
      row({ id: 'profile-bedford', profile: { calendar: 'north-indian', tradition: 'hindu' } }),
      row({ id: 'profile-primary', isPrimary: true, profile: { calendar: 'north-indian', tradition: 'hindu' } }),
    ]);
    expect(output).toHaveLength(1);
    expect(output[0].id).toBe('profile-primary');
  });

  it('retains distinct recurring instances and withholds unresolved rows', () => {
    const output = selectDisplayObservances([
      row({ slug: 'ekadashi', festivalId: 'ekadashi', civilDate: '2026-08-28' }),
      row({ slug: 'ekadashi', festivalId: 'ekadashi', civilDate: '2026-09-12', date: '2026-09-12' }),
      row({ slug: 'diwali', festivalId: 'diwali', civilDate: null, status: 'under_review' }),
    ]);
    expect(output.map((item) => item.civilDate)).toEqual(['2026-08-28', '2026-09-12']);
  });
});
