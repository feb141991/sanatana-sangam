import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type ShrutiLeaderboardUser = {
  id: string;
  full_name: string | null;
  username: string;
  avatar_url: string | null;
  tradition: string | null;
  is_pro: boolean;
  active_symbol_id?: string | null;
  avg_score_100: number;
  total_recordings: number;
  scored_count: number;
  unique_verses_attempted: number;
  certified_count: number;
};

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('pathshala_recitation_stats')
      .select(`
        user_id,
        total_recordings,
        scored_count,
        avg_overall_score,
        unique_verses_attempted,
        certified_count,
        last_reviewed_at,
        profiles!inner (
          id,
          full_name,
          username,
          avatar_url,
          tradition,
          is_pro,
          active_symbol_id
        )
      `)
      .gte('scored_count', 3)
      .not('profiles.full_name', 'is', null)
      .order('avg_overall_score', { ascending: false })
      .order('scored_count', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[scoreboard/shruti] fetch failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const users: ShrutiLeaderboardUser[] = (data ?? []).flatMap((row: any) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      if (!profile?.id) return [];
      return [{
        id: profile.id,
        full_name: profile.full_name ?? null,
        username: profile.username ?? '',
        avatar_url: profile.avatar_url ?? null,
        tradition: profile.tradition ?? null,
        is_pro: Boolean(profile.is_pro),
        active_symbol_id: profile.active_symbol_id ?? null,
        avg_score_100: Math.round((Number(row.avg_overall_score ?? 0) || 0) * 20),
        total_recordings: Number(row.total_recordings ?? 0),
        scored_count: Number(row.scored_count ?? 0),
        unique_verses_attempted: Number(row.unique_verses_attempted ?? 0),
        certified_count: Number(row.certified_count ?? 0),
      }];
    });

    return NextResponse.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[scoreboard/shruti] unexpected failure:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
