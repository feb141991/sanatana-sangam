import type { MetadataRoute } from 'next';
import { VRAT_DATABASE } from '@/lib/vrat-data';
import { STOTRAMS } from '@/lib/stotrams';
import { ALL_KATHAS } from '@/lib/katha-library';
import { SEED_PATHS } from '@/lib/pathshala-paths';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: 'https://shoonaya.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://shoonaya.com/bhakti', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://shoonaya.com/pathshala', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://shoonaya.com/japa', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://shoonaya.com/discover', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://shoonaya.com/panchang', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://shoonaya.com/pricing', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  const vratRoutes: MetadataRoute.Sitemap = Object.keys(VRAT_DATABASE).map(slug => ({
    url: `https://shoonaya.com/vrat/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const stotramRoutes: MetadataRoute.Sitemap = STOTRAMS.map(stotram => ({
    url: `https://shoonaya.com/bhakti/stotram/${stotram.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const kathaRoutes: MetadataRoute.Sitemap = ALL_KATHAS.map(katha => ({
    url: `https://shoonaya.com/bhakti/katha/${katha.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const pathshalaRoutes: MetadataRoute.Sitemap = SEED_PATHS.map(path => ({
    url: `https://shoonaya.com/pathshala/${path.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // No festival routes found in src/app/(main)/festival/[slug]

  return [
    ...staticRoutes,
    ...vratRoutes,
    ...stotramRoutes,
    ...kathaRoutes,
    ...pathshalaRoutes,
  ];
}
