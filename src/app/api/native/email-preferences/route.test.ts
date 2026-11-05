import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const getApiUser = vi.fn();
vi.mock('@/lib/api-auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api-auth')>(),
  getApiUser: (...args: unknown[]) => getApiUser(...args),
}));

const rateLimit = vi.fn();
vi.mock('@/lib/api-security', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api-security')>(),
  checkDurableRateLimit: (...args: unknown[]) => rateLimit(...args),
}));

const rpc = vi.fn();
let profileRead: { data: unknown; error: unknown };
let historyRead: { data: unknown; error: unknown };
vi.mock('@/lib/admin', () => ({
  createServiceRoleSupabaseClient: () => ({
    rpc: (...args: unknown[]) => rpc(...args),
    from: (table: string) => ({
      select: () => ({
        eq: () => table === 'profiles'
          ? { maybeSingle: async () => profileRead }
          : { order: () => ({ limit: async () => historyRead }) },
      }),
    }),
  }),
}));

import { GET, POST } from './route';

const URL = 'http://localhost:3000/api/native/email-preferences';

function request(method: 'GET' | 'POST', init: { body?: unknown; headers?: Record<string, string>; query?: string } = {}) {
  return new NextRequest(`${URL}${init.query ?? ''}`, {
    method,
    headers: { 'content-type': 'application/json', ...init.headers },
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
}

beforeEach(() => {
  getApiUser.mockReset();
  rateLimit.mockReset().mockResolvedValue(null);
  rpc.mockReset().mockResolvedValue({ data: { changed: true, marketing: true, newsletter: true, festivals: false }, error: null });
  profileRead = { data: { marketing_consent: true, email_newsletter: true, email_festivals: false }, error: null };
  historyRead = { data: [{ created_at: '2026-11-06T01:00:00.000Z' }], error: null };
  getApiUser.mockResolvedValue({ user: { id: 'user-1' }, supabase: {}, error: null });
});

describe('GET /api/native/email-preferences', () => {
  it.each([401, 503])('passes through the actual auth failure %s', async (status) => {
    getApiUser.mockResolvedValue({ user: null, supabase: null, error: Object.assign(new Error('x'), { status }) });
    const res = await GET(request('GET'));
    expect(res.status).toBe(status);
  });

  it('returns the choices, the last change and the policy, and is never cached', async () => {
    const res = await GET(request('GET', { headers: { 'x-vercel-ip-country': 'IN' } }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(await res.json()).toEqual({
      newsletter: true, festivals: false, lastChangedAt: '2026-11-06T01:00:00.000Z',
      policy: { region: 'IN', regionSource: 'ip_header', wordingVersion: 'global-v1' },
    });
  });

  it.each([
    ['DE', undefined, 'DE', 'ip_header', 'eu-uk-v1'],
    [undefined, 'GB', 'GB', 'device_region', 'eu-uk-v1'],
    [undefined, 'sg', 'SG', 'device_region', 'global-v1'],
    [undefined, undefined, null, null, 'eu-uk-v1'],
  ])('picks the policy from ip=%s device=%s', async (ip, device, region, regionSource, wording) => {
    const res = await GET(request('GET', { headers: ip ? { 'x-vercel-ip-country': ip } : {}, query: device ? `?deviceRegion=${device}` : '' }));
    expect((await res.json()).policy).toEqual({ region, regionSource, wordingVersion: wording });
  });

  it('policyOnly returns just the policy, reads nothing about the person, and works before a profile exists', async () => {
    profileRead = { data: null, error: null };
    const res = await GET(request('GET', { headers: { 'x-vercel-ip-country': 'FR' }, query: '?policyOnly=1' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ policy: { region: 'FR', regionSource: 'ip_header', wordingVersion: 'eu-uk-v1' } });
  });

  it('policyOnly still requires a signed-in account and still obeys the rate limit', async () => {
    getApiUser.mockResolvedValue({ user: null, supabase: null, error: Object.assign(new Error('x'), { status: 401 }) });
    expect((await GET(request('GET', { query: '?policyOnly=1' }))).status).toBe(401);
    getApiUser.mockResolvedValue({ user: { id: 'user-1' }, supabase: {}, error: null });
    rateLimit.mockResolvedValue(new Response('{}', { status: 429 }));
    expect((await GET(request('GET', { query: '?policyOnly=1' }))).status).toBe(429);
  });

  it('only the exact value 1 selects policyOnly', async () => {
    for (const value of ['0', 'true', '', 'yes']) {
      const res = await GET(request('GET', { query: `?policyOnly=${value}` }));
      expect(Object.keys(await res.json()).sort(), value).toEqual(['festivals', 'lastChangedAt', 'newsletter', 'policy']);
    }
  });

  it('a failed read is a retryable 503 with no detail, never "everything off"', async () => {
    profileRead = { data: null, error: { code: '57014', message: 'canceling statement on relation profiles' } };
    const res = await GET(request('GET'));
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toMatch(/relation|profiles|statement/);
  });

  it('returns the rate limiter answer unchanged', async () => {
    rateLimit.mockResolvedValue(new Response('{}', { status: 429 }));
    expect((await GET(request('GET'))).status).toBe(429);
  });
});

describe('POST /api/native/email-preferences', () => {
  it('changes only the signed-in account, whatever the body says', async () => {
    const res = await POST(request('POST', {
      headers: { 'x-vercel-ip-country': 'DE' },
      body: { category: 'newsletter', granted: true, source: 'onboarding', wordingVersion: 'eu-uk-v1', deviceRegion: 'IN', userId: 'someone-else', user_id: 'someone-else' },
    }));
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('set_email_consent', {
      p_user_id: 'user-1', p_category: 'newsletter', p_granted: true, p_source: 'onboarding',
      p_wording_version: 'eu-uk-v1', p_region: 'DE', p_region_source: 'ip_header',
    });
    expect(await res.json()).toEqual({ ok: true, changed: true, newsletter: true, festivals: false, lastChangedAt: '2026-11-06T01:00:00.000Z' });
  });

  it('falls back to the device region when the request carries no country, and drops an unknown wording version', async () => {
    await POST(request('POST', { body: { category: 'festivals', granted: true, source: 'settings', wordingVersion: 'made-up-v9', deviceRegion: 'in' } }));
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_category: 'festivals', p_wording_version: null, p_region: 'IN', p_region_source: 'device_region' });
  });

  it('records no region when none can be derived', async () => {
    await POST(request('POST', { body: { category: 'festivals', granted: false, source: 'settings' } }));
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_region: null, p_region_source: null, p_wording_version: null });
  });

  it.each([
    ['unknown category', { category: 'sms', granted: true, source: 'settings' }],
    ['"all" is not offered to the app', { category: 'all', granted: false, source: 'settings' }],
    ['granted is not a boolean', { category: 'newsletter', granted: 'true', source: 'settings' }],
    ['granted is missing', { category: 'newsletter', source: 'settings' }],
    ['a link path cannot be claimed by the app', { category: 'newsletter', granted: false, source: 'one_click' }],
    ['a database-only path cannot be claimed', { category: 'newsletter', granted: true, source: 'backfill' }],
    ['source is missing', { category: 'newsletter', granted: true }],
    ['an array body', [1, 2]],
    ['a null body', null],
  ])('refuses %s without touching the database', async (_name, body) => {
    const res = await POST(request('POST', { body }));
    expect(res.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('refuses an oversized body, whether or not the request declares its length', async () => {
    const body = { category: 'newsletter', granted: true, source: 'settings', pad: 'x'.repeat(4000) };
    const declared = await POST(request('POST', { body, headers: { 'content-length': String(JSON.stringify(body).length) } }));
    expect(declared.status).toBe(413);
    const undeclared = await POST(request('POST', { body }));
    expect(undeclared.status).toBe(413);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('refuses a body that is not JSON', async () => {
    const res = await POST(new NextRequest(URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{not json' }));
    expect(res.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('requires a signed-in account', async () => {
    getApiUser.mockResolvedValue({ user: null, supabase: null, error: Object.assign(new Error('x'), { status: 401 }) });
    expect((await POST(request('POST', { body: { category: 'newsletter', granted: true, source: 'settings' } }))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each([
    ['P0002', 404, 'PROFILE_NOT_FOUND'],
    ['55000', 409, 'ACCOUNT_DELETING'],
    ['22023', 400, 'INVALID_REQUEST'],
    ['57014', 503, 'EMAIL_PREFERENCES_UNAVAILABLE'],
  ])('maps database code %s to %i and says nothing about the cause', async (code, status, appCode) => {
    rpc.mockResolvedValue({ data: null, error: { code, message: 'violates check constraint on email_consent_events' } });
    const res = await POST(request('POST', { body: { category: 'newsletter', granted: true, source: 'settings' } }));
    expect(res.status).toBe(status);
    const json = await res.json();
    expect(json.code).toBe(appCode);
    expect(JSON.stringify(json)).not.toMatch(/constraint|email_consent_events|violates/);
  });

  it('still reports success when only the "last changed" read fails', async () => {
    historyRead = { data: null, error: { code: '57014' } };
    const res = await POST(request('POST', { body: { category: 'newsletter', granted: true, source: 'settings' } }));
    expect(res.status).toBe(200);
    expect((await res.json()).lastChangedAt).toBeNull();
  });

  it('reports the newsletter as on only when general marketing consent is also on', async () => {
    rpc.mockResolvedValue({ data: { changed: true, marketing: false, newsletter: true, festivals: false }, error: null });
    const res = await POST(request('POST', { body: { category: 'newsletter', granted: true, source: 'settings' } }));
    expect((await res.json()).newsletter).toBe(false);
  });

  it('is rate limited per account', async () => {
    await POST(request('POST', { body: { category: 'newsletter', granted: true, source: 'settings' } }));
    expect(rateLimit.mock.calls[0][0]).toBe('email-preferences:write:user:user-1');
    rateLimit.mockResolvedValue(new Response('{}', { status: 429 }));
    expect((await POST(request('POST', { body: { category: 'newsletter', granted: true, source: 'settings' } }))).status).toBe(429);
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
