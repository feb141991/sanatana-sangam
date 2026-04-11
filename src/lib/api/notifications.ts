import { createClient } from '@/lib/supabase';
import type { Notification } from '@/types/database';

export async function fetchNotifications(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function markNotificationsRead(notificationIds: string[]) {
  if (!notificationIds.length) return [];
  const supabase = createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .in('id', notificationIds);

  if (error) throw error;
  return notificationIds;
}

export async function markNotificationRead(notificationId: string) {
  const updated = await markNotificationsRead([notificationId]);
  return updated[0] ?? notificationId;
}
