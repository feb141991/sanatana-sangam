import { createServerSupabaseClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import DiscoverDetailClient from './DiscoverDetailClient';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const supabase = await createServerSupabaseClient();
  const { data: piece } = await supabase
    .from('discover_content')
    .select('title, hook_question, body_short, og_image_url')
    .eq('slug', resolvedParams.slug)
    .eq('published', true)
    .maybeSingle();

  if (!piece) {
    return {
      title: 'Dharma Wisdom — Shoonaya',
    };
  }

  return {
    title: `${piece.title} — Shoonaya`,
    description: piece.body_short,
    openGraph: {
      title: piece.hook_question,
      description: piece.body_short,
      images: piece.og_image_url ? [{ url: piece.og_image_url }] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: piece.hook_question,
      description: piece.body_short,
      images: piece.og_image_url ? [piece.og_image_url] : [],
    },
  };
}

export default async function DiscoverPiecePage({ params }: Props) {
  const resolvedParams = await params;
  const supabase = await createServerSupabaseClient();
  
  // 1. Fetch current piece
  const { data: piece, error } = await supabase
    .from('discover_content')
    .select('id, slug, title, subtitle, tradition, category, hook_question, body_short, body_full, scripture_line, scripture_source, app_deep_link, og_image_url, published, created_at')
    .eq('slug', resolvedParams.slug)
    .eq('published', true)
    .maybeSingle();

  if (error || !piece) {
    notFound();
  }

  // 2. Fetch related pieces (same tradition, excluding current slug, limit 3)
  const { data: related } = await supabase
    .from('discover_content')
    .select('id, slug, title, hook_question, body_short, tradition, category')
    .eq('tradition', piece.tradition)
    .eq('published', true)
    .neq('slug', piece.slug)
    .limit(3);

  return (
    <DiscoverDetailClient 
      piece={piece} 
      relatedPieces={related || []} 
    />
  );
}
