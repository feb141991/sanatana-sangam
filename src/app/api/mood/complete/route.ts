import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      checkin_id,
      clicked_action,
      completed_action,
      after_mood,
      reflection_note,
    } = body;

    if (!checkin_id) {
      return NextResponse.json({ error: 'Missing checkin_id' }, { status: 400 });
    }

    const clickedActionValue = clicked_action || null;
    const completedActionValue = completed_action || null;
    const hasReflectionNote = typeof reflection_note === 'string' && reflection_note.trim().length > 0;
    const hasAfterMood = typeof after_mood === 'string' && after_mood.trim().length > 0;
    const updatePayload: Record<string, string | null> = {};

    if (clickedActionValue) {
      updatePayload.clicked_action = clickedActionValue;
    }

    if (completedActionValue) {
      updatePayload.completed_action = completedActionValue;
      updatePayload.completed_at = new Date().toISOString();
    }

    if (hasAfterMood) {
      updatePayload.after_mood = after_mood;
    }

    if (hasReflectionNote) {
      updatePayload.reflection_note = reflection_note.trim();
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No mood completion fields provided' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_mood_checkins')
      .update(updatePayload)
      .eq('id', checkin_id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error completing mood checkin:', error);
      return NextResponse.json({ error: 'Failed to complete mood checkin' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in /api/mood/complete:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
