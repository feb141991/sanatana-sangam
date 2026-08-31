// Pure keyset-cursor helpers for the Mandali feed's (created_at, id)
// pagination. Deliberately has no 'server-only' import and no Supabase
// dependency so it can be unit-tested directly -- see
// mandali-cursor.test.ts, which proves the design (strictly-decreasing
// tuple comparison) is immune to a post being inserted between two page
// fetches, unlike offset pagination.

export type FeedCursor = { createdAt: string; id: string };

export function encodeFeedCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}|${id}`, 'utf8').toString('base64url');
}

/** Native must never construct or parse this itself -- treat it as opaque. */
export function decodeFeedCursor(cursor: string): FeedCursor | null {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const [createdAt, id] = decoded.split('|');
    if (!createdAt || !id) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

/**
 * Mirrors the SQL keyset predicate used in loadMandaliFeedPage's `.or()`
 * filter: true when `row` sorts strictly after `cursor` in (created_at
 * desc, id desc) order -- i.e. row belongs on a page fetched AFTER the one
 * that produced this cursor.
 */
export function isAfterCursor(row: { created_at: string; id: string }, cursor: FeedCursor): boolean {
  if (row.created_at !== cursor.createdAt) {
    return row.created_at < cursor.createdAt;
  }
  return row.id < cursor.id;
}

export function formatIdListLiteral(ids: string[]): string {
  return `(${ids.join(',')})`;
}
