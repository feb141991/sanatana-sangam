import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock, writeMock } = vi.hoisted(() => ({ rpcMock: vi.fn(), writeMock: vi.fn() }));
let profileFound = true;
let lookupError: unknown = null;

vi.mock('@/lib/admin', () => ({
  createServiceRoleSupabaseClient: () => ({
    rpc: (...args: unknown[]) => rpcMock(...args),
    from: () => {
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: () => builder,
        // A direct write to profiles must never happen from this route any more; the test fails if one does.
        update: (value: unknown) => { writeMock(value); return builder; },
        insert: (value: unknown) => { writeMock(value); return builder; },
        maybeSingle: async () => ({ data: profileFound ? { id: 'u1' } : null, error: lookupError }),
      };
      return builder;
    },
  }),
}));

const { GET, POST } = await import('./route');

const post = (url: string, body?: string) => POST(new Request(url, {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  ...(body !== undefined ? { body } : {}),
}));

beforeEach(() => {
  rpcMock.mockReset().mockResolvedValue({ data: { changed: true, marketing: true, newsletter: false, festivals: false }, error: null });
  writeMock.mockReset();
  profileFound = true;
  lookupError = null;
});

describe('/api/unsubscribe', () => {
  it('does not change anything on GET because email scanners prefetch links', async () => {
    const response = await GET(new Request('https://www.shoonaya.com/api/unsubscribe?token=opaque&type=festivals'));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('Confirm unsubscribe');
    expect(rpcMock).not.toHaveBeenCalled();
    expect(writeMock).not.toHaveBeenCalled();
  });

  it('withdraws only the requested category, through the recorded database function, as an unsubscribe link', async () => {
    const response = await post('https://www.shoonaya.com/api/unsubscribe', 'token=opaque&type=festivals');

    expect(response.status).toBe(200);
    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith('set_email_consent', {
      p_user_id: 'u1', p_category: 'festivals', p_granted: false, p_source: 'unsubscribe_link',
      p_wording_version: null, p_region: null, p_region_source: null,
    });
    expect(writeMock).not.toHaveBeenCalled();
  });

  it.each([
    ['newsletter', 'newsletter'],
    ['all', 'all'],
  ])('maps type=%s to category %s', async (type, category) => {
    await post(`https://www.shoonaya.com/api/unsubscribe?token=opaque&type=${type}`);
    expect(rpcMock.mock.calls[0][1]).toMatchObject({ p_category: category, p_granted: false });
  });

  it('treats a missing type as "all optional emails"', async () => {
    await post('https://www.shoonaya.com/api/unsubscribe?token=opaque');
    expect(rpcMock.mock.calls[0][1]).toMatchObject({ p_category: 'all', p_granted: false });
  });

  it('records the mail client one-click request as one_click, and only withdraws', async () => {
    const response = await post('https://www.shoonaya.com/api/unsubscribe?token=opaque&type=newsletter', 'List-Unsubscribe=One-Click');
    expect(response.status).toBe(200);
    expect(rpcMock.mock.calls[0][1]).toMatchObject({ p_source: 'one_click', p_granted: false, p_category: 'newsletter' });
  });

  it('never grants: every call this route makes is a withdrawal', async () => {
    for (const type of ['all', 'newsletter', 'festivals']) {
      await post(`https://www.shoonaya.com/api/unsubscribe?token=opaque&type=${type}`, 'granted=true&p_granted=true');
    }
    expect(rpcMock.mock.calls.every(([, args]) => (args as { p_granted: boolean }).p_granted === false)).toBe(true);
  });

  it('rejects unsupported categories without changing anything', async () => {
    const response = await post('https://www.shoonaya.com/api/unsubscribe?token=opaque&type=account');
    expect(response.status).toBe(400);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('rejects a missing or oversized token without changing anything', async () => {
    expect((await post('https://www.shoonaya.com/api/unsubscribe?type=all')).status).toBe(400);
    expect((await post(`https://www.shoonaya.com/api/unsubscribe?token=${'x'.repeat(257)}`)).status).toBe(400);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('says the link is unavailable, and changes nothing, for an unknown token', async () => {
    profileFound = false;
    const response = await post('https://www.shoonaya.com/api/unsubscribe?token=opaque&type=all');
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('no longer valid');
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('answers a retryable 503, never a success page, when the change could not be recorded', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { code: '57014', message: 'canceling statement on relation profiles' } });
    const response = await post('https://www.shoonaya.com/api/unsubscribe?token=opaque&type=all');
    expect(response.status).toBe(503);
    const text = await response.text();
    expect(text).not.toContain('unsubscribed');
    expect(text).not.toMatch(/relation|profiles|statement/);
  });

  it('answers a 503 when the profile lookup fails', async () => {
    lookupError = { code: '57014' };
    expect((await post('https://www.shoonaya.com/api/unsubscribe?token=opaque&type=all')).status).toBe(503);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('confirms what was stopped, keeps account mail out of it, and points to the app (no link to the retired web settings)', async () => {
    const html = await (await post('https://www.shoonaya.com/api/unsubscribe?token=opaque&type=festivals')).text();
    expect(html).toContain('unsubscribed from festival emails');
    expect(html).toContain('sign-in alerts');
    expect(html).toContain('Settings, then Email');
    expect(html).not.toMatch(/href="[^"]*\/settings/);
  });
});
