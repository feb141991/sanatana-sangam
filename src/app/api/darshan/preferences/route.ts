import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { requireUserNotBanned } from '@/lib/api-guards';

// ─── GET — fetch all darshan preferences for the current user ────────────────
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { user, error: authError } = await requireUserNotBanned(supabase);
  if (authError) return authError;

  const { data, error } = await supabase
    .from('darshan_preferences')
    .select('stream_id, is_favourite, notify_morning, notify_evening')
    .eq('user_id', user.id);

  if (error) {
    console.error('[darshan/preferences GET]', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }

  return NextResponse.json({ preferences: data ?? [] });
}

// ─── POST — upsert a single stream preference ────────────────────────────────
// Body: { stream_id, is_favourite?, notify_morning?, notify_evening? }
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { user, error: authError } = await requireUserNotBanned(supabase);
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const { stream_id, is_favourite, notify_morning, notify_evening } = body ?? {};

  if (!stream_id || typeof stream_id !== 'string') {
    return NextResponse.json({ error: 'stream_id is required' }, { status: 400 });
  }

  // Build the upsert payload — only include defined fields
  const payload: Record<string, unknown> = {
    user_id: user.id,
    stream_id,
    updated_at: new Date().toISOString(),
  };
  if (typeof is_favourite  === 'boolean') payload.is_favourite  = is_favourite;
  if (typeof notify_morning === 'boolean') payload.notify_morning = notify_morning;
  if (typeof notify_evening === 'boolean') payload.notify_evening = notify_evening;

  const { data, error } = await supabase
    .from('darshan_preferences')
    .upsert(payload, { onConflict: 'user_id,stream_id' })
    .select()
    .single();

  if (error) {
    console.error('[darshan/preferences POST]', error);
    return NextResponse.json({ error: 'Failed to save preference' }, { status: 500 });
  }

  return NextResponse.json({ preference: data });
}

// ─── DELETE — remove a stream from favourites entirely ───────────────────────
// Body: { stream_id }
export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { user, error: authError } = await requireUserNotBanned(supabase);
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const { stream_id } = body ?? {};

  if (!stream_id || typeof stream_id !== 'string') {
    return NextResponse.json({ error: 'stream_id is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('darshan_preferences')
    .delete()
    .eq('user_id', user.id)
    .eq('stream_id', stream_id);

  if (error) {
    console.error('[darshan/preferences DELETE]', error);
    return NextResponse.json({ error: 'Failed to remove preference' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
