import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import sitemap from '@/app/sitemap';
import { FaqClient } from '@/app/(marketing)/faq/FaqClient';
import { SitemapClient } from '@/app/(marketing)/sitemap/SitemapClient';
import { metadata as helpMetadata } from '@/app/(marketing)/help/page';
import PanchangHub from '@/app/(main)/panchang/PanchangHub';
import { OrganizationJsonLd } from '@/components/seo/JsonLd';
import { marketingFeatures } from '@/config/marketing';

type Node = Record<string, unknown>;
const landingHtml = readFileSync(resolve(process.cwd(), 'public/landing.html'), 'utf8');

describe('site-wide structured data (on every page)', () => {
  const markup = renderToStaticMarkup(createElement(OrganizationJsonLd));
  const graph = (JSON.parse(markup.match(/>([\s\S]*)<\/script>/)![1]) as { '@graph': Node[] })['@graph'];

  it('carries no FAQ and no site search that does not exist', () => {
    expect(graph.length).toBeGreaterThan(2);
    expect(graph.map((node) => node['@type'])).not.toContain('FAQPage');
    expect(markup).not.toContain('SearchAction');
  });

  it('claims no App Store listing while there is none', () => {
    const app = graph.find((node) => node['@type'] === 'MobileApplication');
    expect(app?.operatingSystem).toBe('Android');
    expect(markup).not.toContain('apps.apple.com');
    expect(markup).toContain('play.google.com/store/apps/details?id=com.shoonaya.app');
  });
});

describe('homepage structured data', () => {
  const json = landingHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1];
  const graph = (JSON.parse(json) as { '@graph': Node[] })['@graph'];
  const visible = landingHtml.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ')
        .replace(/&amp;/g, '&').replace(/&(?:#39|apos|rsquo);|’/g, "'").replace(/\s+/g, ' ').replace(/ ([.,])/g, '$1');

  it('marks up only questions a visitor can read on the page', () => {
    const faq = graph.find((node) => node['@type'] === 'FAQPage') as {
      mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
    };
    expect(faq.mainEntity.length).toBeGreaterThan(0);
    for (const { name, acceptedAnswer } of faq.mainEntity) {
      expect(visible).toContain(` ${name} `);
      expect(visible).toContain(acceptedAnswer.text);
    }
  });

  it('claims no App Store listing while there is none', () => {
    expect(json).not.toContain('apps.apple.com');
  });
});

describe('FAQ page', () => {
  it('has every answer in the server HTML', () => {
    const html = renderToStaticMarkup(createElement(FaqClient));
    const questions = html.match(/aria-controls="faq-answer-[^"]+"/g) ?? [];
    const answers = html.match(/<div id="faq-answer-[^"]+"[^>]*><p[^>]*>[^<]{20,}/g) ?? [];
    expect(questions.length).toBeGreaterThan(10);
    expect(answers).toHaveLength(questions.length);
  });
});

describe('feature links', () => {
  const real = new Set(marketingFeatures.map((feature) => `/features/${feature.slug}`));

  it('sitemap.xml, the FAQ and the site map page link only to features that exist', async () => {
    const paths = (await sitemap()).map(({ url }) => new URL(url).pathname);
    const html = renderToStaticMarkup(createElement(FaqClient)) + renderToStaticMarkup(createElement(SitemapClient));
    const links = [...paths, ...[...html.matchAll(/href="([^"#?]+)/g)].map((match) => match[1])]
      .filter((path) => path.startsWith('/features/'));
    expect(links.length).toBeGreaterThan(5);
    expect(links.filter((path) => !real.has(path))).toEqual([]);
  });
});

describe('sitemap.xml dates', () => {
  it('never gives a page the time the sitemap was built', async () => {
    const before = Date.now();
    const dated = (await sitemap()).filter((entry) => entry.lastModified);
    for (const { url, lastModified } of dated) {
      expect(new Date(lastModified!).getTime(), url).toBeLessThan(before);
    }
    expect(dated.length).toBeGreaterThan(0);
  });
});

describe('individual pages', () => {
  it('/help is canonical to itself', () => {
    expect(helpMetadata.alternates?.canonical).toBe('https://www.shoonaya.com/help');
  });

  it('/panchang has exactly one H1 in its source', () => {
    expect(PanchangHub).toBeTypeOf('function');
    const source = readFileSync(resolve(process.cwd(), 'src/app/(main)/panchang/PanchangHub.tsx'), 'utf8');
    expect(source.match(/<h1\b/g)).toHaveLength(1);
  });
});
