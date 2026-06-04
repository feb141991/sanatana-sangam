import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const config = { api: { bodyParser: false } };

/**
 * Razorpay webhook handler – validates signature and updates user subscription status.
 */
export async function POST(request: Request) {
  const signature = request.headers.get('x-razorpay-signature');
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 401 });
  }

  const rawBody = await request.text();
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = payload.event;

  // ── Lifetime pass: order.paid fires for one-time payments ─────────────────
  if (event === 'order.paid') {
    const orderNotes = payload.payload?.order?.entity?.notes ?? {};
    if (orderNotes.plan === 'lifetime' && orderNotes.user_id) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabase.from('profiles').update({
        is_pro: true,
        subscription_status: 'pro',
        entitlement_source: 'lifetime',
        subscription_expires_at: null,
      }).eq('id', orderNotes.user_id);
      return NextResponse.json({ received: true }, { status: 200 });
    }
  }

  const entity = payload.payload?.subscription?.entity ?? {};
  const notes = entity.notes ?? {};
  const userId = notes.user_id;
  const plan = notes.plan;
  const billing = notes.billing;

  if (!userId) {
    return NextResponse.json({ error: 'User ID missing in notes' }, { status: 400 });
  }

  // Guard against injection / accidental bad data — userId must be a valid UUID
  // before we use it as a primary-key filter in Supabase.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(userId)) {
    console.warn('[webhook] Rejected non-UUID user_id in notes:', userId);
    return NextResponse.json({ error: 'Invalid user_id format' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  let update: any = {};

  if (event === 'subscription.activated') {
    const status = plan.includes('kul') ? 'kul_pro' : 'pro';
    update = {
      is_pro: true,
      subscription_status: status,
      entitlement_source: 'razorpay',
      subscription_expires_at: null,
    };
  } else if (event === 'subscription.charged') {
    const nextDate = new Date();
    if (billing === 'annual') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    update = { subscription_expires_at: nextDate.toISOString() };
  } else if (event === 'subscription.cancelled') {
    update = { subscription_status: 'expired', subscription_expires_at: new Date().toISOString() };
  } else if (event === 'subscription.halted') {
    update = { subscription_status: 'grace' };
  } else {
    // ignore other events
    return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
  }

  // Apply update to user profile
  const { error: updError } = await supabase.from('profiles').update(update as never).eq('id', userId);
  if (updError) {
    console.error('Supabase update error', updError);
  }

  // ── Kul Pro activation: propagate Zenith to all family members ───────────
  if (event === 'subscription.activated' && plan.includes('kul')) {
    const { data: kulMember } = await supabase
      .from('kul_members')
      .select('kul_id')
      .eq('user_id', userId)
      .eq('role', 'guardian')
      .maybeSingle();

    if (kulMember?.kul_id) {
      const proExpires = new Date();
      if (billing === 'annual') {
        proExpires.setFullYear(proExpires.getFullYear() + 1);
      } else {
        proExpires.setMonth(proExpires.getMonth() + 1);
      }

      // Mark the kul itself as pro
      await supabase.from('kuls').update({
        is_pro:           true,
        pro_activated_at: new Date().toISOString(),
        pro_expires_at:   proExpires.toISOString(),
        pro_activated_by: userId,
      }).eq('id', kulMember.kul_id);

      // Propagate Zenith to all kul members via DB function
      await supabase.rpc('propagate_kul_pro', {
        p_kul_id:     kulMember.kul_id,
        p_expires_at: proExpires.toISOString(),
      });
    }
  }

  // ── Kul Pro cancellation: revoke family members' access ──────────────────
  if (event === 'subscription.cancelled' && plan.includes('kul')) {
    const { data: kulMember } = await supabase
      .from('kul_members')
      .select('kul_id')
      .eq('user_id', userId)
      .eq('role', 'guardian')
      .maybeSingle();

    if (kulMember?.kul_id) {
      await supabase.from('kuls').update({
        is_pro: false,
        pro_expires_at: new Date().toISOString(),
      }).eq('id', kulMember.kul_id);

      await supabase.rpc('revoke_kul_pro', { p_kul_id: kulMember.kul_id });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
