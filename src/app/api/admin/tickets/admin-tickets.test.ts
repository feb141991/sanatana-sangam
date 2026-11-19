import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET as listAdminTicketsHandler } from '@/app/api/admin/tickets/route';
import { GET as getAdminTicketHandler, PATCH as patchAdminTicketHandler } from '@/app/api/admin/tickets/[id]/route';
import { POST as postAdminMessageHandler } from '@/app/api/admin/tickets/[id]/messages/route';

const mocks = vi.hoisted(() => ({
  authRejection: null as NextResponse | null,
  sessionUsername: 'admin_test_user',
  tables: {} as Record<string, any>,
  calls: [] as any[],
}));

vi.mock('@/lib/admin-auth', () => ({
  ADMIN_COOKIE: 'sangam_admin_session',
  verifyAdminCookieAuth: vi.fn().mockImplementation(async () => mocks.authRejection),
  verifyAdminToken: vi.fn().mockImplementation(async () => ({ username: mocks.sessionUsername })),
}));

vi.mock('@/lib/supabase-admin', () => ({
  createAdminClient: () => ({
    from(table: string) {
      const entry = () => mocks.tables[table] ?? {};
      const chain: any = {
        select: (_fields?: string, _opts?: any) => chain,
        insert: (payload: any) => {
          mocks.calls.push({ table, op: 'insert', payload });
          return chain;
        },
        update: (payload: any) => {
          mocks.calls.push({ table, op: 'update', payload });
          return chain;
        },
        eq: () => chain,
        in: () => chain,
        or: () => chain,
        order: () => chain,
        range: () => chain,
        single: () => Promise.resolve({ data: entry().single ?? null, error: entry().error ?? null }),
        then: (resolve: any) =>
          resolve({
            data: entry().rows ?? [],
            count: entry().count ?? (entry().rows?.length || 0),
            error: entry().error ?? null,
          }),
      };
      return chain;
    },
  }),
}));

describe('Admin Support Tickets Operations API', () => {
  beforeEach(() => {
    mocks.authRejection = null;
    mocks.tables = {};
    mocks.calls = [];
  });

  it('rejects unauthorized requests without valid admin session', async () => {
    mocks.authRejection = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const req = new NextRequest('http://localhost:3000/api/admin/tickets');
    const res = await listAdminTicketsHandler(req);
    expect(res.status).toBe(401);
  });

  it('lists tickets and operational queue statistics for authenticated admin', async () => {
    mocks.tables['support_tickets'] = {
      rows: [
        { id: 't1', ticket_number: 'TKT-202611-0001', subject: 'Panchang query', status: 'open', priority: 'high' },
      ],
      count: 1,
    };

    const req = new NextRequest('http://localhost:3000/api/admin/tickets?status=open');
    const res = await listAdminTicketsHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.tickets.length).toBe(1);
    expect(json.stats.total).toBe(1);
  });

  it('updates ticket status and assigns admin via PATCH', async () => {
    const mockTicket = { id: 't1', status: 'in_progress', assigned_admin: 'acharya_mod' };
    mocks.tables['support_tickets'] = { single: mockTicket };

    const req = new NextRequest('http://localhost:3000/api/admin/tickets/t1', {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'in_progress',
        assignedAdmin: 'acharya_mod',
      }),
    });

    const res = await patchAdminTicketHandler(req, { params: Promise.resolve({ id: 't1' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mocks.calls.some((c) => c.table === 'support_tickets' && c.op === 'update')).toBe(true);
  });

  it('posts admin message to devotee and marks ticket in_progress', async () => {
    mocks.tables['support_tickets'] = {
      single: { id: 't1', status: 'open' },
    };
    mocks.tables['support_ticket_messages'] = {
      single: { id: 'msg-adm-1', message: 'We have updated your city timezone' },
    };

    const req = new NextRequest('http://localhost:3000/api/admin/tickets/t1/messages', {
      method: 'POST',
      body: JSON.stringify({
        message: 'We have updated your city timezone settings in the ephemeris service.',
        isInternalNote: false,
        updateStatus: 'waiting_on_seeker',
      }),
    });

    const res = await postAdminMessageHandler(req, { params: Promise.resolve({ id: 't1' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mocks.calls.some((c) => c.table === 'support_ticket_messages' && c.op === 'insert')).toBe(true);
  });
});
