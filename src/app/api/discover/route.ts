import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// createServerSupabaseClient is built on @supabase/ssr + next/headers cookies,
// both Edge-supported. Note: the DB query itself still has to reach the
// Dublin database regardless of where this function executes, so the win
// here is smaller than for the pure-static routes -- mainly helps the
// non-DB parts of a cache-miss request (this route is already public-cached
// at s-maxage=3600, so most requests never reach the function at all).
export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(req.url);
    const tradition = searchParams.get('tradition');

    let query = supabase
      .from('discover_content')
      .select('id, slug, title, subtitle, tradition, category, hook_question, body_short, body_full, scripture_line, scripture_source, app_deep_link, og_image_url, published, created_at')
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

    return NextResponse.json(
      { success: true, data },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
    );
  } catch (err: any) {
    console.error('[GET /api/discover] Server error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
