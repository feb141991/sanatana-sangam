import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../route';
import { postSlackOperationalAlert } from '@/lib/slack-alerts';
import { processEmailOutboxBatch } from '@/lib/email-outbox';

vi.mock('@/lib/slack-alerts', () => ({
  postSlackOperationalAlert: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/admin', () => ({
  createServiceRoleSupabaseClient: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/email-outbox', () => ({
  processEmailOutboxBatch: vi.fn(),
}));

describe('/api/cron/email-outbox', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      CRON_SECRET: 'test-cron-secret-123',
      RESEND_API_KEY: 're_test_key',
      EMAIL_SUPPRESSION_HMAC_KEY: 'test_hmac_key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('rejects unauthorized requests', async () => {
    const req = new Request('https://shoonaya.com/api/cron/email-outbox', {
      headers: { authorization: 'Bearer wrong-secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('successfully processes batches', async () => {
    vi.mocked(processEmailOutboxBatch).mockResolvedValue({
      claimed: 2,
      sent: 2,
      suppressed: 0,
      retried: 0,
      dead: 0,
      failed: 0,
    });

    const req = new Request('https://shoonaya.com/api/cron/email-outbox', {
      headers: { authorization: 'Bearer test-cron-secret-123' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.sent).toBe(2);
    expect(postSlackOperationalAlert).not.toHaveBeenCalled();
  });

  it('dispatches P0 Slack alert when database throws a PostgREST / connection error', async () => {
    vi.mocked(processEmailOutboxBatch).mockRejectedValue(
      new Error('email_outbox_claim_failed:PGRST002: Could not query the database for the schema cache')
    );

    const req = new Request('https://shoonaya.com/api/cron/email-outbox', {
      headers: { authorization: 'Bearer test-cron-secret-123' },
    });
    const res = await GET(req);
    expect(res.status).toBe(500);

    expect(postSlackOperationalAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'P0',
        title: expect.stringContaining('Database Unreachable in Email Outbox'),
        desc: expect.stringContaining('PGRST002'),
      })
    );
  });
});
