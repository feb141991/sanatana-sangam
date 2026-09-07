import type { MetadataRoute } from 'next';

/** Never turn a failed database page into a successful, truncated sitemap. */
export async function readSitemapPages<T>(
  read: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (;;) {
    const result = await read(rows.length, rows.length + 499);
    if (result.error || !result.data) throw new Error('Sitemap content query failed');
    if (result.data.length === 0) return rows;
    rows.push(...result.data);
    if (rows.length > 45_000) throw new Error('Sitemap requires splitting before adding more content');
  }
}

export function deduplicateSitemap(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const unique = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const entry of entries) {
    const existing = unique.get(entry.url);
    if (!existing || (entry.lastModified && (!existing.lastModified ||
      new Date(entry.lastModified) > new Date(existing.lastModified)))) unique.set(entry.url, entry);
  }
  if (unique.size > 50_000) throw new Error('Sitemap exceeds the single-file URL limit');
  return [...unique.values()];
}
