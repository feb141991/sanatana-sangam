import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { readFileSync } from 'node:fs';

const getApiUser = vi.fn();
vi.mock('@/lib/api-auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api-auth')>(),
  getApiUser: (...args: unknown[]) => getApiUser(...args),
}));

import { GET } from './route';

describe('GET /api/native/home-summary Contract & Timing Suite', () => {
  beforeEach(() => {
    getApiUser.mockReset();
    getApiUser.mockResolvedValue({
      user: null,
      error: Object.assign(new Error('Unauthorized'), { status: 401, code: 'AUTH_REQUIRED' }),
      supabase: null,
    });
  });

  it('returns 401 Unauthorized with proper headers when no auth is provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/native/home-summary');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('guarantees response is marked private, no-store', async () => {
    const req = new NextRequest('http://localhost:3000/api/native/home-summary');
    const res = await GET(req);

    // Unauthenticated or authenticated must never be publicly CDN-cacheable
    const cacheControl = res.headers.get('Cache-Control');
    if (res.status === 200) {
      expect(cacheControl).toBe('private, no-store');
      expect(res.headers.has('Server-Timing')).toBe(true);
    }
  });

  it('reads observance reminder preferences in the existing profile query for contextual Native prompts', () => {
    const source = readFileSync(new URL('./route.ts', import.meta.url), 'utf8');
    const projection = readFileSync(new URL('../../../../lib/home-profile-read.ts', import.meta.url), 'utf8');
    expect(projection).toMatch(/calendar_profile, wants_festival_reminders, wants_vrat_reminders, wants_tithi_reminders/);
    expect(source).toMatch(/wantsFestivalReminders: typeof profile\?\.wants_festival_reminders === 'boolean'/);
    expect(source).toMatch(/wantsVratReminders: typeof profile\?\.wants_vrat_reminders === 'boolean'/);
    expect(source).toMatch(/wantsTithiReminders: typeof profile\?\.wants_tithi_reminders === 'boolean'/);
  });

  it('returns a retryable private failure before calendar work when required profile cannot be read', async () => {
    const query = {
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
      abortSignal: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { code: '42703', message: 'provider detail' }, status: 400 }),
    };
    const from = vi.fn().mockReturnValue(query);
    getApiUser.mockResolvedValue({ user: { id: 'test-user' }, supabase: { from }, error: null });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const res = await GET(new NextRequest('http://localhost:3000/api/native/home-summary', { headers: { 'x-request-id': 'profile-test' } }));
      expect(res.status).toBe(503);
      expect(res.headers.get('Cache-Control')).toBe('private, no-store');
      expect(res.headers.get('Retry-After')).toBe('5');
      expect(res.headers.get('X-Request-ID')).toBe('profile-test');
      expect(res.headers.get('Server-Timing')).toContain('profile');
      expect(await res.json()).toEqual({ error: 'Profile temporarily unavailable', code: 'PROFILE_UNAVAILABLE' });
      expect(from.mock.calls).toEqual([['profiles']]);
      expect(JSON.stringify(log.mock.calls)).not.toContain('provider detail');
    } finally { log.mockRestore(); }
  });

  describe('profile missing -> repair outcome', () => {
    const FK_PROFILES = {
      code: '23503',
      message: 'insert or update on table "profiles" violates foreign key constraint "profiles_id_fkey"',
      details: 'Key (id)=(ghost-user) is not present in table "users".',
    };

    function missingProfileClient(insertError: { code?: string; message?: string; details?: string }) {
      const query = {
        select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
        abortSignal: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null, status: 200 }),
        insert: vi.fn().mockResolvedValue({ error: insertError }),
      };
      return { from: vi.fn().mockReturnValue(query), query };
    }

    beforeEach(() => {
      // resolveAuthProfile uses the request's own client when the admin env is absent.
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
      vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    });
    afterEach(() => { vi.unstubAllEnvs(); });

    it('answers 401 AUTH_REQUIRED, not 503, when the database says the account was deleted', async () => {
      const { from, query } = missingProfileClient(FK_PROFILES);
      getApiUser.mockResolvedValue({ user: { id: 'ghost-user' }, supabase: { from }, error: null });
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const log = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const res = await GET(new NextRequest('http://localhost:3000/api/native/home-summary', { headers: { 'x-request-id': 'ghost-test' } }));
        expect(res.status).toBe(401);
        expect(res.headers.get('Cache-Control')).toBe('no-store');
        expect(res.headers.get('Retry-After')).toBeNull();
        expect(res.headers.get('X-Request-ID')).toBe('ghost-test');
        expect(await res.json()).toMatchObject({ code: 'AUTH_REQUIRED', error: 'Unauthorized' });
        expect(query.insert).toHaveBeenCalledTimes(1);
        expect(JSON.stringify([...warn.mock.calls, ...log.mock.calls])).not.toContain(FK_PROFILES.details);
      } finally { warn.mockRestore(); log.mockRestore(); }
    });

    it('keeps 503 PROFILE_UNAVAILABLE when the repair fails for any other reason', async () => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        for (const insertError of [
          { code: '57014', message: 'canceling statement due to statement timeout' },
          { code: '23503', message: 'violates foreign key constraint "profiles_active_symbol_id_fkey"' },
          { code: '23505', message: 'duplicate key value violates unique constraint "profiles_username_key"' },
        ]) {
          const { from } = missingProfileClient(insertError);
          getApiUser.mockResolvedValue({ user: { id: 'real-user' }, supabase: { from }, error: null });
          const res = await GET(new NextRequest('http://localhost:3000/api/native/home-summary'));
          expect(res.status).toBe(503);
          expect(res.headers.get('Retry-After')).toBe('5');
          expect(await res.json()).toEqual({ error: 'Profile temporarily unavailable', code: 'PROFILE_UNAVAILABLE' });
        }
      } finally { log.mockRestore(); }
    });

    it('never turns a profile read failure into a 401 (a stall is not a deleted account)', async () => {
      const query = {
        select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
        abortSignal: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { code: '57014', message: 'statement timeout' }, status: 500 }),
        insert: vi.fn(),
      };
      getApiUser.mockResolvedValue({ user: { id: 'real-user' }, supabase: { from: vi.fn().mockReturnValue(query) }, error: null });
      const log = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const res = await GET(new NextRequest('http://localhost:3000/api/native/home-summary'));
        expect(res.status).toBe(503);
        expect(query.insert).not.toHaveBeenCalled();
      } finally { log.mockRestore(); }
    });
  });

  it('includes reviewed Hindi and Punjabi fields for the Native Dharm Veer Home card', () => {
    const source = readFileSync(new URL('./route.ts', import.meta.url), 'utf8');
    expect(source).toMatch(/nameLocal: dharmVeer\.nameLocal \?\? null/);
    expect(source).toMatch(/namePa: dharmVeer\.namePa \?\? null/);
    expect(source).toMatch(/taglineLocal: dharmVeer\.taglineLocal \?\? null/);
    expect(source).toMatch(/taglinePa: dharmVeer\.taglinePa \?\? null/);
  });
});
