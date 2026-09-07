import assert from 'node:assert/strict';
import test from 'node:test';

import { inferUpdatedUrls, parseSitemap, run } from './submit-indexnow.mjs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ORIGIN = 'https://www.shoonaya.com';

test('course and festival source edits select their public narratives', () => {
  const urls = new Set([`${ORIGIN}/pathshala/gita`, `${ORIGIN}/festival/diwali`, `${ORIGIN}/about`]);
  assert.deepEqual([...inferUpdatedUrls(['src/lib/pathshala-paths.ts',
    'packages/dharma-rules/src/festivals/festival-content.json'], urls, new Set())].sort(),
  [`${ORIGIN}/festival/diwali`, `${ORIGIN}/pathshala/gita`]);
});

for (const mode of ['dry', 'accepted', 'pending', 'rejected']) {
  test(`submission checkpoint: ${mode}`, async () => {
    const dir = await mkdtemp(join(tmpdir(), 'shoonaya-indexnow-'));
    const snapshotPath = join(dir, 'snapshot.json');
    const original = JSON.stringify({ deploymentSha: null, entries: [[`${ORIGIN}/old`, null]] });
    await writeFile(snapshotPath, original);
    const key = (await readFile('public/ecb13bc18920487faed9fce877b7c386.txt', 'utf8')).trim();
    let posts = 0;
    try {
      const attempt = run({ snapshotPath, deploymentSha: null, forceSubmit: false,
        dryRun: mode === 'dry', fetchImpl: async (url, options) => {
          if (url.endsWith('/sitemap.xml')) return new Response(`<urlset><url><loc>${ORIGIN}/new</loc></url></urlset>`);
          if (url.endsWith('.txt')) return new Response(key);
          posts++;
          assert.equal(options.method, 'POST');
          assert.deepEqual(JSON.parse(options.body).urlList, [`${ORIGIN}/new`, `${ORIGIN}/old`]);
          return new Response('', { status: mode === 'pending' ? 202 : mode === 'rejected' ? 429 : 200 });
        } });
      if (mode === 'pending' || mode === 'rejected') await assert.rejects(attempt);
      else await attempt;
      assert.equal(posts, mode === 'dry' ? 0 : 1);
      const after = await readFile(snapshotPath, 'utf8');
      if (mode !== 'accepted') assert.equal(after, original);
      else assert.deepEqual(JSON.parse(after).entries, [[`${ORIGIN}/new`, null]]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
}

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
