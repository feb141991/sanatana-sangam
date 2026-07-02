import { getAppDataRuntime } from '@/lib/api/runtime';
import type { MessageThread, MessagesApi, SendThreadMessageInput, ThreadMessage } from '@/lib/contracts/messages';
import { mockMessageThreads, mockThreadMessages } from '@/lib/mocks/messages';
import { selectRuntimeAdapter } from '@shared-core/runtime/selectRuntimeAdapter';

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
    return mockMessagesApi.listThreads(userId);
  },
  async listMessages(threadId, userId) {
    return mockMessagesApi.listMessages(threadId, userId);
  },
  async sendMessage(input) {
    return mockMessagesApi.sendMessage(input);
  },
  async markThreadRead(threadId, userId) {
    return mockMessagesApi.markThreadRead(threadId, userId);
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
