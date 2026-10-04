import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const getApiUser = vi.fn();
vi.mock('@/lib/admin', () => ({ createServiceRoleSupabaseClient: () => ({ rpc }) }));
vi.mock('@/lib/api-auth', () => ({
  getApiUser: (...args: unknown[]) => getApiUser(...args),
  getApiAuthFailureResponse: () => Response.json({ error: 'Unauthorized' }, { status: 401 }),
}));

vi.stubEnv('DEVICE_REGISTRY_HMAC_KEY', 'device-test-key');
const { POST } = await import('./route');

function request(payload: unknown) {
  return new Request('https://example.test/api/native/security/new-device', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

beforeEach(() => {
  rpc.mockReset();
  rpc.mockResolvedValue({ data: true, error: null });
  getApiUser.mockReset();
getApiUser.mockResolvedValue({ user: { id: '00000000-0000-4000-8000-000000000001' }, supabase: {}, error: null });
});

describe('POST /api/native/security/new-device', () => {
  it('stores only a keyed digest and authenticated owner', async () => {
    const installationId = '55cb87b5-3561-4f10-8f1a-3920c7344d01';
    const response = await POST(request({ installationId, platform: 'ios' }) as never);
    expect(response.status).toBe(200);
    const expectedHash = createHmac('sha256', 'device-test-key').update(installationId).digest('hex');
    expect(rpc).toHaveBeenCalledWith('register_email_security_device', {
      p_user_id: '00000000-0000-4000-8000-000000000001',
      p_device_hash: expectedHash,
      p_platform: 'ios',
    });
    expect(JSON.stringify(rpc.mock.calls)).not.toContain(installationId);
  });

  it('rejects malformed installation identifiers without invoking the database', async () => {
    const response = await POST(request({ installationId: 'not-a-uuid', platform: 'android' }) as never);
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
});
