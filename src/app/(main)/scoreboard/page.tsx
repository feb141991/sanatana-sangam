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
};

export default async function ScoreboardPage() {
  const supabase = await createServerSupabaseClient();

  const baseSelect = 'id, full_name, username, avatar_url, seva_score, weekly_seva, monthly_seva, tradition, is_pro';
  const [{ data: users, error }, { data: weeklyUsers, error: weeklyError }, { data: monthlyUsers, error: monthlyError }] = await Promise.all([
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
  ]);

  if (error || weeklyError || monthlyError) {
    console.error('Error fetching scoreboard:', error || weeklyError || monthlyError);
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from('profiles').select('tradition').eq('id', user.id).single()
    : { data: null };

  return (
    <ScoreboardClient
      initialUsers={(users as LeaderboardUser[] | null) || []}
      weeklyUsers={(weeklyUsers as LeaderboardUser[] | null) || []}
      monthlyUsers={(monthlyUsers as LeaderboardUser[] | null) || []}
      currentUserId={user?.id}
      currentUserTradition={(profile as { tradition?: string | null } | null)?.tradition ?? null}
    />
  );
}
