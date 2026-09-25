import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GET } from './route';

describe('Sankalpa midpoint cron rollout gate', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv, CRON_SECRET: 'test-secret' };
    delete process.env.NOTIFICATION_RESOLVER_ENABLED;
    delete process.env.NOTIFICATION_CANDIDATE_MODE_SANKALPA_MIDPOINT;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns without database work while the new candidate type is disabled by default', async () => {
    const response = await GET(new Request('https://shoonaya.com/api/cron/sankalpa-checkin', {
      headers: { authorization: 'Bearer test-secret' },
    }));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.skipped).toBe(true);
    expect(payload.mode).toBe('disabled');
  });

  it('rejects requests without the cron secret', async () => {
    const response = await GET(new Request('https://shoonaya.com/api/cron/sankalpa-checkin'));
    expect(response.status).toBe(401);
  });
});
