import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST as deflectHandler } from '@/app/api/support/deflect/route';
import { POST as createTicketHandler, GET as listTicketsHandler } from '@/app/api/support/tickets/route';
import { GET as getTicketHandler, POST as replyTicketHandler } from '@/app/api/support/tickets/[ticketNumber]/route';

const mocks = vi.hoisted(() => ({
  authResult: { user: null as any, error: null, supabase: null as any },
  tables: {} as Record<string, any>,
  calls: [] as any[],
}));

vi.mock('@/lib/api-auth', () => ({
  getApiUser: vi.fn().mockImplementation(async () => mocks.authResult),
}));

vi.mock('@/lib/api-security', () => ({
  rateLimitByIp: vi.fn().mockReturnValue(null),
  rejectLargeRequest: vi.fn().mockReturnValue(null),
  asBoundedString: (str: any) => (typeof str === 'string' ? str : null),
}));

vi.mock('@/lib/supabase-admin', () => ({
  createAdminClient: () => ({
    from(table: string) {
      const entry = () => mocks.tables[table] ?? {};
      const chain: any = {
        select: () => chain,
        insert: (payload: any) => {
          mocks.calls.push({ table, op: 'insert', payload });
          return chain;
        },
        update: (payload: any) => {
          mocks.calls.push({ table, op: 'update', payload });
          return chain;
        },
        eq: () => chain,
        order: () => chain,
        single: () => Promise.resolve({ data: entry().single ?? null, error: entry().error ?? null }),
        then: (resolve: any) => resolve({ data: entry().rows ?? [], error: entry().error ?? null }),
      };
      return chain;
    },
  }),
}));

describe('Support System Public & Seeker APIs', () => {
  beforeEach(() => {
    mocks.authResult = { user: null, error: null, supabase: null };
    mocks.tables = {};
    mocks.calls = [];
  });

  describe('POST /api/support/deflect', () => {
    it('returns 400 if query is missing or too short', async () => {
      const req = new NextRequest('http://localhost:3000/api/support/deflect', {
        method: 'POST',
        body: JSON.stringify({ query: 'hi' }),
      });
      const res = await deflectHandler(req);
      expect(res.status).toBe(400);
    });

    it('returns grounded deflection response for valid questions', async () => {
      const req = new NextRequest('http://localhost:3000/api/support/deflect', {
        method: 'POST',
        body: JSON.stringify({ query: 'How does the Japa Mala counter track offline repetitions?' }),
      });
      const res = await deflectHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.suggestedCategory).toBe('sadhana_japa');
      expect(json.bulletPoints.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/support/tickets', () => {
    it('creates a support ticket and message record for guest devotee', async () => {
      const mockTicket = {
        id: 'ticket-uuid-1',
        ticket_number: 'TKT-202611-ABCD',
        seeker_name: 'Devotee Priya',
        seeker_email: 'priya@example.com',
        subject: 'Ekadashi notification discrepancy',
        description: 'Notifications did not fire at sunrise',
        category: 'calendar_panchang',
        priority: 'high',
        status: 'open',
        created_at: new Date().toISOString(),
      };
      mocks.tables['support_tickets'] = { single: mockTicket };
      mocks.tables['support_ticket_messages'] = { single: { id: 'msg-1' } };

      const req = new NextRequest('http://localhost:3000/api/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          query: 'Notifications did not fire at sunrise in New York',
          seekerName: 'Devotee Priya',
          seekerEmail: 'priya@example.com',
          category: 'calendar_panchang',
        }),
      });

      const res = await createTicketHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.ticketNumber).toBe('TKT-202611-ABCD');
      expect(mocks.calls.some((c) => c.table === 'support_tickets' && c.op === 'insert')).toBe(true);
      expect(mocks.calls.some((c) => c.table === 'support_ticket_messages' && c.op === 'insert')).toBe(true);
    });
  });

  describe('GET /api/support/tickets/[ticketNumber]', () => {
    it('returns 400 for invalid ticket number format', async () => {
      const req = new NextRequest('http://localhost:3000/api/support/tickets/invalid-num');
      const res = await getTicketHandler(req, { params: Promise.resolve({ ticketNumber: 'invalid-num' }) });
      expect(res.status).toBe(400);
    });

    it('returns ticket detail and messages when email matches guest ticket', async () => {
      const mockTicket = {
        id: 'ticket-uuid-1',
        ticket_number: 'TKT-202611-ABCD',
        seeker_name: 'Devotee Priya',
        seeker_email: 'priya@example.com',
        subject: 'Ekadashi notification discrepancy',
        description: 'Notifications did not fire at sunrise',
        category: 'calendar_panchang',
        priority: 'high',
        status: 'open',
        created_at: new Date().toISOString(),
      };
      mocks.tables['support_tickets'] = { single: mockTicket };
      mocks.tables['support_ticket_messages'] = {
        rows: [{ id: 'msg-1', sender_type: 'seeker', sender_name: 'Devotee Priya', message: 'Hello' }],
      };

      const req = new NextRequest('http://localhost:3000/api/support/tickets/TKT-202611-ABCD?email=priya@example.com');
      const res = await getTicketHandler(req, { params: Promise.resolve({ ticketNumber: 'TKT-202611-ABCD' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.ticket.ticketNumber).toBe('TKT-202611-ABCD');
      expect(json.messages.length).toBe(1);
    });
  });
});
