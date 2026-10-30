import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

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
    resolveRequestProfile: async (_req: any, requested: any) => {
      if (mock.auth.invalidCredentials) {
        return {
          supabase: mock.client,
          userId: null,
          calendarProfile: requested.calendarProfile || 'legacy-ujjain',
          tradition: requested.tradition || 'all',
          sampradaya: null,
          timezone: 'Asia/Kolkata',
          calendarScope: null,
          ekadashiMethod: 'standard',
          context: { effectiveCalculationLocation: { label: 'Ujjain', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' }, displayedTraditionProfile: null, disclosureDiagnostics: {} },
          isAuthenticated: false,
          invalidCredentials: true,
          profileError: null,
        };
      }
      if (mock.auth.profileError) {
        return {
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
          profileError: mock.auth.profileError,
        };
      }
      return {
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
      };
    },
  };
});

function createMockSupabase(data: {
  definition?: { id: number; slug: string; route_slug: string } | null;
  definitions?: Array<{ id: number; slug: string; route_slug: string }>;
  anchor?: { definition_id: number; date: string; observance_definitions: { slug: string; route_slug: string } } | null;
  occurrences?: any[];
  error?: any;
}) {
  return {
    from: (table: string) => {
      if (table === 'observance_definitions') {
        const query: any = {
          select: () => query,
          eq: () => query,
          or: () => ({
            then: (resolve: any) =>
              resolve({
                data: data.definitions ?? (data.definition ? [data.definition] : []),
                error: data.error ?? null,
              }),
          }),
        };
        return query;
      }
      if (table === 'observance_occurrences') {
        const query: any = {
          select: () => query,
          eq: () => query,
          in: () => query,
          gte: () => query,
          lte: () => query,
          neq: () => query,
          order: () => query,
          limit: () => query,
          maybeSingle: async () => ({
            data: data.anchor ?? null,
            error: data.error ?? null,
          }),
          then: (resolve: any) =>
            resolve({
              data: data.occurrences ?? [],
              error: data.error ?? null,
            }),
        };
        return query;
      }
      throw new Error(`Unexpected table ${table}`);
    },
  };
}

