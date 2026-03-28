import { createServerSupabaseClient } from '@/lib/supabase-server';
import VichaarClient from './VichaarClient';

export default async function VichaarSabhaPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: threads } = await supabase
    .from('forum_threads')
    .select('*, profiles(full_name, username, avatar_url, sampradaya)')
    .order('created_at', { ascending: false })
    .limit(40);

  // Pass userId as empty string for guests — VichaarClient shows read-only mode
  return <VichaarClient threads={threads ?? []} userId={user?.id ?? ''} />;
}
