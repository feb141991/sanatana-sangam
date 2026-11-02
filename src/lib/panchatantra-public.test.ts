import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import {
  PANCHATANTRA_HUB_PATH,
  PUBLIC_PANCHATANTRA_IDS,
  RETELLING_NOTICE,
  findPublicPanchatantraStory,
  listPublicPanchatantraStories,
  panchatantraStoryPath,
  panchatantraStoryUrl,
} from './panchatantra-public';

const root = resolve(__dirname, '../..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

const flags = JSON.parse(read('scripts/panchatantra-new-name-flags.json')) as {
  newNamesByStory: Record<string, Record<string, number>>;
};

const devanagariShare = (text: string) => {
  const letters = [...text].filter((c) => /\p{L}/u.test(c));
  return letters.filter((c) => c >= 'ऀ' && c <= 'ॿ').length / Math.max(1, letters.length);
};

describe('public Panchatantra stories: what is listed', () => {
  it('lists exactly the three approved stories, in order, each with a readable slug', () => {
    expect(listPublicPanchatantraStories().map((s) => s.id)).toEqual([...PUBLIC_PANCHATANTRA_IDS]);
    expect(listPublicPanchatantraStories().map((s) => s.slug)).toEqual([
      'crane-and-crab',
      'dharmabuddhi-papabuddhi',
      'self-sacrificing-dove',
    ]);
  });

  it('never lists a story whose retelling adds names that were not checked against a source', () => {
    for (const id of PUBLIC_PANCHATANTRA_IDS) {
      expect(flags.newNamesByStory[id], `${id} is flagged for unverified new names`).toBeUndefined();
    }
  });

  it('serves nothing for a real but unlisted story, an unknown slug, or a language segment', () => {
    // monkey-and-crocodile exists in the library and is flagged for unverified names.
    expect(findPublicPanchatantraStory('monkey-and-crocodile')).toBeUndefined();
    expect(findPublicPanchatantraStory('panchatantra-crane-and-crab')).toBeUndefined();
    expect(findPublicPanchatantraStory('does-not-exist')).toBeUndefined();
    expect(findPublicPanchatantraStory('hi')).toBeUndefined();
    expect(findPublicPanchatantraStory('')).toBeUndefined();
    expect(findPublicPanchatantraStory('crane-and-crab')?.id).toBe('panchatantra-crane-and-crab');
  });
});

describe('public Panchatantra stories: what a reader sees', () => {
  it('gives every story a title, moral and equal-length English and Hindi text', () => {
    for (const story of listPublicPanchatantraStories()) {
      for (const field of [story.title, story.titleHi, story.moral, story.moralHi, story.portrait]) {
        expect(field.trim().length, story.id).toBeGreaterThan(0);
      }
      expect(story.body.length, story.id).toBeGreaterThanOrEqual(5);
      expect(story.bodyHi, story.id).toHaveLength(story.body.length);
      for (const paragraph of [...story.body, ...story.bodyHi]) expect(paragraph.trim().length, story.id).toBeGreaterThan(0);
      expect(story.durationMin, story.id).toBeGreaterThan(0);
    }
  });

  it('writes the Hindi in Devanagari rather than repeating the English', () => {
    for (const story of listPublicPanchatantraStories()) {
      expect(devanagariShare(story.bodyHi.join(' ')), story.id).toBeGreaterThan(0.7);
      expect(devanagariShare(story.titleHi), story.id).toBeGreaterThan(0.7);
      expect(devanagariShare(story.moralHi), story.id).toBeGreaterThan(0.7);
    }
  });

  it('states in both languages that the text is a retelling, not a translation', () => {
    expect(RETELLING_NOTICE.en).toMatch(/retelling/i);
    expect(RETELLING_NOTICE.en).toMatch(/not a translation/i);
    expect(RETELLING_NOTICE.hi).toContain('पुनर्कथन');
    expect(RETELLING_NOTICE.hi).toContain('अनुवाद नहीं');
  });

  it('builds the canonical English and Hindi paths and URLs', () => {
    expect(PANCHATANTRA_HUB_PATH).toBe('/stories/panchatantra');
    expect(panchatantraStoryPath('crane-and-crab', 'en')).toBe('/stories/panchatantra/crane-and-crab');
    expect(panchatantraStoryPath('crane-and-crab', 'hi')).toBe('/stories/panchatantra/crane-and-crab/hi');
    expect(panchatantraStoryUrl('crane-and-crab', 'hi')).toBe('https://www.shoonaya.com/stories/panchatantra/crane-and-crab/hi');
  });
});

describe('public Panchatantra pages: source contract', () => {
  const view = read('src/app/(marketing)/stories/panchatantra/PanchatantraStoryView.tsx');
  const hub = read('src/app/(marketing)/stories/panchatantra/page.tsx');

  it('puts the retelling notice on the story page and on the hub', () => {
    expect(view).toContain('RETELLING_NOTICE[lang]');
    expect(hub).toContain('RETELLING_NOTICE.en');
  });

  it('serves no artwork: the Native illustrations have no recorded provenance or rights status', () => {
    for (const source of [view, hub]) {
      expect(source).not.toMatch(/from ["']next\/image["']/);
      expect(source).not.toMatch(/<img\b/i);
      expect(source).not.toMatch(/\.(webp|png|jpe?g)["'`]/i);
    }
  });

  it('returns 404 for slugs outside the list instead of rendering them on demand', () => {
    for (const path of [
      'src/app/(marketing)/stories/panchatantra/[slug]/page.tsx',
      'src/app/(marketing)/stories/panchatantra/[slug]/hi/page.tsx',
    ]) {
      expect(read(path), path).toContain('export const dynamicParams = false');
    }
  });
});

describe('public Panchatantra pages: sitemap', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('lists the hub and each story in English and Hindi, each pointing at its twin, and nothing else under /stories/', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
    const { default: sitemap } = await import('@/app/sitemap');
    const entries = await sitemap();
    const stories = entries.filter((e) => new URL(e.url).pathname.startsWith('/stories/'));

    const expected = [
      'https://www.shoonaya.com/stories/panchatantra',
      ...listPublicPanchatantraStories().flatMap((s) => [
        panchatantraStoryUrl(s.slug, 'en'),
        panchatantraStoryUrl(s.slug, 'hi'),
      ]),
    ];
    expect(stories.map((e) => e.url).sort()).toEqual([...expected].sort());

    for (const s of listPublicPanchatantraStories()) {
      for (const lang of ['en', 'hi'] as const) {
        const entry = stories.find((e) => e.url === panchatantraStoryUrl(s.slug, lang));
        expect(entry?.alternates?.languages, `${s.slug} ${lang}`).toEqual({
          en: panchatantraStoryUrl(s.slug, 'en'),
          hi: panchatantraStoryUrl(s.slug, 'hi'),
        });
      }
    }
  });
});

describe('public Panchatantra pages: reachable without signing in', () => {
  const original = process.env.APP_OPEN;
  afterEach(() => {
    if (original === undefined) delete process.env.APP_OPEN;
    else process.env.APP_OPEN = original;
  });

  it('lets an anonymous visitor reach the hub and every story page even while the app gate is closed', async () => {
    process.env.APP_OPEN = 'false';
    const paths = [
      PANCHATANTRA_HUB_PATH,
      ...listPublicPanchatantraStories().flatMap((s) => [
        panchatantraStoryPath(s.slug, 'en'),
        panchatantraStoryPath(s.slug, 'hi'),
      ]),
    ];
    for (const path of paths) {
      const response = await middleware(new NextRequest(`https://www.shoonaya.com${path}`));
      expect(response.headers.get('location'), path).toBeNull();
      expect(response.headers.get('x-middleware-next'), path).toBe('1');
    }
  });

  it('opens nothing else under /stories/, which the same closed gate still turns away', async () => {
    process.env.APP_OPEN = 'false';
    const response = await middleware(new NextRequest('https://www.shoonaya.com/stories/private-draft'));
    expect(response.headers.get('location')).toBe('https://www.shoonaya.com/');
  });
});
