import ScoreboardClient from './ScoreboardClient';
import { createServerSupabaseClient } from '@/lib/supabase-server';

type LeaderboardUser = {
  id: string;
  full_name: string | null;
  username: string;
  avatar_url: string | null;
  seva_score: number;
  weekly_seva: number | null;
  monthly_seva: number | null;
  tradition: string | null;
  is_pro: boolean;
  active_symbol_id?: string | null;
};

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

export default async function ScoreboardPage() {
  const supabase = await createServerSupabaseClient();

  const baseSelect = 'id, full_name, username, avatar_url, seva_score, weekly_seva, monthly_seva, tradition, is_pro, active_symbol_id';
  const [
    { data: users, error },
    { data: weeklyUsers, error: weeklyError },
    { data: monthlyUsers, error: monthlyError },
    { data: shrutiData, error: shrutiError },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select(baseSelect)
      .not('full_name', 'is', null)
      .order('seva_score', { ascending: false })
      .limit(50),
    supabase
      .from('profiles')
      .select(baseSelect)
      .not('full_name', 'is', null)
      .order('weekly_seva', { ascending: false })
      .limit(50),
    supabase
      .from('profiles')
      .select(baseSelect)
      .not('full_name', 'is', null)
      .order('monthly_seva', { ascending: false })
      .limit(50),
    supabase
      .from('pathshala_recitation_stats')
      .select(`
        user_id,
        total_recordings,
        scored_count,
        avg_overall_score,
        unique_verses_attempted,
        certified_count,
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
      .limit(50),
  ]);

  if (error || weeklyError || monthlyError || shrutiError) {
    console.error('Error fetching scoreboard:', error || weeklyError || monthlyError || shrutiError);
  }

  const shrutiUsers: ShrutiLeaderboardUser[] = ((shrutiData ?? []) as any[]).flatMap((row) => {
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

  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from('profiles').select('tradition').eq('id', user.id).single()
    : { data: null };

  return (
    <ScoreboardClient
      initialUsers={(users as LeaderboardUser[] | null) || []}
      weeklyUsers={(weeklyUsers as LeaderboardUser[] | null) || []}
      monthlyUsers={(monthlyUsers as LeaderboardUser[] | null) || []}
      shrutiUsers={shrutiUsers}
      currentUserId={user?.id}
      currentUserTradition={(profile as { tradition?: string | null } | null)?.tradition ?? null}
    />
  );
}
