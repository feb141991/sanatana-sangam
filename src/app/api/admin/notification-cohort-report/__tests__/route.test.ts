import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { requireAdminAccess } from '@/lib/admin';

const mocks = vi.hoisted(() => ({
  mockProfiles: [] as any[],
  mockActivityRows: [] as any[],
  lastInIds: null as string[] | null,
}));

vi.mock('@/lib/admin-auth', () => ({
  verifyAdminCookieAuth: vi.fn(),
}));

vi.mock('@/lib/admin', () => ({
  requireAdminAccess: vi.fn(),
}));

vi.mock('@/lib/supabase-admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    from: (table: string) => {
      if (table === 'profiles') {
        return { select: vi.fn().mockResolvedValue({ data: mocks.mockProfiles, error: null }) };
      }
      if (table === 'daily_sadhana') {
        return {
          select: () => ({
            in: (_column: string, ids: string[]) => {
              mocks.lastInIds = ids;
              return {
                eq: () => ({
                  // Mirrors a real `.in(...)` filter: only rows whose
                  // user_id was actually in the queried id list come back.
                  gte: vi.fn().mockResolvedValue({
                    data: mocks.mockActivityRows.filter((row) => ids.includes(row.user_id)),
                    error: null,
                  }),
                }),
              };
            },
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  }),
}));

describe('admin/notification-cohort-report route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAdminCookieAuth).mockResolvedValue(null);
    vi.mocked(requireAdminAccess).mockResolvedValue({ admin: { id: 'admin-1' } } as any);
    mocks.mockProfiles = [];
    mocks.mockActivityRows = [];
    mocks.lastInIds = null;
  });

  it('rejects an unauthenticated request', async () => {
    vi.mocked(verifyAdminCookieAuth).mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    );
    const res = await GET(new NextRequest('https://shoonaya.com/api/admin/notification-cohort-report'));
    expect(res.status).toBe(401);
  });

  it('groups profiles by their exact opt-in set, never assuming opt-in from an unset field', async () => {
    mocks.mockProfiles = [
      { id: 'p1', tradition: 'hindu', sampradaya: null, calendar_profile: 'legacy-ujjain', app_language: 'en', is_deleting: false, consent_activity_personalization: false, japa_reminder_enabled: true, wants_shloka_reminders: true },
      { id: 'p2', tradition: 'hindu', sampradaya: null, calendar_profile: 'legacy-ujjain', app_language: 'en', is_deleting: false, consent_activity_personalization: false, japa_reminder_enabled: true },
      { id: 'p3', tradition: 'jain', sampradaya: null, calendar_profile: null, app_language: 'hi', is_deleting: false, consent_activity_personalization: false },
    ];
    const res = await GET(new NextRequest('https://shoonaya.com/api/admin/notification-cohort-report'));
    const body = await res.json();

    expect(body.totalProfiles).toBe(3);
    expect(body.byOptInCohort).toEqual({ 'japa+shloka': 1, japa: 1, none: 1 });
    expect(body.eligibleForAnyDelivery).toBe(2);
  });

  it('cross-tabs by tradition, calendar profile, and language using "unset" for null', async () => {
    mocks.mockProfiles = [
      { id: 'p1', tradition: 'hindu', sampradaya: null, calendar_profile: 'legacy-ujjain', app_language: 'en', is_deleting: false, consent_activity_personalization: false },
      { id: 'p2', tradition: null, sampradaya: null, calendar_profile: null, app_language: null, is_deleting: false, consent_activity_personalization: false },
    ];
    const res = await GET(new NextRequest('https://shoonaya.com/api/admin/notification-cohort-report'));
    const body = await res.json();

    expect(body.byTradition).toEqual({ hindu: 1, unset: 1 });
    expect(body.byCalendarProfile).toEqual({ 'legacy-ujjain': 1, unset: 1 });
    expect(body.byLanguage).toEqual({ en: 1, unset: 1 });
  });

  it('derives audience from gender_context the same way observance-preferences.ts does, defaulting to not_female', async () => {
    mocks.mockProfiles = [
      { id: 'p1', tradition: null, calendar_profile: null, app_language: null, gender_context: 'female', is_deleting: false, consent_activity_personalization: false },
      { id: 'p2', tradition: null, calendar_profile: null, app_language: null, gender_context: 'male', is_deleting: false, consent_activity_personalization: false },
      { id: 'p3', tradition: null, calendar_profile: null, app_language: null, gender_context: null, is_deleting: false, consent_activity_personalization: false },
    ];
    const res = await GET(new NextRequest('https://shoonaya.com/api/admin/notification-cohort-report'));
    const body = await res.json();

    expect(body.byAudience).toEqual({ female: 1, not_female: 2 });
  });

  it('only counts recent activity among profiles that explicitly consented', async () => {
    mocks.mockProfiles = [
      { id: 'consented-active', tradition: 'hindu', calendar_profile: null, app_language: null, is_deleting: false, consent_activity_personalization: true },
      { id: 'consented-inactive', tradition: 'hindu', calendar_profile: null, app_language: null, is_deleting: false, consent_activity_personalization: true },
      { id: 'not-consented', tradition: 'hindu', calendar_profile: null, app_language: null, is_deleting: false, consent_activity_personalization: false },
    ];
    // Even though this id is "active," it must never be counted because it didn't consent.
    mocks.mockActivityRows = [{ user_id: 'consented-active' }, { user_id: 'not-consented' }];

    const res = await GET(new NextRequest('https://shoonaya.com/api/admin/notification-cohort-report'));
    const body = await res.json();

    // The strongest check: the non-consented id must never even be sent in
    // the activity query's id list, not just excluded from the final tally.
    expect(mocks.lastInIds).toEqual(['consented-active', 'consented-inactive']);
    expect(mocks.lastInIds).not.toContain('not-consented');

    expect(body.activityPersonalization.consented).toBe(2);
    expect(body.activityPersonalization.notConsented).toBe(1);
    expect(body.activityPersonalization.recentlyActiveAmongConsented).toBe(1);
  });

  it('never includes a user id, email, or name anywhere in the response', async () => {
    mocks.mockProfiles = [
      { id: 'should-never-appear', tradition: 'hindu', calendar_profile: null, app_language: null, is_deleting: false, consent_activity_personalization: true, japa_reminder_enabled: true },
    ];
    mocks.mockActivityRows = [{ user_id: 'should-never-appear' }];

    const res = await GET(new NextRequest('https://shoonaya.com/api/admin/notification-cohort-report'));
    const text = await res.text();

    expect(text).not.toContain('should-never-appear');
  });

  it('always includes an explicit small-sample caveat', async () => {
    mocks.mockProfiles = [{ id: 'p1', tradition: null, calendar_profile: null, app_language: null, is_deleting: false, consent_activity_personalization: false }];
    const res = await GET(new NextRequest('https://shoonaya.com/api/admin/notification-cohort-report'));
    const body = await res.json();
    expect(typeof body.sampleSizeCaveat).toBe('string');
    expect(body.sampleSizeCaveat.length).toBeGreaterThan(0);
  });
});
