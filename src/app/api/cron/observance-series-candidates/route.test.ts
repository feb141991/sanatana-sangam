import { afterEach, describe, expect, it } from 'vitest';
import { GET } from './route';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('observance series candidate cron route', () => {
  it('rejects requests without the cron bearer secret', async () => {
    process.env.CRON_SECRET = 'test-secret';
    const response = await GET(new Request('https://shoonaya.com/api/cron/observance-series-candidates'));
    expect(response.status).toBe(401);
  });

  it('returns before data access when the global resolver is disabled', async () => {
    process.env.CRON_SECRET = 'test-secret';
    delete process.env.NOTIFICATION_RESOLVER_ENABLED;
    process.env.NOTIFICATION_CANDIDATE_MODE_OBSERVANCE_SERIES = 'candidate';
    const response = await GET(new Request('https://shoonaya.com/api/cron/observance-series-candidates', {
      headers: { authorization: 'Bearer test-secret' },
    }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      skipped: true,
      reason: 'observance_series_candidate_pipeline_not_enabled',
    });
  });

  it('is default-off when the per-type candidate mode is unset', async () => {
    process.env.CRON_SECRET = 'test-secret';
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'true';
    delete process.env.NOTIFICATION_CANDIDATE_MODE_OBSERVANCE_SERIES;
    const response = await GET(new Request('https://shoonaya.com/api/cron/observance-series-candidates', {
      headers: { authorization: 'Bearer test-secret' },
    }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, skipped: true, mode: 'disabled' });
  });
});
