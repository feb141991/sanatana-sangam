import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { VRAT_DATABASE } from '@/lib/vrat-data';
import { STOTRAMS } from '@/lib/stotrams';
import { ALL_KATHAS } from '@/lib/katha-library';

// Search indexing has one canonical production origin. Do not derive sitemap
// URLs from deployment environment variables, which may point at preview
// domains or a non-canonical hostname.
const BASE_URL = 'https://www.shoonaya.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    // Core landing
    { url: `${BASE_URL}`,                        changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/what-is-shoonaya`,       changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/pricing`,                changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/about`,                  changeFrequency: 'monthly', priority: 0.6 },

    // High search-intent pages — daily content, should rank for panchang/rashiphala queries
    { url: `${BASE_URL}/panchang`,         changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/panchang/today`,   changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/rashiphala`,       changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/kundali`,          changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/tirtha-map`,       changeFrequency: 'weekly',  priority: 0.8 },

    // Content / learning
    { url: `${BASE_URL}/bhakti`,           changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/bhakti/aarti`,     changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/bhakti/browse`,    changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/bhakti/katha`,     changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/discover`,         changeFrequency: 'daily',   priority: 0.7 },

    // Public practice tools
    { url: `${BASE_URL}/nitya-karma`,      changeFrequency: 'weekly',  priority: 0.6 },

    // Public / legal
    { url: `${BASE_URL}/privacy`,          changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/terms`,            changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/contact`,          changeFrequency: 'yearly',  priority: 0.3 },
  ];

  const vratRoutes: MetadataRoute.Sitemap = Object.keys(VRAT_DATABASE).map(slug => ({
    url: `${BASE_URL}/vrat/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const stotramRoutes: MetadataRoute.Sitemap = STOTRAMS.map(stotram => ({
    url: `${BASE_URL}/bhakti/stotram/${stotram.id}`,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const kathaRoutes: MetadataRoute.Sitemap = ALL_KATHAS.map(katha => ({
    url: `${BASE_URL}/bhakti/katha/${katha.id}`,
    changeFrequency: 'monthly',
    priority: 0.7,
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
          ...(item.created_at ? { lastModified: new Date(item.created_at) } : {}),
          changeFrequency: 'weekly',
          priority: 0.8,
        }));
      }

      if (nameStoryResult.data) {
        nameStoryRoutes = nameStoryResult.data.map(item => ({
          url: `${BASE_URL}/name/${item.share_slug}`,
          ...(item.generated_at ? { lastModified: new Date(item.generated_at) } : {}),
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
    ...discoverRoutes,
    ...nameStoryRoutes,
  ];
}
