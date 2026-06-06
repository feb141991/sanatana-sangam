import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Zenith users never need to unlock — packs are auto-open via /challenge/current
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('is_pro, subscription_status')
      .eq('id', user.id)
      .single();

    const isZenith = userProfile?.is_pro === true ||
      userProfile?.subscription_status === 'pro' ||
      userProfile?.subscription_status === 'kul_pro';

    if (isZenith) {
      return NextResponse.json({ success: true, unlocked: true, message: 'Zenith members have all packs unlocked.' });
    }

    const { pack_id, method } = await req.json();

    if (!pack_id || (method !== 'ad' && method !== 'seva')) {
      return NextResponse.json({ error: 'pack_id and method (ad|seva) are required.' }, { status: 400 });
    }

    // 1. Fetch the pack details
    const { data: pack, error: packError } = await supabase
      .from('challenge_packs')
      .select('id, is_free')
      .eq('id', pack_id)
      .maybeSingle();

    if (packError) throw packError;
    if (!pack) {
      return NextResponse.json({ error: 'Pack not found.' }, { status: 404 });
    }

    // 2. Check if pack is already unlocked
    const { data: progress, error: progressError } = await supabase
      .from('user_challenge_progress')
      .select('unlocked')
      .eq('user_id', user.id)
      .eq('pack_id', pack_id)
      .maybeSingle();

    if (progressError) throw progressError;

    if (pack.is_free || (progress && progress.unlocked)) {
      return NextResponse.json({ success: true, unlocked: true, message: 'Pack already unlocked.' });
    }

    if (method === 'ad') {
      // ─── AD UNLOCK STUB ──────────────────────────────────────────────────────
      // TODO: Once the mobile client integrates the AdMob SDK, wire the reward
      // verification token from the Google AdMob server callback.
      // ─────────────────────────────────────────────────────────────────────────

      // Mark as unlocked in the DB
      const { error: upsertError } = await supabase
        .from('user_challenge_progress')
        .upsert({
          user_id: user.id,
          pack_id: pack_id,
          unlocked: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,pack_id' });

      if (upsertError) throw upsertError;

      return NextResponse.json({ success: true, unlocked: true });
    } else {
      // ─── SEVA CREDIT (KARMA POINTS) UNLOCK ────────────────────────────────────
      // Atomically deduct 50 credits and log to the karma ledger
      // ─────────────────────────────────────────────────────────────────────────
      const { data: success, error: rpcError } = await supabase.rpc('deduct_karma', {
        p_user_id: user.id,
        p_amount: 50
      });

      if (rpcError) throw rpcError;

      if (!success) {
        return NextResponse.json(
          { error: 'Insufficient Seva Credits. You need at least 50 Seva Credits to unlock.' },
          { status: 400 }
        );
      }

      // Mark as unlocked in the DB
      const { error: upsertError } = await supabase
        .from('user_challenge_progress')
        .upsert({
          user_id: user.id,
          pack_id: pack_id,
          unlocked: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,pack_id' });

      if (upsertError) throw upsertError;

      return NextResponse.json({ success: true, unlocked: true });
    }
  } catch (err: any) {
    console.error('[challenge/unlock] POST error:', err);
    return NextResponse.json({ error: 'Failed to unlock pack.' }, { status: 500 });
  }
}
