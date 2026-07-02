import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { requireUserNotBanned } from '@/lib/api-guards';

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { user, error: authError } = await requireUserNotBanned(supabase);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { sankalpa_id } = body;

    if (!sankalpa_id) {
      return NextResponse.json({ error: 'sankalpa_id is required' }, { status: 400 });
    }

    // Verify the sankalpa belongs to user and status is 'active'
    const { data: sankalpa, error: fetchError } = await supabase
      .from('sankalpas')
      .select('id, status, user_id')
      .eq('id', sankalpa_id)
      .single();

    if (fetchError || !sankalpa || sankalpa.user_id !== user.id) {
      return NextResponse.json({ error: 'Sankalpa not found or not owned by user' }, { status: 404 });
    }

    if (sankalpa.status !== 'active') {
      return NextResponse.json({ error: 'Sankalpa is not active' }, { status: 400 });
    }

    // Update sankalpa status and completed_at timestamp
    const { error: updateError } = await supabase
      .from('sankalpas')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sankalpa_id);

    if (updateError) throw updateError;

    // Award +50 karma via RPC or direct fallback
    try {
      const { error: rpcError } = await supabase.rpc('increment_period_seva', {
        p_user_id: user.id,
        p_points: 50
      });

      if (rpcError) {
        // Fallback: update profiles.karma_points directly
        const { data: prof } = await supabase
          .from('profiles')
          .select('karma_points')
          .eq('id', user.id)
          .single();

        await supabase
          .from('profiles')
          .update({ karma_points: ((prof as any)?.karma_points ?? 0) + 50 })
          .eq('id', user.id);
      }
    } catch (rpcErr) {
      console.warn('[sankalpa/complete] RPC failed, trying fallback direct update:', rpcErr);
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('karma_points')
          .eq('id', user.id)
          .single();

        await supabase
          .from('profiles')
          .update({ karma_points: ((prof as any)?.karma_points ?? 0) + 50 })
          .eq('id', user.id);
      } catch (fallbackErr) {
        console.error('[sankalpa/complete] Fallback update failed:', fallbackErr);
      }
    }

    return NextResponse.json({ success: true, karmaAwarded: 50 });
  } catch (err) {
    console.error('[sankalpa/complete/POST] Failed:', err);
    return NextResponse.json({ error: 'Failed to complete sankalpa' }, { status: 500 });
  }
}
