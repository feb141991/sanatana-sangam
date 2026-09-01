import type { Metadata } from 'next';
import { cache } from 'react';
import { calculatePanchang, REFERENCE_LOCATION_UJJAIN } from '@/lib/panchang';
import { JsonLd, BreadcrumbJsonLd, PanchangJsonLd } from '@/components/seo/JsonLd';
import PanchangHub from './PanchangHub';

// Panchang is fully static — no auth, no cookies, pure computation.
// ISR with 86400s caused ~509s TTFB on cache miss (cold ISR function spinup
// + astronomia cold-load). Using revalidate=0 + on-demand revalidation via
// the midnight cron avoids stale-while-revalidate gaps entirely.
// The /api/cron/panchang-revalidate route calls revalidatePath('/panchang')
// at midnight IST so the page is always warm for the day.
export const revalidate = 0;
export const preferredRegion = ['dub1'];

// Memoised per-request so generateMetadata and the page share one calculation.
const getPanchang = cache(() => {
  return calculatePanchang(new Date(), REFERENCE_LOCATION_UJJAIN.lat, REFERENCE_LOCATION_UJJAIN.lon, REFERENCE_LOCATION_UJJAIN.tz);
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
      url: 'https://www.shoonaya.com/panchang',
    },
    alternates: {
      canonical: 'https://www.shoonaya.com/panchang',
    },
  };
}

export default function PanchangHubPage() {
  const panchang = getPanchang();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.shoonaya.com' },
          { name: 'Panchang Hub', url: 'https://www.shoonaya.com/panchang' },
        ]}
      />
      <PanchangJsonLd
        panchang={panchang}
        url="https://www.shoonaya.com/panchang"
        name={`Hindu Panchang and Astrology Hub for ${panchang.date}`}
        description="Daily Hindu almanac including tithi, nakshatra, daily horoscope, and online Vedic Kundali birth chart generation."
      />
      {/* userRashi and tradition are fetched client-side in PanchangHub
          so this page can be fully cached at the edge. */}
      <PanchangHub panchang={panchang as any} />
    </>
  );
}
