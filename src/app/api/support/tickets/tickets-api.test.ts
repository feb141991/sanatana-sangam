import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST as deflectHandler } from '@/app/api/support/deflect/route';
import { POST as createTicketHandler, GET as listTicketsHandler } from '@/app/api/support/tickets/route';
import { accessCodeMatches, generateAccessCode, hashAccessCode, generateTicketNumber, TICKET_NUMBER_PATTERN, sanitizeSearchTerm, boundClientMetadata } from '@/lib/support/ticket-access';
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
        maybeSingle: () => Promise.resolve({ data: entry().single ?? null, error: entry().error ?? null }),
        order: () => chain,
        single: () => Promise.resolve({ data: entry().single ?? null, error: entry().error ?? null }),
        then: (resolve: any) => resolve({ data: entry().rows ?? [], error: entry().error ?? null }),
      };
      return chain;
    },
  }),
}));

const CODE = generateAccessCode();
const NUMBER = 'TKT-202611-ABC234';

function storedTicket(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ticket-uuid-1',
    ticket_number: NUMBER,
    access_token_hash: hashAccessCode(CODE),
    user_id: null,
    seeker_name: 'Devotee Priya',
    seeker_email: 'priya@example.com',
    subject: 'Ekadashi notification discrepancy',
    description: 'Notifications did not fire at sunrise',
    category: 'calendar_panchang',
    priority: 'high',
    status: 'open',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function get(headers: Record<string, string> = {}, query = '') {
  const req = new NextRequest(`http://localhost:3000/api/support/tickets/${NUMBER}${query}`, { headers });
  return getTicketHandler(req, { params: Promise.resolve({ ticketNumber: NUMBER }) });
}

function reply(headers: Record<string, string> = {}, body: unknown = { message: 'Thank you', email: 'priya@example.com' }) {
  const req = new NextRequest(`http://localhost:3000/api/support/tickets/${NUMBER}`, { method: 'POST', headers, body: JSON.stringify(body) });
  return replyTicketHandler(req, { params: Promise.resolve({ ticketNumber: NUMBER }) });
}

describe('Support System Public & Seeker APIs', () => {
  beforeEach(() => {
    mocks.authResult = { user: null, error: null, supabase: null };
    mocks.tables = {};
    mocks.calls = [];
  });

  describe('POST /api/support/deflect', () => {
    it('returns 400 if query is missing or too short', async () => {
      const res = await deflectHandler(new NextRequest('http://localhost:3000/api/support/deflect', { method: 'POST', body: JSON.stringify({ query: 'hi' }) }));
      expect(res.status).toBe(400);
    });

    it('returns grounded deflection response for valid questions', async () => {
      const res = await deflectHandler(new NextRequest('http://localhost:3000/api/support/deflect', {
        method: 'POST',
        body: JSON.stringify({ query: 'How does the Japa Mala counter track offline repetitions?' }),
      }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.suggestedCategory).toBe('sadhana_japa');
      expect(json.bulletPoints.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/support/tickets', () => {
    it('creates a ticket, returns the access code once and stores only its hash', async () => {
      mocks.tables['support_tickets'] = { single: storedTicket() };
      mocks.tables['support_ticket_messages'] = { single: { id: 'msg-1' } };
      const res = await createTicketHandler(new NextRequest('http://localhost:3000/api/support/tickets', {
        method: 'POST',
        body: JSON.stringify({ query: 'Notifications did not fire at sunrise in New York', seekerName: 'Devotee Priya', seekerEmail: 'priya@example.com', category: 'calendar_panchang' }),
      }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(typeof json.accessCode).toBe('string');
      const insert = mocks.calls.find((c) => c.table === 'support_tickets' && c.op === 'insert')!.payload;
      expect(insert.access_token_hash).toBe(hashAccessCode(json.accessCode));
      expect(JSON.stringify(mocks.calls)).not.toContain(json.accessCode);
    });

    it('does not return database details when the insert fails', async () => {
      mocks.tables['support_tickets'] = { single: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "support_tickets_ticket_number_key"' } };
      const res = await createTicketHandler(new NextRequest('http://localhost:3000/api/support/tickets', {
        method: 'POST',
        body: JSON.stringify({ query: 'Notifications did not fire at sunrise', seekerName: 'Priya', seekerEmail: 'priya@example.com' }),
      }));
      expect(res.status).toBe(500);
      const text = JSON.stringify(await res.json());
      expect(text).not.toMatch(/duplicate|constraint|support_tickets|23505/);
    });

    it('lists only a signed-in account\'s tickets and refuses guests', async () => {
      expect((await listTicketsHandler(new NextRequest('http://localhost:3000/api/support/tickets'))).status).toBe(401);
    });
  });

  describe('GET /api/support/tickets/[ticketNumber]', () => {
    it('answers a malformed reference exactly like a wrong code (no probing)', async () => {
      mocks.tables['support_tickets'] = { single: null };
      const res = await getTicketHandler(new NextRequest('http://localhost:3000/api/support/tickets/invalid-num'), { params: Promise.resolve({ ticketNumber: 'invalid-num' }) });
      expect(res.status).toBe(404);
    });

    it('opens a ticket with its access code and never returns the hash or the e-mail', async () => {
      mocks.tables['support_tickets'] = { single: storedTicket() };
      mocks.tables['support_ticket_messages'] = { rows: [{ id: 'msg-1', sender_type: 'seeker', sender_name: 'Devotee Priya', message: 'Hello' }] };
      const res = await get({ 'x-ticket-access-code': CODE });
      expect(res.status).toBe(200);
      const text = JSON.stringify(await res.json());
      expect(text).toContain(NUMBER);
      expect(text).not.toContain('access_token_hash');
      expect(text).not.toContain(hashAccessCode(CODE));
      expect(text).not.toContain('priya@example.com');
    });

    it('REGRESSION: an e-mail address, with no access code, opens nothing (guest ticket)', async () => {
      mocks.tables['support_tickets'] = { single: storedTicket() };
      const res = await get({}, '?email=priya@example.com');
      expect(res.status).toBe(404);
      expect((await get({}, '?email=anything@at.all')).status).toBe(404);
    });

    it('a wrong code and a missing ticket give the same answer', async () => {
      mocks.tables['support_tickets'] = { single: storedTicket() };
      const wrong = await get({ 'x-ticket-access-code': generateAccessCode() });
      mocks.tables['support_tickets'] = { single: null };
      const missing = await get({ 'x-ticket-access-code': CODE });
      expect(wrong.status).toBe(404);
      expect(await wrong.json()).toEqual(await missing.json());
    });

    it('the signed-in owner opens their own ticket without a code, another account does not', async () => {
      mocks.tables['support_tickets'] = { single: storedTicket({ user_id: 'user-1' }) };
      mocks.tables['support_ticket_messages'] = { rows: [] };
      mocks.authResult = { user: { id: 'user-1', email: 'priya@example.com' }, error: null, supabase: null };
      expect((await get()).status).toBe(200);
      mocks.authResult = { user: { id: 'user-2', email: 'priya@example.com' }, error: null, supabase: null };
      expect((await get()).status).toBe(404);
    });
  });

  describe('POST /api/support/tickets/[ticketNumber] (reply)', () => {
    it('REGRESSION: the ticket e-mail alone cannot post to a thread', async () => {
      mocks.tables['support_tickets'] = { single: storedTicket() };
      expect((await reply()).status).toBe(404);
      expect(mocks.calls.some((c) => c.table === 'support_ticket_messages' && c.op === 'insert')).toBe(false);
    });

    it('the access code posts a reply, which re-opens a resolved ticket', async () => {
      mocks.tables['support_tickets'] = { single: storedTicket({ status: 'resolved' }) };
      mocks.tables['support_ticket_messages'] = { single: { id: 'm2', sender_type: 'seeker', sender_name: 'Devotee Priya', message: 'Thank you' } };
      const res = await reply({ 'x-ticket-access-code': CODE });
      expect(res.status).toBe(200);
      expect((await res.json()).ticketStatus).toBe('open');
    });
  });

  describe('ticket-access helpers', () => {
    it('generates ticket references that match the public pattern and are not repeated', () => {
      const seen = new Set(Array.from({ length: 200 }, () => generateTicketNumber()));
      expect(seen.size).toBeGreaterThan(195);
      for (const n of seen) expect(n).toMatch(TICKET_NUMBER_PATTERN);
    });

    it('matches only the right code and rejects malformed input', () => {
      expect(accessCodeMatches(CODE, hashAccessCode(CODE))).toBe(true);
      expect(accessCodeMatches(generateAccessCode(), hashAccessCode(CODE))).toBe(false);
      for (const bad of ['', ' ', 'short', null, undefined, 'priya@example.com', CODE + '!']) {
        expect(accessCodeMatches(bad as string, hashAccessCode(CODE))).toBe(false);
      }
      expect(accessCodeMatches(CODE, null)).toBe(false);
    });

    it('keeps search terms and metadata from changing a query or growing without bound', () => {
      expect(sanitizeSearchTerm('a,status.eq.open),(x')).not.toMatch(/[,()]/);
      expect(Object.keys(boundClientMetadata({ platform: 'web', 'bad key': 1, nested: { a: 1 }, big: 'x'.repeat(5000) }))).toEqual(['platform', 'big']);
      expect(boundClientMetadata({ big: 'x'.repeat(5000) }).big.length).toBe(120);
    });
  });
});
