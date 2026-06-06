import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import InsightsClient from '../../../japa/insights/InsightsClient';


export default async function MalaInsightsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const fromDate = oneYearAgo.toISOString().slice(0, 10);

  const { data: sessions, error } = await supabase
    .from('mala_sessions')
    .select('id, user_id, mantra, chant_source, count, target_count, duration_seconds, notes, share_scope, completed_at, created_at, date, rounds, bead_count, mantra_id, duration_secs, mala_id, background_scene, tradition, practice_type, intention, completion_type, target_rounds, completed_rounds, completed_beads, mood_before, mood_after, ambient_id, spiritual_time_window, spiritual_date, timezone, haptics_enabled, source_route, panchang_context')
    .eq('user_id', user.id)
    .gte('created_at', `${fromDate}T00:00:00`)
    .order('created_at', { ascending: false });

  if (error) console.error('[MalaInsights] mala_sessions fetch error:', error.message);

  return <InsightsClient sessions={sessions ?? []} />;
}
