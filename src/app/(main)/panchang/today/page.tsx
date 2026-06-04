import type { Metadata } from 'next';
import { cache } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { calculatePanchang } from '@/lib/panchang';
import { UJJAIN_LAT, UJJAIN_LON } from '@/lib/calendar/engine';
import { JsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import PanchangDetail from './PanchangDetail';

// Memoised per-request: generateMetadata and the page share one calculation.
const getDefaultPanchang = cache(() => {
  return calculatePanchang(new Date(), UJJAIN_LAT, UJJAIN_LON);
});

export async function generateMetadata(): Promise<Metadata> {
  const panchang = getDefaultPanchang();
  const dateStr = new Date().toLocaleDateString('en-IN', {
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
      url: 'https://shoonaya.com/panchang/today',
    },
    alternates: {
      canonical: 'https://shoonaya.com/panchang/today',
    },
  };
}

export default async function PanchangDetailPage() {
  const supabase = await createServerSupabaseClient();

  // Run auth + profile fetch with a race against a 4 s timeout so a slow
  // Supabase cold-start never blocks the page beyond that.
  let lat       = 28.6139;
  let lon       = 77.2090;
  let city      = '';
  let tradition = 'hindu';
  let timezone: string | undefined;

  try {
    const timeout = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('profile_timeout')), 4000)
    );

    const profileFetch = supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return null;
      const { data: profile } = await supabase
        .from('profiles')
        .select('latitude, longitude, city, neighbourhood, tradition, timezone')
        .eq('id', data.user.id)
        .single();
      return profile;
    });

    const profile = await Promise.race([profileFetch, timeout]);
    if (profile) {
      if (profile.latitude)  lat       = profile.latitude;
      if (profile.longitude) lon       = profile.longitude;
      if (profile.city)      city      = profile.neighbourhood ?? profile.city;
      if (profile.tradition) tradition = profile.tradition;
      if (profile.timezone)  timezone  = profile.timezone;
    }
  } catch {
    // Falls back to Delhi defaults — better to show something than hang.
  }

  // Re-use cached default panchang if coords are still Delhi (common case),
  // otherwise compute with user's location.
  const isDefaultCoords = lat === 28.6139 && lon === 77.2090 && !timezone;
  const panchang = isDefaultCoords
    ? getDefaultPanchang()
    : calculatePanchang(new Date(), lat, lon, timezone);

  const panchangSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": `Hindu Panchang for ${panchang.date}`,
    "description": "Daily Hindu almanac including tithi, nakshatra, yoga, karana, vara, muhurta and auspicious timings.",
    "url": "https://shoonaya.com/panchang/today",
    "keywords": ["panchang", "tithi", "nakshatra", "muhurta", panchang.tithi, panchang.nakshatra, panchang.masaName],
    "creator": { "@type": "Organization", "name": "Shoonaya" },
    "temporalCoverage": panchang.date,
    "variableMeasured": [
      { "@type": "PropertyValue", "name": "Tithi",         "value": `${panchang.tithi} (${panchang.paksha})` },
      { "@type": "PropertyValue", "name": "Nakshatra",     "value": panchang.nakshatra },
      { "@type": "PropertyValue", "name": "Yoga",          "value": panchang.yoga },
      { "@type": "PropertyValue", "name": "Vara",          "value": panchang.vara },
      { "@type": "PropertyValue", "name": "Masa",          "value": panchang.masaName },
      { "@type": "PropertyValue", "name": "Sunrise",       "value": panchang.sunrise },
      { "@type": "PropertyValue", "name": "Sunset",        "value": panchang.sunset },
      { "@type": "PropertyValue", "name": "Rahu Kaal",     "value": panchang.rahuKaal },
      { "@type": "PropertyValue", "name": "Brahma Muhurta","value": panchang.brahmaMuhurta },
      { "@type": "PropertyValue", "name": "Abhijit Muhurat","value": panchang.abhijitMuhurat },
    ],
  };

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home',    url: 'https://shoonaya.com' },
          { name: 'Panchang', url: 'https://shoonaya.com/panchang' },
          { name: 'Today',   url: 'https://shoonaya.com/panchang/today' },
        ]}
      />
      <JsonLd data={panchangSchema} />
      <PanchangDetail lat={lat} lon={lon} city={city} tradition={tradition} timezone={timezone} />
    </>
  );
}
