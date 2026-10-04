import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { EnqueueEmailInput } from './email-outbox';

vi.mock('@/lib/admin', () => ({ createServiceRoleSupabaseClient: () => { throw new Error('not used'); } }));

import { buildDeletionNotice, dueDeletionReminder } from './account-deletion-email';
import { enqueueDeletionCompletedNotice, enqueueDeletionNotice, enqueueDueDeletionReminders } from './account-deletion-notices';

const DAY = 24 * 60 * 60 * 1000;
const REQUESTED = '2026-10-01T10:00:00.000Z';
const PURGE = Date.parse(REQUESTED) + 30 * DAY;

type Profile = { id: string; is_deleting: boolean; deletion_requested_at: string | null };

function fakeAdmin(state: { profiles: Profile[]; emails: Record<string, string | null> }) {
  return {
    auth: { admin: { getUserById: async (id: string) => ({ data: { user: { email: state.emails[id] ?? null } }, error: null }) } },
    from() {
      const filters: Array<(row: Record<string, unknown>) => boolean> = [];
      const matching = () => state.profiles.filter((row) => filters.every((filter) => filter(row as unknown as Record<string, unknown>)));
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: (column: string, value: unknown) => { filters.push((row) => row[column] === value); return builder; },
        gt: (column: string, value: string) => { filters.push((row) => typeof row[column] === 'string' && (row[column] as string) > value); return builder; },
        lte: (column: string, value: string) => { filters.push((row) => typeof row[column] === 'string' && (row[column] as string) <= value); return builder; },
        maybeSingle: async () => ({ data: matching()[0] ?? null, error: null }),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: matching(), error: null }).then(resolve),
      };
      return builder;
    },
  } as unknown as SupabaseClient;
}

let state: { profiles: Profile[]; emails: Record<string, string | null> };
let queuedKeys: Set<string>;
const enqueue = vi.fn(async (input: EnqueueEmailInput) => {
  if (queuedKeys.has(input.idempotencyKey)) return 'already_queued' as const;
  queuedKeys.add(input.idempotencyKey);
  return 'queued' as const;
});

