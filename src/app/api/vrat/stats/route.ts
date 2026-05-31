import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { localSpiritualDate } from '@/lib/sacred-time';

/**
 * GET /api/vrat/stats?vrat_id=ekadashi
 *
 * Public endpoint — no auth required.
 * Returns:
 *   - today_count: how many users marked this vrat observed today (IST)
 *   - total_count: all-time observation count across all users
 *   - next_date: next occurrence from observance_occurrences (if any)
 */
export async function GET(req: NextRequest) {
  const vrat_id = req.nextUrl.searchParams.get('vrat_id');
  if (!vrat_id) return NextResponse.json({ error: 'Missing vrat_id' }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const today    = localSpiritualDate('Asia/Kolkata', 4);
  const recType  = `vrat_obs:${vrat_id}`;

  // All-time count
  const { count: totalCount } = await supabase
    .from('recommendations')
    .select('*', { count: 'exact', head: true })
    .eq('type', recType);

  // Today's count
  const { count: todayCount } = await supabase
    .from('recommendations')
    .select('*', { count: 'exact', head: true })
    .eq('type', recType)
    .eq('date', today);

  // Next occurrence from observance_occurrences (joins observance_definitions by slug)
  const { data: nextOcc } = await supabase
    .from('observance_occurrences')
    .select('date, observance_definitions!inner(slug)')
    .eq('observance_definitions.slug', vrat_id)
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(1)
    .maybeSingle();

  return NextResponse.json(
    {
      today_count: todayCount ?? 0,
      total_count: totalCount ?? 0,
      next_date:   nextOcc?.date ?? null,
      today,
    },
    {
      headers: { 'Cache-Control': 'public, max-age=300' }, // 5 min cache
    }
  );
}
