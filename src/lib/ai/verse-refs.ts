/**
 * Adjacent verse refs within the same section: every segment but the last is
 * shared, so two-part refs (Gita "2.47") and three-part refs (Katha "1.3.3",
 * Mundaka "3.1.6") are handled alike. Returns null for refs that are not
 * dot-separated integers.
 */
export function adjacentVerseRefs(ref: string): { prev: string | null; next: string } | null {
  const parts = String(ref).split('.');
  if (parts.length < 2 || !parts.every((part) => /^\d+$/.test(part))) return null;
  const prefix = parts.slice(0, -1).join('.');
  const verse = Number(parts[parts.length - 1]);
  return { prev: verse > 1 ? `${prefix}.${verse - 1}` : null, next: `${prefix}.${verse + 1}` };
}
