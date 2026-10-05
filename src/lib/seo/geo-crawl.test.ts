import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import robots, { AI_CRAWLER_USER_AGENTS } from '@/app/robots';
import type { FestivalContent } from '@/lib/festival-data';
import { extractFestivalGeo } from './geo-extractors';
import { buildLlmsFull } from './llms-full';

const reviewedText = (value: string) => ({
  value: { en: value },
  status: 'reviewed_editorial' as const,
  sourceRefs: [],
  applicability: { universal: true },
  reviewRef: 'review:test',
});

const reviewedList = (value: string[]) => ({
  value: { en: value },
  status: 'reviewed_editorial' as const,
  sourceRefs: [],
  applicability: { universal: true },
  reviewRef: 'review:test',
});

describe('AI crawler discovery', () => {
  it('allows public content and applies private-path exclusions to every AI crawler', () => {
    const rules = robots().rules;
    const aiRule = Array.isArray(rules) ? rules[1] : undefined;

    expect(aiRule?.userAgent).toEqual([...AI_CRAWLER_USER_AGENTS]);
    expect(aiRule?.allow).toBe('/');
    expect(aiRule?.disallow).toEqual(['/api/', '/admin/']);
  });

  it('keeps the committed full corpus in sync with canonical public content', () => {
    const indexContent = readFileSync('public/llms.txt', 'utf8');
    const committedFullContent = readFileSync('public/llms-full.txt', 'utf8');

    expect(committedFullContent).toBe(buildLlmsFull(indexContent));
    expect(committedFullContent).not.toContain('pending_source');
  });

  it('builds Article and FAQ-ready facts only from publishable festival copy', () => {
    const festival = {
      definitionKey: 'reviewed-festival',
      emoji: '🪔',
      tradition: 'hindu',
      name: reviewedText('Reviewed Festival'),
      tagline: reviewedText('A reviewed public guide'),
      significance: reviewedText('Reviewed significance.'),
      rituals: reviewedList(['Reviewed ritual.']),
      dos: reviewedList(['Reviewed recommendation.']),
      donts: reviewedList(['Reviewed caution.']),
      pujaItems: reviewedList(['Reviewed item']),
    } satisfies FestivalContent;

    const geo = extractFestivalGeo(festival);

    expect(geo.canonicalUrl).toBe('https://www.shoonaya.com/festival/reviewed-festival');
    expect(geo.qa).toEqual(expect.arrayContaining([
      expect.objectContaining({ question: 'What is the significance of Reviewed Festival?' }),
      expect.objectContaining({ question: 'How is Reviewed Festival observed?' }),
    ]));
  });
});

describe('verified Native app associations', () => {
  it('associates the canonical web domain with the production iOS app', () => {
    const association = JSON.parse(
      readFileSync('public/.well-known/apple-app-site-association', 'utf8'),
    ) as { applinks: { details: Array<{ appIDs: string[]; components: Array<{ '/': string }> }> } };
    const detail = association.applinks.details[0];

    expect(detail.appIDs).toContain('3K78ST7PG3.com.shoonaya.app');
    expect(detail.components.map(component => component['/'])).toEqual(expect.arrayContaining([
      '/panchang',
      '/vrat/*',
      '/festival/*',
      '/bhakti/*',
      '/pathshala/*',
    ]));
  });

  it('associates the canonical web domain with the EAS-signed Android app', () => {
    const statements = JSON.parse(
      readFileSync('public/.well-known/assetlinks.json', 'utf8'),
    ) as Array<{ target: { package_name: string; sha256_cert_fingerprints: string[] } }>;

    expect(statements[0].target.package_name).toBe('com.shoonaya.app');
    expect(statements[0].target.sha256_cert_fingerprints).toContain(
      '44:C4:9E:E8:73:BD:B1:94:EB:53:62:64:90:82:D9:D9:B0:03:9B:FE:74:CD:BD:FC:6D:34:97:93:EE:31:B8:9A',
    );
  });
});
