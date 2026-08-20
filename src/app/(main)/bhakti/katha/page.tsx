import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import KathaClient from './KathaClient';
import { ALL_KATHAS, getKathasByTradition, toKathaSummary } from '@/lib/katha-library';

export const metadata: Metadata = {
  title: 'Sacred Kathas & Spiritual Stories with Meaning | Shoonaya',
  description: 'Read Hindu kathas, Sikh sakhis, Buddhist Dhamma stories and Jain wisdom tales with their meaning, tradition, occasion and spiritual significance.',
  alternates: {
    canonical: 'https://www.shoonaya.com/bhakti/katha',
  },
  openGraph: {
    title: 'Sacred Kathas & Spiritual Stories with Meaning',
    description: 'Explore sacred stories across Hindu, Sikh, Buddhist and Jain traditions.',
    url: 'https://www.shoonaya.com/bhakti/katha',
    type: 'website',
  },
};

export default async function KathaPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let tradition = 'other';
  let userName = 'Sadhak';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tradition, name')
      .eq('id', user.id)
      .single();
    if (profile) {
      tradition = profile.tradition || 'other';
      userName = profile.name || 'Sadhak';
    }
  }

  // Today's featured katha — rotate by day of year
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const todayKatha = ALL_KATHAS[dayOfYear % ALL_KATHAS.length];

  // This week's kathas — next 5 after today's
  const weekKathas = Array.from({ length: 5 }, (_, i) => ALL_KATHAS[(dayOfYear + i + 1) % ALL_KATHAS.length]);

  // Tradition kathas
  const traditionKathas = getKathasByTradition(tradition as any).slice(0, 6);

  return (
    <KathaClient
      todayKatha={toKathaSummary(todayKatha)}
      weekKathas={weekKathas.map(toKathaSummary)}
      traditionKathas={traditionKathas.map(toKathaSummary)}
      allKathas={ALL_KATHAS.map(toKathaSummary)}
      tradition={tradition}
      userName={userName}
    />
  );
}
