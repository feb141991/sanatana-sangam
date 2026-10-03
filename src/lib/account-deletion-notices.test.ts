import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

vi.mock('@/lib/admin', () => ({ createServiceRoleSupabaseClient: () => { throw new Error('not used'); } }));
vi.mock('@/lib/apple-auth-service', () => ({ revokeAppleAuthorizationForUser: vi.fn() }));
vi.mock('@/lib/email', () => ({ sendShoonayaEmail: vi.fn() }));

import { buildDeletionNotice, dueDeletionReminder, sendDeletionNotice, sendDueDeletionReminders } from './account-deletion-notices';

const DAY = 24 * 60 * 60 * 1000;
const REQUESTED = '2026-10-01T10:00:00.000Z';
const PURGE = Date.parse(REQUESTED) + 30 * DAY;

type Profile = { id: string; is_deleting: boolean; deletion_requested_at: string | null };
type Notice = { user_id: string; deletion_requested_at: string; kind: string };

function fakeAdmin(state: { profiles: Profile[]; notices: Notice[]; emails: Record<string, string | null> }) {
  return {
    auth: { admin: { getUserById: async (id: string) => ({ data: { user: { email: state.emails[id] ?? null } }, error: null }) } },
    from(table: string) {
      const filters: Array<(row: Record<string, unknown>) => boolean> = [];
      let pendingUpsert: Notice | null = null;
      let deleting = false;
      const rows = () => (table === 'profiles' ? state.profiles : state.notices) as unknown as Array<Record<string, unknown>>;
      const matching = () => rows().filter((r) => filters.every((f) => f(r)));
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: (c: string, v: unknown) => { filters.push((r) => r[c] === v); return builder; },
        gt: (c: string, v: string) => { filters.push((r) => typeof r[c] === 'string' && (r[c] as string) > v); return builder; },
        lte: (c: string, v: string) => { filters.push((r) => typeof r[c] === 'string' && (r[c] as string) <= v); return builder; },
        maybeSingle: async () => ({ data: matching()[0] ?? null, error: null }),
        upsert: (row: Notice) => { pendingUpsert = row; return builder; },
        delete: () => { deleting = true; return builder; },
        then: (resolve: (v: unknown) => unknown) => {
          if (pendingUpsert) {
            const row = pendingUpsert;
            const exists = state.notices.some((n) => n.user_id === row.user_id && n.deletion_requested_at === row.deletion_requested_at && n.kind === row.kind);
            if (!exists) state.notices.push(row);
            return Promise.resolve({ data: exists ? [] : [{ user_id: row.user_id }], error: null }).then(resolve);
          }
          if (deleting) {
            const keep = state.notices.filter((n) => !filters.every((f) => f(n as unknown as Record<string, unknown>)));
            state.notices.splice(0, state.notices.length, ...keep);
            return Promise.resolve({ data: null, error: null }).then(resolve);
          }
          return Promise.resolve({ data: matching(), error: null }).then(resolve);
        },
      };
      return builder;
    },
  } as unknown as SupabaseClient;
}

let state: { profiles: Profile[]; notices: Notice[]; emails: Record<string, string | null> };
const okSend = vi.fn(async () => ({ success: true }));

beforeEach(() => {
  state = {
    profiles: [{ id: 'u1', is_deleting: true, deletion_requested_at: REQUESTED }],
    notices: [],
    emails: { u1: 'seeker@example.com' },
  };
  okSend.mockClear();
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

describe('sendDeletionNotice', () => {
  it('sends once per request and kind; a repeat is already_sent with no second email', async () => {
    const admin = fakeAdmin(state);
    expect(await sendDeletionNotice(admin, { userId: 'u1', deletionRequestedAt: REQUESTED, kind: 'scheduled' }, okSend)).toBe('sent');
    expect(await sendDeletionNotice(admin, { userId: 'u1', deletionRequestedAt: REQUESTED, kind: 'scheduled' }, okSend)).toBe('already_sent');
    expect(okSend).toHaveBeenCalledTimes(1);
    expect(state.notices).toEqual([{ user_id: 'u1', deletion_requested_at: REQUESTED, kind: 'scheduled' }]);
  });

  it('releases the claim when the provider fails (or no key), so the next run retries', async () => {
    const admin = fakeAdmin(state);
    for (const failing of [vi.fn(async () => ({ success: false })), vi.fn(async () => undefined)]) {
      expect(await sendDeletionNotice(admin, { userId: 'u1', deletionRequestedAt: REQUESTED, kind: 'reminder_7d' }, failing)).toBe('failed');
      expect(state.notices).toHaveLength(0);
    }
    expect(await sendDeletionNotice(admin, { userId: 'u1', deletionRequestedAt: REQUESTED, kind: 'reminder_7d' }, okSend)).toBe('sent');
    expect(state.notices).toHaveLength(1);
  });

  it('sends nothing for a cancelled request or a superseded request time', async () => {
    const admin = fakeAdmin(state);
    expect(await sendDeletionNotice(admin, { userId: 'u1', deletionRequestedAt: '2026-09-01T00:00:00.000Z', kind: 'scheduled' }, okSend)).toBe('not_pending');
    state.profiles[0] = { ...state.profiles[0], is_deleting: false, deletion_requested_at: null };
    expect(await sendDeletionNotice(admin, { userId: 'u1', deletionRequestedAt: REQUESTED, kind: 'scheduled' }, okSend)).toBe('not_pending');
    expect(okSend).toHaveBeenCalledTimes(0);
    expect(state.notices).toHaveLength(0);
  });

  it('reports no_email without claiming when the account has no email', async () => {
    state.emails.u1 = null;
    expect(await sendDeletionNotice(fakeAdmin(state), { userId: 'u1', deletionRequestedAt: REQUESTED, kind: 'scheduled' }, okSend)).toBe('no_email');
    expect(state.notices).toHaveLength(0);
  });
});

describe('sendDueDeletionReminders across the whole cool-off', () => {
  it('daily runs send exactly one 7-day and one 1-day reminder, to the right address', async () => {
    const admin = fakeAdmin(state);
    const firstRun = Date.parse('2026-10-02T09:15:00.000Z');
    for (let day = 0; day < 30; day += 1) await sendDueDeletionReminders(admin, firstRun + day * DAY, okSend);
    expect(state.notices.map((n) => n.kind).sort()).toEqual(['reminder_1d', 'reminder_7d']);
    expect(okSend).toHaveBeenCalledTimes(2);
    for (const call of okSend.mock.calls as unknown as Array<[{ to: string; shloka: string }]>) {
      expect(call[0].to).toBe('seeker@example.com');
      expect(call[0].shloka).toBe('');
    }
  });

  it('sends nothing to an account that cancelled during the cool-off', async () => {
    state.profiles[0].is_deleting = false;
    const admin = fakeAdmin(state);
    for (let day = 0; day < 30; day += 1) await sendDueDeletionReminders(admin, Date.parse(REQUESTED) + day * DAY, okSend);
    expect(okSend).toHaveBeenCalledTimes(0);
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
