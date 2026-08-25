import { describe, expect, it } from 'vitest';
import {
  fetchIncompleteSeriesOccurrenceIds,
  isOccurrenceObservableInItsSeries,
  isSeriesMemberSlug,
} from '../observance-series-eligibility';
import type { ClientObservanceResult } from '../observance-formatter';
import type { BuildObservanceSeriesOptions } from '../observance-series';

const DEF = {
  slug: 'placeholder',
  display_name: 'Placeholder',
  emoji: '🪔',
  description: '',
  kind: 'major',
  tradition: 'hindu',
  route_kind: 'vrat',
  route_slug: 'placeholder',
  active: true,
};

function row(slug: string, date: string, overrides: Record<string, unknown> = {}) {
  return {
    id: `occ-${slug}`,
    definition_id: `def-${slug}`,
    date,
    occurrence_date: date,
    year: date.slice(0, 4),
    review_status: 'reviewed',
    verification_status: 'verified',
    audit_status: 'completed',
    publication_status: 'published',
    calculated_by: 'engine',
    final_date_source: 'engine',
    calendar_profile: 'legacy-ujjain',
    spiritual_tradition: 'standard',
    variant_key: 'standard',
    series_instance_key: null,
    batch_id: null,
    reasons: [],
    diagnostics: [],
    source_refs: [{ sourceName: 'Test fixture', tier: 1 }],
    computed_latitude: 23.1765,
    computed_longitude: 75.7885,
    computed_timezone: 'Asia/Kolkata',
    rule_version: '1.0.0',
    astronomy_version: '1.0.0',
    day_boundary_version: '1.0.0',
    observance_definitions: { ...DEF, slug, display_name: slug, route_slug: slug },
    ...overrides,
  };
}

const DIWALI_ROWS = [
  row('dhanteras', '2026-11-06'),
  row('naraka-chaturdashi', '2026-11-08'),
  row('diwali', '2026-11-08'),
  row('govardhan-puja', '2026-11-09'),
  row('bhai-dooj', '2026-11-10'),
];

/** Minimal fake matching the .from().select().in().eq().gte().lte() chain used by fetchIncompleteSeriesOccurrenceIds. */
function fakeSupabase(data: unknown[]) {
  const builder: any = {
    in: () => builder,
    eq: () => builder,
    gte: () => builder,
    lte: () => builder,
    then: (resolve: (v: { data: unknown[]; error: null }) => void) => resolve({ data, error: null }),
  };
  return {
    from: () => ({ select: () => builder }),
  } as any;
}

describe('isSeriesMemberSlug', () => {
  it('recognises real series-member slugs and rejects unrelated ones', () => {
    expect(isSeriesMemberSlug('diwali')).toBe(true);
    expect(isSeriesMemberSlug('naraka-chaturdashi')).toBe(true);
    expect(isSeriesMemberSlug('ekadashi')).toBe(false);
    expect(isSeriesMemberSlug(null)).toBe(false);
    expect(isSeriesMemberSlug(undefined)).toBe(false);
  });
});

