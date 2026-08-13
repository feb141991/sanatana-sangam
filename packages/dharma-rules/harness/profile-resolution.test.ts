/**
 * Calendar-profile resolution in formatOccurrencesToResults.
 *
 * The routes ask for `.in('calendar_profile', [chosen, 'legacy-ujjain'])`, so a
 * user on any non-default profile gets two rows per festival. `calendarProfile`
 * was passed to the formatter and never read, and nothing downstream could tell
 * the rows apart: they group on `festivalId@lat,lon` (both computed at Ujjain)
 * and the primary is chosen by `spiritual_tradition`, which both satisfy.
 *
 * These tests are written against the USER-VISIBLE consequences rather than the
 * internals, because the internals are what was wrong. In particular the third
 * test is the one that matters most: where the two rows disagree -- exactly the
 * amanta/purnimanta split the profile exists to express -- the uncited-difference
 * branch marked the entry 'ambiguous'. Picking a regional calendar made your own
 * festivals look disputed.
 */
import { describe, it, expect } from 'vitest';
import { formatOccurrencesToResults } from '@/lib/calendar/observance-formatter';
import { resolveCalendarContext } from '@/lib/calendar/calendar-context';

const UJJAIN = { computed_latitude: 23.1765, computed_longitude: 75.7885, computed_timezone: 'Asia/Kolkata' };

const row = (over: Partial<Record<string, unknown>> & { date: string; calendar_profile: string }) => ({
  ...UJJAIN,
  occurrence_date: over.date,
  review_status: 'reviewed',
  verification_status: 'verified',
  audit_status: 'completed',
  spiritual_tradition: 'standard',
  variant_key: 'default',
  is_primary_variant: true,
  reasons: [], diagnostics: [], source_refs: [],
  observance_definitions: {
    slug: 'test-festival', display_name: 'Test Festival', emoji: '🪔',
    description: '', kind: 'major', tradition: 'hindu',
    route_kind: null, route_slug: null, active: true,
  },
  ...over,
});

const format = (
  rows: Parameters<typeof formatOccurrencesToResults>[0],
  profile: string,
  sampradaya: string | null = null,
) => {
  const isVaishnava = sampradaya === 'gaudiya_iskcon';
  const context = resolveCalendarContext({
    calendarProfile: profile,
    calendarProfileDefinition: {
      slug: profile,
      monthSystem: profile === 'gujarati_amanta' ? 'amanta' : 'unknown',
      era: profile === 'gujarati_amanta' ? 'vikram_gujarat' : 'vikram_north',
    },
    traditionProfile: sampradaya,
    traditionProfileDefinition: sampradaya === 'smarta' || isVaishnava
      ? {
          slug: sampradaya,
          ekadashiMethod: isVaishnava ? 'vaishnava_suddha' : 'smarta',
          janmashtamiMethod: isVaishnava ? 'vaishnava_rohini' : 'smarta_nishita',
        }
      : null,
  });
  return formatOccurrencesToResults(
    rows,
    [],
    'hindu',
    profile,
    sampradaya,
    '2026-01-01',
    '2026-12-31',
    context,
  );
};

