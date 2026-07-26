import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-cache';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import RashiphalClient from './RashiphalClient';

export const metadata: Metadata = {
  title: 'Rashiphala Today: Daily Vedic Horoscope by Rashi | Shoonaya',
  description: 'Read today’s Rashiphala and personalised Vedic horoscope by moon sign, with daily guidance for love, work, wellbeing, karma and sadhana.',
  alternates: {
    canonical: 'https://www.shoonaya.com/rashiphala',
  },
  openGraph: {
    title: 'Rashiphala Today: Daily Vedic Horoscope',
    description: 'Daily Vedic horoscope guidance based on your moon sign.',
    url: 'https://www.shoonaya.com/rashiphala',
    type: 'website',
  },
};

export default async function RashiphalaPage() {
  const user = await getAuthUser();

  let userRashi: string | null = null;
  let timezone = 'Asia/Kolkata';

  if (user) {
    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('rashi, timezone')
      .eq('id', user.id)
      .single();
    if (profile?.rashi) userRashi = profile.rashi;
    if (profile?.timezone) timezone = profile.timezone;
  }

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.shoonaya.com' },
          { name: 'Panchang', url: 'https://www.shoonaya.com/panchang' },
          { name: 'Rashiphala', url: 'https://www.shoonaya.com/rashiphala' },
        ]}
      />
      <RashiphalClient userRashi={userRashi} timezone={timezone} />
    </>
  );
}
