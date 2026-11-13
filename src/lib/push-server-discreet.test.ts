import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  tokenRows: [] as Array<{ user_id: string; token: string; binding_version?: string }>,
  preferences: {} as Record<string, boolean>,
  discreetError: null as { code?: string; message: string } | null,
  discreetQueries: 0,
  discreetQueriedIds: [] as string[],
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
      let discreetQuery = false;
      let queriedIds: string[] = [];
      const builder: Record<string, unknown> = {
        select: (columns: string) => { discreetQuery = columns === 'id, notification_discreet_mode'; return builder; },
        in: (_column: string, ids: string[]) => {
          queriedIds = ids;
          if (discreetQuery) { mocks.discreetQueries += 1; mocks.discreetQueriedIds.push(...ids); }
          return builder;
        },
        eq: () => builder,
        delete: () => builder,
        insert: async () => ({ error: null }),
        then: (resolve: (value: unknown) => unknown) => {
          if (table === 'push_tokens') return Promise.resolve({ data: mocks.tokenRows, error: null }).then(resolve);
          if (table === 'profiles' && discreetQuery) {
            return Promise.resolve(mocks.discreetError
              ? { data: null, error: mocks.discreetError }
              : { data: queriedIds.filter((id) => id in mocks.preferences).map((id) => ({ id, notification_discreet_mode: mocks.preferences[id] })), error: null }).then(resolve);
          }
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

describe('lock-screen discretion in the push sender', () => {
  const fetchMock = vi.fn();
  type Sent = { to: string; title: string; body: string; data: Record<string, unknown> };
  const sent = () => (JSON.parse(fetchMock.mock.calls[0][1].body as string) as Sent[]);
  const forToken = (token: string) => sent().find((m) => m.to === token)!;

  beforeEach(() => {
    mocks.tokenRows = [
      { user_id: 'asked', token: 'ExponentPushToken[asked]', binding_version: 'v1' },
      { user_id: 'normal', token: 'ExponentPushToken[normal]', binding_version: 'v1' },
    ];
    mocks.preferences = { asked: true, normal: false };
    mocks.discreetError = null;
    mocks.discreetQueries = 0;
    mocks.discreetQueriedIds = [];
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string, init: { body: string }) => expoOk(url, init));
    vi.stubGlobal('fetch', fetchMock);
  });

  const send = (type = 'festival', extra: Record<string, unknown> = {}) => sendPushNotification(
    { userIds: ['asked', 'normal'], title: 'Ekadashi tomorrow', body: 'Begin your vrat for Pitru Paksha', url: '/vrat', data: { type }, ...extra } as never,
    { type, notificationKey: `${type}:2026-11-12` },
  );

  it('shows an account that asked only the neutral line, and leaves everyone else\'s text alone', async () => {
    await send();
    expect(forToken('ExponentPushToken[asked]')).toMatchObject({ title: 'Shoonaya', body: 'You have a new notification.' });
    expect(forToken('ExponentPushToken[normal]')).toMatchObject({ title: 'Ekadashi tomorrow', body: 'Begin your vrat for Pitru Paksha' });
  });

  it('never lets the real text reach any field the lock screen can show', async () => {
    await send();
    const { title, body, ...rest } = forToken('ExponentPushToken[asked]') as Sent & Record<string, unknown>;
    // title and body are what is displayed; nothing else in the message carries the original wording either
    expect(`${title} ${body}`).not.toMatch(/Ekadashi|vrat|Pitru|Begin/i);
    expect(JSON.stringify({ ...rest, data: undefined })).not.toMatch(/Ekadashi|Pitru|Begin/i);
    expect('subtitle' in rest).toBe(false);
  });

  it('keeps the tap destination and the caller\'s own data, so tapping still opens the right screen', async () => {
    await send('festival', { data: { type: 'festival', emoji: 'x' } });
    const data = forToken('ExponentPushToken[asked]').data;
    // the destination is data, not displayed text: it must survive, or a tap would open the wrong screen
    expect(data.url).toBe('/vrat');
    expect(data.type).toBe('festival');
    expect(data.notificationKey).toBe('festival:2026-11-12');
    expect(data.emoji).toBe('x');
  });

  it('sends the neutral line to EVERYONE when the lookup fails: privacy fails closed', async () => {
    mocks.discreetError = { code: '57014', message: 'statement timeout' };
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await send();
    for (const token of ['ExponentPushToken[asked]', 'ExponentPushToken[normal]']) {
      expect(forToken(token)).toMatchObject({ title: 'Shoonaya', body: 'You have a new notification.' });
    }
  });

  it('keeps the generic message when the column is unreadable', async () => {
    mocks.discreetError = { code: '42703', message: 'column does not exist' };
    await send();
    expect(forToken('ExponentPushToken[asked]').title).toBe('Shoonaya');
  });

  it('redacts when a recipient profile is missing from the query', async () => {
    delete mocks.preferences.normal;
    await send();
    expect(forToken('ExponentPushToken[normal]').title).toBe('Shoonaya');
  });

  it('never replaces a security notice', async () => {
    await send('security');
    expect(forToken('ExponentPushToken[asked]').title).toBe('Ekadashi tomorrow');
  });

  it('applies to every ordinary type, including family and community messages', async () => {
    for (const type of ['family_remembrance', 'mandali_comment', 'japa']) {
      fetchMock.mockClear();
      await send(type);
      expect(forToken('ExponentPushToken[asked]').title, type).toBe('Shoonaya');
    }
  });

  it('uses a change in preference before submitting the next provider batch', async () => {
    mocks.preferences.asked = false;
    mocks.tokenRows = Array.from({ length: 101 }, (_, i) => ({
      user_id: 'asked', token: `ExponentPushToken[${i}]`, binding_version: 'v1',
    }));
    fetchMock.mockImplementationOnce(async (url: string, init: { body: string }) => {
      mocks.preferences.asked = true;
      return expoOk(url, init);
    });
    await sendPushNotification({ userIds: ['asked'], title: 'Private title', body: 'Private body' }, { type: 'festival' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)[0].title).toBe('Private title');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)[0]).toMatchObject({ title: 'Shoonaya', body: 'You have a new notification.' });
  });

  it('looks up exactly the recipients that will be pushed to: one query, and nobody without a token', async () => {
    await sendPushNotification(
      { userIds: ['asked', 'normal', 'no-token'], title: 't', body: 'b', url: '/home' } as never,
      { type: 'festival', notificationKey: 'festival:k' },
    );
    expect(mocks.discreetQueries).toBe(1);
    expect(mocks.discreetQueriedIds.sort()).toEqual(['asked', 'normal']);
  });
});
