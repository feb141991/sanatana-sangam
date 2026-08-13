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
import { resolveCalendarContext } from '../calendar-context';

const UJJAIN = { computed_latitude: 23.1765, computed_longitude: 75.7885, computed_timezone: 'Asia/Kolkata' };

/**
 * A complete materialisation batch, as the read path now requires before a
 * profile may supersede the legacy fallback.
 *
 * Row COUNTS no longer decide this. These fixtures used to rely on the old
 * heuristic (more rows wins), which could not see two equally-short sets; a
 * profile set is now trusted only when the materialiser recorded that it
 * finished. Tests that mean "the profile is complete" must say so.
 */
const completeBatch = (n = 1) => ({
  id: 'batch-complete', status: 'complete', expected_row_count: n, produced_row_count: n,
});
const partialBatch = (expected: number, produced: number) => ({
  id: 'batch-partial', status: 'partial', expected_row_count: expected, produced_row_count: produced,
});

const occ = (slug: string, date: string, calendar_profile: string, batch: any = null) => ({
  batch,
  batch_family_complete: true,
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
    const profileRow = occ('test-festival', '2026-09-01', 'gujarati-amanta', completeBatch());
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

  it('publishes two YEARS of an annual festival as two resolved primaries', () => {
    // The assertion the test above was missing. Checking only that both dates
    // survive says nothing about what they were classified as: the final grouping
    // keyed annual rows on slug+location with no year, so Diwali 2026 and Diwali
    // 2027 were read as competing readings of one date -- both 'ambiguous', one
    // primary. Two years of the same festival are not a dispute.
    //
    // Third occurrence of this shape in this file. Presence is not cardinality.
    const rows = [
      occ('diwali', '2026-11-08', 'legacy-ujjain'),
      occ('diwali', '2027-10-29', 'legacy-ujjain'),
    ];
    const out = format(rows, 'legacy-ujjain', '2026-11-01', '2027-11-30');
    expect(out).toHaveLength(2);
    expect(out.map(r => r.status)).toEqual(['resolved', 'resolved']);
    expect(out.every(r => r.isPrimary)).toBe(true);
    expect(out.every(r => r.alternatives.length === 0)).toBe(true);
  });

  it('still groups a genuine same-year variant pair', () => {
    // The converse guard. Adding year to the key must not over-split: two
    // sampradaya readings of ONE instance are a real dispute and must stay in one
    // group, or the fix for over-merging silently destroys variant handling.
    // variant_key must be cleared, not just spiritual_tradition overridden: occ()'s
    // base fixture sets variant_key: 'default' on every row, and the grouping code
    // prefers variantKey over profile.tradition when it builds itemsByVariantKey
    // (observance-formatter.ts ~475), so leaving 'default' on both rows collapsed
    // them into one identity regardless of their differing spiritual_tradition --
    // silently skipping the whole isCitedDispute branch this test exists to reach.
    // Real krishna-janmashtami rows never carry variant_key (only sampradaya /
    // spiritual_tradition -- see rules.json), so null here matches production.
    const smarta = { ...occ('krishna-janmashtami', '2026-09-04', 'legacy-ujjain'), variant_key: null, spiritual_tradition: 'smarta' };
    const vaish  = { ...occ('krishna-janmashtami', '2026-09-05', 'legacy-ujjain'), variant_key: null, spiritual_tradition: 'gaudiya_iskcon' };
    const context = resolveCalendarContext({
      calendarProfile: 'legacy-ujjain',
      calendarProfileDefinition: {
        slug: 'legacy-ujjain',
        monthSystem: 'unknown',
        era: 'vikram_north',
      },
      traditionProfile: 'gaudiya_iskcon',
      traditionProfileDefinition: {
        slug: 'gaudiya_iskcon',
        ekadashiMethod: 'vaishnava_suddha',
        janmashtamiMethod: 'vaishnava_rohini',
      },
    });
    const out = formatOccurrencesToResults(
      [smarta, vaish],
      [],
      'hindu',
      'legacy-ujjain',
      'gaudiya_iskcon',
      '2026-09-01',
      '2026-09-30',
      context,
    );
    expect(out).toHaveLength(2);
    expect(out.filter(r => r.isPrimary)).toHaveLength(1);
    expect(out.find(r => r.isPrimary)!.civilDate).toBe('2026-09-05');
    expect(out.find(r => r.isPrimary)!.alternatives.length).toBeGreaterThan(0);
  });
});

