import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import BhaktiInsightsClient from './BhaktiInsightsClient';


export default async function BhaktiInsightsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const ninetyAgo = new Date();
  ninetyAgo.setDate(ninetyAgo.getDate() - 89);
  const fromDate = ninetyAgo.toISOString().slice(0, 10);

  const [{ data: sessions }, { data: profile }] = await Promise.all([
    // Bhakti mala sessions (same table as Japa — devotional practice)
    supabase
      .from('mala_sessions')
      .select('id, user_id, mantra, chant_source, count, target_count, duration_seconds, notes, share_scope, completed_at, created_at, date, rounds, bead_count, mantra_id, duration_secs, mala_id, background_scene, tradition, practice_type, intention, completion_type, target_rounds, completed_rounds, completed_beads, mood_before, mood_after, ambient_id, spiritual_time_window, spiritual_date, timezone, haptics_enabled, source_route, panchang_context')
      .eq('user_id', user.id)
      .gte('created_at', fromDate + 'T00:00:00')   // filter by created_at — always exists
      .order('created_at', { ascending: false }),

    supabase
      .from('profiles')
      .select('tradition, shloka_streak, seva_score')
      .eq('id', user.id)
      .single(),
  ]);

  return (
    <BhaktiInsightsClient
      sessions={sessions ?? []}
      shlokaStreak={profile?.shloka_streak ?? 0}
      sevaScore={profile?.seva_score ?? 0}
      tradition={profile?.tradition ?? 'hindu'}
    />
  );
}
