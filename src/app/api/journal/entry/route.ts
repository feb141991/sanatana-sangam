import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null) as {
      content?: string;
      mood?: 'peaceful' | 'grateful' | 'seeking' | 'struggling' | 'joyful';
      tradition_context?: string;
      tags?: string[];
      is_shared_to_kul?: boolean;
      entry_date?: string;
    } | null;

    const content = body?.content?.trim();
    const mood = body?.mood;
    const tradition_context = body?.tradition_context?.trim() || null;
    const tags = body?.tags || [];
    const is_shared_to_kul = !!body?.is_shared_to_kul;
    const entry_date = body?.entry_date;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (!mood || !['peaceful', 'grateful', 'seeking', 'struggling', 'joyful'].includes(mood)) {
      return NextResponse.json({ error: 'A valid mood is required' }, { status: 400 });
    }

    // Resolve date in user timezone
    let resolvedDate = entry_date?.trim();
    if (!resolvedDate) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', user.id)
        .single();
      const timeZone = profile?.timezone || 'Asia/Kolkata';
      resolvedDate = new Date().toLocaleDateString('en-CA', { timeZone });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(resolvedDate)) {
      return NextResponse.json({ error: 'Invalid entry_date format. Must be YYYY-MM-DD' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('journal_entries')
      .upsert({
        user_id: user.id,
        entry_date: resolvedDate,
        content,
        mood,
        tradition_context,
        tags,
        is_shared_to_kul,
      }, {
        onConflict: 'user_id,entry_date'
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/journal/entry] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[POST /api/journal/entry] Server error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
