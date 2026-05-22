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
    const { before_mood, source_surface, dismissed } = body;

    if (!dismissed && !before_mood) {
      return NextResponse.json({ error: 'Missing before_mood' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('user_mood_checkins')
      .insert({
        user_id: session.user.id,
        before_mood: before_mood || null,
        source_surface: source_surface || null,
        dismissed: !!dismissed,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error inserting mood checkin:', error);
      return NextResponse.json({ error: 'Failed to insert mood checkin' }, { status: 500 });
    }

    return NextResponse.json({ checkin_id: data.id });
  } catch (error) {
    console.error('Error in /api/mood/checkin:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
