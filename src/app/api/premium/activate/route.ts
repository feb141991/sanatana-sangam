import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createServiceRoleSupabaseClient } from '@/lib/admin';

// ─── POST /api/premium/activate ──────────────────────────────────────────────
// Grants Sangam Pro to the authenticated user immediately (no payment yet).
// When billing is integrated, this endpoint will be called by the payment
// webhook instead of directly from the client.

export async function POST() {
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
