import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  resolve: vi.fn(), auth: vi.fn(), admin: vi.fn(), load: vi.fn(), render: vi.fn(),
}));
vi.mock('@/lib/calendar/request-profile', () => ({ resolveRequestProfile: mocks.resolve }));
vi.mock('@/lib/api-auth', () => ({ getApiUser: mocks.auth }));
vi.mock('@/lib/admin', () => ({ createServiceRoleSupabaseClient: mocks.admin }));
vi.mock('@/lib/calendar/subscription-feed', () => ({
  loadSubscriptionEvents: mocks.load, renderSubscriptionCalendar: mocks.render,
  subscriptionSettings: (value: unknown) => value,
}));
import { GET as feed } from '@/app/api/calendar/feed/[token]/route';
import { GET as manage, POST as create, DELETE as revoke } from '@/app/api/calendar/subscription/route';

const token = 'a'.repeat(64);
const settings = { calendarProfile: 'test', tradition: 'hindu', sampradaya: 'test', timezone: 'UTC', context: { effectiveCalculationLocation: { label: 'Test' } } };
const request = () => new NextRequest('https://www.shoonaya.com/api/calendar/subscription');
function client(result: { data: unknown; error: unknown }) {
  const eq = vi.fn().mockReturnValue({ maybeSingle: async () => result, then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve) });
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn().mockReturnValue({ select: () => ({ eq }), delete: () => ({ eq }), upsert });
  return { from, eq, upsert };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.load.mockResolvedValue({ from: '2026-01-01', to: '2026-06-30', events: [] });
  mocks.render.mockReturnValue('BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n');
});

describe('calendar subscription route boundaries', () => {
  it('rejects malformed public tokens before opening a privileged client', async () => {
    const response = await feed(request(), { params: Promise.resolve({ token: '../not-a-token' }) });
    expect(response.status).toBe(404);
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it('returns not found for a revoked/missing token without serving events', async () => {
    const db = client({ data: null, error: null }); mocks.admin.mockReturnValue(db);
    expect((await feed(request(), { params: Promise.resolve({ token }) })).status).toBe(404);
    expect(db.eq).toHaveBeenCalledWith('token', token);
    expect(mocks.load).not.toHaveBeenCalled();
  });
  it('returns an error rather than a successful empty calendar on database or loader failure', async () => {
    mocks.admin.mockReturnValue(client({ data: null, error: { message: 'unavailable' } }));
    expect((await feed(request(), { params: Promise.resolve({ token }) })).status).toBe(503);
    mocks.admin.mockReturnValue(client({ data: { settings }, error: null }));
    mocks.load.mockRejectedValueOnce(new Error('unavailable'));
    expect((await feed(request(), { params: Promise.resolve({ token }) })).status).toBe(503);
    expect(mocks.render).not.toHaveBeenCalled();
  });
  it('serves only the matched snapshot and disables caching/indexing', async () => {
    const db = client({ data: { settings }, error: null }); mocks.admin.mockReturnValue(db);
    const response = await feed(request(), { params: Promise.resolve({ token }) });
    expect(response.status).toBe(200);
    expect(mocks.load).toHaveBeenCalledWith(db, settings);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('x-robots-tag')).toContain('noindex');
    expect(await response.text()).not.toContain(token);
  });
  it('requires verified authentication for subscription management', async () => {
    mocks.resolve.mockResolvedValue({ isAuthenticated: false, invalidCredentials: true });
    expect((await manage(request())).status).toBe(401);
    expect((await create(request())).status).toBe(401);
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it('revokes only the authenticated owner and refuses anonymous writes', async () => {
    mocks.auth.mockResolvedValueOnce({ user: null });
    expect((await revoke(request())).status).toBe(401);
    const db = client({ data: null, error: null });
    mocks.auth.mockResolvedValueOnce({ user: { id: 'owner' }, supabase: db });
    expect((await revoke(request())).status).toBe(204);
    expect(db.eq).toHaveBeenCalledWith('user_id', 'owner');
  });
  it('creates from server identity and uses conflict-ignore to preserve an existing link on retries', async () => {
    const db = client({ data: { token, settings }, error: null }); mocks.admin.mockReturnValue(db);
    mocks.resolve.mockResolvedValue({ ...settings, userId: 'owner', isAuthenticated: true, invalidCredentials: false, supabase: db });
    const response = await create(new NextRequest('https://www.shoonaya.com/api/calendar/subscription', {
      method: 'POST', body: JSON.stringify({ userId: 'someone-else', settings: { calendarProfile: 'forged' } }),
    }));
    expect(response.status).toBe(200);
    const [insert, options] = db.upsert.mock.calls[0];
    expect(insert.user_id).toBe('owner');
    expect(insert.token).toMatch(/^[a-f0-9]{64}$/);
    expect(insert.settings.calendarProfile).toBe('test');
    expect(options).toEqual({ onConflict: 'user_id', ignoreDuplicates: true });
  });
});
