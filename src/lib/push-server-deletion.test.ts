import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  deletingRows: [] as Array<{ id: string }>,
  deletionError: null as { message: string } | null,
  tokenRows: [] as Array<{ user_id: string; token: string; binding_version?: string }>,
  tokenLookupIds: null as string[] | null,
  audit: [] as Array<Record<string, unknown>>,
}));

vi.mock('@/lib/notification-safety', () => ({
  getNotificationSafetyState: () => ({ isDryRun: false, skipDelivery: false, isDisabled: false, disabledReason: null }),
}));
vi.mock('@/lib/notification-delivery-audit', () => ({
  recordNotificationDeliveryBatch: vi.fn(async (rows: Array<Record<string, unknown>>) => { mocks.audit.push(...rows); }),
}));
vi.mock('@/lib/push-token-audit', () => ({
  recordPushTokenEventBatch: vi.fn(async () => undefined),
  hashPushToken: (token: string) => `hash:${token}`,
}));
vi.mock('@/lib/push-binding', () => ({ prunePushBindings: vi.fn(async () => undefined) }));
vi.mock('@/lib/admin', () => ({
  createServiceRoleSupabaseClient: () => ({
    from: (table: string) => {
      const builder = {
        select: () => builder,
        in: (_c: string, ids: string[]) => { if (table === 'push_tokens') mocks.tokenLookupIds = ids; return builder; },
        eq: () => builder,
        insert: async () => ({ error: null }),
        delete: () => builder,
        then: (resolve: (value: unknown) => unknown) => {
          if (table === 'profiles') return Promise.resolve({ data: mocks.deletionError ? null : mocks.deletingRows, error: mocks.deletionError }).then(resolve);
          if (table === 'push_tokens') return Promise.resolve({ data: mocks.tokenRows, error: null }).then(resolve);
          return Promise.resolve({ data: null, error: null }).then(resolve);
        },
      };
      return builder;
    },
  }),
}));

import { sendPushNotification } from './push-server';

// One ticket per message, like Expo: a short ticket list would be read as failures for the rest.
const expoOk = (_url: string, init: { body: string }) => ({
  ok: true,
  json: async () => ({ data: (JSON.parse(init.body) as unknown[]).map((_, i) => ({ status: 'ok', id: `ticket-${i}` })) }),
  text: async () => '',
});

describe('sendPushNotification and accounts in their deletion cool-off', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    mocks.deletingRows = [];
    mocks.deletionError = null;
    mocks.tokenRows = [
      { user_id: 'active', token: 'ExponentPushToken[active]', binding_version: 'v1' },
      { user_id: 'deleting', token: 'ExponentPushToken[deleting]', binding_version: 'v1' },
    ];
    mocks.tokenLookupIds = null;
    mocks.audit = [];
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string, init: { body: string }) => expoOk(url, init));
    vi.stubGlobal('fetch', fetchMock);
  });

  const send = (userIds: string[]) => sendPushNotification({ userIds, title: 't', body: 'b' }, { type: 'festival' });

  it('never looks up tokens for, or pushes to, a deleting account, and reports it as a skip', async () => {
    mocks.deletingRows = [{ id: 'deleting' }];
    const result = await send(['active', 'deleting']);

    expect(mocks.tokenLookupIds).toEqual(['active']);
    const pushed = JSON.parse(fetchMock.mock.calls[0][1].body as string) as Array<{ to: string }>;
    expect(pushed.map((m) => m.to)).toEqual(['ExponentPushToken[active]']);
    expect(result.sentUserIds).toEqual(['active']);
    expect(result.skippedUserIds).toContain('deleting');
    expect(result.failedUserIds).toEqual([]);
    expect(result.attempted).toBe(2);
    expect(result.skipped).toBe(1);
  });

  it('records why the push was skipped', async () => {
    mocks.deletingRows = [{ id: 'deleting' }];
    await send(['active', 'deleting']);
    const skipped = mocks.audit.filter((row) => row.status === 'skipped' && row.userId === 'deleting');
    expect(skipped).toHaveLength(1);
    expect(skipped[0].metadata).toMatchObject({ reason: 'account_deletion_pending' });
  });

  it('sends nothing at all when every recipient is deleting', async () => {
    mocks.deletingRows = [{ id: 'active' }, { id: 'deleting' }];
    const result = await send(['active', 'deleting']);
    expect(mocks.tokenLookupIds).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.sent).toBe(0);
    expect(result.skippedUserIds.sort()).toEqual(['active', 'deleting']);
  });

  it('fails closed, as a retryable failure, if the deletion check itself errors', async () => {
    mocks.deletionError = { message: 'db down' };
    const result = await send(['active', 'deleting']);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.tokenLookupIds).toBeNull();
    expect(result.sent).toBe(0);
    expect(result.failedUserIds.sort()).toEqual(['active', 'deleting']);
    expect(mocks.audit.some((row) => row.errorCode === 'deletion_lookup_failed')).toBe(true);
  });

  it('is unchanged when nobody is deleting', async () => {
    const result = await send(['active', 'deleting']);
    expect(mocks.tokenLookupIds).toEqual(['active', 'deleting']);
    expect(result.sentUserIds.sort()).toEqual(['active', 'deleting']);
    expect(result.skippedUserIds).toEqual([]);
  });
});
