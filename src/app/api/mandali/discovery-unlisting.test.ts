import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// In-memory profiles table that applies the same filters PostgREST would, so
// these tests assert who is actually returned, not which methods were called.
type Row = Record<string, unknown>;
const db = vi.hoisted(() => ({ profiles: [] as Row[] }));

function query(rows: Row[]) {
  let current = rows;
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: (col: string, v: unknown) => { current = current.filter((r) => r[col] === v); return builder; },
    neq: (col: string, v: unknown) => { current = current.filter((r) => r[col] !== v); return builder; },
    gte: (col: string, v: number) => { current = current.filter((r) => typeof r[col] === 'number' && (r[col] as number) >= v); return builder; },
    lte: (col: string, v: number) => { current = current.filter((r) => typeof r[col] === 'number' && (r[col] as number) <= v); return builder; },
    ilike: (col: string, pattern: string) => {
      const re = new RegExp(`^${pattern.replace(/%/g, '.*')}$`, 'i');
      current = current.filter((r) => typeof r[col] === 'string' && re.test(r[col] as string)); return builder;
    },
    not: (col: string, op: string, v: unknown) => {
      if (op !== 'is') throw new Error(`unsupported not.${op}`);
      current = current.filter((r) => r[col] !== v); return builder;
    },
    limit: (n: number) => { current = current.slice(0, n); return builder; },
    single: async () => ({ data: current[0] ?? null, error: current[0] ? null : { message: 'none' } }),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve({ data: current, error: null }).then(resolve),
  };
  return builder;
}

vi.mock('@/lib/api-auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api-auth')>(),
  getApiUser: async () => ({ user: { id: 'me' }, error: null }),
}));
vi.mock('@/lib/supabase-admin', () => ({ createAdminClient: () => ({ from: () => query(db.profiles) }) }));
vi.mock('@/lib/user-safety', () => ({
  getUserSafetyState: async () => ({}),
  filterProfileRows: <T,>(rows: T[]) => rows,
}));

import { GET as nearby } from './nearby/route';
import { GET as search } from './search/route';

const near = { latitude: 28.61, longitude: 77.21, city: 'Delhi' };

beforeEach(() => {
  db.profiles = [
    { id: 'me', username: 'me_seeker', avatar_url: null, ...near, is_deleting: false },
    { id: 'active', username: 'seeker_active', avatar_url: null, ...near, is_deleting: false },
    { id: 'legacy-null', username: 'seeker_legacy', avatar_url: null, ...near, is_deleting: null },
    { id: 'deleting', username: 'seeker_deleting', avatar_url: null, ...near, is_deleting: true },
  ];
});

const ids = (rows: Array<{ id: string }>) => rows.map((r) => r.id).sort();

describe('Mandali discovery unlists accounts in their deletion cool-off', () => {
  it('search returns exactly the non-deleting matches (NULL counts as not deleting)', async () => {
    const res = await search(new NextRequest('http://localhost/api/mandali/search?q=seeker'));
    expect(ids((await res.json()).profiles)).toEqual(['active', 'legacy-null', 'me'].filter((id) => id !== 'me'));
  });

  it('nearby by coordinates returns exactly the non-deleting seekers', async () => {
    const res = await nearby(new NextRequest('http://localhost/api/mandali/nearby'));
    expect(ids((await res.json()).seekers)).toEqual(['active', 'legacy-null']);
  });

  it('nearby by city (no coordinates) returns exactly the non-deleting seekers', async () => {
    db.profiles = db.profiles.map((r) => ({ ...r, latitude: null, longitude: null }));
    const res = await nearby(new NextRequest('http://localhost/api/mandali/nearby'));
    expect(ids((await res.json()).seekers)).toEqual(['active', 'legacy-null']);
  });
});
