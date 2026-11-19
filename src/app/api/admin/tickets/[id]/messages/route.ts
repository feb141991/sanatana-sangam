import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCookieAuth, ADMIN_COOKIE, verifyAdminToken } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { asBoundedString } from '@/lib/api-security';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminCookieAuth(req);
  if (authError) return authError;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing ticket ID' }, { status: 400 });

  // Get admin username from session cookie
  const token = req.cookies.get(ADMIN_COOKIE)?.value ?? '';
  const session = await verifyAdminToken(token);
  const adminUsername = session?.username || 'Shoonaya Admin';

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const message = asBoundedString(body.message, 3000)?.trim();
    if (!message || message.length < 2) {
      return NextResponse.json({ error: 'Message must be at least 2 characters' }, { status: 400 });
    }

    const isInternalNote = Boolean(body.isInternalNote);
    const updateStatus = body.updateStatus as string | undefined;

    const admin = createAdminClient() as any;

    // Verify ticket exists
    const { data: ticket, error: ticketCheck } = await admin
      .from('support_tickets')
      .select('id, status, user_id')
      .eq('id', id)
      .single();

    if (ticketCheck || !ticket) {
      return NextResponse.json({ error: 'Support ticket not found' }, { status: 404 });
    }

    // Insert message
    const { data: newMsg, error: msgError } = await admin
      .from('support_ticket_messages')
      .insert({
        ticket_id: id,
        sender_type: 'admin',
        sender_id: adminUsername,
        user_id: isInternalNote ? null : ticket.user_id ?? null,
        sender_name: adminUsername,
        message,
        is_internal_note: isInternalNote,
      })
      .select('*')
      .single();

    if (msgError) {
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    // Optionally update ticket status if replying to seeker
    let updatedTicket = null;
    const ticketUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (!isInternalNote) {
      if (updateStatus && ['waiting_on_seeker', 'resolved', 'closed', 'in_progress'].includes(updateStatus)) {
        ticketUpdates.status = updateStatus;
        if (updateStatus === 'resolved' || updateStatus === 'closed') {
          ticketUpdates.resolved_at = new Date().toISOString();
        }
      } else if (ticket.status === 'open') {
        ticketUpdates.status = 'in_progress';
      }
    }

    const { data: updTicket } = await admin
      .from('support_tickets')
      .update(ticketUpdates)
      .eq('id', id)
      .select()
      .single();

    updatedTicket = updTicket;

    return NextResponse.json({
      success: true,
      message: newMsg,
      ticket: updatedTicket,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown message creation error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
