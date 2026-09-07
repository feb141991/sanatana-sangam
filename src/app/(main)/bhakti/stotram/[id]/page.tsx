import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getStotramById, DEITY_META } from '@/lib/stotrams';
import { GeoArticleJsonLd, BreadcrumbJsonLd, JsonLd } from '@/components/seo/JsonLd';
import { DEVOTIONAL_STARTER_TRACKS } from '@/lib/devotional-audio';
import { extractStotramGeo } from '@/lib/seo/geo-extractors';
import StotramClient from './StotramClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const stotram = getStotramById(decodedId);
  
  if (!stotram) return { title: 'Stotram | Shoonaya' };

  const description = `${stotram.description} Read the original ${stotram.language}, transliteration and verse-by-verse meaning.`.slice(0, 160);
  
  return {
    title: `${stotram.title}: Lyrics, Transliteration & Meaning | Shoonaya`,
    description,
    openGraph: {
      title: `${stotram.title}: Lyrics & Meaning`,
      description,
      type: 'article',
      url: `https://www.shoonaya.com/bhakti/stotram/${decodedId}`,
    },
    alternates: {
      canonical: `https://www.shoonaya.com/bhakti/stotram/${decodedId}`
    }
  };
}

export default async function StotramPage({ params }: Props) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const stotram = getStotramById(decodedId);
  
  if (!stotram) {
    notFound();
  }
  
  const geo = extractStotramGeo(stotram);
  const track = DEVOTIONAL_STARTER_TRACKS.find(item => item.id === stotram.audioTrackId
    && item.approvalStatus === 'approved' && item.inAppPlayback && item.audioUrl);
  const canonicalUrl = `https://www.shoonaya.com/bhakti/stotram/${decodedId}`;
  const deityMeta = stotram.deity ? (DEITY_META[stotram.deity] ?? DEITY_META.universal) : (DEITY_META.universal ?? null);

  return (
    <>
      <GeoArticleJsonLd geo={geo} url={canonicalUrl} />
      {track && <JsonLd data={{ '@context': 'https://schema.org', '@type': 'AudioObject',
        name: track.title, contentUrl: track.audioUrl, url: canonicalUrl,
        creator: { '@type': 'Person', name: track.creator }, creditText: track.attributionText,
        isBasedOn: track.sourceUrl }} />}
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://www.shoonaya.com' },
        { name: 'Bhakti', url: 'https://www.shoonaya.com/bhakti' },
        { name: 'Stotrams', url: 'https://www.shoonaya.com/bhakti/browse' },
        { name: stotram.title, url: canonicalUrl }
      ]} />
      <StotramClient params={params} stotram={stotram} deityMeta={deityMeta} />
    </>
  );
}
