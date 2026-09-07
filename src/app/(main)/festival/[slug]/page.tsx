import { notFound } from 'next/navigation';
import FestivalClient from './FestivalClient';
import { lookupFestivalData, isFestivalPublishable, resolveFestivalText } from '@/lib/festival-data';
import { JsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const decodedSlug = decodeURIComponent(p.slug);
  const festival = lookupFestivalData(decodedSlug);

  if (!festival) return { title: 'Festival | Shoonaya' };

  const name = festival.name.value.en;
  const tagline = festival.tagline.value.en;

  return {
    title: `${name}: Significance, Rituals & Mantra | Shoonaya`,
    description: tagline.slice(0, 160),
    robots: isFestivalPublishable(festival) ? undefined : { index: false, follow: true },
    alternates: {
      canonical: `https://www.shoonaya.com/festival/${decodedSlug}`,
    },
  };
}

export default async function FestivalPage({ params }: Props) {
  const p = await params;
  const decodedSlug = decodeURIComponent(p.slug);
  const festival = lookupFestivalData(decodedSlug);

  if (!festival) {
    notFound();
  }

  const url = `https://www.shoonaya.com/festival/${decodedSlug}`;
  return <>
    {isFestivalPublishable(festival) && <>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebPage', url,
        name: resolveFestivalText(festival.name), description: resolveFestivalText(festival.tagline) }} />
      <BreadcrumbJsonLd items={[{ name: 'Home', url: 'https://www.shoonaya.com' },
        { name: resolveFestivalText(festival.name), url }]} />
    </>}
    <FestivalClient festival={festival} originalSlug={decodedSlug} />
  </>;
}
