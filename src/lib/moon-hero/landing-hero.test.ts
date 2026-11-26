import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// Plain ESM helper shared with scripts/moon-hero/build.mjs.
import { MOON_HERO_BUNDLE, moonHeroSourceHash } from '../../../scripts/moon-hero/source-hash.mjs';

const landing = readFileSync('public/landing.html', 'utf8');
const bundle = readFileSync(MOON_HERO_BUNDLE, 'utf8');
const scene = readFileSync('scripts/moon-hero/scene.ts', 'utf8');
const hero = landing.slice(landing.indexOf('<section id="moon-hero"'), landing.indexOf('</section>', landing.indexOf('<section id="moon-hero"')));

describe('homepage moon hero bundle', () => {
  it('was built from the current sources, and the homepage asks for that build', () => {
    const hash = moonHeroSourceHash();
    expect(bundle.split('\n')[0]).toContain(`source hash ${hash}.`);
    expect(landing).toContain(`/assets/js/moon-hero.js?v=${hash}`);
  });

  it('is self-hosted, so the CSP needs no third-party script host', () => {
    expect(landing).not.toMatch(/cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com/);
    expect(landing).toMatch(/s\.src = "\/assets\/js\/moon-hero\.js\?v=[0-9a-f]{12}"/);
  });
});

describe('homepage moon hero page', () => {
  it('keeps the homepage heading and the live reviewed-observance rail inside the hero', () => {
    expect(hero).toContain('<h1 id="splash-title">Shoonaya.<em>Find your infinite.</em></h1>');
    expect(hero).toContain('id="hero-observance-stack"');
    expect(hero.match(/class="mh-chapter"/g)).toHaveLength(4);
  });

  it('no longer hides the rest of the page behind an Explore gate', () => {
    expect(landing).toContain('<div id="main-page">');
    expect(landing).not.toContain('<div id="main-page" style="display: none">');
    expect(landing).not.toContain('id="explore-btn"');
    expect(landing).not.toMatch(/triggerExplore/);
    expect(landing).toMatch(/function ensureMainPage\(\)/);
    expect(landing).toMatch(/rootMargin: "800px 0px"/);
  });

  it('shows the chapters as plain text with Reduce Motion or without JavaScript', () => {
    const css = landing.slice(landing.indexOf('<style id="moon-hero-css">'), landing.indexOf('</style>', landing.indexOf('<style id="moon-hero-css">')));
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*#moon-hero \{ height: auto; \}/);
    expect(landing).toMatch(/<noscript>\s*<style>\s*#moon-hero \{ height: auto; \}/);
  });

  it('keeps section links keyboard reachable with 44px targets', () => {
    expect(landing).toMatch(/#moon-hero \.mh-sections button \{[^}]*min-height: 44px;/);
    expect(landing).toMatch(/el\.addEventListener\("focusin"/);
  });
});

describe('homepage moon hero calendar honesty', () => {
  it('labels the ring as an illustration and never derives a tithi from the real Moon', () => {
    expect(scene).toContain('An illustration of one lunar month, not tonight');
    expect(scene).toContain('Your tithi for today is in the app.');
    // The real Moon only gives "% lit" and waxing or waning.
    expect(scene).not.toMatch(/tithi\w*\(\s*nowFrac|tithi\w*\(\s*nowElong/);
  });
});
