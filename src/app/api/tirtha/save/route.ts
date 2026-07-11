import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ACTIONS = new Set(['save', 'unsave']);

function parseString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getApiUser(req);
    if (!user || !supabase) {
      return NextResponse.json({ error: authError?.message ?? 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const placeId = parseString(payload.place_id);
    const action = parseString(payload.action);

    if (!placeId || !action || !ACTIONS.has(action)) {
      return NextResponse.json({ error: 'place_id and action=save|unsave are required' }, { status: 400 });
    }

    if (action === 'unsave') {
      const { error } = await supabase
        .from('tirtha_saves')
        .delete()
        .eq('user_id', user.id)
        .eq('place_id', placeId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ action: 'unsaved', place_id: placeId });
    }

    const { error } = await supabase
      .from('tirtha_saves')
      .upsert({ user_id: user.id, place_id: placeId }, { onConflict: 'user_id,place_id' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ action: 'saved', place_id: placeId });
  } catch (err: unknown) {
    console.error('[POST /api/tirtha/save] Server error:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
