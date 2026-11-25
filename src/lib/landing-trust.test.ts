import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { getAllJournalEssays } from '@/config/journal';
import { marketingFeatures } from '@/config/marketing';
import { extractJournalGeo } from '@/lib/seo/geo-extractors';
import { WEB_CONSENT_STORAGE_KEY, WEB_CONSENT_VERSION, parseWebConsent } from '@/lib/web-consent';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const landing = read('public/landing.html');

/**
 * Found on 2026-11-26: the homepage (a separate HTML file, outside the consent manager) loaded Microsoft Clarity for
 * everyone who had not said no, while the rest of the site and the privacy policy promised opt-in. It now carries its
 * own copy of the consent panel. This runs the page's real script against a small stand-in for the browser.
 */
type Stub = {
  hidden: boolean; checked: boolean; offsetHeight: number; focused: boolean;
  classList: { add(c: string): void; remove(c: string): void; contains(c: string): boolean };
  listeners: Record<string, () => void>;
};

function openHomepage(opts: { stored?: string | null; storageThrows?: boolean; embed?: boolean; cookies?: string[]; host?: string } = {}) {
  const script = landing.match(/<script id="home-consent">([\s\S]*?)<\/script>/)?.[1];
  if (!script) throw new Error('homepage consent script not found');
  const make = (): Stub => {
    const classes = new Set<string>();
    return {
      hidden: true, checked: false, offsetHeight: 300, focused: false, listeners: {},
      classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), contains: (c) => classes.has(c) },
    };
  };
  const nodes: Record<string, Stub> = {};
  for (const [, id] of landing.matchAll(/id="(privacy-[a-z-]+)"/g)) nodes[id] = make();
  const jar = new Map<string, string>((opts.cookies ?? []).map((name) => [name, '1']));
  const cookieWrites: string[] = [];
  let stored = opts.stored ?? null;
  const inserted: string[] = [];
  const clarityCalls: unknown[][] = [];
  const removedSessionKeys: string[] = [];
  const body = make();
  if (opts.embed) body.classList.add('landing-embed');
  const element = (id: string) => {
    const node = nodes[id];
    if (!node) throw new Error(`homepage has no #${id}`);
    return Object.assign(node, {
      addEventListener: (type: string, fn: () => void) => { node.listeners[type] = fn; },
      focus: () => { node.focused = true; },
    });
  };
  const document = {
    getElementById: element,
    body,
    documentElement: { style: { setProperty: () => undefined } },
    createElement: () => ({ src: '' }),
    getElementsByTagName: () => [{ parentNode: { insertBefore: (tag: { src: string }) => inserted.push(tag.src) } }],
    get cookie() { return [...jar.keys()].map((name) => `${name}=1`).join('; '); },
    set cookie(value: string) { cookieWrites.push(value); if (value.includes('Max-Age=0')) jar.delete(value.split('=')[0]); },
  };
  const window: Record<string, unknown> = { addEventListener: () => undefined };
  const localStorage = {
    getItem: (key: string) => {
      if (opts.storageThrows) throw new Error('blocked');
      return key === WEB_CONSENT_STORAGE_KEY ? stored : null;
    },
    setItem: (_key: string, value: string) => { if (opts.storageThrows) throw new Error('blocked'); stored = value; },
  };
  const sessionStorage = { removeItem: (key: string) => removedSessionKeys.push(key) };
  vm.runInNewContext(script, {
    window, document, localStorage, sessionStorage, JSON, Date, location: { hostname: opts.host ?? 'www.shoonaya.com' },
  });
  return {
    clarityLoads: () => inserted.filter((src) => src.includes('clarity.ms/tag')).length,
    stopSpy: () => { window.clarity = (...args: unknown[]) => clarityCalls.push(args); },
    clarityCalls, cookieWrites, removedSessionKeys, jar, nodes,
    open: () => !nodes['privacy-choices'].hidden,
    click: (id: string) => nodes[id].listeners.click(),
    saved: () => parseWebConsent(stored),
  };
}

const choice = (over: object) =>
  JSON.stringify({ version: WEB_CONSENT_VERSION, analytics: true, advertising: false, decidedAt: '2026-11-26T00:00:00Z', ...over });

