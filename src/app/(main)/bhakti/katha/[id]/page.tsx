import { notFound } from 'next/navigation';
import { getKathaById } from '@/lib/katha-library';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import KathaReaderClient from './KathaReaderClient';
import type { Metadata } from 'next';
import { GeoArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { extractKathaGeo } from '@/lib/seo/geo-extractors';interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const katha = getKathaById(id);
  
  if (!katha) return { title: 'Katha | Shoonaya' };
  
  return {
    title: `${katha.title} | Shoonaya`,
    description: katha.preview.slice(0, 160),
    openGraph: {
      title: katha.title,
      description: katha.preview.slice(0, 160),
      type: 'article'
    },
    alternates: {
      canonical: `https://shoonaya.com/bhakti/katha/${id}`
    }
  };
}

export default async function KathaReaderPage({ params }: Props) {
  const { id } = await params;
  const katha = getKathaById(id);
  if (!katha) notFound();

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: {
    app_language?: string | null;
    meaning_language?: string | null;
    transliteration_language?: string | null;
    show_transliteration?: boolean | null;
  } | null = null;

  if (user) {
    const result = await supabase
      .from('profiles')
      .select('app_language, meaning_language, transliteration_language, show_transliteration')
      .eq('id', user.id)
      .maybeSingle();
    profile = result.data;
  }

  const geo = extractKathaGeo(katha);
  const canonicalUrl = `https://shoonaya.com/bhakti/katha/${id}`;

  return (
    <>
      <GeoArticleJsonLd geo={geo} url={canonicalUrl} />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://shoonaya.com' },
        { name: 'Bhakti', url: 'https://shoonaya.com/bhakti' },
        { name: 'Katha', url: 'https://shoonaya.com/bhakti/katha' },
        { name: katha.title, url: canonicalUrl }
      ]} />
      <KathaReaderClient
        katha={katha}
        appLanguage={profile?.app_language ?? 'en'}
        meaningLanguage={profile?.meaning_language ?? 'en'}
        transliterationLanguage={profile?.transliteration_language ?? 'en'}
        showTransliteration={profile?.show_transliteration ?? true}
      />
    </>
  );
}
