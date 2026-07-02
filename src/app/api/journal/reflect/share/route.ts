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
      reflection_id?: string;
      is_shared_to_kul?: boolean;
    } | null;

    const reflection_id = body?.reflection_id;
    const is_shared_to_kul = !!body?.is_shared_to_kul;

    if (!reflection_id) {
      return NextResponse.json({ error: 'reflection_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('journal_reflections')
      .update({ is_shared_to_kul })
      .eq('id', reflection_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[POST /api/journal/reflect/share] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[POST /api/journal/reflect/share] Server error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
