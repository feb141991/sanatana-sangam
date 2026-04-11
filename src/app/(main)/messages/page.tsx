import { redirect } from 'next/navigation';
import MessagesClient from './MessagesClient';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { fetchMessageThreads, fetchThreadMessages } from '@/lib/api/messages';

export default async function MessagesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('id', user.id)
    .single();

  const threads = await fetchMessageThreads(user.id);
  const firstThreadId = threads[0]?.id ?? null;
  const initialMessages = firstThreadId ? await fetchThreadMessages(firstThreadId, user.id) : [];

  return (
    <MessagesClient
      userId={user.id}
      userName={profile?.full_name ?? profile?.username ?? 'You'}
      initialThreads={threads}
      initialMessages={initialMessages}
    />
  );
}
