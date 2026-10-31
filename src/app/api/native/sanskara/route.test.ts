import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const getApiUser = vi.fn();
const checkDurableRateLimit = vi.fn();
const createAdminClient = vi.fn(() => ({ admin: true }));

vi.mock('@/lib/api-auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api-auth')>(),
  getApiUser: (...args: unknown[]) => getApiUser(...args),
}));
vi.mock('@/lib/api-security', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api-security')>(),
  checkDurableRateLimit: (...args: unknown[]) => checkDurableRateLimit(...args),
}));
vi.mock('@/lib/supabase-admin', () => ({ createAdminClient: () => createAdminClient() }));

import { GET, POST } from './[action]/route';

const R = '11111111-1111-4111-8111-111111111111';
const S = '22222222-2222-4222-8222-222222222222';
const USER = { id: 'user-1' };

function ctx(action: string) {
  return { params: Promise.resolve({ action }) };
}
function get(action: string, query = '') {
  return GET(new NextRequest(`http://localhost/api/native/sanskara/${action}${query}`), ctx(action));
}
function post(action: string, body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new NextRequest(`http://localhost/api/native/sanskara/${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    ctx(action),
  );
}

let rpc: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  rpc = vi.fn().mockResolvedValue({ data: { ok: true }, error: null });
  getApiUser.mockResolvedValue({ user: USER, error: null, supabase: { rpc } });
  checkDurableRateLimit.mockResolvedValue(null);
});

describe('routing', () => {
  it('404s an action that does not exist, before touching auth or the database', async () => {
    const res = await get('nope');
    expect(res.status).toBe(404);
    expect(getApiUser).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('405s the wrong method and names the right one', async () => {
    const res = await get('create-dependent');
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('POST');
    const res2 = await post('timeline', {});
    expect(res2.status).toBe(405);
    expect(res2.headers.get('Allow')).toBe('GET');
    expect(rpc).not.toHaveBeenCalled();
  });

  it('marks every response private and uncacheable', async () => {
    for (const res of [await get('nope'), await get('timeline'), await post('create-dependent', {}), await get('create-dependent')]) {
      expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    }
  });
});

describe('who may call', () => {
  it('stops an unauthenticated caller with the shared auth failure and never calls the database', async () => {
    getApiUser.mockResolvedValue({ user: null, supabase: null, error: Object.assign(new Error('x'), { status: 401, code: 'unauthenticated' }) });
    const res = await get('timeline');
    expect(res.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
    expect(checkDurableRateLimit).not.toHaveBeenCalled();
  });

  it('applies a per-user durable rate limit, separately for reads and writes', async () => {
    await get('timeline');
    await post('delete-mine', { requestId: R });
    expect(checkDurableRateLimit).toHaveBeenNthCalledWith(1, 'sanskara:read:user:user-1', 120, 60_000, expect.anything());
    expect(checkDurableRateLimit).toHaveBeenNthCalledWith(2, 'sanskara:write:user:user-1', 30, 60_000, expect.anything());
  });

  it('returns the rate limiter response untouched and does not call the database', async () => {
    checkDurableRateLimit.mockResolvedValue(NextResponse.json({ error: 'slow down' }, { status: 429 }));
    const res = await post('delete-mine', { requestId: R });
    expect(res.status).toBe(429);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('refuses an oversized body before authenticating', async () => {
    const res = await post('create-dependent', { requestId: R }, { 'content-length': '999999' });
    expect(res.status).toBe(413);
    expect(getApiUser).not.toHaveBeenCalled();
  });
});

describe('validation', () => {
  it('rejects a body that is not a JSON object', async () => {
    for (const body of ['not json', '[]', '"x"', 'null', '5']) {
      const res = await post('create-dependent', body);
      expect(res.status, body).toBe(400);
      expect((await res.json()).code).toBe('sanskara_invalid_body');
    }
    expect(rpc).not.toHaveBeenCalled();
  });

  it('names the offending field and nothing else, without calling the database', async () => {
    const res = await post('create-dependent', { requestId: R, name: 'Asha', birthDate: '18081991' });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: 'That request could not be accepted. Please check it and try again.',
      code: 'sanskara_invalid_input',
      field: 'birthDate',
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('validates a read query string too', async () => {
    const res = await get('access', '?subject=not-a-uuid');
    expect(res.status).toBe(400);
    expect((await res.json()).field).toBe('subject');
  });
});

describe('the call', () => {
  it('calls the right function with exactly the validated arguments, and returns its data', async () => {
    rpc.mockResolvedValue({ data: { id: S }, error: null });
    const res = await post('create-dependent', { requestId: R, name: ' Asha ', birthDate: '2024-03-04' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: S });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('sanskara_create_dependent', { p_request_id: R, p_name: 'Asha', p_birth_date: '2024-03-04' });
  });

  it('never takes the caller from the request: no account id is sent, the database derives it from the JWT', async () => {
    await get('timeline');
    expect(rpc).toHaveBeenCalledWith('sanskara_my_timeline', {});
    await post('create-dependent', { requestId: R, name: 'Asha', birthDate: '2024-03-04', accountId: 'someone-else' });
    expect(rpc).toHaveBeenCalledTimes(1); // the second request was refused for the unknown key
  });

  it('passes a read argument from the query string', async () => {
    await get('access', `?subject=${S}`);
    expect(rpc).toHaveBeenCalledWith('sanskara_list_access', { p_subject: S });
  });

  it('returns null, not an error, when a function returns nothing', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    const res = await get('timeline');
    expect(res.status).toBe(200);
    expect(await res.json()).toBeNull();
  });
});

describe('refusals', () => {
  it('maps our own SK errors to their status and keeps our reason', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'SK404', message: 'sanskara_not_found' } });
    const res = await post('delete-dependent', { requestId: R, subjectId: S });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'That was not found.', code: 'sanskara_not_found' });
  });

  it('turns the consent refusal into a 403 the client can act on', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'SK403', message: 'sanskara_consent_required' } });
    const res = await get('dependents');
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe('sanskara_consent_required');
  });

  it('reports any other database error as a generic 503 and leaks none of its text', async () => {
    const secret = 'permission denied for table sanskara_subjects; user 4e1d9c; column kul_family_member_id';
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: secret, details: secret, hint: secret } });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const res = await get('dependents');
    expect(res.status).toBe(503);
    const text = await res.text();
    expect(text).not.toContain('sanskara_subjects');
    expect(text).not.toContain('4e1d9c');
    expect(text).not.toContain('kul_family_member_id');
    // The server log carries the action and our code, not the database text or any identifier.
    expect(JSON.stringify(warn.mock.calls)).not.toContain('4e1d9c');
    expect(JSON.stringify(warn.mock.calls)).not.toContain('sanskara_subjects');
    warn.mockRestore();
  });

  it('lets a retry through to the database, which returns the stored response', async () => {
    rpc.mockResolvedValue({ data: { id: S, replayed: true }, error: null });
    const res = await post('create-dependent', { requestId: R, name: 'Asha', birthDate: '2024-03-04' });
    expect(res.status).toBe(200);
    expect((await res.json()).replayed).toBe(true);
  });
});
