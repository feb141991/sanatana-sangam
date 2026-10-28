import { beforeEach, describe, it, expect, vi } from 'vitest';
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

  it('includes reviewed Hindi and Punjabi fields for the Native Dharm Veer Home card', () => {
    const source = readFileSync(new URL('./route.ts', import.meta.url), 'utf8');
    expect(source).toMatch(/nameLocal: dharmVeer\.nameLocal \?\? null/);
    expect(source).toMatch(/namePa: dharmVeer\.namePa \?\? null/);
    expect(source).toMatch(/taglineLocal: dharmVeer\.taglineLocal \?\? null/);
    expect(source).toMatch(/taglinePa: dharmVeer\.taglinePa \?\? null/);
  });
});
