import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tirtha/save
 * Upserts or deletes a tirtha_saves row using the service role (bypasses RLS).
 *
 * Body: { place_id, action: 'save' | 'unsave' }
 */
export async function POST(req: NextRequest) {
  try {
    const userClient = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { place_id, action } = body;

    if (!place_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = createAdminClient() as unknown as { from: (t: string) => any };

    if (action === 'unsave') {
      const { error } = await admin
        .from('tirtha_saves')
        .delete()
        .eq('user_id', user.id)
        .eq('place_id', place_id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ action: 'unsaved' });
    }

    // save
    const { error } = await admin
      .from('tirtha_saves')
      .upsert({ user_id: user.id, place_id }, { onConflict: 'user_id,place_id' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ action: 'saved' });
  } catch (err: any) {
    console.error('[tirtha/save] unexpected error:', err);
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
