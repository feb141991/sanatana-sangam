import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createServiceRoleSupabaseClient } from '@/lib/admin';

// ─── POST /api/premium/activate ──────────────────────────────────────────────
// Early-access: open to all users. Idempotent — safe to call multiple times;
// will not downgrade an existing paid subscription.

export async function POST() {
  // ── Gate: authenticated user ───────────────────────────────────────────────
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: authError?.message ?? 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const serviceSupabase = createServiceRoleSupabaseClient();

    // ── Gate 3: idempotency — skip if already pro from a real source ──────────
    const { data: current } = await serviceSupabase
      .from('profiles')
      .select('is_pro, entitlement_source, subscription_status')
      .eq('id', user.id)
      .single();

    const alreadyPro = current?.is_pro === true;
    const isRealBilling = current?.entitlement_source
      && !['early_access', null, undefined].includes(current.entitlement_source);

    if (alreadyPro && isRealBilling) {
      // User already has a paid subscription — don't overwrite it
      console.info('[premium/activate] skipped — user already has paid entitlement', {
        userId: user.id,
        source: current?.entitlement_source,
      });
      return NextResponse.json({ ok: true, is_pro: true, skipped: true });
    }

    const now = new Date().toISOString();

    const { error } = await serviceSupabase
      .from('profiles')
      .update({
        is_pro:                  true,
        subscription_status:     'pro',
        entitlement_source:      'early_access',
        entitlement_updated_at:  now,
        // Only stamp pro_activated_at once (don't reset if already set)
        ...(alreadyPro ? {} : { pro_activated_at: now }),
        pro_note:                'early_access',
      })
      .eq('id', user.id);

    if (error) {
      console.error('[premium/activate] DB update failed:', { userId: user.id, error });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.info('[premium/activate] activated early-access pro', { userId: user.id, alreadyPro });
    return NextResponse.json({ ok: true, is_pro: true });

  } catch (err) {
    console.error('[premium/activate] crashed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Activation failed' },
      { status: 500 }
    );
  }
}
