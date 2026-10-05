import type { MetadataRoute } from 'next';

export const AI_CRAWLER_USER_AGENTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
  'Amazonbot',
  'cohere-ai',
  'Bytespider',
] as const;

const PRIVATE_PATHS = ['/api/', '/admin/'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: [...AI_CRAWLER_USER_AGENTS],
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: 'https://www.shoonaya.com/sitemap.xml',
  };
}
