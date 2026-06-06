import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import LiveDarshanClient from './LiveDarshanClient';
import { resolveActiveLiveStreams } from '@/lib/live-streams';


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
      .select('id, title, location, schedule, category, tradition, current_video_id, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
  ]);

  const { data: dbStreams, error: streamsError } = dbStreamsResult;
  const activeStreams = resolveActiveLiveStreams(!streamsError ? dbStreams : null);

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
