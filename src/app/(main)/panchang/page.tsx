import type { Metadata } from 'next';
import { cache } from 'react';
import { calculatePanchang } from '@/lib/panchang';
import { UJJAIN_LAT, UJJAIN_LON } from '@/lib/calendar/engine';
import { JsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import PanchangHub from './PanchangHub';

// Revalidate once per day — panchang data changes daily at midnight IST.
// This serves the page from Vercel's edge cache for all visitors,
// eliminating cold-start latency and Supabase auth overhead on every hit.
export const revalidate = 86400;

// Memoised per-request so generateMetadata and the page share one calculation.
const getPanchang = cache(() => {
  return calculatePanchang(new Date(), UJJAIN_LAT, UJJAIN_LON);
});

export async function generateMetadata(): Promise<Metadata> {
  const panchang = getPanchang();
  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    title: `Panchang and Astrology Hub for ${dateStr} | Shoonaya`,
    description: `Today's Astrology Hub: Panchang Tithi ${panchang.tithi}, Nakshatra ${panchang.nakshatra}. Explore daily horoscopes (Rashiphala) and generate birth charts (Vedic Kundali).`,
    openGraph: {
      title: `Daily Panchang & Astrology — ${panchang.tithi}`,
      description: `Explore today's Panchang, daily horoscope, and generate birth charts. Sunrise: ${panchang.sunrise} · Tithi: ${panchang.tithi}`,
      type: 'website',
      url: 'https://shoonaya.com/panchang',
    },
    alternates: {
      canonical: 'https://shoonaya.com/panchang',
    },
  };
}

export default function PanchangHubPage() {
  const panchang = getPanchang();

  const panchangSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": `Hindu Panchang and Astrology Hub for ${panchang.date}`,
    "description": "Daily Hindu almanac including tithi, nakshatra, daily horoscope, and online Vedic Kundali birth chart generation.",
    "url": "https://shoonaya.com/panchang",
    "keywords": ["panchang", "tithi", "horoscope", "kundali", "rashiphala", panchang.tithi, panchang.nakshatra],
    "creator": { "@type": "Organization", "name": "Shoonaya" },
    "temporalCoverage": panchang.date,
    "variableMeasured": [
      { "@type": "PropertyValue", "name": "Tithi", "value": `${panchang.tithi} (${panchang.paksha})` },
      { "@type": "PropertyValue", "name": "Nakshatra", "value": panchang.nakshatra },
      { "@type": "PropertyValue", "name": "Yoga", "value": panchang.yoga },
      { "@type": "PropertyValue", "name": "Vara", "value": panchang.vara },
      { "@type": "PropertyValue", "name": "Masa", "value": panchang.masaName },
    ],
  };

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://shoonaya.com' },
          { name: 'Panchang Hub', url: 'https://shoonaya.com/panchang' },
        ]}
      />
      <JsonLd data={panchangSchema} />
      {/* userRashi and tradition are fetched client-side in PanchangHub
          so this page can be fully cached at the edge. */}
      <PanchangHub panchang={panchang as any} />
    </>
  );
}