beforeEach(() => {
  state = {
    profiles: [{ id: 'u1', is_deleting: true, deletion_requested_at: REQUESTED }],
    emails: { u1: 'seeker@example.com' },
  };
  queuedKeys = new Set();
  enqueue.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('dueDeletionReminder', () => {
  it('is 7d from 7 days out down to just over 1 day, 1d inside the last day, nothing otherwise', () => {
    const purge = new Date(PURGE).toISOString();
    expect(dueDeletionReminder(purge, PURGE - 8 * DAY)).toBeNull();
    expect(dueDeletionReminder(purge, PURGE - 7 * DAY)).toBe('reminder_7d');
    expect(dueDeletionReminder(purge, PURGE - 1.5 * DAY)).toBe('reminder_7d');
    expect(dueDeletionReminder(purge, PURGE - 1 * DAY)).toBe('reminder_1d');
    expect(dueDeletionReminder(purge, PURGE - 1)).toBe('reminder_1d');
    expect(dueDeletionReminder(purge, PURGE)).toBeNull();
  });
});

describe('enqueueDeletionNotice', () => {
  it('queues a deterministic transactional message without calling the provider', async () => {
    const admin = fakeAdmin(state);
    expect(await enqueueDeletionNotice(admin, { userId: 'u1', deletionRequestedAt: REQUESTED, kind: 'scheduled' }, enqueue)).toBe('queued');
    expect(await enqueueDeletionNotice(admin, { userId: 'u1', deletionRequestedAt: REQUESTED, kind: 'scheduled' }, enqueue)).toBe('already_queued');
    expect(enqueue).toHaveBeenCalledTimes(2);
    expect(enqueue).toHaveBeenNthCalledWith(1, expect.objectContaining({
      idempotencyKey: `account-deletion:u1:${REQUESTED}:scheduled`,
      to: 'seeker@example.com',
      recipientUserId: 'u1',
      templateKey: 'account_deletion',
      emailClass: 'transactional',
      context: { deletionRequestedAt: REQUESTED },
      content: expect.objectContaining({ subject: 'Your Shoonaya account is scheduled for deletion', shloka: '', meaning: '' }),
    }));
  });

  it('queues nothing for a cancelled or superseded request', async () => {
    const admin = fakeAdmin(state);
    expect(await enqueueDeletionNotice(admin, { userId: 'u1', deletionRequestedAt: '2026-09-01T00:00:00.000Z', kind: 'scheduled' }, enqueue)).toBe('not_pending');
    state.profiles[0] = { ...state.profiles[0], is_deleting: false, deletion_requested_at: null };
    expect(await enqueueDeletionNotice(admin, { userId: 'u1', deletionRequestedAt: REQUESTED, kind: 'scheduled' }, enqueue)).toBe('not_pending');
    expect(enqueue).not.toHaveBeenCalled();
  });

  it('reports a missing auth email without queueing', async () => {
    state.emails.u1 = null;
    expect(await enqueueDeletionNotice(fakeAdmin(state), { userId: 'u1', deletionRequestedAt: REQUESTED, kind: 'reminder_7d' }, enqueue)).toBe('no_email');
    expect(enqueue).not.toHaveBeenCalled();
  });
});

describe('enqueueDeletionCompletedNotice', () => {
  it('queues a privacy-preserving receipt after deletion without retaining the user id', async () => {
    vi.stubEnv('EMAIL_SUPPRESSION_HMAC_KEY', 'test-only-email-key');

    expect(await enqueueDeletionCompletedNotice('u1', 'seeker@example.com', enqueue)).toBe('queued');
    expect(enqueue).toHaveBeenCalledTimes(1);

    const [input] = enqueue.mock.calls[0];
    expect(input).toMatchObject({
      to: 'seeker@example.com',
      recipientUserId: null,
      templateKey: 'account_deletion',
      emailClass: 'transactional',
      content: expect.objectContaining({
        subject: 'Your Shoonaya account has been deleted',
        title: 'Account deletion complete',
        body: expect.stringContaining('have been deleted'),
        shloka: '',
        meaning: '',
      }),
    });
    expect(input.idempotencyKey).toMatch(/^account-deletion-completed:[a-f0-9]{64}$/);
    expect(input.idempotencyKey).not.toContain('u1');
    expect(await enqueueDeletionCompletedNotice('u1', 'seeker@example.com', enqueue)).toBe('already_queued');
    expect(enqueue).toHaveBeenCalledTimes(2);
  });

  it('fails closed when the stable privacy key is not configured', async () => {
    vi.stubEnv('EMAIL_SUPPRESSION_HMAC_KEY', '');
    expect(await enqueueDeletionCompletedNotice('u1', 'seeker@example.com', enqueue)).toBe('failed');
    expect(enqueue).not.toHaveBeenCalled();
  });
});

describe('enqueueDueDeletionReminders across the whole cool-off', () => {
  it('queues only one 7-day and one 1-day reminder despite daily cron retries', async () => {
    const admin = fakeAdmin(state);
    const firstRun = Date.parse('2026-10-02T09:15:00.000Z');
    for (let day = 0; day < 30; day += 1) await enqueueDueDeletionReminders(admin, firstRun + day * DAY, enqueue);
    const keys = enqueue.mock.calls.map(([input]) => input.idempotencyKey);
    expect(keys.filter((key) => key.endsWith(':reminder_7d'))).toHaveLength(6);
    expect(keys.filter((key) => key.endsWith(':reminder_1d'))).toHaveLength(1);
    expect(queuedKeys.size).toBe(2);
    for (const [input] of enqueue.mock.calls as unknown as Array<[EnqueueEmailInput]>) {
      expect(input.to).toBe('seeker@example.com');
      expect(input.content).toMatchObject({ shloka: '', meaning: '' });
    }
  });

  it('does not enqueue reminders after the user cancels deletion', async () => {
    state.profiles[0].is_deleting = false;
    const result = await enqueueDueDeletionReminders(fakeAdmin(state), Date.parse(REQUESTED) + DAY, enqueue);
    expect(result.queued).toBe(0);
    expect(enqueue).not.toHaveBeenCalled();
  });
});

describe('buildDeletionNotice', () => {
  it('states the purge date and how to cancel, and carries no spiritual content', () => {
    const notice = buildDeletionNotice('reminder_1d', REQUESTED);
    expect(notice.subject).toBe('Your Shoonaya account will be deleted tomorrow');
    expect(notice.body).toContain('31 October 2026');
    expect(notice.body).toContain('Cancel deletion');
    expect(notice.ctaUrl.endsWith('/profile')).toBe(true);
  });
});
