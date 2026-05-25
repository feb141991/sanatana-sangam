import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { razorpay, PLAN_IDS } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Razorpay checkout endpoint – creates a subscription and returns the subscription ID.
 * GET /api/payment/checkout?plan=zenith|kul&billing=monthly|annual
 * Auth: session cookie via createServerSupabaseClient (service role cannot read sessions).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const plan = url.searchParams.get('plan');
  const billing = url.searchParams.get('billing');

  if (!plan || !billing) {
    return NextResponse.json({ error: 'Missing plan or billing' }, { status: 400 });
  }

  // Auth via session cookies — service role cannot read user sessions
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Map plan+billing to a Razorpay plan ID
  const planKey = `${plan}_${billing}` as keyof typeof PLAN_IDS;
  const planId = PLAN_IDS[planKey];
  if (!planId) {
    return NextResponse.json({ error: 'Invalid plan/billing combination' }, { status: 400 });
  }

  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      quantity: 1,
      total_count: billing === 'annual' ? 1 : 120, // 120 months ≈ 10 yrs for open-ended monthly
      notes: { user_id: user.id, plan, billing },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('[payment/checkout] Razorpay error', err);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}
