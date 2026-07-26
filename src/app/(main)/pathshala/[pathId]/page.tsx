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

  const description = `${path.description} Follow a ${path.total_lessons}-lesson guided scripture course for ${path.difficulty} learners.`.slice(0, 160);
  
  return {
    title: `${path.title}: Guided Scripture Course | Shoonaya`,
    description,
    openGraph: {
      title: `${path.title}: Guided Scripture Course`,
      description,
      type: 'article',
      url: `https://www.shoonaya.com/pathshala/${pathId}`,
    },
    alternates: {
      canonical: `https://www.shoonaya.com/pathshala/${pathId}`
    }
  };
}

export default async function PathshalaPathPage({ params }: Props) {
  const { pathId } = await params;
  const path = SEED_PATHS.find(p => p.id === pathId);
  
  if (!path) notFound();

  const geo = extractPathshalaGeo(path);
  const canonicalUrl = `https://www.shoonaya.com/pathshala/${pathId}`;

  return (
    <>
      <GeoArticleJsonLd geo={geo} url={canonicalUrl} />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://www.shoonaya.com' },
        { name: 'Pathshala', url: 'https://www.shoonaya.com/pathshala' },
        { name: path.title, url: canonicalUrl }
      ]} />
      <meta httpEquiv="refresh" content={`0; url=/pathshala/${pathId}/lesson`} />
    </>
  );
}
