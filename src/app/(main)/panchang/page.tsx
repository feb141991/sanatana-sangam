import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { calculatePanchang } from '@/lib/panchang';
import { UJJAIN_LAT, UJJAIN_LON } from '@/lib/calendar/engine';
import { JsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import PanchangClient from './PanchangClient';

export async function generateMetadata(): Promise<Metadata> {
  const today = new Date();
  const panchang = calculatePanchang(today, UJJAIN_LAT, UJJAIN_LON);
  const dateStr = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    title: `Panchang for ${dateStr} — ${panchang.tithi}, ${panchang.nakshatra} | Shoonaya`,
    description: `Today's Panchang: Tithi ${panchang.tithi} (${panchang.paksha}), Nakshatra ${panchang.nakshatra}, Yoga ${panchang.yoga}. Sunrise ${panchang.sunrise}, Rahu Kaal ${panchang.rahuKaal}. Astronomy-backed calculation using Lahiri ayanamsha.`,
    openGraph: {
      title: `Daily Panchang — ${panchang.tithi} ${panchang.paksha}`,
      description: `Nakshatra: ${panchang.nakshatra} · Yoga: ${panchang.yoga} · Sunrise: ${panchang.sunrise}`,
      type: 'website',
      url: 'https://shoonaya.com/panchang',
    },
    alternates: {
      canonical: 'https://shoonaya.com/panchang',
    },
  };
}

export default async function PanchangPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let lat       = 28.6139; // Default: New Delhi
  let lon       = 77.2090;
  let city      = '';
  let tradition = 'hindu';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('latitude, longitude, city, neighbourhood, tradition')
      .eq('id', user.id)
      .single();
    if (profile?.latitude)  lat       = profile.latitude;
    if (profile?.longitude) lon       = profile.longitude;
    if (profile?.city)      city      = profile.neighbourhood ?? profile.city;
    if (profile?.tradition) tradition = profile.tradition;
  }

  const today = new Date();
  const panchang = calculatePanchang(today, UJJAIN_LAT, UJJAIN_LON);
  const panchangSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": `Hindu Panchang for ${panchang.date}`,
    "description": "Daily Hindu almanac including tithi, nakshatra, yoga, karana, vara, muhurta and auspicious timings.",
    "url": "https://shoonaya.com/panchang",
    "keywords": ["panchang", "tithi", "nakshatra", "muhurta", panchang.tithi, panchang.nakshatra, panchang.masaName],
    "creator": { "@type": "Organization", "name": "Shoonaya" },
    "temporalCoverage": panchang.date,
    "variableMeasured": [
      { "@type": "PropertyValue", "name": "Tithi", "value": `${panchang.tithi} (${panchang.paksha})` },
      { "@type": "PropertyValue", "name": "Nakshatra", "value": panchang.nakshatra },
      { "@type": "PropertyValue", "name": "Yoga", "value": panchang.yoga },
      { "@type": "PropertyValue", "name": "Vara", "value": panchang.vara },
      { "@type": "PropertyValue", "name": "Masa", "value": panchang.masaName },
      { "@type": "PropertyValue", "name": "Sunrise", "value": panchang.sunrise },
      { "@type": "PropertyValue", "name": "Sunset", "value": panchang.sunset },
      { "@type": "PropertyValue", "name": "Rahu Kaal", "value": panchang.rahuKaal },
      { "@type": "PropertyValue", "name": "Brahma Muhurta", "value": panchang.brahmaMuhurta },
      { "@type": "PropertyValue", "name": "Abhijit Muhurat", "value": panchang.abhijitMuhurat },
    ],
  };

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://shoonaya.com' },
          { name: 'Panchang', url: 'https://shoonaya.com/panchang' },
        ]}
      />
      <JsonLd data={panchangSchema} />
      <PanchangClient lat={lat} lon={lon} city={city} tradition={tradition} />
    </>
  );
}
