import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import DiscoverClient from './DiscoverClient';

export const metadata = { title: 'Discover — Mood-Based Guidance' };

export default async function DiscoverPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: sankalpa }, { data: todayObservance }] = await Promise.all([
    supabase
      .from('profiles')
      .select('tradition, spiritual_level, transliteration_language')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('sankalpa')
      .select('name, start_date, target_days, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
    supabase
      .from('observance_occurrences')
      .select('date, observance_definitions!inner(display_name, emoji, slug, route_kind, route_slug)')
      .gte('date', new Date().toISOString().slice(0, 10))
      .lte('date', new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10))
      .eq('observance_definitions.active', true)
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  let activeSankalpa = null;
  if (sankalpa) {
    const startMs = new Date(sankalpa.start_date + 'T00:00:00Z').getTime();
    const daysSinceStart = Math.floor((Date.now() - startMs) / 86400000);
    const streakDays = Math.min(Math.max(0, daysSinceStart + 1), sankalpa.target_days);
    activeSankalpa = {
      name: sankalpa.name,
      streakDays,
      targetDays: sankalpa.target_days,
    };
  }

  let nextObservance = null;
  if (todayObservance) {
    const obsDate = new Date(todayObservance.date + 'T00:00:00Z').getTime();
    const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z').getTime();
    const daysAway = Math.max(0, Math.round((obsDate - today) / 86400000));
    
    // Use type assertion since the joined table might be typed as an array or single object by Supabase
    const def = Array.isArray(todayObservance.observance_definitions) 
      ? todayObservance.observance_definitions[0] 
      : todayObservance.observance_definitions as any;

    if (def) {
      nextObservance = {
        name: def.display_name,
        emoji: def.emoji,
        daysAway,
        slug: def.route_slug || def.slug,
        routeKind: def.route_kind || 'vrat',
      };
    }
  }

  return (
    <DiscoverClient
      tradition={profile?.tradition ?? null}
      spiritualLevel={profile?.spiritual_level ?? null}
      transliterationLanguage={profile?.transliteration_language ?? 'en'}
      activeSankalpa={activeSankalpa}
      nextObservance={nextObservance}
    />
  );
}
