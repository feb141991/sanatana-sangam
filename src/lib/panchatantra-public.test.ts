import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { config, middleware } from '@/middleware';
import {
  PANCHATANTRA_HUB_PATH,
  PUBLIC_PANCHATANTRA_IDS,
  RETELLING_NOTICE,
  findPublicPanchatantraStory,
  listPublicPanchatantraStories,
  panchatantraCoverImage,
  panchatantraScenesFor,
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

describe('public Panchatantra stories: artwork', () => {
  const publicDir = resolve(root, 'public');
  const withArt = ['crane-and-crab', 'dharmabuddhi-papabuddhi'];

  it('illustrates exactly the stories that have a full set, one scene per paragraph', () => {
    for (const story of listPublicPanchatantraStories()) {
      if (withArt.includes(story.slug)) expect(story.scenes, story.slug).toHaveLength(story.body.length);
    }
    expect(listPublicPanchatantraStories().filter((s) => s.scenes.length > 0).map((s) => s.slug)).toEqual(withArt);
  });

  it('shows no artwork for a story that has no set, and never borrows another story\'s scenes', () => {
    // The Native app has no illustration set for the self-sacrificing dove; the net and pigeon stories are different tales.
    expect(findPublicPanchatantraStory('self-sacrificing-dove')?.scenes).toEqual([]);
    expect(panchatantraScenesFor('panchatantra-self-sacrificing-dove', 6)).toEqual([]);
    expect(panchatantraScenesFor('panchatantra-dove-king-and-net', 6)).toEqual([]);
    expect(panchatantraScenesFor('panchatantra-hunter-and-pigeons', 6)).toEqual([]);
  });

  it('drops a set that does not match the paragraphs one for one instead of showing it out of step', () => {
    expect(panchatantraScenesFor('panchatantra-crane-and-crab', 6)).toHaveLength(6);
    for (const wrong of [0, 1, 5, 7]) expect(panchatantraScenesFor('panchatantra-crane-and-crab', wrong)).toEqual([]);
  });

  it('serves real WebP files that exist, stay within the Native 600 KB budget, and have no strays beside them', () => {
    for (const story of listPublicPanchatantraStories().filter((s) => s.scenes.length > 0)) {
      story.scenes.forEach((scene, index) => {
        expect(scene.src, story.slug).toBe(`/images/panchatantra/${story.slug}/${index + 1}.webp`);
        const bytes = readFileSync(resolve(publicDir, `.${scene.src}`));
        expect(bytes.subarray(0, 4).toString('latin1'), scene.src).toBe('RIFF');
        expect(bytes.subarray(8, 12).toString('latin1'), scene.src).toBe('WEBP');
        expect(bytes.length, scene.src).toBeLessThanOrEqual(600 * 1024);
      });
      const onDisk = readdirSync(resolve(publicDir, 'images/panchatantra', story.slug)).sort();
      expect(onDisk, story.slug).toEqual(story.scenes.map((_, i) => `${i + 1}.webp`));
    }
  });

  it('declares the real pixel size of every image so the page does not shift while it loads', () => {
    for (const story of listPublicPanchatantraStories().filter((s) => s.scenes.length > 0)) {
      for (const scene of story.scenes) {
        const bytes = readFileSync(resolve(publicDir, `.${scene.src}`));
        // Lossy WebP (VP8): width and height are 14-bit little-endian values at bytes 26 and 28.
        expect(bytes.subarray(12, 16).toString('latin1'), scene.src).toBe('VP8 ');
        expect(bytes.readUInt16LE(26) & 0x3fff, scene.src).toBe(scene.width);
        expect(bytes.readUInt16LE(28) & 0x3fff, scene.src).toBe(scene.height);
      }
    }
  });

  it('describes every scene in English and in Devanagari Hindi, without repeating a description', () => {
    for (const story of listPublicPanchatantraStories().filter((s) => s.scenes.length > 0)) {
      for (const scene of story.scenes) {
        expect(scene.alt.trim().length, scene.src).toBeGreaterThan(30);
        expect(devanagariShare(scene.altHi), scene.src).toBeGreaterThan(0.7);
        expect(devanagariShare(scene.alt), scene.src).toBeLessThan(0.1);
      }
      expect(new Set(story.scenes.map((s) => s.alt)).size, story.slug).toBe(story.scenes.length);
      expect(new Set(story.scenes.map((s) => s.altHi)).size, story.slug).toBe(story.scenes.length);
    }
  });

  it('offers the first scene as an absolute cover image, and none for a story without artwork', () => {
    const crane = findPublicPanchatantraStory('crane-and-crab')!;
    expect(panchatantraCoverImage(crane, 'en')).toEqual({
      url: 'https://www.shoonaya.com/images/panchatantra/crane-and-crab/1.webp',
      width: 1376,
      height: 774,
      alt: crane.scenes[0].alt,
    });
    expect(panchatantraCoverImage(crane, 'hi')?.alt).toBe(crane.scenes[0].altHi);
    expect(panchatantraCoverImage(findPublicPanchatantraStory('self-sacrificing-dove')!, 'en')).toBeUndefined();
  });

  it('is reachable without signing in: the middleware matcher leaves .webp files alone', () => {
    const matcher = new RegExp(`^${config.matcher[0]}$`);
    for (const story of listPublicPanchatantraStories().filter((s) => s.scenes.length > 0)) {
      for (const scene of story.scenes) expect(matcher.test(scene.src), scene.src).toBe(false);
    }
    // The matcher still covers pages, so the sanity check below fails if it were loosened to match nothing.
    expect(matcher.test('/stories/panchatantra')).toBe(true);
  });
});

describe('public Panchatantra pages: source contract', () => {
  const view = read('src/app/(marketing)/stories/panchatantra/PanchatantraStoryView.tsx');
  const hub = read('src/app/(marketing)/stories/panchatantra/page.tsx');

  it('puts the retelling notice on the story page and on the hub', () => {
    expect(view).toContain('RETELLING_NOTICE[lang]');
    expect(hub).toContain('RETELLING_NOTICE.en');
  });

  it('draws every image from the artwork table: no image path is written into a page', () => {
    for (const source of [view, hub]) {
      expect(source).not.toMatch(/<img\b/i);
      expect(source).not.toMatch(/\.(webp|png|jpe?g)["'`]/i);
    }
    expect(view).toMatch(/from ["']next\/image["']/);
    expect(view).toContain('story.scenes[index]');
    expect(view).toContain('isHindi ? scene.altHi : scene.alt');
    // Only the first image is loaded eagerly; the rest wait until they are near the screen.
    expect(view.match(/priority=/g)).toHaveLength(1);
    expect(view).toContain('priority={index === 0}');
  });

  it('gives the page a cover image for link previews and structured data, in both languages', () => {
    for (const path of [
      'src/app/(marketing)/stories/panchatantra/[slug]/page.tsx',
      'src/app/(marketing)/stories/panchatantra/[slug]/hi/page.tsx',
    ]) {
      const source = read(path);
      expect(source, path).toContain('panchatantraCoverImage(story');
      expect(source, path).toContain('images: [cover]');
      expect(source, path).toContain('image: cover.url');
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
