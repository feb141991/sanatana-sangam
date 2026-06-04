import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import RashiphalClient from './RashiphalClient';

export const metadata: Metadata = {
  title: 'Daily Rashiphala — Personalised Vedic Horoscope | Shoonaya',
  description: 'Read your daily Vedic horoscope (Rashiphala) with direct sadhana and karma guidance based on your moon sign.',
};

export default async function RashiphalaPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userRashi: string | null = null;
  let timezone = 'Asia/Kolkata';

  if (user) {
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
          { name: 'Home', url: 'https://shoonaya.com' },
          { name: 'Panchang', url: 'https://shoonaya.com/panchang' },
          { name: 'Rashiphala', url: 'https://shoonaya.com/rashiphala' },
        ]}
      />
      <RashiphalClient userRashi={userRashi} timezone={timezone} />
    </>
  );
}
