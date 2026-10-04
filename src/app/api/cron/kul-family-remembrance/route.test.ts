import { afterEach, describe, expect, it, vi } from 'vitest';

const createClient = vi.fn();
vi.mock('@supabase/supabase-js', () => ({ createClient: (...args: unknown[]) => createClient(...args) }));

import { GET } from './route';

const originalEnv = { ...process.env };

function cronRequest(token = 'test-secret') {
  return new Request('https://shoonaya.com/api/cron/kul-family-remembrance', {
    headers: { authorization: `Bearer ${token}` },
  });
}

describe('KUL family remembrance cron gate', () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    createClient.mockReset();
  });

  it('rejects requests without the cron secret before reading any data', async () => {
    process.env.CRON_SECRET = 'test-secret';
    const response = await GET(cronRequest('wrong-secret'));
    expect(response.status).toBe(401);
    expect(createClient).not.toHaveBeenCalled();
  });

  it('keeps production candidate creation off until both rollout gates are enabled', async () => {
    process.env.CRON_SECRET = 'test-secret';
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'true';
    delete process.env.NOTIFICATION_CANDIDATE_MODE_FAMILY_REMEMBRANCE;
    const response = await GET(cronRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      skipped: true,
      reason: 'family_remembrance_candidate_pipeline_not_enabled',
      pipelineMode: 'disabled',
      resolverEnabled: true,
    });
    expect(createClient).not.toHaveBeenCalled();
  });

  it('does not read or create candidates when the global resolver gate is off', async () => {
    process.env.CRON_SECRET = 'test-secret';
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'false';
    process.env.NOTIFICATION_CANDIDATE_MODE_FAMILY_REMEMBRANCE = 'candidate';
    const response = await GET(cronRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      skipped: true,
      pipelineMode: 'candidate',
      resolverEnabled: false,
    });
    expect(createClient).not.toHaveBeenCalled();
  });
});
