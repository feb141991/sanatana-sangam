import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createClient = vi.fn();
vi.mock('@supabase/supabase-js', () => ({ createClient: (...args: unknown[]) => createClient(...args) }));

import { GET } from './route';

const originalEnv = { ...process.env };
const SUB_A = '8a1f3c52-1b7e-4c0a-9d3e-5f6a7b8c9d01';
const SUB_B = '9c2e4a60-1111-4222-8333-abcdefabcdef';
const SUB_C = '7d3e5b71-2222-4333-8444-fedcbafedcba';
const ACCOUNT = '2b4d6f80-aaaa-4bbb-8ccc-0123456789ab';

function dueRow(subscription_id: string, overrides: Record<string, unknown> = {}) {
  // scheduled_for is a fixed offset from the real clock, so the 48-hour and end-of-day rules hold whenever the test runs.
  const scheduled = new Date(Date.now() + 2 * 60 * 60 * 1000);
  return {
    subscription_id,
    subscription_generation: 1,
    record_version: 1,
    profile_generation: 1,
    account_id: ACCOUNT,
    lead_days: 1,
    audience_variant: 'self',
    local_date: scheduled.toISOString().slice(0, 10),
    scheduled_for: scheduled.toISOString(),
    timezone: 'UTC',
    language: 'en',
    quiet_hours_start: null,
    quiet_hours_end: null,
    ...overrides,
  };
}

type InsertResult = { error: { code: string; message: string } | null };

function mockDatabase(rows: unknown[], options: { rpcError?: { code: string; message: string }; inserts?: InsertResult[] } = {}) {
  const limit = vi.fn().mockResolvedValue(options.rpcError ? { data: null, error: options.rpcError } : { data: rows, error: null });
  const rpc = vi.fn().mockReturnValue({ limit });
  const queue = [...(options.inserts ?? [])];
  const insert = vi.fn().mockImplementation(() => Promise.resolve(queue.shift() ?? { error: null }));
  const from = vi.fn().mockReturnValue({ insert });
  createClient.mockReturnValue({ rpc, from });
  return { rpc, limit, from, insert };
}

function request(token = 'test-secret', query = '') {
  return new Request(`https://shoonaya.com/api/cron/sanskara-reminders${query}`, { headers: { authorization: `Bearer ${token}` } });
}

function enable() {
  process.env.CRON_SECRET = 'test-secret';
  process.env.NOTIFICATION_RESOLVER_ENABLED = 'true';
  process.env.NOTIFICATION_CANDIDATE_MODE_SANSKAR_MILESTONE = 'candidate';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
  delete process.env.NOTIFICATIONS_DRY_RUN;
  delete process.env.NOTIFICATIONS_DISABLED;
  delete process.env.NOTIFICATIONS_DISABLE_TYPES;
}

