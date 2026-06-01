import type { MessageThread, MessagesApi, SendThreadMessageInput, ThreadMessage } from '@/lib/contracts/messages';
import { mockMessageThreads, mockThreadMessages } from '@/lib/mocks/messages';
import { selectRuntimeAdapter } from '@shared-core/runtime/selectRuntimeAdapter';
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase';

// Always use the browser client — this file is imported by client components.
// Server-side initial data fetching (page.tsx) uses its own server client directly.
function getSupabase() {
  return createBrowserSupabaseClient();
}

const threadStore = new Map<string, MessageThread[]>();
const messageStore = new Map<string, ThreadMessage[]>();

function cloneThread(thread: MessageThread): MessageThread {
  return { ...thread };
}

function cloneMessage(message: ThreadMessage): ThreadMessage {
  return { ...message };
}

function ensureSeeded(userId: string) {
  if (!threadStore.has(userId)) {
    threadStore.set(userId, mockMessageThreads.map(cloneThread));
  }

  for (const [threadId, messages] of Object.entries(mockThreadMessages)) {
    if (!messageStore.has(threadId)) {
      messageStore.set(threadId, messages.map(cloneMessage));
    }
  }
}

const mockMessagesApi: MessagesApi = {
  async listThreads(userId) {
    ensureSeeded(userId);
    return (threadStore.get(userId) ?? []).map(cloneThread).sort((a, b) => (
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    ));
  },

  async listMessages(threadId, userId) {
    ensureSeeded(userId);
    return (messageStore.get(threadId) ?? []).map(cloneMessage).sort((a, b) => (
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ));
  },

  async sendMessage(input) {
    ensureSeeded(input.userId);

    const nextMessage: ThreadMessage = {
      id: `${input.threadId}-${Date.now()}`,
      threadId: input.threadId,
      senderId: input.userId,
      senderName: input.userName,
      body: input.body.trim(),
      createdAt: new Date().toISOString(),
      deliveryState: 'sent',
      isCurrentUser: true,
    };

    const currentMessages = messageStore.get(input.threadId) ?? [];
    messageStore.set(input.threadId, [...currentMessages, nextMessage]);

    const currentThreads = threadStore.get(input.userId) ?? [];
    threadStore.set(
      input.userId,
      currentThreads.map((thread) =>
        thread.id === input.threadId
          ? {
              ...thread,
              lastMessagePreview: nextMessage.body,
              lastMessageAt: nextMessage.createdAt,
            }
          : thread
      )
    );

    return cloneMessage(nextMessage);
  },

  async markThreadRead(threadId, userId) {
    ensureSeeded(userId);
    const currentThreads = threadStore.get(userId) ?? [];
    threadStore.set(
      userId,
      currentThreads.map((thread) => thread.id === threadId ? { ...thread, unreadCount: 0 } : thread)
    );
  },
};