const LOCATION = { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
const PROFILE = { calendar: 'legacy-ujjain', tradition: 'standard' };
const OPTIONS: BuildObservanceSeriesOptions = {
  spiritualDate: '2026-11-08',
  profile: PROFILE,
  location: LOCATION,
  tradition: 'hindu',
};

function clientResult(slug: string, civilDate: string | null, overrides: Partial<ClientObservanceResult> = {}): ClientObservanceResult {
  return {
    date: civilDate ?? '',
    slug,
    display_name: slug,
    emoji: '🪔',
    kind: 'major',
    tradition: 'hindu',
    route_kind: 'vrat',
    route_slug: slug,
    description: '',
    id: `occ-${slug}-${civilDate ?? 'none'}`,
    festivalId: slug,
    variantKey: 'standard',
    status: civilDate ? 'resolved' : 'unresolved',
    civilDate,
    candidateDates: civilDate ? [civilDate] : [],
    reviewPlacementDate: civilDate,
    location: LOCATION,
    profile: PROFILE,
    versions: { panchangaCore: '1', calendarProfile: '1', ruleEngine: '1', rule: '1' },
    reasons: [],
    alternatives: [],
    confidence: civilDate ? 'high' : 'low',
    diagnostics: [],
    sourceRefs: [{ sourceName: 'Test fixture', tier: 1 }],
    reviewStatus: 'reviewed',
    isPrimary: true,
    ...overrides,
  };
}

function diwaliClusterRows(includeNaraka = true): ClientObservanceResult[] {
  return [
    clientResult('dhanteras', '2026-11-06'),
    ...(includeNaraka ? [clientResult('naraka-chaturdashi', '2026-11-08')] : []),
    clientResult('diwali', '2026-11-08'),
    clientResult('govardhan-puja', '2026-11-09'),
    clientResult('bhai-dooj', '2026-11-10'),
  ];
}

const NAVRATRI_SLUGS = [
  'navratri-day-1-shailaputri', 'navratri-day-2-brahmacharini', 'navratri-day-3-chandraghanta',
  'navratri-day-4-kushmanda', 'navratri-day-5-skandamata', 'navratri-day-6-katyayani',
  'navratri-day-7-kalaratri', 'durga-ashtami', 'maha-navami', 'dussehra',
] as const;
const NAVRATRI_DATES = [
  '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15',
  '2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20',
] as const;
function navratriClusterRows(): ClientObservanceResult[] {
  return NAVRATRI_SLUGS.map((slug, index) => clientResult(slug, NAVRATRI_DATES[index]));
}

describe('isOccurrenceObservableInItsSeries', () => {
  it('allows a non-series slug through unconditionally', () => {
    const rows = diwaliClusterRows();
    expect(isOccurrenceObservableInItsSeries(rows, OPTIONS, 'anything', 'ekadashi')).toBe(true);
  });

  it('allows every child of a complete festival_cluster series (Diwali)', () => {
    const rows = diwaliClusterRows();
    const diwali = rows.find((r) => r.slug === 'diwali')!;
    const dhanteras = rows.find((r) => r.slug === 'dhanteras')!;
    expect(isOccurrenceObservableInItsSeries(rows, OPTIONS, diwali.id!, 'diwali')).toBe(true);
    expect(isOccurrenceObservableInItsSeries(rows, OPTIONS, dhanteras.id!, 'dhanteras')).toBe(true);
  });

  it('rejects every child once a required sibling is missing from the cluster', () => {
    const rows = diwaliClusterRows(false);
    const dhanteras = rows.find((r) => r.slug === 'dhanteras')!;
    expect(isOccurrenceObservableInItsSeries(rows, OPTIONS, dhanteras.id!, 'dhanteras')).toBe(false);
  });

  it('allows only today\'s active child in a daily_journey series (Navratri), not a future resolved day', () => {
    const rows = navratriClusterRows();
    const today = rows.find((r) => r.slug === 'navratri-day-7-kalaratri')!; // civilDate 2026-10-17, matches OPTIONS spiritualDate override below
    const future = rows.find((r) => r.slug === 'dussehra')!; // resolved, but not today
    const navratriOptions: BuildObservanceSeriesOptions = { ...OPTIONS, spiritualDate: '2026-10-17' };
    expect(isOccurrenceObservableInItsSeries(rows, navratriOptions, today.id!, 'navratri-day-7-kalaratri')).toBe(true);
    expect(isOccurrenceObservableInItsSeries(rows, navratriOptions, future.id!, 'dussehra')).toBe(false);
  });
});

describe('fetchIncompleteSeriesOccurrenceIds', () => {
  it('returns an empty set when no candidate slug is a series member', async () => {
    const supabase = fakeSupabase([]);
    const result = await fetchIncompleteSeriesOccurrenceIds(supabase, ['ekadashi', 'pradosh-vrat'], ['2026-11-08', '2026-11-08']);
    expect(result.size).toBe(0);
  });

  it('marks nothing incomplete when every Diwali-cluster sibling is reviewed and present', async () => {
    const supabase = fakeSupabase(DIWALI_ROWS);
    const result = await fetchIncompleteSeriesOccurrenceIds(
      supabase,
      ['diwali', 'naraka-chaturdashi'],
      ['2026-11-08', '2026-11-08'],
    );
    expect(result.size).toBe(0);
  });

  it('marks every child of the cluster incomplete when a required sibling is missing', async () => {
    const withoutNaraka = DIWALI_ROWS.filter((r) => r.observance_definitions.slug !== 'naraka-chaturdashi');
    const supabase = fakeSupabase(withoutNaraka);
    const result = await fetchIncompleteSeriesOccurrenceIds(
      supabase,
      ['diwali'],
      ['2026-11-08'],
    );
    // The whole diwali-five-days series fails closed -- dhanteras, diwali,
    // govardhan-puja, and bhai-dooj are all withheld alongside the missing child.
    expect(result.has('occ-diwali')).toBe(true);
    expect(result.has('occ-dhanteras')).toBe(true);
    expect(result.has('occ-govardhan-puja')).toBe(true);
    expect(result.has('occ-bhai-dooj')).toBe(true);
  });

  it('marks every child incomplete when a sibling exists but is not reviewed', async () => {
    const unreviewed = DIWALI_ROWS.map((r) =>
      r.observance_definitions.slug === 'naraka-chaturdashi'
        ? { ...r, review_status: 'needs_review' }
        : r,
    );
    const supabase = fakeSupabase(unreviewed);
    const result = await fetchIncompleteSeriesOccurrenceIds(
      supabase,
      ['diwali', 'naraka-chaturdashi'],
      ['2026-11-08', '2026-11-08'],
    );
    expect(result.has('occ-diwali')).toBe(true);
    expect(result.has('occ-naraka-chaturdashi')).toBe(true);
  });
});