describe('homepage consent', () => {
  it('loads Clarity and shows no panel after analytics was accepted', () => {
    const page = openHomepage({ stored: choice({}) });
    expect(page.clarityLoads()).toBe(1);
    expect(page.open()).toBe(false);
  });

  it.each([
    ['no choice yet', { stored: null }],
    ['an old consent version', { stored: choice({ version: '2026-08-24.v1' }) }],
    ['no decision date', { stored: choice({ decidedAt: '' }) }],
    ['a missing category', { stored: choice({ advertising: undefined }) }],
    ['an unreadable value', { stored: '{' }],
    ['blocked storage', { storageThrows: true }],
  ])('with %s it loads nothing and asks', (_label, opts) => {
    const page = openHomepage(opts);
    expect(page.clarityLoads()).toBe(0);
    expect(page.open()).toBe(true);
    expect(page.nodes['privacy-first'].hidden).toBe(false);
  });

  it('does not ask again, or load anything, after a refusal', () => {
    const page = openHomepage({ stored: choice({ analytics: false }) });
    expect(page.clarityLoads()).toBe(0);
    expect(page.open()).toBe(false);
  });

  it('removes Clarity cookies left by the old homepage when there is no yes', () => {
    for (const stored of [null, choice({ analytics: false })]) {
      const page = openHomepage({ stored, cookies: ['_clck', '_clsk', 'session'] });
      expect([...page.jar.keys()]).toEqual(['session']);
      expect(page.cookieWrites.some((w) => w.startsWith('_clck=') && w.endsWith('domain=.shoonaya.com'))).toBe(true);
      expect(page.removedSessionKeys).toContain('_cltk');
    }
  });

  it('keeps Clarity cookies for someone who said yes', () => {
    expect([...openHomepage({ stored: choice({}), cookies: ['_clck'] }).jar.keys()]).toEqual(['_clck']);
  });

  it('accepting saves a choice the rest of the site accepts and starts Clarity once', () => {
    const page = openHomepage();
    page.click('privacy-accept');
    expect(page.saved()).toMatchObject({ analytics: true, advertising: true });
    expect(page.open()).toBe(false);
    page.click('privacy-accept');
    expect(page.clarityLoads()).toBe(1);
  });

  it('refusing saves the refusal and loads nothing', () => {
    const page = openHomepage();
    page.click('privacy-refuse');
    expect(page.saved()).toMatchObject({ analytics: false, advertising: false });
    expect(page.clarityLoads()).toBe(0);
    expect(page.open()).toBe(false);
  });

  it('settings start unticked, and ticking alone changes nothing until saved', () => {
    const page = openHomepage();
    page.click('privacy-customize');
    expect(page.nodes['privacy-analytics'].checked).toBe(false);
    expect(page.nodes['privacy-advertising'].checked).toBe(false);
    page.nodes['privacy-analytics'].checked = true;
    expect(page.clarityLoads()).toBe(0);
    page.click('privacy-save');
    expect(page.saved()).toMatchObject({ analytics: true, advertising: false });
    expect(page.clarityLoads()).toBe(1);
  });

  it('the footer link reopens the saved choice, and withdrawing stops Clarity and clears its cookies', () => {
    const page = openHomepage({ stored: choice({ advertising: true }), cookies: ['_clck', '_clsk', '_ga_X', '__gads'] });
    page.stopSpy();
    page.click('privacy-choices-open');
    expect(page.open()).toBe(true);
    expect(page.nodes['privacy-analytics'].checked).toBe(true);
    page.nodes['privacy-analytics'].checked = false;
    page.nodes['privacy-advertising'].checked = false;
    page.click('privacy-save');
    expect(page.clarityCalls).toEqual([['consent', false], ['stop']]);
    expect([...page.jar.keys()]).toEqual([]);
    expect(page.saved()).toMatchObject({ analytics: false, advertising: false });
  });

  it('does not ask inside an embedded frame', () => {
    const page = openHomepage({ embed: true });
    expect(page.open()).toBe(false);
    expect(page.clarityLoads()).toBe(0);
  });

  it('says what the rest of the site says', () => {
    const manager = read('src/components/privacy/WebConsentManager.tsx');
    for (const text of [
      'Your privacy choices',
      'Shoonaya uses necessary storage for sign-in and preferences. Analytics and advertising stay off unless you choose them.',
      'Keep both off', 'Choose settings', 'Allow analytics &amp; ads', 'Save choices',
    ]) {
      expect(manager).toContain(text);
      expect(landing).toContain(text);
    }
  });

  it('loads Clarity nowhere else on the page', () => {
    expect(landing.match(/clarity\.ms\/tag/g)).toHaveLength(1);
  });

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
  it('no Jain relic is a renamed emoji of something else', () => {
    // Until 2026-11-26: a peace sign, a six-pointed star, an atom, a Greek vase, a peacock, a cratered moon, a diamond.
    const wrong = [
      'a9dd1ef538cb5ceb24f46e7d64689306da927f18', 'b6ac17b6a05683041786de3a0309790cc3e17f59',
      '1f5c8f54d863b22239f55ef09bf452154ff32660', 'bdf76186f1c885fff91e368ccb1d0de6020e8e8b',
      '8e5c3f0149984cec861000bfa87281d89da47ee8', 'd7351607311d6eba10a85536bfa03a84e813feeb',
      '864e4787afb0b58cefb4dfebdcf742cda307236f',
    ];
    for (const name of ['ahimsa-hand', 'ahimsa_hand', 'jain-kalasha', 'jain-swastika', 'peacock-brush', 'siddhachakra-wheel', 'siddhashila-moon', 'three-jewels']) {
      const bytes = readFileSync(join(process.cwd(), `public/relics/${name}.png`));
      expect(wrong, name).not.toContain(createHash('sha1').update(bytes).digest('hex'));
    }
  });
});
