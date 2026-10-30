import { describe, expect, it } from 'vitest';
import { selectFestivalReaderOccurrence } from '../festival-reader-selection';
import type { ClientObservanceResult } from '../observance-formatter';

function mockObservance(overrides: Partial<ClientObservanceResult> = {}): ClientObservanceResult {
  return {
    date: '2026-10-14',
    civilDate: '2026-10-14',
    slug: 'rama-navami',
    route_slug: 'rama-navami',
    display_name: 'Rama Navami',
    emoji: '🏹',
    kind: 'major',
    tradition: 'hindu',
    route_kind: 'festival',
    description: 'Appearance day of Lord Rama',
    festivalId: 'rama-navami',
    status: 'resolved',
    candidateDates: ['2026-10-14'],
    reviewPlacementDate: null,
    location: { label: 'Ujjain', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
    profile: { calendar: 'legacy-ujjain', tradition: 'hindu' },
    versions: { panchangaCore: '1.0.0', calendarProfile: '1.0.0', ruleEngine: '1.0.0', rule: '1.0.0' },
    reasons: [],
    alternatives: [],
    confidence: 'high',
    diagnostics: [],
    sourceRefs: [],
    reviewStatus: 'reviewed',
    isPrimary: true,
    id: '11111111-1111-4111-8111-111111111111',
    ...overrides,
  };
}

describe('selectFestivalReaderOccurrence (Calendar Governance Contract)', () => {
  it('returns unavailable when results list is empty', () => {
    const res = selectFestivalReaderOccurrence([], { slug: 'rama-navami' });
    expect(res).toEqual({
      occurrence: null,
      candidates: [],
      selection: 'unavailable',
    });
  });

  it('returns selected when exactly 1 verified, resolved candidate matches', () => {
    const row = mockObservance({ id: 'occ-1', slug: 'rama-navami' });
    const res = selectFestivalReaderOccurrence([row], { slug: 'rama-navami' });
    expect(res.selection).toBe('selected');
    expect(res.occurrence).toBe(row);
    expect(res.candidates).toEqual([row]);
  });

  it('matches via route_slug alias as well as primary slug', () => {
    const row = mockObservance({ id: 'occ-1', slug: 'ram-navami-alt', route_slug: 'rama-navami' });
    const res = selectFestivalReaderOccurrence([row], { slug: 'rama-navami' });
    expect(res.selection).toBe('selected');
    expect(res.occurrence).toBe(row);
  });

  it('never presents a final date for unresolved, under_review, ambiguous or withheld occurrences', () => {
    const unreviewed = mockObservance({ status: 'under_review', civilDate: null });
    const ambiguous = mockObservance({ status: 'ambiguous', civilDate: null });
    const withheld = mockObservance({ status: 'unresolved', civilDate: null });
    const draftWithDate = mockObservance({ status: 'under_review', civilDate: '2026-10-14' });

    const res1 = selectFestivalReaderOccurrence([unreviewed], { slug: 'rama-navami' });
    expect(res1.selection).toBe('unavailable');
    expect(res1.occurrence).toBeNull();
    expect(res1.candidates).toEqual([]);

    const res2 = selectFestivalReaderOccurrence([ambiguous], { slug: 'rama-navami' });
    expect(res2.selection).toBe('unavailable');
    expect(res2.occurrence).toBeNull();

    const res3 = selectFestivalReaderOccurrence([withheld], { slug: 'rama-navami' });
    expect(res3.selection).toBe('unavailable');
    expect(res3.occurrence).toBeNull();

    const res4 = selectFestivalReaderOccurrence([draftWithDate], { slug: 'rama-navami' });
    expect(res4.selection).toBe('unavailable');
    expect(res4.occurrence).toBeNull();
  });

  it('never silently chooses between recognised traditions: returns selection=multiple with all variants', () => {
    const smartha = mockObservance({
      id: 'smartha-1',
      civilDate: '2026-10-14',
      variantKey: 'smartha',
      isPrimary: true,
      profile: { calendar: 'legacy-ujjain', tradition: 'smartha' },
    });
    const vaishnava = mockObservance({
      id: 'vaishnava-1',
      civilDate: '2026-10-15',
      variantKey: 'vaishnava',
      isPrimary: false,
      profile: { calendar: 'legacy-ujjain', tradition: 'vaishnava' },
    });

    const res = selectFestivalReaderOccurrence([smartha, vaishnava], { slug: 'rama-navami' });
    expect(res.selection).toBe('multiple');
    expect(res.candidates).toEqual([smartha, vaishnava]);
    expect(res.occurrence).toBe(smartha); // primary is exposed as initial selection without suppressing alternatives
  });

  it('selects explicit variant when variantKey target is requested', () => {
    const smartha = mockObservance({
      id: 'smartha-1',
      civilDate: '2026-10-14',
      variantKey: 'smartha',
      isPrimary: true,
    });
    const vaishnava = mockObservance({
      id: 'vaishnava-1',
      civilDate: '2026-10-15',
      variantKey: 'vaishnava',
      isPrimary: false,
    });

    const res = selectFestivalReaderOccurrence([smartha, vaishnava], {
      slug: 'rama-navami',
      variantKey: 'vaishnava',
    });
    expect(res.selection).toBe('selected');
    expect(res.occurrence).toBe(vaishnava);
    expect(res.candidates).toEqual([vaishnava]);
  });

  it('selects explicit date when target date is requested', () => {
    const smartha = mockObservance({
      id: 'smartha-1',
      civilDate: '2026-10-14',
      variantKey: 'smartha',
      isPrimary: true,
    });
    const vaishnava = mockObservance({
      id: 'vaishnava-1',
      civilDate: '2026-10-15',
      variantKey: 'vaishnava',
      isPrimary: false,
    });

    const res = selectFestivalReaderOccurrence([smartha, vaishnava], {
      slug: 'rama-navami',
      date: '2026-10-15',
    });
    expect(res.selection).toBe('selected');
    expect(res.occurrence).toBe(vaishnava);
    expect(res.candidates).toEqual([vaishnava]);
  });

  it('selects exact occurrence by occurrenceId and rejects mismatched id', () => {
    const occA = mockObservance({ id: 'uuid-a', civilDate: '2026-10-14' });
    const occB = mockObservance({ id: 'uuid-b', civilDate: '2026-10-15' });

    const matched = selectFestivalReaderOccurrence([occA, occB], {
      slug: 'rama-navami',
      occurrenceId: 'uuid-b',
    });
    expect(matched.selection).toBe('selected');
    expect(matched.occurrence).toBe(occB);

    const unmatched = selectFestivalReaderOccurrence([occA, occB], {
      slug: 'rama-navami',
      occurrenceId: 'uuid-unknown',
    });
    expect(unmatched.selection).toBe('unavailable');
    expect(unmatched.occurrence).toBeNull();
  });

  it('groups only immediate upcoming occurrence instance and does not leak recurring dates 2 weeks later', () => {
    const upcomingDay1 = mockObservance({ id: 'ek-1', civilDate: '2026-10-14', isPrimary: true });
    const upcomingDay2 = mockObservance({ id: 'ek-2', civilDate: '2026-10-15', isPrimary: false });
    const nextFortnight = mockObservance({ id: 'ek-3', civilDate: '2026-10-29', isPrimary: true });

    const res = selectFestivalReaderOccurrence([upcomingDay1, upcomingDay2, nextFortnight], {
      slug: 'rama-navami',
    });
    expect(res.selection).toBe('multiple');
    expect(res.candidates).toEqual([upcomingDay1, upcomingDay2]);
    expect(res.candidates).not.toContain(nextFortnight);
  });
});
