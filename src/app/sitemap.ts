import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { VRAT_DATABASE } from '@/lib/vrat-data';
import { STOTRAMS } from '@/lib/stotrams';
import { ALL_KATHAS } from '@/lib/katha-library';
import { SEED_PATHS } from '@/lib/pathshala-paths';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://shoonaya.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/bhakti`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/pathshala`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/japa`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/discover`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/panchang`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  const vratRoutes: MetadataRoute.Sitemap = Object.keys(VRAT_DATABASE).map(slug => ({
    url: `${BASE_URL}/vrat/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const stotramRoutes: MetadataRoute.Sitemap = STOTRAMS.map(stotram => ({
    url: `${BASE_URL}/bhakti/stotram/${stotram.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const kathaRoutes: MetadataRoute.Sitemap = ALL_KATHAS.map(katha => ({
    url: `${BASE_URL}/bhakti/katha/${katha.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const pathshalaRoutes: MetadataRoute.Sitemap = SEED_PATHS.map(path => ({
    url: `${BASE_URL}/pathshala/${path.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  let discoverRoutes: MetadataRoute.Sitemap = [];
  let nameStoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const client = createClient(supabaseUrl, supabaseKey);
      
      const [discoverResult, nameStoryResult] = await Promise.all([
        client
          .from('discover_content')
          .select('slug, created_at')
          .eq('published', true),
        client
          .from('name_stories')
          .select('share_slug, generated_at')
          .eq('is_public', true)
      ]);
      
      if (discoverResult.data) {
        discoverRoutes = discoverResult.data.map(item => ({
          url: `${BASE_URL}/discover/${item.slug}`,
          lastModified: item.created_at ? new Date(item.created_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        }));
      }

      if (nameStoryResult.data) {
        nameStoryRoutes = nameStoryResult.data.map(item => ({
          url: `${BASE_URL}/name/${item.share_slug}`,
          lastModified: item.generated_at ? new Date(item.generated_at) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.5,
        }));
      }
    }
  } catch (err) {
    console.error('Error generating dynamic routes for sitemap:', err);
  }

  return [
    ...staticRoutes,
    ...vratRoutes,
    ...stotramRoutes,
    ...kathaRoutes,
    ...pathshalaRoutes,
    ...discoverRoutes,
    ...nameStoryRoutes,
  ];
}