describe('Sanskara reminder producer cron', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    process.env = { ...originalEnv };
    createClient.mockReset();
    vi.restoreAllMocks();
  });

  describe('gates', () => {
    it('rejects a wrong secret before touching the database', async () => {
      process.env.CRON_SECRET = 'test-secret';
      const response = await GET(request('wrong'));
      expect(response.status).toBe(401);
      expect(createClient).not.toHaveBeenCalled();
    });

    it('is off by default: no per-type mode means no database access at all', async () => {
      enable();
      delete process.env.NOTIFICATION_CANDIDATE_MODE_SANSKAR_MILESTONE;
      const response = await GET(request());
      expect(await response.json()).toMatchObject({ skipped: true, reason: 'sanskara_candidate_pipeline_not_enabled', pipelineMode: 'disabled' });
      expect(createClient).not.toHaveBeenCalled();
    });

    it('stays off when the global resolver switch is off, even with the type switched on', async () => {
      enable();
      process.env.NOTIFICATION_RESOLVER_ENABLED = 'false';
      const response = await GET(request());
      expect(await response.json()).toMatchObject({ skipped: true, pipelineMode: 'candidate', resolverEnabled: false });
      expect(createClient).not.toHaveBeenCalled();
    });

    it.each(['legacy', 'disabled', 'yes'])('does not run for mode %s', async (mode) => {
      enable();
      process.env.NOTIFICATION_CANDIDATE_MODE_SANSKAR_MILESTONE = mode;
      const response = await GET(request());
      expect((await response.json()).skipped).toBe(true);
      expect(createClient).not.toHaveBeenCalled();
    });

    it('creates nothing in a dry run', async () => {
      enable();
      const db = mockDatabase([dueRow(SUB_A), dueRow(SUB_B)]);
      const response = await GET(request('test-secret', '?dryRun=true'));
      expect(response.status).toBe(200);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('creates nothing when the type is listed in NOTIFICATIONS_DISABLE_TYPES', async () => {
      enable();
      process.env.NOTIFICATIONS_DISABLE_TYPES = 'sanskar_milestone';
      const db = mockDatabase([dueRow(SUB_A)]);
      await GET(request());
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('creates nothing when all notifications are disabled', async () => {
      enable();
      process.env.NOTIFICATIONS_DISABLED = 'true';
      const db = mockDatabase([dueRow(SUB_A)]);
      await GET(request());
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe('selection', () => {
    it('asks the database selector with no arguments, so the server clock decides, and bounds the result', async () => {
      enable();
      const db = mockDatabase([]);
      await GET(request());
      expect(db.rpc).toHaveBeenCalledWith('sanskara_reminders_due');
      expect(db.limit).toHaveBeenCalledWith(1000);
    });

    it('inserts one candidate per due row into notification_candidates', async () => {
      enable();
      const db = mockDatabase([dueRow(SUB_A), dueRow(SUB_B, { lead_days: 0 })]);
      const response = await GET(request());
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toMatchObject({ success: true, due: 2, created: 2, duplicates: 0, refused: 0, malformed: 0 });
      expect(db.from).toHaveBeenCalledWith('notification_candidates');
      expect(db.insert).toHaveBeenCalledTimes(2);
      expect(db.insert.mock.calls[0][0]).toMatchObject({ event_type: 'sanskar_milestone', event_id: SUB_A, event_instance: 'L1' });
      expect(db.insert.mock.calls[1][0]).toMatchObject({ event_type: 'sanskar_milestone', event_id: SUB_B, event_instance: 'L0' });
    });

    it('does nothing and succeeds when nothing is due', async () => {
      enable();
      const db = mockDatabase([]);
      const response = await GET(request());
      expect(await response.json()).toMatchObject({ success: true, due: 0, created: 0 });
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('reports truncation when the selector hit its bound', async () => {
      enable();
      mockDatabase(Array.from({ length: 1000 }, (_, i) => dueRow(`00000000-0000-4000-8000-${String(i).padStart(12, '0')}`)));
      const body = await (await GET(request())).json();
      expect(body.truncated).toBe(true);
    });

    it('skips a malformed row without stopping the others', async () => {
      enable();
      const db = mockDatabase([dueRow(SUB_A), dueRow('not-a-uuid'), dueRow(SUB_B)]);
      const body = await (await GET(request())).json();
      expect(body).toMatchObject({ created: 2, malformed: 1 });
      expect(db.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe('what the insert trigger may answer', () => {
    it('counts a refusal (23514) and carries on: a change made between selection and insert is expected', async () => {
      enable();
      const db = mockDatabase([dueRow(SUB_A), dueRow(SUB_B), dueRow(SUB_C)], {
        inserts: [{ error: null }, { error: { code: '23514', message: 'sanskara_candidate_requires_current_subscription' } }, { error: null }],
      });
      const response = await GET(request());
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(db.insert).toHaveBeenCalledTimes(3);
      expect(body).toMatchObject({ created: 2, refused: 1, refusedReasons: { sanskara_candidate_requires_current_subscription: 1 } });
    });

    it('retries with the next wording when the trigger says the text repeats a name, and counts it as created', async () => {
      enable();
      const notDiscreet = { code: '23514', message: 'sanskara_candidate_not_discreet' };
      const db = mockDatabase([dueRow(SUB_A)], { inserts: [{ error: notDiscreet }, { error: null }] });
      const body = await (await GET(request())).json();
      expect(db.insert).toHaveBeenCalledTimes(2);
      const [first, second] = db.insert.mock.calls.map((c) => c[0]);
      expect(second.title).not.toBe(first.title);
      expect(second.metadata).toEqual(first.metadata);
      expect(second.event_id).toBe(first.event_id);
      expect(body).toMatchObject({ created: 1, reworded: 1, refused: 0 });
    });

    it('refuses the reminder, without looping, when every wording repeats the name', async () => {
      enable();
      const notDiscreet = { code: '23514', message: 'sanskara_candidate_not_discreet' };
      const db = mockDatabase([dueRow(SUB_A), dueRow(SUB_B)], { inserts: [{ error: notDiscreet }, { error: notDiscreet }, { error: null }] });
      const body = await (await GET(request())).json();
      // two wordings for SUB_A, then SUB_B on its first
      expect(db.insert).toHaveBeenCalledTimes(3);
      expect(body).toMatchObject({ created: 1, refused: 1, refusedReasons: { sanskara_candidate_not_discreet: 1 } });
    });

    it('does not reword for any other refusal', async () => {
      enable();
      const db = mockDatabase([dueRow(SUB_A)], { inserts: [{ error: { code: '23514', message: 'sanskara_candidate_requires_current_subscription' } }] });
      await GET(request());
      expect(db.insert).toHaveBeenCalledTimes(1);
    });

    it('counts a duplicate (23505) as already created, not a failure', async () => {
      enable();
      mockDatabase([dueRow(SUB_A)], { inserts: [{ error: { code: '23505', message: 'duplicate key value violates unique constraint "notification_candidates_one_live_sanskar"' } }] });
      const response = await GET(request());
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ created: 0, duplicates: 1, refused: 0 });
    });

    it('never echoes database text it did not write: an unknown 23514 message becomes a fixed reason', async () => {
      enable();
      mockDatabase([dueRow(SUB_A)], { inserts: [{ error: { code: '23514', message: 'new row for relation "notification_candidates" violates check constraint "x" Failing row contains (secret)' } }] });
      const body = await (await GET(request())).json();
      expect(body.refusedReasons).toEqual({ sanskara_candidate_refused: 1 });
      expect(JSON.stringify(body)).not.toContain('secret');
    });

    it('stops at any other database error and answers 503, leaving the rest for the next run', async () => {
      enable();
      const db = mockDatabase([dueRow(SUB_A), dueRow(SUB_B), dueRow(SUB_C)], {
        inserts: [{ error: null }, { error: { code: '42501', message: 'permission denied for table notification_candidates' } }],
      });
      const response = await GET(request());
      expect(response.status).toBe(503);
      expect(db.insert).toHaveBeenCalledTimes(2);
      expect(JSON.stringify(await response.json())).not.toContain('permission denied');
    });

    it('answers 503 and creates nothing when the selector itself fails', async () => {
      enable();
      const db = mockDatabase([], { rpcError: { code: '57014', message: 'canceling statement due to statement timeout' } });
      const response = await GET(request());
      expect(response.status).toBe(503);
      expect(db.insert).not.toHaveBeenCalled();
      expect(JSON.stringify(await response.json())).not.toContain('statement timeout');
    });
  });

  describe('privacy of its own output', () => {
    it('puts no subscription id, account id or reminder text in the response or the logs', async () => {
      enable();
      mockDatabase([dueRow(SUB_A), dueRow(SUB_B)], {
        inserts: [{ error: null }, { error: { code: '23514', message: 'sanskara_candidate_not_discreet' } }],
      });
      const response = await GET(request());
      const out = JSON.stringify(await response.json());
      const logged = JSON.stringify([...(console.info as ReturnType<typeof vi.fn>).mock.calls, ...(console.warn as ReturnType<typeof vi.fn>).mock.calls]);
      for (const text of [out, logged]) {
        expect(text).not.toContain(SUB_A);
        expect(text).not.toContain(SUB_B);
        expect(text).not.toContain(ACCOUNT);
        expect(text).not.toContain('Open your timeline');
      }
    });
  });
});
