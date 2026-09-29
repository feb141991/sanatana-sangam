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
    expect(source).toMatch(/calendar_profile, wants_festival_reminders, wants_vrat_reminders, wants_tithi_reminders/);
    expect(source).toMatch(/wantsFestivalReminders: typeof profile\?\.wants_festival_reminders === 'boolean'/);
    expect(source).toMatch(/wantsVratReminders: typeof profile\?\.wants_vrat_reminders === 'boolean'/);
    expect(source).toMatch(/wantsTithiReminders: typeof profile\?\.wants_tithi_reminders === 'boolean'/);
  });
});
