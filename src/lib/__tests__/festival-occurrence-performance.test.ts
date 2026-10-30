import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as occurrenceGet } from '@/app/api/calendar/occurrence/route';

const mock = vi.hoisted(() => ({
  client: null as unknown,
  auth: { user: null as { id: string } | null, invalidCredentials: false, profileError: null as Error | null },
}));

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: async () => mock.client,
}));

vi.mock('@/lib/calendar/request-profile', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/calendar/request-profile')>();
  return {
    ...actual,
    resolveRequestProfile: async (_req: any, requested: any) => ({
      supabase: mock.client,
      userId: mock.auth.user?.id ?? null,
      calendarProfile: requested.calendarProfile || 'legacy-ujjain',
      tradition: requested.tradition || 'all',
      sampradaya: null,
      timezone: 'Asia/Kolkata',
      calendarScope: null,
      ekadashiMethod: 'standard',
      context: { effectiveCalculationLocation: { label: 'Ujjain', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' }, displayedTraditionProfile: null, disclosureDiagnostics: {} },
      isAuthenticated: Boolean(mock.auth.user),
      invalidCredentials: false,
      profileError: null,
    }),
  };
});

describe('Festival detail narrow read performance (synthetic fixture, not live latency)', () => {
  it('instruments Server-Timing stages and reduces response footprint', async () => {
    const occurrenceRow = {
      id: '77777777-7777-4777-8777-777777777777',
      definition_id: 201,
      date: '2026-11-14',
      occurrence_date: '2026-11-14',
      year: 2026,
      review_status: 'reviewed',
      verification_status: 'verified',
      audit_status: 'completed',
      publication_status: 'published',
      calculated_by: 'panchang-engine',
      final_date_source: 'rule_evaluation',
      calendar_profile: 'legacy-ujjain',
      spiritual_tradition: 'hindu',
      variant_key: null,
      is_primary_variant: true,
      reasons: [],
      diagnostics: [],
      source_refs: [],
      computed_latitude: 23.1765,
      computed_longitude: 75.7885,
      computed_timezone: 'Asia/Kolkata',
      rule_version: '1.0.0',
      astronomy_version: '1.0.0',
      day_boundary_version: '1.0.0',
      observance_definitions: {
        slug: 'rama-navami',
        display_name: 'Rama Navami',
        emoji: '🏹',
        description: 'Holy day',
        tradition: 'hindu',
        route_kind: 'festival',
        route_slug: 'rama-navami',
      },
    };

    let queryCount = 0;
    mock.client = {
      from: (table: string) => {
        queryCount++;
        const q: any = {
          select: () => q,
          eq: () => q,
          in: () => q,
          gte: () => q,
          lte: () => q,
          neq: () => q,
          order: () => q,
          limit: () => q,
          or: () => ({
            then: (resolve: any) => resolve({ data: [{ id: 201, slug: 'rama-navami' }], error: null }),
          }),
          then: (resolve: any) => resolve({ data: [occurrenceRow], error: null }),
        };
        return q;
      },
    };

    const req = new NextRequest('http://localhost:3000/api/calendar/occurrence?slug=rama-navami&date=2026-11-14');
    const res = await occurrenceGet(req);
    expect(res.status).toBe(200);

    const timingHeader = res.headers.get('Server-Timing');
    expect(timingHeader).toBeTruthy();
    expect(timingHeader).toContain('profile;dur=');
    expect(timingHeader).toContain('definition_lookup;dur=');
    expect(timingHeader).toContain('occurrences_query;dur=');
    expect(timingHeader).toContain('formatting;dur=');
    expect(timingHeader).toContain('selection;dur=');
    expect(timingHeader).toContain('total;dur=');

    const bodyText = await res.text();
    const payload = JSON.parse(bodyText);
    expect(payload.selection).toBe('selected');
    expect(payload.occurrence.civilDate).toBe('2026-11-14');

    const responseBytes = Buffer.byteLength(bodyText);
    // Broad feed on production is ~88,000 bytes; narrow response is < 2,500 bytes.
    expect(responseBytes).toBeLessThan(2500);
    expect(queryCount).toBe(2); // 1 definition lookup + 1 scoped occurrences query

    console.log(JSON.stringify({
      fixture: 'synthetic-festival-occurrence',
      endpoint: '/api/calendar/occurrence',
      queries: queryCount,
      responseBytes,
      serverTiming: timingHeader,
    }));
  });
});
