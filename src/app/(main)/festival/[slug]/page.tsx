import { notFound } from 'next/navigation';
import FestivalClient from './FestivalClient';
import { lookupFestivalData } from '@/lib/festival-data';
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

  return <FestivalClient festival={festival} originalSlug={decodedSlug} />;
}
