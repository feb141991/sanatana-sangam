import { getDharmVeerBySlug } from '@/lib/dharm-veer-db';
import DharmVeerClient from './DharmVeerClient';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { unstable_cache } from 'next/cache';

// Cache hero content for 1 hour — it only changes when the daily cron runs
const getCachedHero = unstable_cache(
  async (slug: string) => {
    const admin = createAdminClient() as unknown as { from: (t: string) => any };
    // Try daily cache table first
    const { data: daily } = await admin
      .from('dharm_veer_daily')
      .select('*')
      .eq('slug', slug)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (daily) return daily;
    // Fallback to legacy table
    const { data } = await admin
      .from('dharm_veers')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    return data ?? null;
  },
  ['dharm-veer-hero'],
  { revalidate: 3600, tags: ['dharm-veer'] }
);

export default async function DharmVeerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Run hero fetch (cached, via admin) and auth in PARALLEL
  // Previously: 3 sequential awaits. Now: 2 parallel + 1 conditional.
  const [rawHero, supabase] = await Promise.all([
    getDharmVeerBySlug(
      // Inline a lightweight admin client for the parallel hero fetch
      createAdminClient() as any,
      id
    ),
    createServerSupabaseClient(),
  ]);

  if (!rawHero) notFound();

  // Auth and profile fetch — only needs the user-Supabase client
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user
    ? (await supabase
        .from('profiles')
        .select('app_language, meaning_language, transliteration_language, show_transliteration, scripture_script')
        .eq('id', user.id)
        .single()).data
    : null;

  return (
    <DharmVeerClient
      hero={rawHero}
      appLanguage={(profile as any)?.app_language ?? 'en'}
      meaningLanguage={(profile as any)?.meaning_language ?? 'en'}
      transliterationLanguage={(profile as any)?.transliteration_language ?? 'en'}
      showTransliteration={(profile as any)?.show_transliteration ?? true}
      scriptureScript={(profile as any)?.scripture_script ?? 'original'}
    />
  );
}
