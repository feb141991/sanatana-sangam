import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tirtha/place
 * Upserts a place into tirtha_places using the service role (bypasses RLS).
 * Requires the user to be authenticated — we verify via the user Supabase client
 * before writing with the admin client.
 *
 * Body: { id, source, source_id, name, tradition, lat, lon, address?,
 *         website?, phone?, opening_hours?, deity?, sampradaya? }
 * Returns: { place_id: string }
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
    const { id, source, source_id, name, tradition, lat, lon } = body;

    if (!id || !source || !name || !tradition || lat == null || lon == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const row = {
      id,
      source,
      source_id: source_id ?? id,
      name,
      tradition,
      lat,
      lon,
      address:            body.address            ?? null,
      website:            body.website            ?? null,
      phone:              body.phone              ?? null,
      opening_hours:      body.opening_hours      ?? null,
      deity:              body.deity              ?? null,
      sampradaya:         body.sampradaya         ?? null,
      source_confidence:  'community_import',
      created_by:         user.id,
      updated_at:         new Date().toISOString(),
    };

    const admin = createAdminClient() as unknown as { from: (t: string) => any };
    const { error } = await admin
      .from('tirtha_places')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('[tirtha/place] upsert failed:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ place_id: id });
  } catch (err: any) {
    console.error('[tirtha/place] unexpected error:', err);
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
