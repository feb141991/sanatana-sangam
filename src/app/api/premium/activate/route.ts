import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createServiceRoleSupabaseClient } from '@/lib/admin';

// ─── POST /api/premium/activate ──────────────────────────────────────────────
// Early-access only. This must be disabled in production billing contexts.

export async function POST() {
  if (process.env.ENABLE_EARLY_ACCESS_PRO !== 'true') {
    return NextResponse.json(
      { error: 'Early-access Pro activation is disabled. Production entitlements must come from the billing provider.' },
      { status: 409 }
    );
  }

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

    const { error } = await serviceSupabase
      .from('profiles')
      .update({
        is_pro:           true,
        subscription_status: 'pro',
        entitlement_source: 'early_access',
        entitlement_updated_at: new Date().toISOString(),
        pro_activated_at: new Date().toISOString(),
        pro_note:         'early_access',
      })
      .eq('id', user.id);

    if (error) {
      console.error('[premium/activate] DB update failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, is_pro: true });
  } catch (err) {
    console.error('[premium/activate] crashed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Activation failed' },
      { status: 500 }
    );
  }
}
