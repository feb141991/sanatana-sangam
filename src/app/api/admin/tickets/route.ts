import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = await verifyAdminCookieAuth(req);
  if (authError) return authError;

  const url = req.nextUrl;
  const statusFilter = url.searchParams.get('status');
  const priorityFilter = url.searchParams.get('priority');
  const categoryFilter = url.searchParams.get('category');
  const searchQuery = url.searchParams.get('search')?.trim();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  try {
    const admin = createAdminClient() as any;

    // Build query for tickets list
    let query = admin
      .from('support_tickets')
      .select('*', { count: 'exact' });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    if (priorityFilter && priorityFilter !== 'all') {
      query = query.eq('priority', priorityFilter);
    }
    if (categoryFilter && categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }
    if (searchQuery) {
      query = query.or(
        `ticket_number.ilike.%${searchQuery}%,seeker_email.ilike.%${searchQuery}%,seeker_name.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%`
      );
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const [
      ticketsResult,
      openCountResult,
      urgentCountResult,
      waitingCountResult,
      resolvedCountResult,
    ] = await Promise.all([
      query,
      admin.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      admin.from('support_tickets').select('id', { count: 'exact', head: true }).in('priority', ['urgent', 'high']).in('status', ['open', 'in_progress']),
      admin.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'waiting_on_seeker'),
      admin.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'resolved'),
    ]);

    if (ticketsResult.error) {
      return NextResponse.json({ error: ticketsResult.error.message }, { status: 500 });
    }

    const total = ticketsResult.count || 0;
    const tickets = ticketsResult.data || [];

    return NextResponse.json({
      success: true,
      stats: {
        total,
        open: openCountResult.count || 0,
        urgent: urgentCountResult.count || 0,
        waitingOnSeeker: waitingCountResult.count || 0,
        resolved: resolvedCountResult.count || 0,
      },
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      tickets,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown query error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
