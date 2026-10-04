import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
vi.mock('@/lib/admin', () => ({
  createServiceRoleSupabaseClient: () => ({ rpc }),
}));

vi.stubEnv('RESEND_WEBHOOK_SECRET', `whsec_${Buffer.from('route test secret').toString('base64')}`);
vi.stubEnv('EMAIL_SUPPRESSION_HMAC_KEY', 'suppression-test-key');

const { POST } = await import('./route');

function signedRequest(body: string, options: { signatureOverride?: string } = {}) {
  const id = 'evt_route_test';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const key = Buffer.from('route test secret');
  const signature = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64');
  return new Request('https://example.test/api/webhooks/resend', {
    method: 'POST',
    headers: {
      'svix-id': id,
      'svix-timestamp': timestamp,
      'svix-signature': options.signatureOverride ?? `v1,${signature}`,
      'content-type': 'application/json',
    },
    body,
  });
}

beforeEach(() => {
  rpc.mockReset();
  rpc.mockResolvedValue({ data: true, error: null });
});

describe('POST /api/webhooks/resend', () => {
  it('rejects unverified signatures before persistence', async () => {
    const response = await POST(signedRequest('{"type":"email.complained","data":{"to":["person@example.com"]}}', {
      signatureOverride: 'v1,invalid',
    }));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('persists only a keyed digest for a permanent bounce and reports duplicates', async () => {
    const body = JSON.stringify({
      type: 'email.bounced',
      data: { to: ['Person@example.com'], bounce: { type: 'Permanent' } },
    });
    const first = await POST(signedRequest(body));
    expect(first.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('process_resend_email_suppression_event', expect.objectContaining({
      p_event_id: 'evt_route_test',
      p_event_type: 'email.bounced',
      p_suppression_reason: 'hard_bounce',
      p_email_hashes: [expect.any(String)],
    }));
    const sentArgs = rpc.mock.calls[0][1] as { p_email_hashes: string[] };
    expect(sentArgs.p_email_hashes[0]).not.toContain('person@example.com');

    rpc.mockResolvedValueOnce({ data: false, error: null });
    const duplicate = await POST(signedRequest(body));
    expect(await duplicate.json()).toEqual({ ok: true, duplicate: true });
  });

  it('rejects an oversized payload before reading or persisting its event', async () => {
    const response = await POST(new Request('https://example.test/api/webhooks/resend', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': '128001' },
      body: '{}',
    }));
    expect(response.status).toBe(413);
    expect(rpc).not.toHaveBeenCalled();
  });
});
