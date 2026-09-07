import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { VRAT_DATABASE } from '@/lib/vrat-data';
import { STOTRAMS } from '@/lib/stotrams';
import { ALL_KATHAS, getCanonicalKathaId } from '@/lib/katha-library';
import { SEED_PATHS } from '@/lib/pathshala-paths';
import { getPublishableFestivalSlugs } from '@/lib/festival-data';
import { deduplicateSitemap, readSitemapPages } from '@/lib/seo/sitemap-pages';

// Search indexing has one canonical production origin. Do not derive sitemap
// URLs from deployment environment variables, which may point at preview
// domains or a non-canonical hostname.
const BASE_URL = 'https://www.shoonaya.com';
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    // Core landing
    { url: `${BASE_URL}/`,                       changeFrequency: 'weekly',  priority: 1.0 },
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

    // Public / legal
    { url: `${BASE_URL}/privacy`,          changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/terms`,            changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/contact`,          changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/sources`,          changeFrequency: 'monthly', priority: 0.4 },
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
    url: `${BASE_URL}/bhakti/katha/${getCanonicalKathaId(katha.id)}`,
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
      
      const [discoverRows, nameStoryRows] = await Promise.all([
        readSitemapPages((from, to) => client
          .from('discover_content')
          .select('slug, created_at')
          .eq('published', true).order('slug').range(from, to)
          .abortSignal(AbortSignal.timeout(10_000))),
        readSitemapPages((from, to) => client
          .from('name_stories')
          .select('share_slug, generated_at')
          .eq('is_public', true).order('share_slug').range(from, to)
          .abortSignal(AbortSignal.timeout(10_000)))
      ]);
      
      if (discoverRows) {
        discoverRoutes = discoverRows.filter(item => item.slug).map(item => ({
          url: `${BASE_URL}/discover/${item.slug}`,
          ...(item.created_at ? { lastModified: new Date(item.created_at) } : {}),
          changeFrequency: 'weekly',
          priority: 0.8,
        }));
      }

      if (nameStoryRows) {
        nameStoryRoutes = nameStoryRows.filter(item => item.share_slug).map(item => ({
          url: `${BASE_URL}/name/${item.share_slug}`,
          ...(item.generated_at ? { lastModified: new Date(item.generated_at) } : {}),
          changeFrequency: 'monthly',
          priority: 0.5,
        }));
      }
    } else throw new Error('Sitemap database configuration is missing');
  } catch (err) {
    console.error('Error generating dynamic routes for sitemap:', err);
    throw new Error('Sitemap temporarily unavailable');
  }

  return deduplicateSitemap([
    ...staticRoutes,
    ...vratRoutes,
    ...stotramRoutes,
    ...kathaRoutes,
    ...discoverRoutes,
    ...nameStoryRoutes,
    ...SEED_PATHS.map(path => ({ url: `${BASE_URL}/pathshala/${path.id}` })),
    ...getPublishableFestivalSlugs().map(slug => ({ url: `${BASE_URL}/festival/${slug}` })),
  ]);
}
