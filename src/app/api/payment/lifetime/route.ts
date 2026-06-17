import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getRazorpay, LIFETIME_PASS } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/payment/lifetime
 * Creates a Razorpay one-time ORDER (not subscription) for the Founding Member Lifetime Pass.
 * Eligibility: user must have a founding_number.
 *
 * Returns: { orderId, amount, currency, key }
 * Client opens Razorpay checkout, on success calls /api/payment/lifetime/activate.
 */
export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Check eligibility: must be a registered founding member ───────────────
  const { data: waitlistRow } = await supabase
    .from('waitlist')
    .select('founding_number')
    .ilike('email', user.email ?? '')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!waitlistRow?.founding_number) {
    return NextResponse.json({
      error: 'not_eligible',
      message: 'The Founding Member Lifetime Pass is exclusively for the founding 1,000 members.',
    }, { status: 403 });
  }

  // ── Prevent double-purchase ────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, entitlement_source')
    .eq('id', user.id)
    .single();

  if (profile?.entitlement_source === 'lifetime') {
    return NextResponse.json({
      error: 'already_purchased',
      message: 'You already hold the Founding Member Lifetime Pass. Welcome back.',
    }, { status: 409 });
  }

  // ── Create Razorpay order ──────────────────────────────────────────────────
  try {
    const order = await getRazorpay().orders.create({
      amount:   LIFETIME_PASS.amount_paise,
      currency: LIFETIME_PASS.currency,
      receipt:  `lifetime_${user.id.slice(0, 8)}`,
      notes: {
        user_id:         user.id,
        plan:            'lifetime',
        founding_number: String(waitlistRow.founding_number),
      },
    });

    return NextResponse.json({
      orderId:  order.id,
      amount:   LIFETIME_PASS.amount_paise,
      currency: LIFETIME_PASS.currency,
      name:     LIFETIME_PASS.name,
      description: LIFETIME_PASS.description,
      key:      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('[payment/lifetime] Razorpay order creation failed:', err);
    return NextResponse.json({ error: 'Failed to create payment order.' }, { status: 500 });
  }
}
