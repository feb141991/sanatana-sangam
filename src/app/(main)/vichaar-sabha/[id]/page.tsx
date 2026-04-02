import { createServerSupabaseClient } from '@/lib/supabase-server';
import { filterAuthoredItems, getUserSafetyState } from '@/lib/user-safety';
import { notFound } from 'next/navigation';
import ThreadDetailClient from './ThreadDetailClient';

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const safetyState = user ? await getUserSafetyState(supabase, user.id) : null;

  const { data: thread } = await supabase
    .from('forum_threads')
    .select('*, profiles!forum_threads_author_id_fkey(full_name, username, avatar_url, sampradaya)')
    .eq('id', id)
    .single();

  if (!thread) notFound();
  if (filterAuthoredItems([thread], 'thread', safetyState).length === 0) notFound();

  const { data: replies } = await supabase
    .from('forum_replies')
    .select('*, profiles!forum_replies_author_id_fkey(full_name, username, avatar_url, sampradaya, spiritual_level)')
    .eq('thread_id', id)
    .order('created_at', { ascending: true });

  const visibleReplies = filterAuthoredItems(replies ?? [], 'reply', safetyState);

  return (
    <ThreadDetailClient
      thread={thread}
      replies={visibleReplies}
      userId={user?.id ?? ''}
    />
  );
}
