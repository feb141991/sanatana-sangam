import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import JournalClient from './JournalClient';
import { resolveObservanceLocation } from '@/lib/panchang';

export const metadata = {
  title: 'Spiritual Progress Journal — Shoonaya',
  description: 'Write your private spiritual autobiography, note daily moods, and receive wise AI reflections.',
};

export default async function JournalPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [profileResult, entriesResult, reflectionResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('tradition, timezone, full_name, username, latitude, longitude, city, neighbourhood')
      .eq('id', user.id)
      .single(),
    supabase
      .from('journal_entries')
      .select('id, user_id, entry_date, content, mood, tradition_context, tags, is_shared_to_kul, ai_reflection_generated, created_at')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .limit(30),
    supabase
      .from('journal_reflections')
      .select('id, user_id, generated_at, period, reflection_text, entry_ids, themes, is_shared_to_kul')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const profile = profileResult.data;
  const initialEntries = entriesResult.data || [];
  const initialReflection = reflectionResult.data || null;

  const tradition = profile?.tradition ?? 'other';
  const resolved = resolveObservanceLocation({
    saved: {
      lat: profile?.latitude,
      lon: profile?.longitude,
      tz: profile?.timezone,
      city: profile?.neighbourhood ?? profile?.city
    }
  });
  const timezone = resolved.tz;
  const userName = profile?.full_name || profile?.username || 'Seeker';

  return (
    <JournalClient
      userName={userName}
      tradition={tradition}
      timezone={timezone}
      initialEntries={initialEntries}
      initialReflection={initialReflection}
    />
  );
}
