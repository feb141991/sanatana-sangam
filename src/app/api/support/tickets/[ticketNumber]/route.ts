import { NextRequest, NextResponse } from 'next/server';
import { rateLimitByIp, rejectLargeRequest, asBoundedString } from '@/lib/api-security';
import { getApiUser } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { accessCodeMatches, TICKET_NUMBER_PATTERN } from '@/lib/support/ticket-access';

export const dynamic = 'force-dynamic';

const NOT_FOUND = { error: 'We could not find a ticket with that reference and access code.' };
const ACCESS_CODE_HEADER = 'x-ticket-access-code';

/**
 * A ticket is opened by its signed-in owner or by the access code shown once when it was created. A wrong reference, a wrong code and a
 * missing ticket all answer the same 404, so neither can be told apart. An e-mail address is never a credential.
 */
async function authorise(
  req: NextRequest,
  ticketNumber: string,
  columns: string,
): Promise<{ ticket: any; authedUserId: string | null; authedName: string | null } | null> {
  if (!TICKET_NUMBER_PATTERN.test(ticketNumber)) return null;
  const admin = createAdminClient() as any;
  const { data: ticket, error } = await admin
    .from('support_tickets')
    .select(`${columns}, access_token_hash, user_id`)
    .eq('ticket_number', ticketNumber)
    .maybeSingle();
  if (error || !ticket) return null;

  const authResult = await getApiUser(req);
  const authedUser = authResult.user;
  const isOwner = Boolean(authedUser && ticket.user_id && authedUser.id === ticket.user_id);
  const codeOk = accessCodeMatches(req.headers.get(ACCESS_CODE_HEADER), ticket.access_token_hash);
  if (!isOwner && !codeOk) return null;
  return { ticket, authedUserId: authedUser?.id ?? null, authedName: authedUser?.user_metadata?.full_name ?? null };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketNumber: string }> },
) {
  const rateRejection = rateLimitByIp(req, { keyPrefix: 'support-ticket-view', limit: 20, windowMs: 60 * 1000 });
  if (rateRejection) return rateRejection;

  const ticketNumber = (await params).ticketNumber?.toUpperCase() ?? '';

  try {
    const access = await authorise(
      req,
      ticketNumber,
      'id, ticket_number, seeker_name, subject, description, category, priority, status, created_at, updated_at, resolved_at',
    );
    if (!access) return NextResponse.json(NOT_FOUND, { status: 404 });
    const { ticket } = access;

    const admin = createAdminClient() as any;
    const { data: messages, error: messagesError } = await admin
      .from('support_ticket_messages')
      .select('id, sender_type, sender_name, message, created_at')
      .eq('ticket_id', ticket.id)
      .eq('is_internal_note', false)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('[Support API] message read failed:', messagesError.code);
      return NextResponse.json({ error: 'We could not load this ticket right now.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        seekerName: ticket.seeker_name,
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        resolvedAt: ticket.resolved_at,
      },
      messages: messages || [],
    });
  } catch (err: unknown) {
    console.error('[Support API] ticket read failed:', err instanceof Error ? err.name : 'unknown');
    return NextResponse.json({ error: 'We could not load this ticket right now.' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ticketNumber: string }> },
) {
  const largeRejection = rejectLargeRequest(req, 10 * 1024);
  if (largeRejection) return largeRejection;

  const rateRejection = rateLimitByIp(req, { keyPrefix: 'support-reply', limit: 10, windowMs: 60 * 1000 });
  if (rateRejection) return rateRejection;

  const ticketNumber = (await params).ticketNumber?.toUpperCase() ?? '';

  try {
    const access = await authorise(req, ticketNumber, 'id, seeker_name, status');
    if (!access) return NextResponse.json(NOT_FOUND, { status: 404 });
    const { ticket, authedUserId, authedName } = access;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }
    const message = asBoundedString(body.message, 2000)?.trim();
    if (!message || message.length < 2) {
      return NextResponse.json({ error: 'Message must be at least 2 characters' }, { status: 400 });
    }

    const admin = createAdminClient() as any;
    const { data: newMsg, error: msgError } = await admin
      .from('support_ticket_messages')
      .insert({
        ticket_id: ticket.id,
        sender_type: 'seeker',
        sender_id: authedUserId ?? 'guest',
        user_id: ticket.user_id ?? null,
        sender_name: authedName || ticket.seeker_name,
        message,
        is_internal_note: false,
      })
      .select('id, sender_type, sender_name, message, created_at')
      .single();

    if (msgError) {
      console.error('[Support API] reply failed:', msgError.code);
      return NextResponse.json({ error: 'We could not send your message right now.' }, { status: 500 });
    }

    // A reply re-opens a finished ticket.
    const nextStatus = ticket.status === 'resolved' || ticket.status === 'closed' ? 'open' : ticket.status;
    await admin
      .from('support_tickets')
      .update({ status: nextStatus, resolved_at: nextStatus === 'open' ? null : undefined, updated_at: new Date().toISOString() })
      .eq('id', ticket.id);

    return NextResponse.json({ success: true, message: newMsg, ticketStatus: nextStatus });
  } catch (err: unknown) {
    console.error('[Support API] reply failed:', err instanceof Error ? err.name : 'unknown');
    return NextResponse.json({ error: 'We could not send your message right now.' }, { status: 500 });
  }
}
