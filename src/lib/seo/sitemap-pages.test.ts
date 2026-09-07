import { describe, expect, it } from 'vitest';
import { readSitemapPages, deduplicateSitemap } from './sitemap-pages';

describe('sitemap database pages', () => {
  it('reads beyond the default database row limit, including a capped server page', async () => {
    const rows = Array.from({ length: 1203 }, (_, id) => ({ id }));
    const actual = await readSitemapPages(async from => ({ data: rows.slice(from, from + 100), error: null }));
    expect(actual).toEqual(rows);
  });
  it('fails the entire result if a later page fails', async () => {
    await expect(readSitemapPages(async from => from === 0
      ? { data: [{ id: 1 }], error: null }
      : { data: null, error: { message: 'database unavailable' } })).rejects.toThrow('Sitemap content query failed');
  });
  it('does not interpret null data as a successful empty page', async () => {
    await expect(readSitemapPages(async () => ({ data: null, error: null }))).rejects.toThrow();
  });
  it('accepts genuinely empty public tables', async () => {
    expect(await readSitemapPages(async () => ({ data: [], error: null }))).toEqual([]);
  });
  it('deduplicates routes and keeps the latest available modification date', () => {
    expect(deduplicateSitemap([{ url: 'https://www.shoonaya.com/a' },
      { url: 'https://www.shoonaya.com/a', lastModified: '2026-09-01' },
      { url: 'https://www.shoonaya.com/a', lastModified: '2026-08-01' }]))
      .toEqual([{ url: 'https://www.shoonaya.com/a', lastModified: '2026-09-01' }]);
  });
});
