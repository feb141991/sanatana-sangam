import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SEED_PATHS } from '@/lib/pathshala-paths';
import { GeoArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { extractPathshalaGeo } from '@/lib/seo/geo-extractors';
interface Props {
  params: Promise<{ pathId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pathId } = await params;
  const path = SEED_PATHS.find(p => p.id === pathId);
  
  if (!path) return { title: 'Pathshala | Shoonaya' };
  
  return {
    title: `${path.title} | Shoonaya`,
    description: path.description.slice(0, 160),
    openGraph: {
      title: path.title,
      description: path.description.slice(0, 160),
      type: 'article'
    },
    alternates: {
      canonical: `https://shoonaya.com/pathshala/${pathId}`
    }
  };
}

export default async function PathshalaPathPage({ params }: Props) {
  const { pathId } = await params;
  const path = SEED_PATHS.find(p => p.id === pathId);
  
  if (!path) notFound();

  const geo = extractPathshalaGeo(path);
  const canonicalUrl = `https://shoonaya.com/pathshala/${pathId}`;

  return (
    <>
      <GeoArticleJsonLd geo={geo} url={canonicalUrl} />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://shoonaya.com' },
        { name: 'Pathshala', url: 'https://shoonaya.com/pathshala' },
        { name: path.title, url: canonicalUrl }
      ]} />
      <meta httpEquiv="refresh" content={`0; url=/pathshala/${pathId}/lesson`} />
    </>
  );
}
