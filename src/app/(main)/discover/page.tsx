import { createServerSupabaseClient } from '@/lib/supabase-server';
import DiscoverGatewayClient from './DiscoverGatewayClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Discover Dharma — Shoonaya',
  description: 'Uncover the scientific and philosophical meanings behind dharmic traditions. Relieve doubts, understand rituals, and connect back to your roots.',
};

export default async function DiscoverPage() {
  const supabase = await createServerSupabaseClient();
  
  const { data: pieces, error } = await supabase
    .from('discover_content')
    .select('id, slug, title, subtitle, tradition, category, hook_question, body_short, body_full, scripture_line, scripture_source, app_deep_link, og_image_url, published, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching discover pieces:', error);
  }

  return (
    <DiscoverGatewayClient initialPieces={pieces || []} />
  );
}