const liveMessagesApi: MessagesApi = {
  async listThreads(userId) {
    const supabase = getSupabase();
    
    // 1. Get all threads the user is participant in
    const { data: participantsData, error: tpError } = await supabase
      .from('thread_participants')
      .select(`
        unread_count,
        thread_id,
        message_threads!inner (
          id,
          title,
          subtitle,
          kind,
          context_label,
          updated_at
        )
      `)
      .eq('user_id', userId);

    if (tpError || !participantsData || participantsData.length === 0) {
      return [];
    }

    const threadIds = participantsData.map(p => p.thread_id);

    // 2. Count participants for each thread
    const { data: countsData } = await supabase
      .from('thread_participants')
      .select('thread_id')
      .in('thread_id', threadIds);

    const participantCounts: Record<string, number> = {};
    countsData?.forEach(c => {
      participantCounts[c.thread_id] = (participantCounts[c.thread_id] || 0) + 1;
    });

    // 3. Get last message for each thread
    const { data: messagesData } = await supabase
      .from('thread_messages')
      .select('thread_id, body, created_at')
      .in('thread_id', threadIds)
      .order('created_at', { ascending: false });

    const lastMessages: Record<string, { body: string; createdAt: string }> = {};
    messagesData?.forEach(m => {
      if (!lastMessages[m.thread_id]) {
        lastMessages[m.thread_id] = {
          body: m.body,
          createdAt: m.created_at
        };
      }
    });

    // 4. Map to MessageThread contracts format
    const threads: MessageThread[] = participantsData.map((row) => {
      const t = row.message_threads as any;
      const threadId = t.id;
      const lastMsg = lastMessages[threadId];
      const title = t.title || '';
      return {
        id: threadId,
        title: title,
        subtitle: t.subtitle || '',
        kind: t.kind,
        contextLabel: t.context_label || '',
        participantCount: participantCounts[threadId] || 0,
        unreadCount: row.unread_count || 0,
        lastMessagePreview: lastMsg?.body || '',
        lastMessageAt: lastMsg?.createdAt || t.updated_at || new Date().toISOString(),
        avatarFallback: title.substring(0, 2).toUpperCase(),
      };
    });

    // 5. Order by lastMessageAt DESC
    threads.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    return threads;
  },

  async listMessages(threadId, userId) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('thread_messages')
      .select('id, thread_id, sender_id, sender_name, body, created_at, delivery_state')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      threadId: row.thread_id,
      senderId: row.sender_id || '',
      senderName: row.sender_name || 'Anonymous',
      body: row.body,
      createdAt: row.created_at,
      deliveryState: row.delivery_state as any,
      isCurrentUser: row.sender_id === userId,
    }));
  },

  async sendMessage(input) {
    const supabase = getSupabase();

    // 1. Insert into thread_messages
    const { data: insertedMsg, error: insertError } = await supabase
      .from('thread_messages')
      .insert({
        thread_id: input.threadId,
        sender_id: input.userId,
        sender_name: input.userName,
        body: input.body.trim(),
        delivery_state: 'sent'
      })
      .select()
      .single();

    if (insertError || !insertedMsg) {
      throw new Error(insertError?.message || 'Failed to insert message');
    }

    // 2. Update message_threads.updated_at
    await supabase
      .from('message_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', input.threadId);

    // 3. Reset unread_count to 0 for sender in thread_participants
    await supabase
      .from('thread_participants')
      .update({ unread_count: 0 })
      .eq('thread_id', input.threadId)
      .eq('user_id', input.userId);

    // 4. Increment unread_count for all other participants in thread
    const { data: participants } = await supabase
      .from('thread_participants')
      .select('user_id, unread_count')
      .eq('thread_id', input.threadId);

    if (participants) {
      for (const p of participants) {
        if (p.user_id !== input.userId) {
          await supabase
            .from('thread_participants')
            .update({ unread_count: (p.unread_count || 0) + 1 })
            .eq('thread_id', input.threadId)
            .eq('user_id', p.user_id);
        }
      }
    }

    // 5. Return inserted ThreadMessage
    return {
      id: insertedMsg.id,
      threadId: insertedMsg.thread_id,
      senderId: insertedMsg.sender_id || '',
      senderName: insertedMsg.sender_name || '',
      body: insertedMsg.body,
      createdAt: insertedMsg.created_at,
      deliveryState: insertedMsg.delivery_state as any,
      isCurrentUser: true,
    };
  },

  async markThreadRead(threadId, userId) {
    const supabase = getSupabase();
    await supabase
      .from('thread_participants')
      .update({ unread_count: 0 })
      .eq('thread_id', threadId)
      .eq('user_id', userId);
  },
};

const messagesApi = selectRuntimeAdapter<MessagesApi>({
  live: liveMessagesApi,
  mock: mockMessagesApi,
});

export async function fetchMessageThreads(userId: string) {
  return messagesApi.listThreads(userId);
}

export async function fetchThreadMessages(threadId: string, userId: string) {
  return messagesApi.listMessages(threadId, userId);
}

export async function sendThreadMessage(input: SendThreadMessageInput) {
  return messagesApi.sendMessage(input);
}

export async function markThreadRead(threadId: string, userId: string) {
  return messagesApi.markThreadRead(threadId, userId);
}
