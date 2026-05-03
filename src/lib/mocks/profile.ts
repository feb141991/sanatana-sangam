import type { Notification, Profile } from '@/types/database';

const profileStore = new Map<string, Profile>();
const notificationStore = new Map<string, Notification[]>();

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function ensureMockProfile(userId: string): Profile {
  if (!profileStore.has(userId)) {
    profileStore.set(userId, {
      id: userId,
      created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
      updated_at: new Date().toISOString(),
      full_name: 'Prince Sharma',
      username: 'prince',
      avatar_url: null,
      bio: 'Building a calmer sacred practice stack.',
      city: 'London',
      country: 'United Kingdom',
      latitude: null,
      longitude: null,
      sampradaya: 'vaishnava',
      ishta_devata: 'krishna',
      spiritual_level: 'sadhaka',
      kul: 'Sharma',
      gotra: 'Bharadwaj',
      kul_devata: 'Radha Krishna',
      home_town: 'Mathura',
      shloka_streak: 14,
      last_shloka_date: null,
      languages: ['en'],
      seeking: ['daily_practice'],
      seva_score: 120,
      mandali_id: 'mock-mandali-1',
      onesignal_player_id: null,
      country_code: 'GB',
      timezone: 'Europe/London',
      tradition: 'hindu',
      custom_greeting: 'Keep one practice steady today.',
      app_language: 'en',
      scripture_script: 'original',
      show_transliteration: true,
      meaning_language: 'en',
      wants_festival_reminders: true,
      wants_shloka_reminders: true,
      wants_community_notifications: true,
      wants_family_notifications: true,
      notification_quiet_hours_start: 22,
      notification_quiet_hours_end: 7,
      is_admin: false,
      is_pro: false,
      life_stage: 'grihastha',
      life_stage_locked: false,
      gender_context: 'general',
      date_of_birth: null,
    });
  }

  return profileStore.get(userId)!;
}

function ensureMockNotifications(userId: string): Notification[] {
  if (!notificationStore.has(userId)) {
    notificationStore.set(userId, [
      {
        id: `notif-${userId}-1`,
        created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        user_id: userId,
        title: 'Festival reminder ready',
        body: 'Akshaya Tritiya is tomorrow. Keep the day clear for one small observance.',
        emoji: '🪔',
        type: 'festival',
        read: false,
        action_url: '/home?focus=festivals',
        notification_key: `festival:${userId}:1`,
        local_date: '2026-04-17',
        sent_timezone: 'Europe/London',
      },
      {
        id: `notif-${userId}-2`,
        created_at: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
        user_id: userId,
        title: 'Kul update',
        body: 'A family event note was added to your Kul space.',
        emoji: '🫶',
        type: 'mandali',
        read: true,
        action_url: '/kul',
        notification_key: `kul:${userId}:1`,
        local_date: '2026-04-17',
        sent_timezone: 'Europe/London',
      },
    ]);
  }

  return notificationStore.get(userId)!;
}

export async function fetchMockProfile(userId: string) {
  return clone(ensureMockProfile(userId));
}

export async function updateMockProfile(userId: string, payload: Partial<Profile>) {
  const current = ensureMockProfile(userId);
  const next = {
    ...current,
    ...payload,
    updated_at: new Date().toISOString(),
  };
  profileStore.set(userId, next);
  return clone(next);
}

export async function fetchMockNotifications(userId: string) {
  return clone(ensureMockNotifications(userId));
}

export async function markMockNotificationsRead(userId: string, notificationIds: string[]) {
  const notifications = ensureMockNotifications(userId);
  for (const notification of notifications) {
    if (notificationIds.includes(notification.id)) notification.read = true;
  }
  return notificationIds;
}