describe('recurring observances are grouped per year, not per slug alone', () => {
  it('publishes every instance of a series as resolved and primary', () => {
    // The assertion this file was missing. The previous version checked only the
    // COUNT, so it passed while all three rows came back status 'ambiguous' with
    // only the first isPrimary -- the downstream grouping was reading a series of
    // distinct observances as competing readings of one date. Any consumer
    // honouring isPrimary would have shown one Ekadashi instead of three.
    const rows = [
      occ('ekadashi', '2026-03-01', 'legacy-ujjain'),
      occ('ekadashi', '2026-03-15', 'legacy-ujjain'),
      occ('ekadashi', '2026-03-29', 'legacy-ujjain'),
    ];
    const out = format(rows, 'legacy-ujjain', '2026-03-01', '2026-03-31');
    expect(out).toHaveLength(3);
    expect(out.map(r => r.status)).toEqual(['resolved', 'resolved', 'resolved']);
    expect(out.every(r => r.isPrimary)).toBe(true);
    expect(out.every(r => r.alternatives.length === 0)).toBe(true);
  });

  it('does not drop legacy rows when the profile has none for that slug-year', () => {
    const rows = [
      occ('ekadashi', '2026-03-01', 'legacy-ujjain'),
      occ('ekadashi', '2026-03-15', 'legacy-ujjain'),
      occ('ekadashi', '2026-03-29', 'legacy-ujjain'),
    ];
    const out = format(rows, 'gujarati-amanta', '2026-03-01', '2026-03-31');
    expect(out).toHaveLength(3);
  });

  it('uses the profile exclusively when its BATCH reports complete', () => {
    // Interleaving would produce a sequence of dates belonging to neither
    // calendar, so a complete profile answers the whole slug-year. Completeness
    // is now the materialiser's statement, not an inference from row counts --
    // note the profile has FEWER rows here than the fallback and still wins,
    // which the old count heuristic could never have allowed.
    const rows = [
      occ('ekadashi', '2026-03-02', 'gujarati-amanta', completeBatch(2)),
      occ('ekadashi', '2026-03-16', 'gujarati-amanta', completeBatch(2)),
      occ('ekadashi', '2026-03-01', 'legacy-ujjain'),
      occ('ekadashi', '2026-03-15', 'legacy-ujjain'),
      occ('ekadashi', '2026-03-29', 'legacy-ujjain'),
    ];
    const out = format(rows, 'gujarati-amanta', '2026-03-01', '2026-03-31');
    expect(out.map(r => r.civilDate).sort()).toEqual(['2026-03-02', '2026-03-16']);
    expect(out.every(r => r.profile.calendar === 'gujarati-amanta')).toBe(true);
  });
});

