import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-cache';
import SettingsClient from './SettingsClient';
import type { Database } from '@/types/database';

type SubscriptionStatus = Database['public']['Tables']['profiles']['Row']['subscription_status'];

export default async function SettingsPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createServerSupabaseClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id,
      tradition,
      transliteration_language,
      japa_reminder_enabled,
      japa_reminder_time,
      quiz_reminder_enabled,
      quiz_reminder_time,
      nitya_reminder_enabled,
      nitya_reminder_time,
      nitya_rhythm_mode,
      wants_madhyahn_reminder,
      madhyahn_reminder_time,
      wants_evening_reminder,
      evening_reminder_time,
      subscription_status
    `)
    .eq('id', user.id)
    .single();

  return (
    <SettingsClient
      userId={user.id}
      initialTradition={profile?.tradition ?? 'hindu'}
      initialTransliterationLanguage={profile?.transliteration_language ?? 'en'}
      initialJapaReminderEnabled={profile?.japa_reminder_enabled ?? false}
      initialJapaReminderTime={profile?.japa_reminder_time ?? '07:00'}
      initialQuizReminderEnabled={profile?.quiz_reminder_enabled ?? false}
      initialQuizReminderTime={profile?.quiz_reminder_time ?? '08:00'}
      initialNityaReminderEnabled={profile?.nitya_reminder_enabled ?? false}
      initialNityaReminderTime={profile?.nitya_reminder_time ?? '06:30'}
      initialWantsMadhyahnReminder={profile?.wants_madhyahn_reminder ?? false}
      initialMadhyahnReminderTime={profile?.madhyahn_reminder_time ?? '12:00'}
      initialWantsEveningReminder={profile?.wants_evening_reminder ?? false}
      initialEveningReminderTime={profile?.evening_reminder_time ?? '18:30'}
      initialNityaRhythmMode={profile?.nitya_rhythm_mode ?? 'morning'}
      subscriptionStatus={(profile?.subscription_status ?? 'free') as SubscriptionStatus}
    />
  );
}
