import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const getApiUser = vi.fn();
const rpc = vi.fn();
const recordPushTokenEvent = vi.fn(async () => undefined);

vi.mock('@/lib/api-auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api-auth')>(),
  getApiUser: (...args: unknown[]) => getApiUser(...args),
}));
vi.mock('@/lib/admin', () => ({ createServiceRoleSupabaseClient: () => ({ rpc }) }));
vi.mock('@/lib/push-token-audit', () => ({
  recordPushTokenEvent: (...args: unknown[]) => recordPushTokenEvent(...(args as [])),
  recordPushTokenEventBatch: vi.fn(async () => undefined),
}));

import { POST } from './route';

const TOKEN = 'ExponentPushToken[abc123]';
const VERSION = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';

function post() {
  return POST(new NextRequest('http://localhost/api/notifications/register-token', {
    method: 'POST',
    body: JSON.stringify({ token: TOKEN, platform: 'ios', registrationReason: 'auth' }),
  }));
}

describe('POST /api/notifications/register-token and account deletion', () => {
  beforeEach(() => {
    getApiUser.mockReset();
    rpc.mockReset();
    recordPushTokenEvent.mockClear();
    getApiUser.mockResolvedValue({ user: { id: 'user-1' }, error: null });
  });

  it('answers 409 ACCOUNT_DELETION_PENDING and records no registration when the RPC refuses a deleting account', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'SHDEL', message: 'account_deletion_pending' } });

    const response = await post();

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'Account deletion is pending', code: 'ACCOUNT_DELETION_PENDING' });
    expect(recordPushTokenEvent).toHaveBeenCalledTimes(0);
  });

  it('keeps other RPC failures retryable (503)', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '57014', message: 'canceling statement' } });

    const response = await post();

    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe('PUSH_REGISTRATION_UNAVAILABLE');
  });

  it('registers normally for an account that is not deleting', async () => {
    rpc.mockResolvedValue({ data: VERSION, error: null });

    const response = await post();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ registered: true, bindingVersion: VERSION });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('register_native_push_token', { p_user_id: 'user-1', p_token: TOKEN, p_platform: 'ios' });
    expect(recordPushTokenEvent).toHaveBeenCalledTimes(1);
  });
});
