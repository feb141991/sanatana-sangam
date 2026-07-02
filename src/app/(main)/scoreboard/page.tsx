import ScoreboardClient from './ScoreboardClient';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const RANK_META = {
  Seeker:  { emoji: '🌱', text: '#7aab7a', desc: 'Beginning the journey' },
  Jigyasu: { emoji: '📖', text: '#c8a050', desc: 'Curious learner' },
  Shishya: { emoji: '🪔', text: '#C5A059', desc: 'Devoted student' },
  Gyani:   { emoji: '🧿', text: '#6a9cd4', desc: 'Knowledgeable one' },
  Pandit:  { emoji: '🏵️', text: '#d4b840', desc: 'Master of tradition' },
} as const;

type RankKey = keyof typeof RANK_META;

function computeRank(total: number, accuracy: number): RankKey {
  if (total >= 30 && accuracy >= 80) return 'Pandit';
  if (total >= 15 && accuracy >= 65) return 'Gyani';
  if (total >= 7  && accuracy >= 50) return 'Shishya';
  if (total >= 1)                    return 'Jigyasu';
  return 'Seeker';
}

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

type ScoreboardProfile = {
  id: string;
  full_name: string | null;
  username: string;
  avatar_url: string | null;
  tradition: string | null;
  is_pro: boolean;
  active_symbol_id: string | null;
};

type ShrutiLeaderboardRow = {
  user_id: string;
  total_recordings: number | null;
  scored_count: number | null;
  avg_overall_score: number | null;
  unique_verses_attempted: number | null;
  certified_count: number | null;
  profiles: ScoreboardProfile | ScoreboardProfile[] | null;
};

export type QuizLeaderboardUser = {
  id: string;
  full_name: string | null;
  username: string;
  avatar_url: string | null;
  tradition: string | null;
  is_pro: boolean;
  active_symbol_id?: string | null;
  total_karma: number;
  total_correct: number;
  total_answered: number;
  rank_title: RankKey;
  rank_emoji: string;
};

type QuizLeaderboardRow = {
  user_id: string;
  date: string;
  is_correct: boolean;
  profiles: ScoreboardProfile | ScoreboardProfile[] | null;
};

export default async function ScoreboardPage() {
  const supabase = await createServerSupabaseClient();

  const baseSelect = 'id, full_name, username, avatar_url, seva_score, weekly_seva, monthly_seva, tradition, is_pro, active_symbol_id';
  const [
    { data: users, error },
    { data: weeklyUsers, error: weeklyError },
    { data: monthlyUsers, error: monthlyError },
    { data: shrutiData, error: shrutiError },
    { data: quizResponsesData, error: quizError },
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
    supabase
      .from('quiz_responses')
      .select(`
        user_id,
        date,
        is_correct,
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
      .not('profiles.full_name', 'is', null),
  ]);

  if (error || weeklyError || monthlyError || shrutiError || quizError) {
    console.error('Error fetching scoreboard:', error || weeklyError || monthlyError || shrutiError || quizError);
  }

  const shrutiUsers: ShrutiLeaderboardUser[] = ((shrutiData ?? []) as ShrutiLeaderboardRow[]).flatMap((row) => {
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

  // Aggregate Quiz Data
  const sevenDaysAgoDate = new Date();
  sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
  const sevenDaysAgo = sevenDaysAgoDate.toISOString().split('T')[0];

  const thirtyDaysAgoDate = new Date();
  thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
  const thirtyDaysAgo = thirtyDaysAgoDate.toISOString().split('T')[0];

  type AggStats = {
    total_karma: number;
    total_correct: number;
    total_answered: number;
  };

  type AggEntry = AggStats & { profile: ScoreboardProfile };

  const aggMapAll = new Map<string, AggEntry>();
  const aggMapWeekly = new Map<string, AggEntry>();
  const aggMapMonthly = new Map<string, AggEntry>();

  for (const row of (quizResponsesData ?? []) as QuizLeaderboardRow[]) {
    const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    if (!prof?.id) continue;

    const karma = row.is_correct ? 10 : 2;
    const isCorrect = row.is_correct ? 1 : 0;
    const dateStr = row.date;

    // All Time
    if (!aggMapAll.has(prof.id)) {
      aggMapAll.set(prof.id, { total_karma: 0, total_correct: 0, total_answered: 0, profile: prof });
    }
    const allStats = aggMapAll.get(prof.id)!;
    allStats.total_karma += karma;
    allStats.total_correct += isCorrect;
    allStats.total_answered += 1;

    // Monthly
    if (dateStr >= thirtyDaysAgo) {
      if (!aggMapMonthly.has(prof.id)) {
        aggMapMonthly.set(prof.id, { total_karma: 0, total_correct: 0, total_answered: 0, profile: prof });
      }
      const monthlyStats = aggMapMonthly.get(prof.id)!;
      monthlyStats.total_karma += karma;
      monthlyStats.total_correct += isCorrect;
      monthlyStats.total_answered += 1;
    }

    // Weekly
    if (dateStr >= sevenDaysAgo) {
      if (!aggMapWeekly.has(prof.id)) {
        aggMapWeekly.set(prof.id, { total_karma: 0, total_correct: 0, total_answered: 0, profile: prof });
      }
      const weeklyStats = aggMapWeekly.get(prof.id)!;
      weeklyStats.total_karma += karma;
      weeklyStats.total_correct += isCorrect;
      weeklyStats.total_answered += 1;
    }
  }

  function mapToQuizLeaderboard(map: Map<string, AggEntry>): QuizLeaderboardUser[] {
    return Array.from(map.values())
      .map((entry) => {
        const accuracy = entry.total_answered > 0 ? Math.round((entry.total_correct / entry.total_answered) * 100) : 0;
        const rank = computeRank(entry.total_answered, accuracy);
        return {
          id: entry.profile.id,
          full_name: entry.profile.full_name ?? null,
          username: entry.profile.username ?? '',
          avatar_url: entry.profile.avatar_url ?? null,
          tradition: entry.profile.tradition ?? null,
          is_pro: Boolean(entry.profile.is_pro),
          active_symbol_id: entry.profile.active_symbol_id ?? null,
          total_karma: entry.total_karma,
          total_correct: entry.total_correct,
          total_answered: entry.total_answered,
          rank_title: rank,
          rank_emoji: RANK_META[rank].emoji,
        };
      })
      .sort((a, b) => b.total_karma - a.total_karma)
      .slice(0, 50);
  }

  const quizAllTime = mapToQuizLeaderboard(aggMapAll);
  const quizWeekly = mapToQuizLeaderboard(aggMapWeekly);
  const quizMonthly = mapToQuizLeaderboard(aggMapMonthly);

  return (
    <ScoreboardClient
      initialUsers={(users as LeaderboardUser[] | null) || []}
      weeklyUsers={(weeklyUsers as LeaderboardUser[] | null) || []}
      monthlyUsers={(monthlyUsers as LeaderboardUser[] | null) || []}
      shrutiUsers={shrutiUsers}
      quizAllTime={quizAllTime}
      quizWeekly={quizWeekly}
      quizMonthly={quizMonthly}
      currentUserId={user?.id}
      currentUserTradition={profile?.tradition ?? null}
    />
  );
}
