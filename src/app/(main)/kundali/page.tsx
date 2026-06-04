import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import KundaliClient from './KundaliClient';

export const metadata: Metadata = {
  title: 'Vedic Kundali Chart — Generate Birth Chart Online | Shoonaya',
  description: 'Generate your free Vedic Kundali birth chart, check your planet placements, shadbala strengths, dasha periods, and Sade Sati status.',
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
          { name: 'Home', url: 'https://shoonaya.com' },
          { name: 'Panchang', url: 'https://shoonaya.com/panchang' },
          { name: 'Kundali', url: 'https://shoonaya.com/kundali' },
        ]}
      />
      <KundaliClient lat={lat} lon={lon} city={city} timezone={timezone} />
    </>
  );
}
