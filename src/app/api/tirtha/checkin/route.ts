import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_PRIVACY = new Set(['private', 'family', 'mandali', 'public']);
const VALID_MOODS = new Set(['gratitude', 'devotion', 'peace', 'clarity']);

function parseString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function clampText(value: unknown, maxLength: number) {
  const text = parseString(value);
  return text ? text.slice(0, maxLength) : null;
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
    const privacy = parseString(payload.privacy) ?? 'private';
    const mood = parseString(payload.darshan_mood) ?? 'gratitude';

    if (!placeId) {
      return NextResponse.json({ error: 'place_id is required' }, { status: 400 });
    }

    if (!VALID_PRIVACY.has(privacy)) {
      return NextResponse.json({ error: 'Invalid privacy value' }, { status: 400 });
    }

    if (!VALID_MOODS.has(mood)) {
      return NextResponse.json({ error: 'Invalid darshan_mood value' }, { status: 400 });
    }

    const { data: inserted, error: checkinError } = await supabase
      .from('tirtha_checkins')
      .insert({
        user_id: user.id,
        place_id: placeId,
        privacy,
        darshan_mood: mood,
        intention: clampText(payload.intention, 500),
        reflection: clampText(payload.reflection, 1200),
        companions: clampText(payload.companions, 300),
        seva_note: clampText(payload.seva_note, 500),
        pradakshina_count: typeof payload.pradakshina_count === 'number'
          ? Math.max(0, Math.floor(payload.pradakshina_count))
          : 0,
      })
      .select('id')
      .single();

    if (checkinError) {
      return NextResponse.json({ error: checkinError.message }, { status: 500 });
    }

    const { error: saveError } = await supabase
      .from('tirtha_saves')
      .upsert({ user_id: user.id, place_id: placeId }, { onConflict: 'user_id,place_id' });

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    return NextResponse.json({ checkin_id: inserted?.id ?? null, place_id: placeId });
  } catch (err: unknown) {
    console.error('[POST /api/tirtha/checkin] Server error:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
