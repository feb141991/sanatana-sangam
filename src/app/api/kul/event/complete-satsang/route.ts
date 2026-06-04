import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { event_id?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { event_id } = body;
    if (!event_id) {
      return NextResponse.json({ error: 'Missing required field: event_id' }, { status: 400 });
    }

    // Fetch the kul_event details
    const { data: event, error: eventError } = await supabase
      .from('kul_events')
      .select('kul_id, created_by, event_type')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Kul event not found' }, { status: 404 });
    }

    // Verify it is a satsang event
    if (event.event_type !== 'satsang') {
      return NextResponse.json({ error: 'Event is not a Satsang' }, { status: 400 });
    }

    // Verify user is authorized:
    // (a) Is creator of the event (created_by = user.id)
    // (b) Is a guardian of the Kul
    let isAuthorized = event.created_by === user.id;

    if (!isAuthorized) {
      const { data: member, error: memberError } = await supabase
        .from('kul_members')
        .select('role')
        .eq('kul_id', event.kul_id)
        .eq('user_id', user.id)
        .single();

      if (!memberError && member && member.role === 'guardian') {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: You must be a guardian or the event creator' }, { status: 403 });
    }

    // Call award_karma RPC to award 50 karma points to the host
    const today = new Date().toISOString().slice(0, 10);
    const { data: rpcData, error: rpcError } = await supabase.rpc('award_karma', {
      p_user_id: user.id,
      p_reason: 'satsang_hosted',
      p_amount: 50,
      p_date: today,
      p_daily_cap: 500, // Standard daily cap
      p_source_route: '/api/kul/event/complete-satsang',
      p_metadata: null
    });

    if (rpcError) {
      console.error('[kul/event/complete-satsang] award_karma failed:', rpcError);
      return NextResponse.json({ error: 'Failed to award karma points for Satsang completion' }, { status: 500 });
    }

    const res = rpcData as { status: string; karma_earned: number };
    if (res.status === 'already_awarded') {
      return NextResponse.json({ error: 'Satsang karma already awarded today.', already_awarded: true }, { status: 429 });
    }
    if (res.status === 'daily_cap_reached') {
      return NextResponse.json({ error: 'Daily karma cap reached.', daily_cap_reached: true }, { status: 429 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[kul/event/complete-satsang] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
