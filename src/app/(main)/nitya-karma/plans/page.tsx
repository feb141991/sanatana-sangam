import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import GuidedPlansClient from './GuidedPlansClient';
import { GUIDED_PLANS, buildGuidedPathStatusMap } from '@/lib/guided-paths';
import type { GuidedPathProgressRow } from '@/lib/guided-paths';

export const dynamic = 'force-dynamic';

export default async function GuidedPlansPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('tradition')
    .eq('id', user.id)
    .single();

  const tradition = profile?.tradition ?? 'hindu';

  // Load user's progress across all plans
  const { data: progressRows } = await supabase
    .from('guided_path_progress')
    .select('path_id, status, started_at, completed_at, updated_at, day_reached')
    .eq('user_id', user.id);

  const statusMap = buildGuidedPathStatusMap((progressRows ?? []) as GuidedPathProgressRow[]);

  return (
    <GuidedPlansClient
      userId={user.id}
      tradition={tradition}
      plans={GUIDED_PLANS}
      statusMap={statusMap}
    />
  );
}
