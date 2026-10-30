import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { readFileSync } from 'node:fs';

const getApiUser = vi.fn();
vi.mock('@/lib/api-auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api-auth')>(),
  getApiUser: (...args: unknown[]) => getApiUser(...args),
}));

import { buildDailySacredText } from '@/lib/daily-sacred-text';
import { getDayOfYear } from '@/lib/sacred-texts';
import { GET } from './route';

const URL_TODAY = 'http://localhost:3000/api/native/shloka/today';

function profileClient(reads: Array<{ data: unknown; error: unknown; status?: number }>, insertError: unknown = null) {
  const maybeSingle = vi.fn();
  for (const r of reads) maybeSingle.mockResolvedValueOnce({ status: 200, ...r });
  maybeSingle.mockResolvedValue({ data: null, error: null, status: 200 });
  const select = vi.fn().mockReturnThis();
  const query = {
    select, eq: vi.fn().mockReturnThis(), abortSignal: vi.fn().mockReturnThis(), maybeSingle,
    insert: vi.fn().mockResolvedValue({ error: insertError }),
  };
  const from = vi.fn().mockReturnValue(query);
  return { from, query, select };
}

describe('GET /api/native/shloka/today', () => {
  beforeEach(() => {
    getApiUser.mockReset();
    // resolveAuthProfile uses the request's own client when the admin env is absent.
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

  it.each([401, 503])('passes through the actual auth failure %s', async (status) => {
    getApiUser.mockResolvedValue({ user: null, supabase: null, error: Object.assign(new Error('x'), { status }) });
    const res = await GET(new NextRequest(URL_TODAY));
    expect(res.status).toBe(status);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it.each([
    [{ tradition: 'hindu', app_language: 'en', timezone: 'Asia/Kolkata' }],
    [{ tradition: 'sikh', app_language: 'pa', timezone: 'Asia/Kolkata' }],
    [{ tradition: 'buddhist', app_language: 'en', timezone: 'UTC' }],
  ])('returns exactly the sacredText that home-summary builds for %j', async (profile) => {
    const { from, select } = profileClient([{ data: profile, error: null }]);
    getApiUser.mockResolvedValue({ user: { id: 'u1' }, supabase: { from }, error: null });
    const res = await GET(new NextRequest(URL_TODAY));
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await res.json()).toEqual({ sacredText: buildDailySacredText(profile, getDayOfYear()) });
    // Only the three columns buildDailySacredText reads, from one table.
    expect(select).toHaveBeenCalledWith('tradition, app_language, timezone');
    expect(from.mock.calls).toEqual([['profiles']]);
  });

  it('repairs a missing profile and then answers 200', async () => {
    const profile = { tradition: 'hindu', app_language: 'en', timezone: 'Asia/Kolkata' };
    const { from, query } = profileClient([{ data: null, error: null }, { data: { id: 'u1', onboarding_completed: false, avatar_url: null }, error: null }, { data: profile, error: null }]);
    getApiUser.mockResolvedValue({ user: { id: 'u1' }, supabase: { from }, error: null });
    const res = await GET(new NextRequest(URL_TODAY));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sacredText: buildDailySacredText(profile, getDayOfYear()) });
    expect(query.insert).not.toHaveBeenCalled(); // repair found the row already present on its own read
  });

  it('answers 401 AUTH_REQUIRED when the database says the account was deleted', async () => {
    const { from } = profileClient([{ data: null, error: null }], {
      code: '23503',
      message: 'insert or update on table "profiles" violates foreign key constraint "profiles_id_fkey"',
    });
    getApiUser.mockResolvedValue({ user: { id: 'ghost' }, supabase: { from }, error: null });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const res = await GET(new NextRequest(URL_TODAY));
    expect(res.status).toBe(401);
    expect(res.headers.get('Retry-After')).toBeNull();
    expect(await res.json()).toMatchObject({ code: 'AUTH_REQUIRED' });
  });

  it('answers a retryable 503 (never a default tradition, never a 401) when the profile read fails', async () => {
    const { from, query } = profileClient([
      { data: null, error: { code: '57014', message: 'provider detail' }, status: 500 },
      { data: null, error: { code: '57014', message: 'provider detail' }, status: 500 },
    ]);
    getApiUser.mockResolvedValue({ user: { id: 'u1' }, supabase: { from }, error: null });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await GET(new NextRequest(URL_TODAY, { headers: { 'x-request-id': 'shloka-test' } }));
    expect(res.status).toBe(503);
    expect(res.headers.get('Retry-After')).toBe('5');
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    expect(res.headers.get('X-Request-ID')).toBe('shloka-test');
    expect(await res.json()).toEqual({ error: 'Profile temporarily unavailable', code: 'PROFILE_UNAVAILABLE' });
    expect(query.insert).not.toHaveBeenCalled();
    expect(JSON.stringify(log.mock.calls)).not.toContain('provider detail');
  });

  it('does no calendar, observance, sadhana or Dharm Veer work (the point of the route)', () => {
    const source = readFileSync(new URL('./route.ts', import.meta.url), 'utf8');
    const imports = source.split('\n').filter((line) => line.startsWith('import ')).join('\n');
    expect(imports).not.toMatch(/calendar|panchang|observance|sankalpa|sadhana|dharm-?veer|home-summary/i);
  });
});
