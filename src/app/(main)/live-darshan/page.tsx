import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import LiveDarshanClient from './LiveDarshanClient';
import { getLiveStreamsWithAartis, AARTI_TIMES } from '@/lib/live-streams';


export default async function LiveDarshanPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  // Fetch profile and user darshan preferences in parallel
  const [profileResult, prefsResult, dbStreamsResult] = await Promise.all([
    supabase.from('profiles').select('tradition').eq('id', user.id).single(),
    supabase
      .from('darshan_preferences')
      .select('stream_id, is_favourite, notify_morning, notify_evening')
      .eq('user_id', user.id),
    supabase
      .from('live_darshans')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
  ]);

  // Build the streams list — merge aarti times into DB rows if available,
  // otherwise fall back to the local static list (already has aarti times).
  let activeStreams = getLiveStreamsWithAartis();
  const { data: dbStreams, error: streamsError } = dbStreamsResult;
  if (!streamsError && dbStreams && dbStreams.length > 0) {
    activeStreams = dbStreams.map(row => ({
      id: row.id,
      title: row.title,
      location: row.location,
      schedule: row.schedule,
      category: row.category,
      tradition: row.tradition,
      youtubeVideoId: row.current_video_id || '',
      // Merge aarti schedule from static registry
      aartis: AARTI_TIMES[row.id],
    }));
  }

  const initialPreferences = prefsResult.data ?? [];

  return (
    <LiveDarshanClient
      tradition={profileResult.data?.tradition ?? 'hindu'}
      userId={user.id}
      streams={activeStreams}
      initialPreferences={initialPreferences}
    />
  );
}
