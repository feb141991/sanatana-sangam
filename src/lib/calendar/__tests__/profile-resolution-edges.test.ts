/**
 * Edge cases for calendar-profile resolution.
 *
 * The first version of this fix passed its own tests and was still wrong in four
 * ways, all found in review. Each one gets a test here, written so it fails
 * against that first implementation:
 *
 *   - resolution ran AFTER date filtering, so a profile row one day outside the
 *     window was invisible and the fallback published instead;
 *   - the grouping key was `slug@lat,lon`, with no year, so a cross-year window
 *     let one year's profile row suppress another year's fallback;
 *   - the same missing key merged every recurring row under one slug, so a single
 *     profile row could drop legacy rows for dates it never covered;
 *   - review-queue items were not resolved at all.
 */
import { describe, it, expect } from 'vitest';
import { formatOccurrencesToResults } from '../observance-formatter';

const UJJAIN = { computed_latitude: 23.1765, computed_longitude: 75.7885, computed_timezone: 'Asia/Kolkata' };

const occ = (slug: string, date: string, calendar_profile: string) => ({
  ...UJJAIN,
  date,
  occurrence_date: date,
  year: Number(date.slice(0, 4)),
  calendar_profile,
  review_status: 'reviewed',
  verification_status: 'verified',
  audit_status: 'completed',
  spiritual_tradition: null,
  variant_key: 'default',
  is_primary_variant: true,
  reasons: [], diagnostics: [], source_refs: [],
  observance_definitions: {
    slug, display_name: slug, emoji: '🪔', description: '',
    kind: 'major', tradition: 'hindu', route_kind: null, route_slug: null, active: true,
  },
});

const format = (rows: any[], profile: string, from: string, to: string, queue: any[] = []) =>
  formatOccurrencesToResults(rows, queue, 'hindu', profile, null, from, to);

describe('profile resolution happens before range clipping', () => {
  it('does not publish the legacy fallback when the profile row sits just outside the window', () => {
    // The routes over-fetch by a pad precisely so this row is visible. If
    // resolution ran after clipping, only the legacy row would remain, the
    // "never materialised for this profile" branch would fire, and 31 August
    // would be published to a user whose calendar says 1 September.
    const profileRow = occ('test-festival', '2026-09-01', 'gujarati-amanta');
    const legacyRow  = occ('test-festival', '2026-08-31', 'legacy-ujjain');

    const out = format([profileRow, legacyRow], 'gujarati-amanta', '2026-08-01', '2026-08-31');

    // The profile owns this festival, and its date is not in August. The correct
    // answer for an August window is therefore NOTHING -- not the legacy date.
    expect(out.map(r => r.civilDate)).not.toContain('2026-08-31');
    expect(out).toHaveLength(0);
  });

  it('still clips the padding out of the response', () => {
    // Over-fetching must not leak: a September request must not return August.
    const rows = [occ('a', '2026-08-20', 'legacy-ujjain'), occ('a', '2026-09-10', 'legacy-ujjain')];
    const out = format(rows, 'legacy-ujjain', '2026-09-01', '2026-09-30');
    expect(out.map(r => r.civilDate)).toEqual(['2026-09-10']);
  });
});

describe('grouping key includes the year', () => {
  it('a profile row in one year does not suppress the fallback in another', () => {
    // `upcoming` windows cross New Year. Without year in the key, the 2027
    // profile row would make the whole slug "profile-owned" and delete the 2026
    // legacy row, leaving a hole in December.
    const rows = [
      occ('test-festival', '2026-12-28', 'legacy-ujjain'),
      occ('test-festival', '2027-01-05', 'gujarati-amanta'),
    ];
    const out = format(rows, 'gujarati-amanta', '2026-12-01', '2027-01-31');
    expect(out.map(r => r.civilDate).sort()).toEqual(['2026-12-28', '2027-01-05']);
  });
});

describe('recurring observances are grouped per year, not per slug alone', () => {
  it('one profile row does not drop legacy rows for dates the profile never covered', () => {
    // Ekadashi emits ~24 rows a year under one slug. A slug-keyed group would let
    // a single profile row anywhere in the range delete every legacy row for the
    // slug -- a user on a regional calendar would lose most of their Ekadashis.
    const rows = [
      occ('ekadashi', '2026-03-01', 'legacy-ujjain'),
      occ('ekadashi', '2026-03-15', 'legacy-ujjain'),
      occ('ekadashi', '2026-03-29', 'legacy-ujjain'),
    ];
    const out = format(rows, 'gujarati-amanta', '2026-03-01', '2026-03-31');
    // No profile rows at all for this slug-year: the whole fallback set stands.
    expect(out).toHaveLength(3);
  });

  it('applies all-or-nothing within a slug-year rather than interleaving calendars', () => {
    // Where the profile HAS materialised the slug for the year, its rows are used
    // exclusively. Filling gaps from legacy would produce a sequence of dates
    // belonging to neither calendar.
    const rows = [
      occ('ekadashi', '2026-03-02', 'gujarati-amanta'),
      occ('ekadashi', '2026-03-16', 'gujarati-amanta'),
      occ('ekadashi', '2026-03-01', 'legacy-ujjain'),
      occ('ekadashi', '2026-03-15', 'legacy-ujjain'),
      occ('ekadashi', '2026-03-29', 'legacy-ujjain'),
    ];
    const out = format(rows, 'gujarati-amanta', '2026-03-01', '2026-03-31');
    expect(out.map(r => r.civilDate).sort()).toEqual(['2026-03-02', '2026-03-16']);
    expect(out.every(r => r.profile.calendar === 'gujarati-amanta')).toBe(true);
  });
});

describe('review-queue items are profile-resolved too', () => {
  const queueRow = (slug: string, year: number, calendar_profile: string, candidate: string) => ({
    id: `${slug}-${calendar_profile}`,
    definition_id: 'def-1',
    year,
    calendar_profile,
    location_label: 'Ujjain, India',
    ...UJJAIN,
    ambiguity_type: 'multiple_qualified_dates',
    reasoning: 'test',
    candidate_dates: [candidate],
    evaluator_details: {},
    review_status: 'pending_review',
    observance_definitions: {
      slug, display_name: slug, emoji: '🪔', description: '',
      kind: 'major', tradition: 'hindu', route_kind: null, route_slug: null, active: true,
    },
  });

  it('does not surface both the chosen-profile and legacy queue entries', () => {
    // resolveCalendarProfile originally filtered occurrences only, so once
    // profile-specific review entries exist a user would see the same unresolved
    // observance twice, on two different dates.
    const queue = [
      queueRow('disputed-festival', 2026, 'gujarati-amanta', '2026-09-04'),
      queueRow('disputed-festival', 2026, 'legacy-ujjain', '2026-09-03'),
    ];
    const out = format([], 'gujarati-amanta', '2026-09-01', '2026-09-30', queue);
    expect(out).toHaveLength(1);
  });

  it('keeps the legacy queue entry when the profile has none', () => {
    const queue = [queueRow('disputed-festival', 2026, 'legacy-ujjain', '2026-09-03')];
    const out = format([], 'gujarati-amanta', '2026-09-01', '2026-09-30', queue);
    expect(out).toHaveLength(1);
  });
});
