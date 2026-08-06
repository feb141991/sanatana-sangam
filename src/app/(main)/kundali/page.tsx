import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import KundaliClient from './KundaliClient';
import { resolveObservanceLocation } from '@/lib/panchang';

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

  let rawLat: number | null = null;
  let rawLon: number | null = null;
  let city     = '';
  let timezone: string | undefined;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('latitude, longitude, city, neighbourhood, timezone')
      .eq('id', user.id)
      .single();
    if (profile) {
      if (profile.latitude != null)  rawLat    = profile.latitude;
      if (profile.longitude != null) rawLon    = profile.longitude;
      if (profile.city)      city     = profile.neighbourhood ?? profile.city;
      if (profile.timezone)  timezone = profile.timezone;
    }
  }

  const resolved = resolveObservanceLocation({
    saved: { lat: rawLat, lon: rawLon, tz: timezone, city }
  });

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.shoonaya.com' },
          { name: 'Panchang', url: 'https://www.shoonaya.com/panchang' },
          { name: 'Kundali', url: 'https://www.shoonaya.com/kundali' },
        ]}
      />
      <KundaliClient
        lat={resolved.lat}
        lon={resolved.lon}
        city={resolved.label}
        timezone={resolved.tz}
        isReference={resolved.isReference}
      />
    </>
  );
}
