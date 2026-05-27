import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// ─── POST /api/karma/award ───────────────────────────────────────────────────
// Awards karma to a user by executing the increment_karma RPC.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { amount, reason } = body;

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const { error } = await supabase.rpc('increment_karma', {
      p_user_id: user.id,
      p_amount: amount,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, karma_earned: amount, reason });
  } catch (err) {
    console.error('[karma/award] Failed:', err);
    return NextResponse.json({ error: 'Failed to award karma' }, { status: 500 });
  }
}
