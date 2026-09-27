import { generateKeyPairSync, randomUUID, sign, type KeyObject } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const cookieGetUser = vi.hoisted(() => vi.fn());
vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: async () => ({ auth: { getUser: cookieGetUser } }),
}));

// Exercise the installed Supabase SDK and WebCrypto, not a mocked getClaims.
// Only the HTTP boundary is local: public JWKS and GoTrue fallback responses.
describe('getApiUser with real ES256 signatures and JWKS verification', () => {
  let privateKey: KeyObject;
  let publicJwk: Record<string, unknown>;
  let projectUrl: string;
  let getApiUser: typeof import('./api-auth').getApiUser;
  let fetchMock: ReturnType<typeof vi.fn>;

  function token(overrides: Record<string, unknown> = {}, signingKey = privateKey, kid = 'key-1') {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'ES256', typ: 'JWT', kid })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      sub: 'b12dc895-7fb3-4cc7-8a2c-17c1cf5b9b4b', iss: `${projectUrl}/auth/v1`,
      aud: 'authenticated', role: 'authenticated', iat: now, exp: now + 3600,
      email: 'fixture@example.test', user_metadata: {}, app_metadata: {}, ...overrides,
    })).toString('base64url');
    const signature = sign('sha256', Buffer.from(`${header}.${payload}`), {
      key: signingKey, dsaEncoding: 'ieee-p1363',
    }).toString('base64url');
    return `${header}.${payload}.${signature}`;
  }

  function request(jwt: string) {
    return new NextRequest('http://localhost/api/fixture', { headers: { authorization: `Bearer ${jwt}` } });
  }

  beforeEach(async () => {
    vi.resetModules();
    projectUrl = `https://${randomUUID()}.supabase.test`;
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', projectUrl);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'local-test-anon-key');
    const keys = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    privateKey = keys.privateKey;
    publicJwk = { ...keys.publicKey.export({ format: 'jwk' }), kid: 'key-1', alg: 'ES256', use: 'sig' };
    fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === `${projectUrl}/auth/v1/.well-known/jwks.json`) {
        return Response.json({ keys: [publicJwk] });
      }
      throw new Error(`Unexpected fixture request: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    cookieGetUser.mockReset();
    ({ getApiUser } = await import('./api-auth'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('verifies signatures, reuses public keys, and keeps different users on distinct bearer clients', async () => {
    const firstToken = token();
    const first = await getApiUser(request(firstToken));
    expect(first.user?.id).toBe('b12dc895-7fb3-4cc7-8a2c-17c1cf5b9b4b');
    const secondToken = token({ sub: '3fdce36b-1a3b-43b3-8a7c-43ec31e1fe0b' });
    const second = await getApiUser(request(secondToken));
    expect(second.user?.id).toBe('3fdce36b-1a3b-43b3-8a7c-43ec31e1fe0b');
    expect(first.supabase).not.toBe(second.supabase);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cookieGetUser).not.toHaveBeenCalled();

    const headers: string[] = [];
    fetchMock.mockImplementation(async (_input: RequestInfo | URL, init?: RequestInit) => {
      headers.push(new Headers(init?.headers).get('authorization') ?? '');
      return Response.json([]);
    });
    await first.supabase!.from('profiles').select('id');
    await second.supabase!.from('profiles').select('id');
    expect(headers).toEqual([`Bearer ${firstToken}`, `Bearer ${secondToken}`]);
  });

  it.each([
    ['expired', { exp: 1 }], ['missing expiry', { exp: undefined }],
    ['non-numeric expiry', { exp: 'not-a-time' }],
    ['future not-before', { nbf: Math.floor(Date.now() / 1000) + 3600 }],
    ['other project', { iss: 'https://other.supabase.test/auth/v1' }],
    ['other audience', { aud: 'anon' }], ['service role', { role: 'service_role' }],
  ])('rejects a genuinely signed token with %s claims', async (_name, override) => {
    const result = await getApiUser(request(token(override)));
    expect(result.user).toBeNull();
    expect(result.error).toMatchObject({ status: 401, code: 'AUTH_REQUIRED' });
    expect(cookieGetUser).not.toHaveBeenCalled();
  });

  it('rejects a forged signature and malformed JWT as 401', async () => {
    const foreignKey = generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey;
    for (const jwt of [token({}, foreignKey), 'not.a.jwt']) {
      const result = await getApiUser(request(jwt));
      expect(result.user).toBeNull();
      expect(result.error).toMatchObject({ status: 401, code: 'AUTH_REQUIRED' });
    }
  });

  it('fetches a rotated public key and verifies its signature', async () => {
    expect((await getApiUser(request(token()))).user).not.toBeNull();
    const rotated = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    publicJwk = { ...rotated.publicKey.export({ format: 'jwk' }), kid: 'key-2', alg: 'ES256', use: 'sig' };
    expect((await getApiUser(request(token({}, rotated.privateKey, 'key-2')))).user).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('preserves a JWKS dependency failure as 503', async () => {
    fetchMock.mockResolvedValue(Response.json({ message: 'fixture outage' }, { status: 503 }));
    const result = await getApiUser(request(token()));
    expect(result.user).toBeNull();
    expect(result.error).toMatchObject({ status: 503, code: 'AUTH_UNAVAILABLE' });
  });

  it('keeps the SDK remote fallback for unknown keys without trusting an unverifiable token', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/.well-known/jwks.json')) return Response.json({ keys: [] });
      if (String(input).endsWith('/user')) return Response.json({ message: 'invalid token' }, { status: 401 });
      throw new Error('Unexpected fixture request');
    });
    const result = await getApiUser(request(token()));
    expect(result.user).toBeNull();
    expect(result.error).toMatchObject({ status: 401, code: 'AUTH_REQUIRED' });
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toContain(`${projectUrl}/auth/v1/user`);
  });
});