describe('calendar profile resolution', () => {
  // A profile set may only supersede the legacy fallback when its materialisation
  // batch reports complete. Row counts no longer decide it, so a fixture that
  // means "this profile is complete" has to say so.
  const gujarati = row({
    date: '2026-09-04',
    calendar_profile: 'gujarati_amanta',
    batch: { id: 'b', status: 'complete', expected_row_count: 1, produced_row_count: 1 },
    batch_family_complete: true,
  });
  const legacy   = row({ date: '2026-09-03', calendar_profile: 'legacy-ujjain' });

  it('returns ONE entry, not both rows, when the user has a non-default profile', () => {
    // The formatter used to emit every row and no route filters on isPrimary,
    // so the user saw the same festival twice on two different days.
    const out = format([gujarati, legacy], 'gujarati_amanta');
    expect(out.filter(r => r.festivalId === 'test-festival')).toHaveLength(1);
  });

  it('keeps the row belonging to the chosen profile, not whichever came back first', () => {
    // Query order decided this before. Asserted in BOTH orders so a fix that
    // merely reorders the query cannot pass.
    for (const rows of [[gujarati, legacy], [legacy, gujarati]]) {
      const out = format(rows, 'gujarati_amanta');
      expect(out[0].civilDate).toBe('2026-09-04');
      expect(out[0].profile.calendar).toBe('gujarati_amanta');
    }
  });

  it('does not mark the entry ambiguous just because the legacy fallback disagrees', () => {
    // The regression that made choosing a regional calendar actively worse than
    // leaving the default alone.
    const out = format([gujarati, legacy], 'gujarati_amanta');
    expect(out[0].status).toBe('resolved');
    expect(out[0].isPrimary).toBe(true);
  });

  it('falls back to legacy-ujjain when the festival was never materialised for the profile', () => {
    // Showing nothing would be a worse failure than showing the fallback.
    const out = format([legacy], 'gujarati_amanta');
    expect(out).toHaveLength(1);
    expect(out[0].civilDate).toBe('2026-09-03');
  });

  it('leaves default-profile users exactly as they were', () => {
    // .in() collapses the duplicate value for them, so their rows were never
    // doubled and this change must be a no-op.
    const out = format([legacy], 'legacy-ujjain');
    expect(out).toHaveLength(1);
    expect(out[0].civilDate).toBe('2026-09-03');
    expect(out[0].status).toBe('resolved');
  });

  it('does not merge rows computed at different locations', () => {
    // Location differences are a separate axis; collapsing them here would
    // reintroduce the bug the grouping comment in the formatter warns about.
    const bedford = row({
      date: '2026-09-03', calendar_profile: 'legacy-ujjain',
      computed_latitude: 52.1360, computed_longitude: -0.4667, computed_timezone: 'Europe/London',
    });
    const out = format([legacy, bedford], 'legacy-ujjain');
    expect(out).toHaveLength(2);
  });
});

describe('variant selection keys on sampradaya, not tradition', () => {
  // krishna-janmashtami is the only rule carrying a citation, so it is the only
  // slug that reaches the [1] DISPUTE branch where variant selection happens.
  const variant = (sampradaya: string, date: string) => ({
    ...UJJAIN,
    date, occurrence_date: date, calendar_profile: 'legacy-ujjain',
    review_status: 'reviewed', verification_status: 'verified', audit_status: 'completed',
    spiritual_tradition: sampradaya, variant_key: sampradaya, is_primary_variant: false,
    reasons: [], diagnostics: [], source_refs: [],
    observance_definitions: {
      slug: 'krishna-janmashtami', display_name: 'Krishna Janmashtami', emoji: '🪔',
      description: '', kind: 'major', tradition: 'hindu',
      route_kind: null, route_slug: null, active: true,
    },
  });

  const smarta    = variant('smarta',    '2026-09-04');
  const vaishnava = variant('gaudiya_iskcon', '2026-09-05');

  it("picks the user's own sampradaya variant", () => {
    const out = format([smarta, vaishnava], 'legacy-ujjain', 'gaudiya_iskcon');
    expect(out.find(r => r.isPrimary)?.civilDate).toBe('2026-09-05');
  });

  it('picks the other one for the other sampradaya', () => {
    // Paired with the test above so a hardcoded winner cannot satisfy both.
    const out = format([smarta, vaishnava], 'legacy-ujjain', 'smarta');
    expect(out.find(r => r.isPrimary)?.civilDate).toBe('2026-09-04');
  });

  it('does not treat a tradition value as a sampradaya', () => {
    // The old code compared requestedTradition ('hindu') against
    // spiritual_tradition ('smarta'/'vaishnava'), which can never match. Passing
    // a tradition where a sampradaya belongs must fail closed rather than select
    // a variant by array order.
    const out = format([smarta, vaishnava], 'legacy-ujjain', 'hindu');
    expect(out.find(r => r.isPrimary)).toBeUndefined();
    expect(out.every(r => r.status === 'under_review')).toBe(true);
    expect(out.flatMap(r => r.candidateDates).sort()).toEqual([
      '2026-09-04',
      '2026-09-04',
      '2026-09-05',
      '2026-09-05',
    ]);
  });

  it('still publishes both readings as alternatives', () => {
    // Selecting a primary must not hide the genuine cited variant.
    const out = format([smarta, vaishnava], 'legacy-ujjain', 'gaudiya_iskcon');
    expect(out).toHaveLength(2);
    expect(out.find(r => r.isPrimary)!.alternatives.length).toBeGreaterThan(0);
  });
});
