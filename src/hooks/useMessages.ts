'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMessageThreads, fetchThreadMessages, markThreadRead, sendThreadMessage } from '@/lib/api/messages';
import type { MessageThread, ThreadMessage } from '@/lib/contracts/messages';
import { queryKeys } from '@/lib/query-keys';
import { getRealtimeTransport } from '@/lib/realtime/transport';

export function useMessageThreadsQuery(userId: string, initialData?: MessageThread[]) {
  return useQuery({
    queryKey: queryKeys.messages.threads(userId),
    queryFn: () => fetchMessageThreads(userId),
    enabled: Boolean(userId),
    initialData,
  });
}

export function useThreadMessagesQuery(threadId: string | null, userId: string, initialData?: ThreadMessage[]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!threadId || !userId) return;

    const transport = getRealtimeTransport();
    const unsubscribe = transport.subscribe(`messages:${threadId}`, () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages.thread(userId, threadId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages.threads(userId) });
    });

    return unsubscribe;
  }, [queryClient, threadId, userId]);

  return useQuery({
    queryKey: threadId ? queryKeys.messages.thread(userId, threadId) : ['messages', 'thread', 'idle'],
    queryFn: () => fetchThreadMessages(threadId as string, userId),
    enabled: Boolean(threadId && userId),
    initialData,
  });
}

export function useSendThreadMessageMutation(userId: string, userName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ threadId, body }: { threadId: string; body: string }) =>
      sendThreadMessage({
        threadId,
        body,
        userId,
        userName,
      }),
    onMutate: async ({ threadId, body }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.messages.thread(userId, threadId) });

      const previousMessages = queryClient.getQueryData<ThreadMessage[]>(queryKeys.messages.thread(userId, threadId));
      const optimisticMessage: ThreadMessage = {
        id: `optimistic-${Date.now()}`,
        threadId,
        senderId: userId,
        senderName: userName,
        body,
        createdAt: new Date().toISOString(),
        deliveryState: 'sending',
        isCurrentUser: true,
      };

      queryClient.setQueryData<ThreadMessage[]>(
        queryKeys.messages.thread(userId, threadId),
        (current = []) => [...current, optimisticMessage]
      );

      return { previousMessages, threadId };
    },
    onError: (_error, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(queryKeys.messages.thread(userId, variables.threadId), context.previousMessages);
      }
    },
    onSuccess: (_message, variables) => {
      const transport = getRealtimeTransport();
      transport.emit(`messages:${variables.threadId}`, { threadId: variables.threadId });
    },
    onSettled: (_message, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages.thread(userId, variables.threadId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages.threads(userId) });
    },
  });
}

export function useMarkThreadReadMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (threadId: string) => markThreadRead(threadId, userId),
    onSuccess: (_result, threadId) => {
      queryClient.setQueryData<MessageThread[]>(
        queryKeys.messages.threads(userId),
        (current = []) => current.map((thread) => thread.id === threadId ? { ...thread, unreadCount: 0 } : thread)
      );
    },
  });
}
