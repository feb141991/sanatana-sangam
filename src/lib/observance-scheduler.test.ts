import { describe, expect, it } from 'vitest';
import {
  generateObservanceScheduleCandidates,
  type ObservanceProfile,
} from './observance-scheduler';
import type { ReviewedObservance } from './observance-notification-source';

describe('observance scheduler', () => {
  const mockFestivals: ReviewedObservance[] = [
    {
      id: 'occ-diwali-2026',
      name: 'Diwali',
      emoji: '🪔',
      date: '2026-11-08',
      type: 'major',
      slug: 'diwali',
      tradition: 'hindu',
      description: 'The Festival of Lights celebration',
      sourceEligible: true,
      route_kind: 'festival',
      route_slug: 'diwali',
    },
    {
      id: 'occ-ekadashi-2026',
      name: 'Maha Nirjala Ekadashi',
      emoji: '🌾',
      date: '2026-11-02',
      type: 'vrat',
      slug: 'ekadashi',
      tradition: 'hindu',
      description: 'Sacred fast dedicated to Lord Vishnu',
      sourceEligible: true,
      route_kind: 'vrat',
      route_slug: 'ekadashi',
    },
    {
      id: 'occ-karva-chauth-2026',
      name: 'Karva Chauth',
      emoji: '🌙',
      date: '2026-10-28',
      type: 'vrat',
      slug: 'karva-chauth',
      tradition: 'hindu',
      description: 'Vrat for family well-being',
      sourceEligible: true,
      route_kind: 'vrat',
      route_slug: 'karva-chauth',
    },
    {
      id: 'occ-somvar-vrat-2026',
      name: 'Shravan Somvar Vrat',
      emoji: '🔱',
      date: '2026-11-06',
      type: 'vrat',
      slug: 'somvar-vrat',
      tradition: 'hindu',
      description: 'Sacred fast dedicated to Lord Shiva',
      sourceEligible: true,
      route_kind: 'vrat',
      route_slug: 'somvar-vrat',
    },
  ];

  const defaultUser: ObservanceProfile = {
    id: 'user-standard-1',
    tradition: 'hindu',
    calendar_profile: 'surya-siddhanta',
    sampradaya: null,
    gender_context: 'female',
    timezone: 'Asia/Kolkata',
    wants_festival_reminders: true,
    wants_vrat_reminders: true,
    wants_tithi_reminders: true,
    observance_reminder_lead_days: [0, 1, 7],
    observance_reminder_time: '08:00',
    notification_quiet_hours_start: 22,
    notification_quiet_hours_end: 6,
    is_deleting: false,
  };

  it('generates future scheduled candidates with budget exemption and complete metadata', () => {
    // Current time: 2026-11-01 00:00:00 UTC (05:30 IST)
    // Diwali is 2026-11-08. D7 is 2026-11-01 at 08:00 IST (future).
    // Ekadashi is 2026-11-02. D1 is 2026-11-01 at 08:00 IST (future).
    const now = new Date('2026-11-01T00:00:00.000Z');

    const result = generateObservanceScheduleCandidates({
      users: [defaultUser],
      observances: mockFestivals,
      now,
    });

    expect(result.stats.totalUsers).toBe(1);
    expect(result.stats.eligibleCount).toBeGreaterThan(0);

    const diwaliD7 = result.candidates.find(
      (c) => c.metadata.slug === 'diwali' && c.metadata.days_away === 7
    );
    expect(diwaliD7).toBeDefined();
    expect(diwaliD7?.user_id).toBe('user-standard-1');
    expect(diwaliD7?.notification_type).toBe('festival');
    expect(diwaliD7?.status).toBe('pending');
    expect(diwaliD7?.metadata.budget_class).toBe('explicit_observance');
    expect(diwaliD7?.metadata.budget_exempt).toBe(true);
    expect(diwaliD7?.metadata.type).toBe('festival');
    expect(diwaliD7?.metadata.timezone).toBe('Asia/Kolkata');
    expect(diwaliD7?.notification_key).toBe('observance-v1:occ-diwali-2026:d7:2026-11-08:general');
    // 08:00 IST is 02:30 UTC
    expect(diwaliD7?.send_at).toBe('2026-11-01T02:30:00.000Z');
  });

  it('suppresses festival candidates when user turns off festival reminders', () => {
    const userNoFestivals: ObservanceProfile = {
      ...defaultUser,
      wants_festival_reminders: false,
      wants_vrat_reminders: true,
    };
    const now = new Date('2026-11-01T00:00:00.000Z');

    const result = generateObservanceScheduleCandidates({
      users: [userNoFestivals],
      observances: mockFestivals,
      now,
    });

    const festivalCandidates = result.candidates.filter(
      (c) => c.notification_type === 'festival'
    );
    expect(festivalCandidates).toHaveLength(0);
    expect(result.stats.suppressedReasons['preference_disabled_festival']).toBeGreaterThan(0);

    // Vrat candidates are still scheduled
    const vratCandidates = result.candidates.filter(
      (c) => c.notification_type === 'vrat'
    );
    expect(vratCandidates.length).toBeGreaterThan(0);
  });

  it('suppresses vrat candidates when user turns off vrat reminders', () => {
    const userNoVrats: ObservanceProfile = {
      ...defaultUser,
      wants_festival_reminders: true,
      wants_vrat_reminders: false,
    };
    const now = new Date('2026-11-01T00:00:00.000Z');

    const result = generateObservanceScheduleCandidates({
      users: [userNoVrats],
      observances: mockFestivals,
      now,
    });

    const vratCandidates = result.candidates.filter(
      (c) => c.notification_type === 'vrat'
    );
    expect(vratCandidates).toHaveLength(0);
    expect(result.stats.suppressedReasons['preference_disabled_vrat']).toBeGreaterThan(0);
  });

  it('filters out past send instants', () => {
    // Current time: 2026-11-01 10:00:00 UTC (15:30 IST)
    // 08:00 IST on 2026-11-01 has already passed.
    const now = new Date('2026-11-01T10:00:00.000Z');

    const result = generateObservanceScheduleCandidates({
      users: [defaultUser],
      observances: mockFestivals,
      now,
    });

    // Send instant for 2026-11-01 at 08:00 IST should be skipped as past
    const d1Nov1 = result.candidates.filter(
      (c) => c.metadata.local_date === '2026-11-01'
    );
    expect(d1Nov1).toHaveLength(0);
    expect(result.stats.skippedPastCount).toBeGreaterThan(0);
  });

  it('skips candidates when scheduled time falls into quiet hours window', () => {
    // Reminder time is 05:00, but user quiet hours end at 06:00
    const userQuietHoursConflict: ObservanceProfile = {
      ...defaultUser,
      observance_reminder_time: '05:00',
      notification_quiet_hours_start: 22,
      notification_quiet_hours_end: 6,
    };
    const now = new Date('2026-11-01T00:00:00.000Z');

    const result = generateObservanceScheduleCandidates({
      users: [userQuietHoursConflict],
      observances: mockFestivals,
      now,
    });

    expect(result.stats.skippedQuietHoursCount).toBeGreaterThan(0);
    expect(result.stats.suppressedReasons['quiet_hours_conflict']).toBeGreaterThan(0);
  });

  it('skips occurrences belonging to an incomplete series', () => {
    const now = new Date('2026-11-01T00:00:00.000Z');
    const incompleteIds = new Set(['occ-diwali-2026']);

    const result = generateObservanceScheduleCandidates({
      users: [defaultUser],
      observances: mockFestivals,
      incompleteSeriesIds: incompleteIds,
      now,
    });

    const diwaliCandidates = result.candidates.filter(
      (c) => c.metadata.slug === 'diwali'
    );
    expect(diwaliCandidates).toHaveLength(0);
    expect(result.stats.suppressedReasons['incomplete_series']).toBeGreaterThan(0);
  });

  it('skips users pending account deletion', () => {
    const userDeleting: ObservanceProfile = {
      ...defaultUser,
      is_deleting: true,
    };
    const now = new Date('2026-11-01T00:00:00.000Z');

    const result = generateObservanceScheduleCandidates({
      users: [userDeleting],
      observances: mockFestivals,
      now,
    });

    expect(result.candidates).toHaveLength(0);
    expect(result.stats.suppressedReasons['account_deletion_pending']).toBe(1);
  });

  it('respects gender context for women-focused vrats', () => {
    const maleUser: ObservanceProfile = {
      ...defaultUser,
      gender_context: 'male',
    };
    // Karwa Chauth is 2026-10-28. Let now be 2026-10-21 00:00:00 UTC (D7 send instant)
    const now = new Date('2026-10-21T00:00:00.000Z');

    const result = generateObservanceScheduleCandidates({
      users: [maleUser],
      observances: mockFestivals,
      now,
    });

    const karwaChauthCandidates = result.candidates.filter(
      (c) => c.metadata.slug === 'karva-chauth'
    );
    expect(karwaChauthCandidates).toHaveLength(0);
    expect(result.stats.suppressedReasons['audience_not_applicable']).toBeGreaterThan(0);
  });

  it('supports category filtering', () => {
    const now = new Date('2026-11-01T00:00:00.000Z');

    const festivalOnlyResult = generateObservanceScheduleCandidates({
      users: [defaultUser],
      observances: mockFestivals,
      now,
      categoryFilter: 'festival',
    });

    expect(
      festivalOnlyResult.candidates.every((c) => c.notification_type === 'festival')
    ).toBe(true);

    const vratOnlyResult = generateObservanceScheduleCandidates({
      users: [defaultUser],
      observances: mockFestivals,
      now,
      categoryFilter: 'vrat',
    });

    expect(
      vratOnlyResult.candidates.every((c) => c.notification_type === 'vrat')
    ).toBe(true);
  });

  it('uses canonical occurrence scope instead of treating missing scope as universal', () => {
    const scopedOccurrence: ReviewedObservance = {
      ...mockFestivals[0],
      calendar_profile: 'north-indian',
      sampradaya: 'vaishnava',
    };
    const result = generateObservanceScheduleCandidates({
      users: [{ ...defaultUser, calendar_profile: 'surya-siddhanta', sampradaya: 'smarta' }],
      observances: [scopedOccurrence],
      now: new Date('2026-11-01T00:00:00.000Z'),
    });
    expect(result.candidates).toHaveLength(0);
    expect(result.stats.suppressedReasons.calendar_profile_not_applicable).toBeGreaterThan(0);
  });

  it('routes occurrence-backed tithis through the distinct tithi preference and mode', () => {
    const tithi: ReviewedObservance = { ...mockFestivals[1], slug: 'ekadashi' };
    const result = generateObservanceScheduleCandidates({
      users: [{ ...defaultUser, wants_vrat_reminders: false, wants_tithi_reminders: true }],
      observances: [tithi],
      now: new Date('2026-11-01T00:00:00.000Z'),
    });
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.candidates.every((candidate) => candidate.notification_type === 'tithi')).toBe(true);
    expect(result.candidates.every((candidate) => candidate.metadata.category === 'tithi')).toBe(true);
  });

  it('fails closed when a profile has no valid IANA timezone', () => {
    const result = generateObservanceScheduleCandidates({
      users: [{ ...defaultUser, timezone: 'Mars/Olympus_Mons' }],
      observances: [mockFestivals[0]],
      now: new Date('2026-11-01T00:00:00.000Z'),
    });
    expect(result.candidates).toHaveLength(0);
    expect(result.stats.suppressedReasons.invalid_timezone).toBe(1);
  });
});
