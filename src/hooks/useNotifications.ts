'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, markNotificationRead, markNotificationsRead } from '@/lib/api/notifications';
import { queryKeys } from '@/lib/query-keys';
import type { Notification } from '@/types/database';

export function useNotificationsQuery(userId: string, initialData?: Notification[]) {
  return useQuery({
    queryKey: queryKeys.notifications(userId),
    queryFn: () => fetchNotifications(userId),
    enabled: Boolean(userId),
    initialData,
  });
}

export function useMarkNotificationReadMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications(userId) });
      const previous = queryClient.getQueryData<Notification[]>(queryKeys.notifications(userId));
      queryClient.setQueryData<Notification[]>(queryKeys.notifications(userId), (current = []) =>
        current.map((item) => item.id === notificationId ? { ...item, read: true } : item)
      );
      return { previous };
    },
    onError: (_error, _notificationId, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.notifications(userId), context.previous);
    },
  });
}

export function useMarkAllNotificationsReadMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationIds: string[]) => markNotificationsRead(notificationIds),
    onMutate: async (notificationIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications(userId) });
      const previous = queryClient.getQueryData<Notification[]>(queryKeys.notifications(userId));
      queryClient.setQueryData<Notification[]>(queryKeys.notifications(userId), (current = []) =>
        current.map((item) => notificationIds.includes(item.id) ? { ...item, read: true } : item)
      );
      return { previous };
    },
    onError: (_error, _notificationIds, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.notifications(userId), context.previous);
    },
  });
}
