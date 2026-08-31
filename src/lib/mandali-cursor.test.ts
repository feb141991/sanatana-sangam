import { describe, it, expect } from 'vitest';
import { encodeFeedCursor, decodeFeedCursor, isAfterCursor } from './mandali-cursor';

type SyntheticPost = { id: string; created_at: string };

/** Same ordering the SQL query uses: created_at desc, id desc. */
function sortFeedOrder(rows: SyntheticPost[]): SyntheticPost[] {
  return [...rows].sort((a, b) => {
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1;
    return a.id < b.id ? 1 : -1;
  });
}

/** Mirrors loadMandaliFeedPage's query: rows after the cursor, page-sized. */
function fetchPage(rows: SyntheticPost[], cursor: ReturnType<typeof decodeFeedCursor>, pageSize: number) {
  const ordered = sortFeedOrder(rows);
  const eligible = cursor ? ordered.filter((row) => isAfterCursor(row, cursor)) : ordered;
  return eligible.slice(0, pageSize);
}

describe('Mandali feed cursor', () => {
  it('round-trips created_at/id through encode and decode', () => {
    const encoded = encodeFeedCursor('2026-08-30T10:00:00.000Z', 'post-42');
    const decoded = decodeFeedCursor(encoded);
    expect(decoded).toEqual({ createdAt: '2026-08-30T10:00:00.000Z', id: 'post-42' });
  });

  it('rejects a malformed or empty cursor instead of throwing', () => {
    expect(decodeFeedCursor('not-base64url-at-all-!!!')).toBeNull();
    expect(decodeFeedCursor(Buffer.from('missing-separator').toString('base64url'))).toBeNull();
  });

  // The exact acceptance test specified in this session's Home/Mandali
  // architecture review: insert a new post between fetching page 1 and
  // page 2, then confirm no duplicates and no missing pre-existing posts.
  // This is the property offset pagination (LIMIT/OFFSET) cannot guarantee
  // -- a live insert at the front shifts every row underneath an offset,
  // causing either a skipped or duplicated row on the next page. Keyset
  // pagination is immune to this because each page's boundary is anchored
  // to a specific (created_at, id) tuple, not a row count.
  it('insert-between-pages: no duplicates, no missing rows, across a live insertion', () => {
    const initialPosts: SyntheticPost[] = [
      { id: 'p5', created_at: '2026-08-30T10:05:00.000Z' },
      { id: 'p4', created_at: '2026-08-30T10:04:00.000Z' },
      { id: 'p3', created_at: '2026-08-30T10:03:00.000Z' },
      { id: 'p2', created_at: '2026-08-30T10:02:00.000Z' },
      { id: 'p1', created_at: '2026-08-30T10:01:00.000Z' },
    ];

    // Page 1: newest 2 posts.
    const page1 = fetchPage(initialPosts, null, 2);
    expect(page1.map((r) => r.id)).toEqual(['p5', 'p4']);
    const cursorAfterPage1 = decodeFeedCursor(encodeFeedCursor(page1[1].created_at, page1[1].id));

    // Live insert: a brand-new post arrives, newer than everything --
    // exactly the "insert between fetching pages" scenario.
    const withNewPost: SyntheticPost[] = [
      { id: 'p6', created_at: '2026-08-30T10:06:00.000Z' },
      ...initialPosts,
    ];

    // Page 2, fetched AFTER the insert, using the cursor captured BEFORE it.
    const page2 = fetchPage(withNewPost, cursorAfterPage1, 2);

    // The new post must never appear on page 2 -- it sorts before the
    // cursor (newer), so it's simply invisible to a pagination sequence
    // that already moved past that point. It would only ever appear on a
    // fresh page-1 fetch (pull-to-refresh), never causing a duplicate.
    expect(page2.some((r) => r.id === 'p6')).toBe(false);

    // The pre-existing posts continue exactly where page 1 left off --
    // no gap, no repeat of p5/p4.
    expect(page2.map((r) => r.id)).toEqual(['p3', 'p2']);

    // Across both pages, every pre-existing post appears exactly once.
    const seenAcrossPages = [...page1, ...page2].map((r) => r.id);
    expect(seenAcrossPages).toEqual(['p5', 'p4', 'p3', 'p2']);
    expect(new Set(seenAcrossPages).size).toBe(seenAcrossPages.length);
  });

  it('breaks ties by id when two posts share the exact same created_at', () => {
    const rows: SyntheticPost[] = [
      { id: 'b', created_at: '2026-08-30T10:00:00.000Z' },
      { id: 'a', created_at: '2026-08-30T10:00:00.000Z' },
      { id: 'c', created_at: '2026-08-29T10:00:00.000Z' },
    ];

    const page1 = fetchPage(rows, null, 1);
    expect(page1.map((r) => r.id)).toEqual(['b']); // higher id wins the same-instant tie

    const cursor = decodeFeedCursor(encodeFeedCursor(page1[0].created_at, page1[0].id));
    const page2 = fetchPage(rows, cursor, 2);
    expect(page2.map((r) => r.id)).toEqual(['a', 'c']); // 'a' (same instant, lower id) comes next, not skipped
  });
});
