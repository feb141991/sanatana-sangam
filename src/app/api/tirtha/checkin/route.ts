import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tirtha/checkin
 * Inserts a visit into tirtha_checkins using the service role (bypasses RLS).
 * Also upserts into tirtha_saves so the place is always bookmarked after a visit.
 *
 * Requires the user to be authenticated — verified via the user Supabase client
 * before writing with the admin client.
 *
 * Body: { place_id, visited_at?, privacy, darshan_mood, intention?,
 *         reflection?, companions?, pradakshina_count? }
 */
export async function POST(req: NextRequest) {
  try {
    // Verify the caller is a signed-in user
    const userClient = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { place_id, privacy, darshan_mood } = body;

    if (!place_id || !privacy || !darshan_mood) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = createAdminClient() as unknown as { from: (t: string) => any };

    // Insert the check-in
    const checkinRow = {
      user_id:          user.id,
      place_id,
      visited_at:       body.visited_at ?? new Date().toISOString(),
      privacy,
      darshan_mood,
      intention:        body.intention        ?? null,
      reflection:       body.reflection       ?? null,
      companions:       body.companions       ?? null,
      pradakshina_count: body.pradakshina_count ?? 0,
      seva_note:        body.seva_note        ?? null,
    };

    const { data: inserted, error: checkinError } = await admin
      .from('tirtha_checkins')
      .insert(checkinRow)
      .select('id')
      .single();

    if (checkinError) {
      console.error('[tirtha/checkin] insert failed:', checkinError.message);
      return NextResponse.json({ error: checkinError.message }, { status: 500 });
    }

    // Also upsert tirtha_saves so the place is automatically bookmarked after visit
    await admin
      .from('tirtha_saves')
      .upsert({ user_id: user.id, place_id }, { onConflict: 'user_id,place_id' });

    return NextResponse.json({ checkin_id: inserted?.id ?? null });
  } catch (err: any) {
    console.error('[tirtha/checkin] unexpected error:', err);
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
