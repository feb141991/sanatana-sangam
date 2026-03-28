import { createServerSupabaseClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import ThreadDetailClient from './ThreadDetailClient';

export default async function ThreadPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: thread } = await supabase
    .from('forum_threads')
    .select('*, profiles(full_name, username, avatar_url, sampradaya)')
    .eq('id', params.id)
    .single();

  if (!thread) notFound();

  const { data: replies } = await supabase
    .from('forum_replies')
    .select('*, profiles(full_name, username, avatar_url, sampradaya, spiritual_level)')
    .eq('thread_id', params.id)
    .order('created_at', { ascending: true });

  return (
    <ThreadDetailClient
      thread={thread}
      replies={replies ?? []}
      userId={user!.id}
    />
  );
}
