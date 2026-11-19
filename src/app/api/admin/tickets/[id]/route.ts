import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { asBoundedString } from '@/lib/api-security';
import type { TicketStatus, TicketPriority, TicketCategory } from '@/lib/support/support-rag';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES: TicketStatus[] = ['open', 'in_progress', 'waiting_on_seeker', 'resolved', 'closed'];
const ALLOWED_PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];
const ALLOWED_CATEGORIES: TicketCategory[] = [
  'calendar_panchang',
  'sadhana_japa',
  'account_auth',
  'app_bug',
  'spiritual_content',
  'billing_donation',
  'general',
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminCookieAuth(req);
  if (authError) return authError;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing ticket ID' }, { status: 400 });

  try {
    const admin = createAdminClient() as any;

    // 1. Fetch ticket
    const { data: ticket, error: ticketError } = await admin
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Support ticket not found' }, { status: 404 });
    }

    // 2. Fetch all messages (including internal notes)
    const { data: messages, error: messagesError } = await admin
      .from('support_ticket_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      return NextResponse.json({ error: messagesError.message }, { status: 500 });
    }

    // 3. Optional user profile preview if authenticated
    let userProfile = null;
    if (ticket.user_id) {
      const { data: profile } = await admin
        .from('profiles')
        .select('id, full_name, tradition, city, country, created_at, shloka_streak, mala_rounds_completed')
        .eq('id', ticket.user_id)
        .single();
      userProfile = profile;
    }

    return NextResponse.json({
      success: true,
      ticket,
      messages: messages || [],
      userProfile,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown query error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminCookieAuth(req);
  if (authError) return authError;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing ticket ID' }, { status: 400 });

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status) {
      if (!ALLOWED_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid ticket status' }, { status: 400 });
      }
      updates.status = body.status;
      if (body.status === 'resolved' || body.status === 'closed') {
        updates.resolved_at = new Date().toISOString();
      } else {
        updates.resolved_at = null;
      }
    }

    if (body.priority) {
      if (!ALLOWED_PRIORITIES.includes(body.priority)) {
        return NextResponse.json({ error: 'Invalid ticket priority' }, { status: 400 });
      }
      updates.priority = body.priority;
    }

    if (body.category) {
      if (!ALLOWED_CATEGORIES.includes(body.category)) {
        return NextResponse.json({ error: 'Invalid ticket category' }, { status: 400 });
      }
      updates.category = body.category;
    }

    if (body.assignedAdmin !== undefined) {
      updates.assigned_admin = asBoundedString(body.assignedAdmin, 100)?.trim() || null;
    }

    const admin = createAdminClient() as any;
    const { data: updatedTicket, error: updateError } = await admin
      .from('support_tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown update error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
