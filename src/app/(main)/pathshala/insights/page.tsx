import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { PATHSHALA_PATH_IDS } from '@/lib/pathshala-paths';
import PathshalaInsightsClient from './PathshalaInsightsClient';


export default async function PathshalaInsightsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const [{ data: progress }, { data: profile }, { data: shrutiStats }] = await Promise.all([
    // Scoped to PATHSHALA_PATH_IDS so we never pull in NityaKarma guided-plan rows
    // (brahma-muhurta-7, japa-foundation-7…) which share the same table.
    supabase
      .from('guided_path_progress')
      .select('path_id, status, completed_at, current_lesson, completed_lessons, created_at, updated_at')
      .eq('user_id', user.id)
      .in('path_id', PATHSHALA_PATH_IDS)
      .order('updated_at', { ascending: false }),

    supabase
      .from('profiles')
      .select('tradition')
      .eq('id', user.id)
      .single(),

    supabase
      .from('pathshala_recitation_stats')
      .select('user_id, avg_overall_score, scored_count, unique_verses_attempted, certified_count, total_recordings')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const { count: betterCount } = await supabase
    .from('pathshala_recitation_stats')
    .select('id', { count: 'exact', head: true })
    .gt('avg_overall_score', shrutiStats?.avg_overall_score ?? 0)
    .gte('scored_count', 3);

  const communityRank = (betterCount ?? 0) + 1;

  const { count: totalReciters } = await supabase
    .from('pathshala_recitation_stats')
    .select('id', { count: 'exact', head: true })
    .gte('scored_count', 3);

  return (
    <PathshalaInsightsClient
      progress={progress ?? []}
      tradition={profile?.tradition ?? 'hindu'}
      shrutiStats={shrutiStats}
      communityRank={communityRank}
      totalReciters={totalReciters ?? 0}
    />
  );
}