describe('incomplete profile materialisation does not silently delete observances', () => {
  it('keeps the fallback when the profile has FEWER rows, and flags it', () => {
    // The previous version of this suite ENDORSED the opposite: it asserted that
    // two profile Ekadashis should replace three legacy ones, which is an
    // interrupted materialisation silently removing a real observance. There is
    // no completion marker to check, so the counts are compared and the shortfall
    // is surfaced rather than assumed away.
    const rows = [
      occ('ekadashi', '2026-03-02', 'gujarati-amanta', partialBatch(24, 2)),
      occ('ekadashi', '2026-03-16', 'gujarati-amanta', partialBatch(24, 2)),
      occ('ekadashi', '2026-03-01', 'legacy-ujjain'),
      occ('ekadashi', '2026-03-15', 'legacy-ujjain'),
      occ('ekadashi', '2026-03-29', 'legacy-ujjain'),
    ];
    const out = format(rows, 'gujarati-amanta', '2026-03-01', '2026-03-31');

    // Nothing is lost: all three legacy instances survive.
    expect(out).toHaveLength(3);
    expect(out.map(r => r.civilDate).sort()).toEqual(['2026-03-01', '2026-03-15', '2026-03-29']);
    // And the condition is visible rather than silent.
    expect(out.every(r => r.diagnostics.includes('incomplete_profile_materialisation'))).toBe(true);
  });

  it('does not flag a single-instance festival where both sides have one row', () => {
    // Equal counts are the normal case for a non-recurring festival and must not
    // trip the incompleteness check.
    const rows = [
      occ('test-festival', '2026-09-04', 'gujarati-amanta', completeBatch()),
      occ('test-festival', '2026-09-03', 'legacy-ujjain'),
    ];
    const out = format(rows, 'gujarati-amanta', '2026-09-01', '2026-09-30');
    expect(out).toHaveLength(1);
    expect(out[0].civilDate).toBe('2026-09-04');
    expect(out[0].diagnostics).not.toContain('incomplete_profile_materialisation');
  });
});

describe('review-queue items are profile-resolved too', () => {
  const queueRow = (
    slug: string,
    year: number,
    calendar_profile: string,
    candidate: string,
    spiritual_tradition: string | null = null,
  ) => ({
    id: `${slug}-${calendar_profile}-${spiritual_tradition ?? 'unspecified'}`,
    definition_id: 'def-1',
    year,
    calendar_profile,
    spiritual_tradition,
    variant_key: spiritual_tradition ?? 'legacy-default',
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

  it("surfaces the USER'S profile queue entry, not the legacy one", () => {
    // Asserting the count alone let a real regression through: requiring a
    // trustworthy batch made every profile queue entry fail (queue rows have no
    // batch and never will), so the legacy entry always won and the test still
    // saw exactly one row. Which one survives is the whole point.
    const queue = [
      queueRow('disputed-festival', 2026, 'gujarati-amanta', '2026-09-04'),
      queueRow('disputed-festival', 2026, 'legacy-ujjain', '2026-09-03'),
    ];
    const out = format([], 'gujarati-amanta', '2026-09-01', '2026-09-30', queue);
    expect(out).toHaveLength(1);
    expect(out[0].profile.calendar).toBe('gujarati-amanta');
  });

  it('keeps the legacy queue entry when the profile has none', () => {
    const queue = [queueRow('disputed-festival', 2026, 'legacy-ujjain', '2026-09-03')];
    const out = format([], 'gujarati-amanta', '2026-09-01', '2026-09-30', queue);
    expect(out).toHaveLength(1);
  });

  it('keeps unresolved sampradaya variants distinct and selects one presentation primary', () => {
    const queue = [
      queueRow('krishna-janmashtami', 2026, 'legacy-ujjain', '2026-09-04', 'smarta'),
      queueRow('krishna-janmashtami', 2026, 'legacy-ujjain', '2026-09-05', 'gaudiya_iskcon'),
    ];
    const context = resolveCalendarContext({
      calendarProfile: 'legacy-ujjain',
      calendarProfileDefinition: {
        slug: 'legacy-ujjain',
        monthSystem: 'unknown',
        era: 'vikram_north',
      },
      traditionProfile: 'gaudiya_iskcon',
      traditionProfileDefinition: {
        slug: 'gaudiya_iskcon',
        ekadashiMethod: 'vaishnava_suddha',
        janmashtamiMethod: 'vaishnava_rohini',
      },
    });

    const out = formatOccurrencesToResults(
      [], queue, 'hindu', 'legacy-ujjain', 'gaudiya_iskcon',
      '2026-09-01', '2026-09-30', context,
    );

    expect(out).toHaveLength(2);
    expect(out.filter(item => item.isPrimary)).toHaveLength(1);
    expect(out.find(item => item.isPrimary)?.profile.tradition).toBe('gaudiya_iskcon');
    expect(out.every(item => item.civilDate === null)).toBe(true);
  });
});
