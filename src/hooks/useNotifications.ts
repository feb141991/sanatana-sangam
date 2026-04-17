'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import { fetchNotifications, markNotificationRead, markNotificationsRead } from '@/lib/api/notifications-runtime';
import { queryKeys } from '@/lib/query-keys';
import type { Notification } from '@/types/database';

export function useNotificationsQuery(userId: string, initialData?: Notification[]) {
  return useQuery({
    queryKey: queryKeys.notifications(userId),
    queryFn: () => fetchNotifications(userId),
    enabled: Boolean(userId),
    initialData,
    staleTime: 30_000,
  });
}

/**
 * Subscribe to Supabase Realtime for new notification inserts for the current
 * user. Automatically invalidates the React Query notifications cache whenever
 * a new row arrives so the bell badge and list update without a page refresh.
 */
export function useNotificationsRealtime(userId: string) {
  const queryClient = useQueryClient();
  // Stable client reference — createClient() is cheap but we don't need a new
  // instance on every render.
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    if (!userId) return;

    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`notifications_feed:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications(userId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}

export function useMarkNotificationReadMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(userId, notificationId),
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
    mutationFn: async (notificationIds: string[]) => markNotificationsRead(userId, notificationIds),
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
