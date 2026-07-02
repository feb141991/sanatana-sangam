import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getRazorpay } from '@/lib/razorpay';

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_id, subscription_expires_at')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.subscription_id) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
    }

    const razorpay = getRazorpay();
    await razorpay.subscriptions.cancel(profile.subscription_id, true);

    await supabase
      .from('profiles')
      .update({ subscription_status: 'cancelling' })
      .eq('id', user.id);

    return NextResponse.json({ success: true, cancelAt: profile.subscription_expires_at });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
