import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  tokenRows: [] as Array<{ user_id: string; token: string; binding_version?: string }>,
}));

vi.mock('@/lib/notification-safety', () => ({
  getNotificationSafetyState: () => ({ isDryRun: false, skipDelivery: false, isDisabled: false, disabledReason: null }),
}));
vi.mock('@/lib/notification-delivery-audit', () => ({ recordNotificationDeliveryBatch: vi.fn(async () => undefined) }));
vi.mock('@/lib/push-token-audit', () => ({
  recordPushTokenEventBatch: vi.fn(async () => undefined),
  hashPushToken: (token: string) => `hash:${token}`,
}));
vi.mock('@/lib/push-binding', () => ({ prunePushBindings: vi.fn(async () => undefined) }));
vi.mock('@/lib/admin', () => ({
  createServiceRoleSupabaseClient: () => ({
    from: (table: string) => {
      const builder = {
        select: () => builder, in: () => builder, eq: () => builder, delete: () => builder,
        insert: async () => ({ error: null }),
        then: (resolve: (value: unknown) => unknown) => {
          if (table === 'push_tokens') return Promise.resolve({ data: mocks.tokenRows, error: null }).then(resolve);
          return Promise.resolve({ data: [], error: null }).then(resolve);
        },
      };
      return builder;
    },
  }),
}));

import { sendPushNotification } from './push-server';

const expoOk = (_url: string, init: { body: string }) => ({
  ok: true,
  json: async () => ({ data: (JSON.parse(init.body) as unknown[]).map((_, i) => ({ status: 'ok', id: `ticket-${i}` })) }),
  text: async () => '',
});

describe('the push payload names the notification, so a tap can be matched to its send', () => {
  const fetchMock = vi.fn();
  const payloadFor = (to: string) => {
    const messages = JSON.parse(fetchMock.mock.calls[0][1].body as string) as Array<{ to: string; data: Record<string, unknown> }>;
    return messages.find((message) => message.to === to)!.data;
  };

  beforeEach(() => {
    mocks.tokenRows = [
      { user_id: 'u1', token: 'ExponentPushToken[u1]', binding_version: 'v1' },
      { user_id: 'u2', token: 'ExponentPushToken[u2]', binding_version: 'v1' },
    ];
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string, init: { body: string }) => expoOk(url, init));
    vi.stubGlobal('fetch', fetchMock);
  });

  it('carries each recipient\'s own key when keys differ per user', async () => {
    await sendPushNotification(
      { userIds: ['u1', 'u2'], title: 't', body: 'b', url: '/quiz' },
      { type: 'quiz', notificationKeysByUserId: { u1: 'quiz:u1:2026-11-12', u2: 'quiz:u2:2026-11-12' } },
    );
    expect(payloadFor('ExponentPushToken[u1]').notificationKey).toBe('quiz:u1:2026-11-12');
    expect(payloadFor('ExponentPushToken[u2]').notificationKey).toBe('quiz:u2:2026-11-12');
  });

  it('carries the shared key when one key covers the send', async () => {
    await sendPushNotification({ userIds: ['u1'], title: 't', body: 'b' }, { type: 'festival', notificationKey: 'festival:diwali:D0' });
    expect(payloadFor('ExponentPushToken[u1]').notificationKey).toBe('festival:diwali:D0');
  });

  it('prefers the per-user key over the shared one, exactly as the delivery audit does', async () => {
    await sendPushNotification(
      { userIds: ['u1'], title: 't', body: 'b' },
      { type: 'quiz', notificationKey: 'shared', notificationKeysByUserId: { u1: 'per-user' } },
    );
    expect(payloadFor('ExponentPushToken[u1]').notificationKey).toBe('per-user');
  });

  it('cannot be overridden by a caller-supplied data.notificationKey', async () => {
    await sendPushNotification(
      { userIds: ['u1'], title: 't', body: 'b', data: { notificationKey: 'spoofed', type: 'quiz' } },
      { type: 'quiz', notificationKey: 'real' },
    );
    const data = payloadFor('ExponentPushToken[u1]');
    expect(data.notificationKey).toBe('real');
    expect(data.type).toBe('quiz');
  });

  it('adds no key when the send has none, and leaves url and the caller\'s data alone', async () => {
    await sendPushNotification({ userIds: ['u1'], title: 't', body: 'b', url: '/home', data: { type: 'streak' } }, { type: 'streak' });
    const data = payloadFor('ExponentPushToken[u1]');
    expect(data).toEqual({ type: 'streak', url: '/home' });
    expect('notificationKey' in data).toBe(false);
  });
});
