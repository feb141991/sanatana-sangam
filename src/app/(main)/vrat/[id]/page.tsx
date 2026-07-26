import { createServerSupabaseClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import VratClient from './VratClient';
import { lookupVratData } from '@/lib/vrat-data';
import type { Metadata } from 'next';
import { GeoArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { extractVratGeo } from '@/lib/seo/geo-extractors';

interface Props {
  params: Promise<{ id: string }>;
}


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const decodedId = decodeURIComponent(p.id);
  const vrat = lookupVratData(decodedId);
  
  if (!vrat) return { title: 'Vrat | Shoonaya' };

  const description = `${vrat.tagline}. Learn its meaning, fasting rules, puja practice, parana guidance and mantra.`.slice(0, 160);
  
  return {
    title: `${vrat.name}: Meaning, Fasting Rules, Puja & Mantra | Shoonaya`,
    description,
    openGraph: {
      title: `${vrat.name}: Meaning, Rules & Puja`,
      description,
      type: 'article',
      url: `https://www.shoonaya.com/vrat/${decodedId}`,
    },
    alternates: {
      canonical: `https://www.shoonaya.com/vrat/${decodedId}`
    }
  };
}

export default async function VratPage({ params }: Props) {
  const p = await params;
  const decodedId = decodeURIComponent(p.id);
  const vratData = lookupVratData(decodedId);
  const supabase = await createServerSupabaseClient();

  if (!vratData) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  const profile = user
    ? (await supabase
        .from('profiles')
        .select('app_language, meaning_language, transliteration_language, show_transliteration, scripture_script')
        .eq('id', user.id)
        .single()).data
    : null;

  const geo = extractVratGeo(vratData);
  const canonicalUrl = `https://www.shoonaya.com/vrat/${decodedId}`;

  return (
    <>
      <GeoArticleJsonLd geo={geo} url={canonicalUrl} />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://www.shoonaya.com' },
        { name: 'Vrat', url: 'https://www.shoonaya.com/vrat' },
        { name: vratData.name, url: canonicalUrl }
      ]} />
      <VratClient
        vrat={vratData}
        originalSlug={decodedId}
        isAuthenticated={!!user}
        appLanguage={(profile as any)?.app_language ?? 'en'}
        meaningLanguage={(profile as any)?.meaning_language ?? 'en'}
        transliterationLanguage={(profile as any)?.transliteration_language ?? 'en'}
        showTransliteration={(profile as any)?.show_transliteration ?? true}
        scriptureScript={(profile as any)?.scripture_script ?? 'original'}
      />
    </>
  );
}
