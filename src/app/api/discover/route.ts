import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(req.url);
    const tradition = searchParams.get('tradition');

    let query = supabase
      .from('discover_content')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (tradition && tradition !== 'all') {
      query = query.eq('tradition', tradition);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[GET /api/discover] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[GET /api/discover] Server error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
