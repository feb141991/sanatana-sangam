import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getRazorpay } from '@/lib/razorpay';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/payment/lifetime/activate
 * Called by client after Razorpay checkout succeeds.
 * Verifies the payment signature, then grants lifetime pro to the user.
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body ?? {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: 'Missing payment verification fields.' }, { status: 400 });
  }

  // ── Verify Razorpay signature ──────────────────────────────────────────────
  const secret = process.env.RAZORPAY_KEY_SECRET ?? '';
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSig !== razorpay_signature) {
    return NextResponse.json({ error: 'Payment signature verification failed.' }, { status: 401 });
  }

  // ── Fetch order to confirm amount and notes ────────────────────────────────
  try {
    const order = await getRazorpay().orders.fetch(razorpay_order_id);
    const notes = (order as any).notes ?? {};

    if (notes.user_id !== user.id) {
      return NextResponse.json({ error: 'Order does not belong to this user.' }, { status: 403 });
    }
    if (notes.plan !== 'lifetime') {
      return NextResponse.json({ error: 'Order is not a lifetime pass.' }, { status: 400 });
    }

    // ── Grant lifetime pro ─────────────────────────────────────────────────
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_pro:               true,
        subscription_status:  'pro',
        entitlement_source:   'lifetime',
        subscription_expires_at: null,   // never expires
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // ── Record in payment history ──────────────────────────────────────────
    await supabase.from('payment_history').insert({
      user_id:            user.id,
      razorpay_order_id,
      razorpay_payment_id,
      plan:               'lifetime',
      billing:            'one_time',
      amount_paise:       (order as any).amount ?? 499900,
      currency:           'INR',
      status:             'paid',
    }).then(({ error }) => {
      if (error) console.warn('[lifetime/activate] Payment history insert failed:', error.message);
    });

    return NextResponse.json({
      success: true,
      message: 'Sthapaka Lifetime Pass activated. Welcome to lifetime Zenith.',
    });
  } catch (err) {
    console.error('[payment/lifetime/activate] Error:', err);
    return NextResponse.json({ error: 'Activation failed. Contact support if payment was deducted.' }, { status: 500 });
  }
}
