import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { getAllJournalEssays } from '@/config/journal';
import { marketingFeatures } from '@/config/marketing';
import { extractJournalGeo } from '@/lib/seo/geo-extractors';
import { WEB_CONSENT_STORAGE_KEY, WEB_CONSENT_VERSION } from '@/lib/web-consent';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const landing = read('public/landing.html');

/**
 * Found on 2026-11-26: the homepage (a separate HTML file, outside the consent manager) loaded Microsoft Clarity for
 * everyone who had not said no, while the rest of the site and the privacy policy promised opt-in.
 */
function loadsClarity(stored: string | null | 'throws'): boolean {
  const script = [...landing.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes('clarity.ms/tag'));
  if (!script) throw new Error('homepage Clarity loader not found');
  let inserted = false;
  const document = {
    createElement: () => ({}),
    getElementsByTagName: () => [{ parentNode: { insertBefore: () => { inserted = true; } } }],
  };
  const localStorage = {
    getItem: (key: string) => {
      if (stored === 'throws') throw new Error('blocked');
      return key === WEB_CONSENT_STORAGE_KEY ? stored : null;
    },
  };
  const window: Record<string, unknown> = {};
  vm.runInNewContext(script, { window, document, localStorage, JSON });
  return inserted;
}

const choice = (over: object) =>
  JSON.stringify({ version: WEB_CONSENT_VERSION, analytics: true, advertising: false, decidedAt: '2026-11-26T00:00:00Z', ...over });

describe('homepage Clarity waits for a recorded yes', () => {
  it('loads after analytics is accepted', () => expect(loadsClarity(choice({}))).toBe(true));
  it.each([
    ['no choice yet', null],
    ['analytics refused', choice({ analytics: false })],
    ['an old consent version', choice({ version: '2026-08-24.v1' })],
    ['no decision date', choice({ decidedAt: '' })],
    ['unreadable value', '{'],
    ['blocked storage', 'throws'],
  ])('does not load with %s', (_label, stored) => expect(loadsClarity(stored)).toBe(false));

  it('is the only static page that loads a tracker', () => {
    const trackers = /clarity\.ms\/tag|googletagmanager\.com\/gtag|pagead2\.googlesyndication/;
    const pages = readdirSync(join(process.cwd(), 'public')).filter((f) => f.endsWith('.html') && trackers.test(read(`public/${f}`)));
    expect(pages).toEqual(['landing.html']);
  });
});

describe('public claims stay supportable', () => {
  it('the homepage does not call the operator a non-profit or date the Rigveda as the oldest text', () => {
    expect(landing).not.toMatch(/non-?profit|oldest known human text|3500 BCE/i);
  });
  it('no announcement strip sits above the fixed header', () => {
    expect(landing).not.toContain('ph-launch-ribbon');
    expect(existsSync(join(process.cwd(), 'src/components/marketing/ProductHuntRibbon.tsx'))).toBe(false);
  });
  it('AI features do not promise to be free of mistakes', () => {
    expect(JSON.stringify(marketingFeatures)).not.toMatch(/hallucinat|rooted strictly|verified scriptures/i);
  });
  it('a council is never published as a person who reviewed an essay', () => {
    const reviewers = getAllJournalEssays().map((essay) => extractJournalGeo(essay).reviewedBy).filter(Boolean);
    expect(reviewers).toEqual(['Pt. Prince Sharma']);
  });
  it('essays never say it is safe to look at the sun', () => {
    for (const file of ['src/config/journal-surya-arghya.ts', 'src/config/journal-chhath-puja.ts']) {
      expect(read(file)).not.toMatch(/without burning|filters out harsh|blinding UV|retinal solar|gazing (at|softly)|gazes softly/i);
      expect(read(file)).toMatch(/permanently damage/);
    }
  });
  it('public pages do not use the peace-sign artwork for Jain Dharma', () => {
    for (const file of ['public/landing.html', 'src/lib/festival-emblems.ts', 'src/config/journal.ts']) {
      expect(read(file)).not.toMatch(/ahimsa[-_]hand/);
    }
  });
});
