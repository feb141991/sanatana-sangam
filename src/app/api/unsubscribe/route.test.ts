import { beforeEach, describe, expect, it, vi } from 'vitest';

const { updateMock } = vi.hoisted(() => ({ updateMock: vi.fn() }));
let profileFound = true;

vi.mock('@/lib/admin', () => ({
  createServiceRoleSupabaseClient: () => ({
    from: () => {
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: () => builder,
        update: (value: unknown) => { updateMock(value); return builder; },
        maybeSingle: async () => ({ data: profileFound ? { id: 'u1' } : null, error: null }),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: profileFound ? [{ id: 'u1' }] : [], error: null }).then(resolve),
      };
      return builder;
    },
  }),
}));

const { GET, POST } = await import('./route');

beforeEach(() => {
  updateMock.mockReset();
  profileFound = true;
});

describe('/api/unsubscribe', () => {
  it('does not mutate preferences on GET because email scanners prefetch links', async () => {
    const response = await GET(new Request('https://www.shoonaya.com/api/unsubscribe?token=opaque&type=festivals'));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('Confirm unsubscribe');
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('uses an explicit one-click POST to disable only the requested category', async () => {
    const response = await POST(new Request('https://www.shoonaya.com/api/unsubscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'token=opaque&type=festivals',
    }));

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({ email_festivals: false });
  });

  it('rejects unsupported categories without changing preferences', async () => {
    const response = await POST(new Request('https://www.shoonaya.com/api/unsubscribe?token=opaque&type=account'));
    expect(response.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });
});
