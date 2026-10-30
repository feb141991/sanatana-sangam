import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getDetail } from './route';
import { DHARM_VEERS } from '@/lib/dharm-veer';

const mock = vi.hoisted(() => ({
  client: null as unknown,
}));

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: async () => mock.client,
}));

function mockDb(options: {
  heroRow?: Record<string, unknown> | null;
  error?: { code: string };
}) {
  return {
    from: (table: string) => {
      if (table !== 'dharm_veers') throw new Error(`Unexpected table ${table}`);
      const query: any = {
        select: () => query,
        eq: (_col: string, val: unknown) => {
          if (val === 'pending_review' || val === 'unapproved') {
            return {
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
              maybeSingle: async () => ({ data: null, error: null }),
            };
          }
          return query;
        },
        maybeSingle: async () => {
          if (options.error) return { data: null, error: options.error };
          return { data: options.heroRow ?? null, error: null };
        },
      };
      return query;
    },
  };
}

describe('GET /api/dharm-veer/detail', () => {
  it('returns approved hero matching roster entry', async () => {
    const heroRow = {
      slug: 'chhatrapati-shivaji',
      name: 'Chhatrapati Shivaji Maharaj',
      tradition: 'hindu',
      review_status: 'approved',
      tagline: 'Hero of Swarajya',
      journey: 'Born in Shivneri...',
      trial: 'Faced Aurangzeb...',
      teaching: 'Swarajya is my birthright...',
      moral: 'Courage and righteousness prevail.',
      created_at: '2026-10-30',
    };
    mock.client = mockDb({ heroRow });

    const req = new NextRequest('http://localhost:3000/api/dharm-veer/detail?id=chhatrapati-shivaji');
    const res = await getDetail(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hero.id).toBe('chhatrapati-shivaji');
    expect(body.hero.name).toBe('Chhatrapati Shivaji Maharaj');
    expect(res.headers.get('Cache-Control')).toBe('public, s-maxage=3600, stale-while-revalidate=86400');
  });

  it('returns 200 { hero: null } for unknown id (never returns 404 which is reserved for OTA)', async () => {
    mock.client = mockDb({ heroRow: null });
    const req = new NextRequest('http://localhost:3000/api/dharm-veer/detail?id=non-existent-hero-xyz');
    const res = await getDetail(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ hero: null });
  });

  it('falls back to bundled DHARM_VEERS for bundled id when db has no row', async () => {
    mock.client = mockDb({ heroRow: null });
    const bundledId = DHARM_VEERS[0].id;
    const req = new NextRequest(`http://localhost:3000/api/dharm-veer/detail?id=${bundledId}`);
    const res = await getDetail(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hero.id).toBe(bundledId);
  });

  it.each([
    '',
    'id=../../etc/passwd',
    'id=Hero_With_Caps',
    'id=bad%20spaces',
    'id=hero-1&id=hero-2',
  ])('returns 400 for invalid id query "%s"', async (query) => {
    mock.client = mockDb({});
    const req = new NextRequest(`http://localhost:3000/api/dharm-veer/detail?${query}`);
    const res = await getDetail(req);
    expect(res.status).toBe(400);
  });

  it('fails with 503 when database read fails', async () => {
    mock.client = mockDb({ error: { code: '57014' } });
    const req = new NextRequest('http://localhost:3000/api/dharm-veer/detail?id=valid-slug');
    const res = await getDetail(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('Story temporarily unavailable.');
    expect(res.headers.get('Retry-After')).toBe('5');
  });
});
