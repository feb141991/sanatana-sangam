import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/'],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/vrat/', '/bhakti/', '/pathshala/', '/panchang'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/vrat/', '/bhakti/', '/pathshala/', '/panchang'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/vrat/', '/bhakti/', '/pathshala/', '/panchang'],
      },
    ],
    sitemap: 'https://shoonaya.com/sitemap.xml',
  };
}
