import assert from 'node:assert/strict';
import test from 'node:test';

import { inferUpdatedUrls, parseSitemap } from './submit-indexnow.mjs';

const ORIGIN = 'https://www.shoonaya.com';

test('parseSitemap keeps canonical URLs and last-modified values', () => {
  const entries = parseSitemap(`
    <urlset>
      <url><loc>${ORIGIN}/</loc></url>
      <url><loc>${ORIGIN}/discover/a&amp;b</loc><lastmod>2026-07-27</lastmod></url>
      <url><loc>https://shoonaya.com/non-canonical</loc></url>
    </urlset>
  `);

  assert.deepEqual([...entries], [
    [`${ORIGIN}/`, null],
    [`${ORIGIN}/discover/a&b`, '2026-07-27'],
  ]);
});

test('inferUpdatedUrls maps static and dynamic app routes', () => {
  const current = new Set([
    `${ORIGIN}/about`,
    `${ORIGIN}/bhakti/katha/ramayana`,
    `${ORIGIN}/bhakti/katha/mahabharata`,
  ]);

  const selected = inferUpdatedUrls(
    [
      'src/app/(marketing)/about/page.tsx',
      'src/app/(main)/bhakti/katha/[id]/page.tsx',
    ],
    current,
    new Set(),
  );

  assert.deepEqual([...selected].sort(), [...current].sort());
});

test('inferUpdatedUrls includes deleted routes from the previous sitemap', () => {
  const deletedUrl = `${ORIGIN}/old-page`;
  const selected = inferUpdatedUrls(
    ['src/app/(marketing)/old-page/page.tsx'],
    new Set(),
    new Set([deletedUrl]),
  );

  assert.deepEqual([...selected], [deletedUrl]);
});

test('shared component changes select every public sitemap URL', () => {
  const urls = new Set([`${ORIGIN}/`, `${ORIGIN}/panchang`]);
  const selected = inferUpdatedUrls(
    ['src/components/Header.tsx'],
    urls,
    new Set(),
  );

  assert.deepEqual([...selected].sort(), [...urls].sort());
});

test('route-group layouts include all descendant public routes', () => {
  const urls = new Set([
    `${ORIGIN}/`,
    `${ORIGIN}/about`,
    `${ORIGIN}/bhakti`,
    `${ORIGIN}/bhakti/katha`,
  ]);
  const selected = inferUpdatedUrls(
    ['src/app/(main)/bhakti/layout.tsx'],
    urls,
    new Set(),
  );

  assert.deepEqual([...selected].sort(), [
    `${ORIGIN}/bhakti`,
    `${ORIGIN}/bhakti/katha`,
  ]);
});

test('co-located route components select their public page', () => {
  const urls = new Set([`${ORIGIN}/discover`, `${ORIGIN}/panchang`]);
  const selected = inferUpdatedUrls(
    ['src/app/(main)/discover/DiscoverClient.tsx'],
    urls,
    new Set(),
  );

  assert.deepEqual([...selected], [`${ORIGIN}/discover`]);
});
