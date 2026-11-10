import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getApiUser: vi.fn(),
  createAdminClient: vi.fn(),
  checkDurableRateLimit: vi.fn(),
  rejectLargeRequest: vi.fn(),
}));

vi.mock('@/lib/api-auth', () => ({
  getApiUser: mocks.getApiUser,
  getApiAuthFailureResponse: () => new Response('unauthorized', { status: 401 }),
}));
vi.mock('@/lib/supabase-admin', () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock('@/lib/api-security', () => ({
  checkDurableRateLimit: mocks.checkDurableRateLimit,
  rejectLargeRequest: mocks.rejectLargeRequest,
}));

afterEach(() => vi.resetAllMocks());

const EVENT = '2f1d6d6e-8a41-4d0a-9c59-0b8a7f1c2a10';
const valid = (extra: Record<string, unknown> = {}) => ({
  clientEventId: EVENT,
  notificationKey: 'quiz:daily-2026-11-12:available:2026-11-12:default',
  tappedAt: '2026-11-12T05:31:00.000Z',
  launchState: 'cold_start',
  appVersion: '1.4.0',
  platform: 'ios',
  ...extra,
});
const request = (body?: unknown) => new NextRequest('https://shoonaya.com/api/native/notification-taps', {
  method: 'POST',
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

function configure(result: { data?: unknown; error?: { code: string; message: string } | null } = {}) {
  const rpc = vi.fn(async () => ({
    data: 'data' in result ? result.data : { accepted: 1, consentRequired: false, religiousConsentRequired: false, unmatched: false },
    error: result.error ?? null,
  }));
  const adminRpc = vi.fn();
  mocks.getApiUser.mockResolvedValue({ user: { id: 'user-1' }, error: null, supabase: { rpc } });
  mocks.createAdminClient.mockReturnValue({ rpc: adminRpc });
  mocks.checkDurableRateLimit.mockResolvedValue(null);
  mocks.rejectLargeRequest.mockReturnValue(null);
  return { rpc, adminRpc };
}

describe('/api/native/notification-taps', () => {
  it('requires a verified signed-in account, and does no other work before that', async () => {
    mocks.rejectLargeRequest.mockReturnValue(null);
    mocks.getApiUser.mockResolvedValue({ user: null, error: new Error('unauthorized'), supabase: null });
    const { POST } = await import('./route');
    expect((await POST(request(valid()))).status).toBe(401);
    expect(mocks.checkDurableRateLimit).not.toHaveBeenCalled();
  });

  it('rejects an oversized body before reading it', async () => {
    mocks.rejectLargeRequest.mockReturnValue(new Response('too large', { status: 413 }));
    const { POST } = await import('./route');
    expect((await POST(request(valid()))).status).toBe(413);
    expect(mocks.getApiUser).not.toHaveBeenCalled();
  });

  it('is rate limited per account', async () => {
    const { rpc } = configure();
    mocks.checkDurableRateLimit.mockResolvedValue(new Response('slow down', { status: 429 }));
    const { POST } = await import('./route');
    expect((await POST(request(valid()))).status).toBe(429);
    expect(mocks.checkDurableRateLimit).toHaveBeenCalledWith('notification-taps:user:user-1', 60, 60_000, expect.anything());
    expect(rpc).not.toHaveBeenCalled();
  });

  it('records through the signed-in user\'s own client, never the admin client, and passes exactly the six fields', async () => {
    const { rpc, adminRpc } = configure();
    const { POST } = await import('./route');
    const response = await POST(request(valid()));
    expect(response.status).toBe(202);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ accepted: 1, consentRequired: false, religiousConsentRequired: false, unmatched: false });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('record_notification_tap', {
      p_client_event_id: EVENT,
      p_notification_key: 'quiz:daily-2026-11-12:available:2026-11-12:default',
      p_tapped_at: '2026-11-12T05:31:00.000Z',
      p_launch_state: 'cold_start',
      p_app_version: '1.4.0',
      p_platform: 'ios',
    });
    expect(adminRpc).not.toHaveBeenCalled();
  });

  it('normalises any ISO timestamp, including one with an offset, to UTC before it reaches the database', async () => {
    const { rpc } = configure();
    const { POST } = await import('./route');
    await POST(request(valid({ tappedAt: '2026-11-12T11:01:00+05:30' })));
    expect(rpc).toHaveBeenCalledWith('record_notification_tap', expect.objectContaining({ p_tapped_at: '2026-11-12T05:31:00.000Z' }));
  });

  it('accepts a tap with only the required fields', async () => {
    const { rpc } = configure();
    const { POST } = await import('./route');
    const response = await POST(request({ clientEventId: EVENT, notificationKey: 'k', launchState: 'running' }));
    expect(response.status).toBe(202);
    expect(rpc).toHaveBeenCalledWith('record_notification_tap', {
      p_client_event_id: EVENT, p_notification_key: 'k', p_tapped_at: null, p_launch_state: 'running', p_app_version: null, p_platform: null,
    });
  });

  it.each([
    ['a user id', { userId: 'someone-else' }],
    ['a notification type', { notificationType: 'quiz' }],
    ['message text', { title: 'Your quiz', body: 'is ready' }],
    ['a route or url', { url: '/quiz' }],
    ['any unknown field', { extra: 1 }],
  ])('refuses a body carrying %s: identity and content never come from the client', async (_label, extra) => {
    const { rpc } = configure();
    const { POST } = await import('./route');
    expect((await POST(request(valid(extra)))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each([
    ['a non-UUID event id', { clientEventId: 'not-a-uuid' }],
    ['a missing event id', { clientEventId: undefined }],
    ['an empty key', { notificationKey: '' }],
    ['a 201-character key', { notificationKey: 'k'.repeat(201) }],
    ['a numeric key', { notificationKey: 42 }],
    ['a launch state outside the pair', { launchState: 'foreground' }],
    ['a missing launch state', { launchState: undefined }],
    ['an unparsable timestamp', { tappedAt: 'yesterday' }],
    ['a numeric timestamp', { tappedAt: 1700000000000 }],
    ['a malformed version', { appVersion: 'latest' }],
    ['an over-long version', { appVersion: '1.0.0-' + 'x'.repeat(40) }],
    ['a web platform', { platform: 'web' }],
  ])('refuses %s', async (_label, extra) => {
    const { rpc } = configure();
    const { POST } = await import('./route');
    expect((await POST(request(valid(extra)))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each([null, [], 'text', 7])('refuses a body that is not an object (%j)', async (body) => {
    const { rpc } = configure();
    const { POST } = await import('./route');
    expect((await POST(request(body))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('relays the database\'s "consent needed" answer so the app can stop queueing', async () => {
    configure({ data: { accepted: 0, consentRequired: true, religiousConsentRequired: false, unmatched: false } });
    const { POST } = await import('./route');
    const response = await POST(request(valid()));
    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({ accepted: 0, consentRequired: true });
  });

  it('relays "religious consent needed" and "unmatched" distinctly', async () => {
    configure({ data: { accepted: 0, consentRequired: false, religiousConsentRequired: true, unmatched: false } });
    const { POST } = await import('./route');
    expect(await (await POST(request(valid()))).json()).toMatchObject({ religiousConsentRequired: true, unmatched: false });
    configure({ data: { accepted: 0, consentRequired: false, religiousConsentRequired: false, unmatched: true } });
    expect(await (await POST(request(valid()))).json()).toMatchObject({ unmatched: true, consentRequired: false });
  });

  it('answers a malformed database result as "nothing accepted", not as an acceptance', async () => {
    configure({ data: 'garbage' });
    const { POST } = await import('./route');
    expect(await (await POST(request(valid()))).json()).toEqual({ accepted: 0, consentRequired: false, religiousConsentRequired: false, unmatched: false });
  });

  it('answers 503 with no database detail on an internal error, and logs the code only', async () => {
    configure({ error: { code: 'XX000', message: 'relation "notification_taps" column "user_id" violates ...' } });
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { POST } = await import('./route');
    const response = await POST(request(valid()));
    expect(response.status).toBe(503);
    const text = JSON.stringify(await response.json());
    expect(text).not.toMatch(/notification_taps|user_id|violates|XX000/);
    expect(JSON.stringify(logged.mock.calls)).not.toMatch(/notification_taps|violates|quiz:daily/);
    expect(JSON.stringify(logged.mock.calls)).toContain('XX000');
    logged.mockRestore();
  });

  it('turns the database\'s own "invalid input" into a 400', async () => {
    configure({ error: { code: '22023', message: 'Invalid notification tap' } });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { POST } = await import('./route');
    expect((await POST(request(valid()))).status).toBe(400);
  });
});
