import { redirect } from 'next/navigation';
import MessagesClient from './MessagesClient';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { MessageThread, ThreadMessage } from '@/lib/contracts/messages';

// SSR data fetching done here with the server client directly —
// messages.ts only uses the browser client (safe for client components).
export default async function MessagesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('id', user.id)
    .single();

  // Fetch threads server-side
  let initialThreads: MessageThread[] = [];
  try {
    const { data: participantsData } = await supabase
      .from('thread_participants')
      .select(`unread_count, thread_id, message_threads!inner(id, title, subtitle, kind, context_label, updated_at)`)
      .eq('user_id', user.id);

    if (participantsData && participantsData.length > 0) {
      const threadIds = participantsData.map((p: any) => p.thread_id);

      const { data: countsData } = await supabase
        .from('thread_participants').select('thread_id').in('thread_id', threadIds);
      const participantCounts: Record<string, number> = {};
      countsData?.forEach((c: any) => { participantCounts[c.thread_id] = (participantCounts[c.thread_id] || 0) + 1; });

      const { data: messagesData } = await supabase
        .from('thread_messages').select('thread_id, body, created_at')
        .in('thread_id', threadIds).order('created_at', { ascending: false });
      const lastMessages: Record<string, { body: string; createdAt: string }> = {};
      messagesData?.forEach((m: any) => { if (!lastMessages[m.thread_id]) lastMessages[m.thread_id] = { body: m.body, createdAt: m.created_at }; });

      initialThreads = participantsData.map((row: any) => {
        const t = row.message_threads as any;
        const title = t.title || '';
        const lastMsg = lastMessages[t.id];
        return {
          id: t.id, title, subtitle: t.subtitle || '', kind: t.kind,
          contextLabel: t.context_label || '',
          participantCount: participantCounts[t.id] || 0,
          unreadCount: row.unread_count || 0,
          lastMessagePreview: lastMsg?.body || '',
          lastMessageAt: lastMsg?.createdAt || t.updated_at || new Date().toISOString(),
          avatarFallback: title.substring(0, 2).toUpperCase(),
        } as MessageThread;
      }).sort((a: MessageThread, b: MessageThread) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
    }
  } catch { /* tables may not exist yet — show empty state */ }

  // Fetch first thread messages server-side
  let initialMessages: ThreadMessage[] = [];
  const firstThreadId = initialThreads[0]?.id ?? null;
  if (firstThreadId) {
    try {
      const { data } = await supabase
        .from('thread_messages')
        .select('id, thread_id, sender_id, sender_name, body, created_at, delivery_state')
        .eq('thread_id', firstThreadId)
        .order('created_at', { ascending: true });
      initialMessages = (data ?? []).map((row: any) => ({
        id: row.id, threadId: row.thread_id, senderId: row.sender_id || '',
        senderName: row.sender_name || 'Anonymous', body: row.body,
        createdAt: row.created_at, deliveryState: row.delivery_state,
        isCurrentUser: row.sender_id === user.id,
      }));
    } catch { /* silent */ }
  }

  return (
    <MessagesClient
      userId={user.id}
      userName={profile?.full_name ?? profile?.username ?? 'You'}
      initialThreads={initialThreads}
      initialMessages={initialMessages}
    />
  );
}