describe('GET /api/calendar/occurrence (Narrow Calendar Read Contract)', () => {
  beforeEach(() => {
    mock.auth = { user: null, invalidCredentials: false, profileError: null };
  });

  describe('Input validation gates', () => {
    it.each(['2025-02-31', '2023-02-29', '2025-04-31', '2025-13-45', 'not-a-date'])(
      'rejects invalid date %s with 400 and INVALID_DATE',
      async (badDate) => {
        const req = new NextRequest(`http://localhost:3000/api/calendar/occurrence?slug=rama-navami&date=${badDate}`);
        const res = await GET(req);
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.code).toBe('INVALID_DATE');
      },
    );

    it.each([
      'Rama Navami', // spaces / uppercase
      'rama/navami',
      '',
      'slug_with_underscore!',
    ])('rejects invalid slug "%s" with 400 and INVALID_VALUE', async (badSlug) => {
      const req = new NextRequest(`http://localhost:3000/api/calendar/occurrence?slug=${encodeURIComponent(badSlug)}`);
      const res = await GET(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe('INVALID_VALUE');
    });

    it('rejects invalid occurrence_id (non-UUID) with 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/calendar/occurrence?slug=rama-navami&occurrence_id=not-a-uuid');
      const res = await GET(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe('INVALID_VALUE');
    });

    it('rejects invalid IANA timezone with 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/calendar/occurrence?slug=rama-navami&tz=+05:30');
      const res = await GET(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe('INVALID_VALUE');
    });
  });

  describe('Auth and profile error handling', () => {
    it('returns 401 when request carries invalid credentials', async () => {
      mock.auth.invalidCredentials = true;
      mock.client = createMockSupabase({});
      const req = new NextRequest('http://localhost:3000/api/calendar/occurrence?slug=rama-navami&date=2026-10-14');
      const res = await GET(req);
      expect(res.status).toBe(401);
      expect((await res.json()).error).toBe('Unauthorized');
    });

    it('returns 503 when profile resolution encounters database error', async () => {
      mock.auth.profileError = new Error('Database down');
      mock.client = createMockSupabase({});
      const req = new NextRequest('http://localhost:3000/api/calendar/occurrence?slug=rama-navami&date=2026-10-14');
      const res = await GET(req);
      expect(res.status).toBe(503);
      expect((await res.json()).error).toBe('Calendar unavailable');
    });
  });

  describe('Headers and Performance Instrumentation', () => {
    it('always includes private, no-store and Server-Timing header', async () => {
      mock.client = createMockSupabase({ definition: null });
      const req = new NextRequest('http://localhost:3000/api/calendar/occurrence?slug=rama-navami&date=2026-10-14');
      const res = await GET(req);
      expect(res.headers.get('Cache-Control')).toBe('private, no-store');
      const timing = res.headers.get('Server-Timing');
      expect(timing).toBeTruthy();
      expect(timing).toContain('total;dur=');
      expect(timing).toContain('profile;dur=');
    });
  });

  describe('Lookup logic and Calendar Governance', () => {
    it('returns selection: unavailable when definition does not exist', async () => {
      mock.client = createMockSupabase({ definitions: [] });
      const req = new NextRequest('http://localhost:3000/api/calendar/occurrence?slug=unknown-festival');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        occurrence: null,
        candidates: [],
        selection: 'unavailable',
      });
    });

    it('returns selection: selected when single verified occurrence matches', async () => {
      const occurrenceRow = {
        id: '22222222-2222-4222-8222-222222222222',
        definition_id: 101,
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

      mock.client = createMockSupabase({
        definition: { id: 101, slug: 'rama-navami', route_slug: 'rama-navami' },
        occurrences: [occurrenceRow],
      });

      const req = new NextRequest('http://localhost:3000/api/calendar/occurrence?slug=rama-navami&date=2026-11-14');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.selection).toBe('selected');
      expect(body.occurrence.civilDate).toBe('2026-11-14');
      expect(body.candidates).toHaveLength(1);
    });

    it('returns selection: multiple and all variants when multiple recognised traditions exist', async () => {
      const smarthaRow = {
        id: '33333333-3333-4333-8333-333333333333',
        definition_id: 102,
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
        spiritual_tradition: 'smartha',
        variant_key: 'smartha',
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
          slug: 'ekadashi',
          display_name: 'Ekadashi',
          emoji: '🌾',
          description: 'Vrat day',
          tradition: 'hindu',
          route_kind: 'festival',
          route_slug: 'ekadashi',
        },
      };

      const vaishnavaRow = {
        ...smarthaRow,
        id: '44444444-4444-4444-8444-444444444444',
        date: '2026-11-15',
        occurrence_date: '2026-11-15',
        spiritual_tradition: 'vaishnava',
        variant_key: 'vaishnava',
        is_primary_variant: false,
      };

      mock.client = createMockSupabase({
        definition: { id: 102, slug: 'ekadashi', route_slug: 'ekadashi' },
        occurrences: [smarthaRow, vaishnavaRow],
      });

      const req = new NextRequest('http://localhost:3000/api/calendar/occurrence?slug=ekadashi');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.selection).toBe('multiple');
      expect(body.candidates).toHaveLength(2);
      expect(body.occurrence).toBeTruthy();
    });

    it('returns selection: selected when looked up by exact occurrence_id anchor', async () => {
      const occurrenceId = '55555555-5555-4555-8555-555555555555';
      const occurrenceRow = {
        id: occurrenceId,
        definition_id: 103,
        date: '2026-11-20',
        occurrence_date: '2026-11-20',
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
          slug: 'diwali',
          display_name: 'Deepavali',
          emoji: '🪔',
          description: 'Festival of Lights',
          tradition: 'hindu',
          route_kind: 'festival',
          route_slug: 'diwali',
        },
      };

      mock.client = createMockSupabase({
        anchor: {
          definition_id: 103,
          date: '2026-11-20',
          observance_definitions: { slug: 'diwali', route_slug: 'diwali' },
        },
        occurrences: [occurrenceRow],
      });

      const req = new NextRequest(`http://localhost:3000/api/calendar/occurrence?slug=diwali&occurrence_id=${occurrenceId}`);
      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.selection).toBe('selected');
      expect(body.occurrence.id).toBe(occurrenceId);
    });

    it('returns selection: unavailable when occurrence row is unverified or under review', async () => {
      const unreviewedRow = {
        id: '66666666-6666-4666-8666-666666666666',
        definition_id: 104,
        date: '2026-11-20',
        occurrence_date: '2026-11-20',
        year: 2026,
        review_status: 'pending_review',
        verification_status: 'unverified',
        audit_status: 'pending',
        publication_status: 'draft',
        calculated_by: 'panchang-engine',
        final_date_source: 'fallback',
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
          slug: 'unverified-fest',
          display_name: 'Unverified Fest',
          emoji: '❓',
          description: 'Unverified',
          tradition: 'hindu',
          route_kind: 'festival',
          route_slug: 'unverified-fest',
        },
      };

      mock.client = createMockSupabase({
        definition: { id: 104, slug: 'unverified-fest', route_slug: 'unverified-fest' },
        occurrences: [unreviewedRow],
      });

      const req = new NextRequest('http://localhost:3000/api/calendar/occurrence?slug=unverified-fest&date=2026-11-20');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.selection).toBe('unavailable');
      expect(body.occurrence).toBeNull();
      expect(body.candidates).toHaveLength(0);
    });
  });
});
