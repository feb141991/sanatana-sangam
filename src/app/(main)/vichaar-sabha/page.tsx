import { createServerSupabaseClient } from '@/lib/supabase-server';
import { filterAuthoredItems, getUserSafetyState } from '@/lib/user-safety';
import VichaarClient from './VichaarClient';

export default async function VichaarSabhaPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const safetyState = user ? await getUserSafetyState(supabase, user.id) : null;

  const { data: threads } = await supabase
    .from('forum_threads')
    .select('*, profiles!forum_threads_author_id_fkey(full_name, username, avatar_url, sampradaya)')
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(40);

  // Pass userId as empty string for guests — VichaarClient shows read-only mode
  return <VichaarClient threads={filterAuthoredItems(threads ?? [], 'thread', safetyState)} userId={user?.id ?? ''} />;
}
