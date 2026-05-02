import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import LiveDarshanClient from './LiveDarshanClient';
import { LIVE_STREAMS } from '@/lib/live-streams';

export default async function LiveDarshanPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('tradition')
    .eq('id', user.id)
    .single();

  // Fetch live streams from the database
  const { data: dbStreams, error: streamsError } = await supabase
    .from('live_darshans')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  // If the database query fails (e.g. migration hasn't been run yet), 
  // gracefully fall back to the local static list.
  let activeStreams = LIVE_STREAMS;
  if (!streamsError && dbStreams && dbStreams.length > 0) {
    activeStreams = dbStreams.map(row => ({
      id: row.id,
      title: row.title,
      location: row.location,
      schedule: row.schedule,
      category: row.category,
      tradition: row.tradition,
      youtubeVideoId: row.current_video_id || '', // Fallback handled by UI if empty
    }));
  }

  return <LiveDarshanClient tradition={profile?.tradition ?? 'hindu'} userId={user.id} streams={activeStreams} />;
}
