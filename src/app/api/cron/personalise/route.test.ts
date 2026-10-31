import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

describe('/api/cron/personalise', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      CRON_SECRET: 'test-cron-secret',
      INTERNAL_DISPATCH_SECRET: 'test-dispatch-secret',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
    };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('rejects unauthorized requests when secret is missing or invalid', async () => {
    const noAuthReq = new NextRequest('https://shoonaya.com/api/cron/personalise');
    const res1 = await GET(noAuthReq);
    expect(res1.status).toBe(401);

    const badAuthReq = new NextRequest('https://shoonaya.com/api/cron/personalise', {
      headers: { Authorization: 'Bearer invalid-token' },
    });
    const res2 = await POST(badAuthReq);
    expect(res2.status).toBe(401);
  });
});
