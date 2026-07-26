import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import KundaliClient from './KundaliClient';

export const metadata: Metadata = {
  title: 'Free Vedic Kundali: Generate Birth Chart Online | Shoonaya',
  description: 'Generate a free Vedic Kundali birth chart online with Lagna, planetary placements, Shadbala strengths, Dasha periods and Sade Sati status.',
  alternates: {
    canonical: 'https://www.shoonaya.com/kundali',
  },
  openGraph: {
    title: 'Free Vedic Kundali: Generate Birth Chart Online',
    description: 'Create your Vedic birth chart with Lagna, planets, Dasha and Shadbala.',
    url: 'https://www.shoonaya.com/kundali',
    type: 'website',
  },
};

export default async function KundaliPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let lat      = 28.6139; // Default: New Delhi
  let lon      = 77.2090;
  let city     = '';
  let timezone = 'Asia/Kolkata';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('latitude, longitude, city, neighbourhood, timezone')
      .eq('id', user.id)
      .single();
    if (profile?.latitude)  lat      = profile.latitude;
    if (profile?.longitude) lon      = profile.longitude;
    if (profile?.city)      city     = profile.neighbourhood ?? profile.city;
    if (profile?.timezone)  timezone = profile.timezone;
  }

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.shoonaya.com' },
          { name: 'Panchang', url: 'https://www.shoonaya.com/panchang' },
          { name: 'Kundali', url: 'https://www.shoonaya.com/kundali' },
        ]}
      />
      <KundaliClient lat={lat} lon={lon} city={city} timezone={timezone} />
    </>
  );
}
