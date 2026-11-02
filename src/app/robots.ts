import type { MetadataRoute } from 'next';

export const AI_CRAWLER_USER_AGENTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Agent',
  'Google-CloudVertexBot',
  'Google-NotebookLM',
  'GoogleAgent-Mariner',
  'GoogleAgent-URLContext',
  'Google-Extended',
  'GoogleOther',
  'GoogleOther-Image',
  'GoogleOther-Video',
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
