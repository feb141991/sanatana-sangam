import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { GUIDED_PLANS, buildGuidedPathStatusMap } from '@/lib/guided-paths';
import type { GuidedPathProgressRow } from '@/lib/guided-paths';
import InsightsClient from './InsightsClient';

export const dynamic = 'force-dynamic';

export default async function PlanInsightsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro, tradition')
    .eq('id', user.id)
    .single();

  const isPro = profile?.is_pro ?? false;

  // Fetch all progress rows for this user
  const { data: progressRows } = await supabase
    .from('guided_path_progress')
    .select('path_id, status, started_at, completed_at, updated_at, day_reached')
    .eq('user_id', user.id);

  const rows = (progressRows ?? []) as GuidedPathProgressRow[];

  // Build a streak per plan: consecutive days with day_reached advancing.
  // We approximate: days since started_at (capped at day_reached)
  const planData = GUIDED_PLANS.map(plan => {
    const row = rows.find(r => r.path_id === plan.id);
    return {
      plan,
      status:     row?.status ?? null,
      dayReached: row?.day_reached ?? 0,
      startedAt:  row?.started_at ?? null,
      completedAt: row?.completed_at ?? null,
    };
  });

  // Global stats
  const totalDaysCompleted = rows.reduce((sum, r) => sum + (r.day_reached ?? 0), 0);
  const plansCompleted     = rows.filter(r => r.status === 'completed').length;
  const activePlan         = rows.find(r => r.status === 'active');
  const currentStreak      = activePlan?.day_reached ?? 0;

  return (
    <InsightsClient
      isPro={isPro}
      planData={planData}
      totalDaysCompleted={totalDaysCompleted}
      plansCompleted={plansCompleted}
      currentStreak={currentStreak}
    />
  );
}
