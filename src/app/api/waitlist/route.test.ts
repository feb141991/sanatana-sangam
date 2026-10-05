import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock('@/lib/admin', () => ({
  createServiceRoleSupabaseClient: () => ({ rpc: mocks.rpc }),
}));

vi.mock('@/lib/api-security', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api-security')>(),
  checkDurableRateLimit: (...args: unknown[]) => mocks.rateLimit(...args),
}));

import { POST } from './route';

function request(body: unknown, headers: HeadersInit = {}) {
  return new NextRequest('https://www.shoonaya.com/api/waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/waitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    mocks.rateLimit.mockResolvedValue(null);
    mocks.rpc.mockResolvedValue({
      data: { id: 'request-1', email: 'prince@example.com', founding_number: 42, already_registered: false },
      error: null,
    });
  });

  it('rejects malformed email and never calls the registration transaction', async () => {
    const response = await POST(request({ email: 'not-an-email' }));

    expect(response.status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('stops a rate-limited request before writing waitlist or outbox data', async () => {
    mocks.rateLimit.mockResolvedValueOnce(NextResponse.json({ error: 'Too many requests' }, { status: 429 }));

    const response = await POST(request({ email: 'prince@example.com' }));

    expect(response.status).toBe(429);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('silently absorbs honeypot submissions without writing or queuing mail', async () => {
    const response = await POST(request({ email: 'bot@example.com', company_website: 'https://spam.invalid' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('uses one atomic registration-and-email transaction and returns a non-enumerating acknowledgement', async () => {
    const response = await POST(request({
      email: '  PRINCE@Example.com ',
      name: 'Prince',
      tradition: 'hindu',
      timezone: 'Asia/Kolkata',
      source: 'early-access-landing-android',
    }));
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toMatchObject({ success: true, foundingNumber: 42 });
    expect(responseBody.alreadyRegistered).toBeUndefined();
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith('register_waitlist_with_welcome', expect.objectContaining({
      p_email: 'prince@example.com',
      p_name: 'Prince',
      p_tradition: 'hindu',
      p_timezone: 'Asia/Kolkata',
      p_email_payload: expect.objectContaining({
        subject: expect.stringContaining('early-access request'),
        html: expect.stringContaining('does not create an account'),
      }),
    }));
  });

  it('does not tell the user the request succeeded if the atomic database transaction fails', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: '57P01' } });

    const response = await POST(request({ email: 'prince@example.com' }));

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: 'Could not save your request. Please try again shortly.' });
  });
});
