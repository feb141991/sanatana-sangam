import { NextRequest, NextResponse } from 'next/server';
import { rateLimitByIp, rejectLargeRequest, asBoundedString } from '@/lib/api-security';
import { getApiUser } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { boundClientMetadata, generateAccessCode, hashAccessCode } from '@/lib/support/ticket-access';
import {
  synthesizeSupportTicket,
  type TicketCategory,
  type ClientMetadata,
} from '@/lib/support/support-rag';

export const dynamic = 'force-dynamic';

const TICKET_CREATE_LIMIT = {
  keyPrefix: 'support-ticket-create',
  limit: 10,
  windowMs: 60 * 60 * 1000, // 10 tickets per hour
};

export async function POST(req: NextRequest) {
  const largeRejection = rejectLargeRequest(req, 20 * 1024);
  if (largeRejection) return largeRejection;

  const rateRejection = rateLimitByIp(req, TICKET_CREATE_LIMIT);
  if (rateRejection) return rateRejection;

  try {
    const authResult = await getApiUser(req);
    const authedUser = authResult.user;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const query = asBoundedString(body.query || body.description, 2000)?.trim();
    if (!query || query.length < 5) {
      return NextResponse.json(
        { error: 'Description must be at least 5 characters' },
        { status: 400 }
      );
    }

    const seekerName = (
      asBoundedString(body.seekerName || body.name, 100) ||
      authedUser?.user_metadata?.full_name ||
      'Devotee Seeker'
    ).trim();

    const seekerEmail = (
      asBoundedString(body.seekerEmail || body.email, 120) ||
      authedUser?.email ||
      ''
    ).trim().toLowerCase();

    if (!seekerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(seekerEmail)) {
      return NextResponse.json(
        { error: 'A valid email address is required so we can notify you of responses' },
        { status: 400 }
      );
    }

    const category = body.category as TicketCategory | undefined;
    const ragResponse = asBoundedString(body.ragResponse, 2000);
    const ragFeedback = body.ragFeedback as 'helpful' | 'unresolved' | 'skipped' | undefined;
    const clientMetadata = boundClientMetadata(body.clientMetadata) as ClientMetadata;

    // Synthesize ticket metadata
    const draft = await synthesizeSupportTicket({
      query,
      seekerName,
      seekerEmail,
      ragResponse: ragResponse || undefined,
      category,
      clientMetadata,
      ragFeedback: ragFeedback || 'unresolved',
    });

    const admin = createAdminClient() as any;

    // The access code is shown once, here. Only its hash is stored.
    const accessCode = generateAccessCode();

    // 1. Insert ticket record
    const { data: ticket, error: ticketError } = await admin
      .from('support_tickets')
      .insert({
        ticket_number: draft.ticketNumber,
        access_token_hash: hashAccessCode(accessCode),
        user_id: authedUser?.id ?? null,
        seeker_name: seekerName,
        seeker_email: seekerEmail,
        category: draft.category,
        priority: draft.priority,
        status: 'open',
        subject: draft.subject,
        description: draft.description,
        rag_deflection_attempted: draft.ragDeflectionAttempted,
        rag_solution_offered: draft.ragSolutionOffered || null,
        rag_deflection_feedback: draft.ragDeflectionFeedback || 'unresolved',
        client_metadata: draft.clientMetadata,
      })
      .select()
      .single();

    if (ticketError) {
      console.error('[Support API] Failed to insert support ticket:', ticketError.code);
      return NextResponse.json(
        { error: 'We could not create your ticket right now. Please try again in a moment.' },
        { status: 500 }
      );
    }

    // 2. Insert initial seeker message into thread
    await admin.from('support_ticket_messages').insert({
      ticket_id: ticket.id,
      sender_type: 'seeker',
      sender_id: authedUser?.id ?? 'guest',
      user_id: authedUser?.id ?? null,
      sender_name: seekerName,
      message: draft.description,
      is_internal_note: false,
    });

    // 3. If RAG guidance was attempted, log it as an assistant diagnostic message
    if (draft.ragSolutionOffered) {
      await admin.from('support_ticket_messages').insert({
        ticket_id: ticket.id,
        sender_type: 'system_agent',
        sender_id: 'rag_deflection_agent',
        user_id: authedUser?.id ?? null,
        sender_name: 'Shoonaya Assistant (RAG)',
        message: draft.ragSolutionOffered,
        is_internal_note: false,
      });
    }

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      accessCode,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      seekerEmail: ticket.seeker_email,
      createdAt: ticket.created_at,
    });
  } catch (err: unknown) {
    console.error('[Support API] ticket creation failed:', err instanceof Error ? err.name : 'unknown');
    return NextResponse.json(
      { error: 'We could not create your ticket right now. Please try again in a moment.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const authResult = await getApiUser(req);
  if (!authResult.user) {
    return NextResponse.json({ error: 'Authentication required to list user tickets' }, { status: 401 });
  }

  try {
    const admin = createAdminClient() as any;
    const { data: tickets, error } = await admin
      .from('support_tickets')
      .select('id, ticket_number, subject, category, priority, status, created_at, updated_at, resolved_at')
      .eq('user_id', authResult.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Support API] ticket list failed:', error.code);
      return NextResponse.json({ error: 'We could not load your tickets right now.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tickets: tickets || [],
    });
  } catch (err: unknown) {
    console.error('[Support API] ticket list failed:', err instanceof Error ? err.name : 'unknown');
    return NextResponse.json({ error: 'We could not load your tickets right now.' }, { status: 500 });
  }
}
