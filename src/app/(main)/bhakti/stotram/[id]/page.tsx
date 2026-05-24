import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getStotramById } from '@/lib/stotrams';
import { GeoArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
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
  
  return {
    title: `${stotram.title} | Shoonaya`,
    description: stotram.description.slice(0, 160),
    openGraph: {
      title: stotram.title,
      description: stotram.description.slice(0, 160),
      type: 'article'
    },
    alternates: {
      canonical: `https://shoonaya.com/bhakti/stotram/${decodedId}`
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
  const canonicalUrl = `https://shoonaya.com/bhakti/stotram/${decodedId}`;
  
  return (
    <>
      <GeoArticleJsonLd geo={geo} url={canonicalUrl} />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://shoonaya.com' },
        { name: 'Bhakti', url: 'https://shoonaya.com/bhakti' },
        { name: 'Stotrams', url: 'https://shoonaya.com/bhakti/browse' },
        { name: stotram.title, url: canonicalUrl }
      ]} />
      <StotramClient params={params} />
    </>
  );
}
