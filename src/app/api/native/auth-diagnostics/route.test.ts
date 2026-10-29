import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  upsert: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));
vi.mock('@/lib/api-security', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api-security')>()),
  checkDurableRateLimit: mocks.rateLimit,
}));

import { POST } from './route';

const event = (overrides: Record<string, unknown> = {}) => ({
  requestId: 'a1b2c3d4-e5f6-4789-8123-456789abcdef',
  retryRequestId: null,
  route: 'register_token',
  authCode: 'AUTH_UNAVAILABLE',
  initialStatus: 503,
  finalStatus: 503,
  authReadyWaitMs: 25,
  hadAccessToken: true,
  refreshAttempted: false,
  refreshSucceeded: false,
  durationMs: 4300,
  timestamp: Date.now(),
  ...overrides,
});

const post = (body: unknown, headers: Record<string, string> = {}) =>
  POST(new Request('https://example.com/api/native/auth-diagnostics', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.example';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
  mocks.upsert.mockResolvedValue({ error: null });
  mocks.rateLimit.mockResolvedValue(null);
  mocks.createClient.mockReturnValue({ from: () => ({ upsert: mocks.upsert }) });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/native/auth-diagnostics', () => {
  it('acknowledges an empty batch as a no-op without touching the database or the rate limit', async () => {
    const response = await post({ appVersion: '1.8.0', platform: 'ios', events: [] });
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ accepted: 0 });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('stores a valid batch idempotently by request id, with no identity fields', async () => {
    const response = await post({ appVersion: '1.8.0', platform: 'ios', events: [event()] });
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ accepted: 1 });
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    const [rows, options] = mocks.upsert.mock.calls[0];
    expect(options).toEqual({ onConflict: 'request_id', ignoreDuplicates: true });
    expect(Object.keys(rows[0]).sort()).toEqual([
      'app_version', 'auth_code', 'auth_ready_wait_ms', 'client_occurred_at', 'duration_ms', 'final_status', 'had_access_token',
      'initial_status', 'platform', 'refresh_attempted', 'refresh_succeeded', 'request_id', 'retry_request_id', 'route',
    ]);
  });

  it('rejects an invalid batch with a 400, stores nothing, and logs no payload content', async () => {
    const response = await post({ appVersion: '1.8.0', platform: 'ios', events: [event({ route: 'not_a_route', requestId: 'secret-looking-value' })] });
    expect(response.status).toBe(400);
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith('[native-auth-diagnostics] payload validation failed');
    expect(JSON.stringify((console.warn as unknown as { mock: { calls: unknown[] } }).mock.calls)).not.toContain('secret-looking-value');
  });

  it.each([
    ['malformed JSON', '{not json'],
    ['a payload that is not an object', '[1,2,3]'],
    ['a missing events array', '{"appVersion":"1.8.0"}'],
    ['events that are not an array', '{"events":{}}'],
  ])('rejects %s with a 400', async (_label, body) => {
    expect((await post(body)).status).toBe(400);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('refuses an oversized request before reading it', async () => {
    const response = await post({ events: [event()] }, { 'content-length': String(24 * 1024 + 1) });
    expect(response.status).toBe(413);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('is unavailable, not silently accepting, when the server is not configured', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect((await post({ events: [event()] })).status).toBe(503);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('honours the rate limit before storing anything', async () => {
    mocks.rateLimit.mockResolvedValue(new Response('{}', { status: 429 }));
    expect((await post({ events: [event()] })).status).toBe(429);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('answers a persistence failure with a retryable 503 and no database detail', async () => {
    mocks.upsert.mockResolvedValue({ error: { code: 'XX001', message: 'relation "native_auth_diagnostic_events" detail' } });
    const response = await post({ events: [event()] });
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('native_auth_diagnostic_events');
  });
});
