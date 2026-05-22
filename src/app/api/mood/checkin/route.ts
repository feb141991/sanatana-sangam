import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      before_mood,
      source_surface,
      context_need,
      context_time,
      context_type,
      dismissed,
    } = body;

    if (!dismissed && !before_mood) {
      return NextResponse.json({ error: 'Missing before_mood' }, { status: 400 });
    }

    const insertPayload: any = {
      user_id: user.id,
      source_surface,
    };

    if (before_mood) insertPayload.before_mood = before_mood;
    if (context_need) insertPayload.context_need = context_need;
    if (context_time) insertPayload.context_time = context_time;
    if (context_type) insertPayload.context_type = context_type;
    if (typeof dismissed === 'boolean') insertPayload.dismissed = dismissed;

    const { data, error } = await supabase
      .from('user_mood_checkins')
      .insert(insertPayload)
      .select('id')
      .single();

    if (error) {
      console.error('Error inserting mood checkin:', error);
      if (error.code === 'PGRST204' || error.code === '42703' || error.message?.includes('does not exist')) {
        return NextResponse.json({ error: 'Database schema is out of date. Please run migration 018.' }, { status: 503 });
      }
      return NextResponse.json({ error: 'Failed to insert mood checkin' }, { status: 500 });
    }

    return NextResponse.json({ checkin_id: data.id });
  } catch (error) {
    console.error('Error in /api/mood/checkin:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
