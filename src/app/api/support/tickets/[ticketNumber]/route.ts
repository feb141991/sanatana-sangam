import { NextRequest, NextResponse } from 'next/server';
import { rateLimitByIp, rejectLargeRequest, asBoundedString } from '@/lib/api-security';
import { getApiUser } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const TICKET_VIEW_RATE_LIMIT = {
  keyPrefix: 'support-ticket-view',
  limit: 30,
  windowMs: 60 * 1000,
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketNumber: string }> }
) {
  const rateRejection = rateLimitByIp(req, TICKET_VIEW_RATE_LIMIT);
  if (rateRejection) return rateRejection;

  const { ticketNumber } = await params;
  if (!ticketNumber || !/^TKT-\d{6}-[A-Z0-9]{4}$/i.test(ticketNumber)) {
    return NextResponse.json({ error: 'Invalid ticket reference format' }, { status: 400 });
  }

  try {
    const admin = createAdminClient() as any;
    const { data: ticket, error: ticketError } = await admin
      .from('support_tickets')
      .select('id, ticket_number, seeker_name, seeker_email, subject, description, category, priority, status, created_at, updated_at, resolved_at, user_id')
      .eq('ticket_number', ticketNumber.toUpperCase())
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Support ticket not found' }, { status: 404 });
    }

    // Auth verification:
    // If ticket belongs to an authenticated user, require that user to be signed in
    // or provide the matching seeker_email query parameter
    const authResult = await getApiUser(req);
    const authedUser = authResult.user;
    const emailParam = req.nextUrl.searchParams.get('email')?.toLowerCase();

    const isAuthorized =
      (authedUser && ticket.user_id && authedUser.id === ticket.user_id) ||
      (emailParam && ticket.seeker_email.toLowerCase() === emailParam) ||
      (!ticket.user_id && emailParam);

    if (!isAuthorized && ticket.user_id) {
      return NextResponse.json(
        { error: 'Authentication or verification email required to view this ticket' },
        { status: 403 }
      );
    }

    // Fetch public messages (exclude internal admin notes)
    const { data: messages, error: messagesError } = await admin
      .from('support_ticket_messages')
      .select('id, sender_type, sender_name, message, created_at')
      .eq('ticket_id', ticket.id)
      .eq('is_internal_note', false)
      .order('created_at', { ascending: true });

    if (messagesError) {
      return NextResponse.json({ error: messagesError.message }, { status: 500 });
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
    const message = err instanceof Error ? err.message : 'Unknown query error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ticketNumber: string }> }
) {
  const largeRejection = rejectLargeRequest(req, 10 * 1024);
  if (largeRejection) return largeRejection;

  const rateRejection = rateLimitByIp(req, { keyPrefix: 'support-reply', limit: 15, windowMs: 60 * 1000 });
  if (rateRejection) return rateRejection;

  const { ticketNumber } = await params;
  if (!ticketNumber || !/^TKT-\d{6}-[A-Z0-9]{4}$/i.test(ticketNumber)) {
    return NextResponse.json({ error: 'Invalid ticket reference format' }, { status: 400 });
  }

  try {
    const admin = createAdminClient() as any;
    const { data: ticket, error: ticketError } = await admin
      .from('support_tickets')
      .select('id, ticket_number, seeker_name, seeker_email, user_id, status')
      .eq('ticket_number', ticketNumber.toUpperCase())
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Support ticket not found' }, { status: 404 });
    }

    const authResult = await getApiUser(req);
    const authedUser = authResult.user;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const message = asBoundedString(body.message, 2000)?.trim();
    if (!message || message.length < 2) {
      return NextResponse.json({ error: 'Message must be at least 2 characters' }, { status: 400 });
    }

    const senderEmail = (asBoundedString(body.email, 120) || authedUser?.email || '').trim().toLowerCase();
    const isAuthorized =
      (authedUser && ticket.user_id && authedUser.id === ticket.user_id) ||
      (senderEmail && ticket.seeker_email.toLowerCase() === senderEmail);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized to reply to this ticket' }, { status: 403 });
    }

    const senderName = authedUser?.user_metadata?.full_name || ticket.seeker_name;

    // 1. Insert message
    const { data: newMsg, error: msgError } = await admin
      .from('support_ticket_messages')
      .insert({
        ticket_id: ticket.id,
        sender_type: 'seeker',
        sender_id: authedUser?.id ?? 'guest',
        sender_name: senderName,
        message,
        is_internal_note: false,
      })
      .select('id, sender_type, sender_name, message, created_at')
      .single();

    if (msgError) {
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    // 2. Re-open ticket if it was waiting or resolved
    const nextStatus = ticket.status === 'resolved' || ticket.status === 'closed' ? 'open' : ticket.status;
    await admin
      .from('support_tickets')
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticket.id);

    return NextResponse.json({
      success: true,
      message: newMsg,
      ticketStatus: nextStatus,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown reply error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
