import { fetchNotifications as fetchLiveNotifications, markNotificationRead as markLiveNotificationRead, markNotificationsRead as markLiveNotificationsRead } from '@/lib/api/notifications';
import { fetchMockNotifications, markMockNotificationsRead } from '@/lib/mocks/profile';
import { selectRuntimeAdapter } from '@shared-core/runtime/selectRuntimeAdapter';
import type { Notification } from '@/types/database';

type RuntimeNotificationsApi = {
  fetchNotifications: (userId: string) => Promise<Notification[]>;
  markNotificationsRead: (userId: string, notificationIds: string[]) => Promise<string[]>;
  markNotificationRead: (userId: string, notificationId: string) => Promise<string>;
};

const notificationsRuntimeApi = selectRuntimeAdapter<RuntimeNotificationsApi>({
  live: {
    fetchNotifications: fetchLiveNotifications,
    markNotificationsRead: async (_userId, notificationIds) => markLiveNotificationsRead(notificationIds),
    markNotificationRead: async (_userId, notificationId) => markLiveNotificationRead(notificationId),
  },
  mock: {
    fetchNotifications: fetchMockNotifications,
    markNotificationsRead: markMockNotificationsRead,
    markNotificationRead: async (userId, notificationId) => {
      const updated = await markMockNotificationsRead(userId, [notificationId]);
      return updated[0] ?? notificationId;
    },
  },
});

export async function fetchNotifications(userId: string) {
  return notificationsRuntimeApi.fetchNotifications(userId);
}

export async function markNotificationsRead(userId: string, notificationIds: string[]) {
  return notificationsRuntimeApi.markNotificationsRead(userId, notificationIds);
}

export async function markNotificationRead(userId: string, notificationId: string) {
  return notificationsRuntimeApi.markNotificationRead(userId, notificationId);
}
