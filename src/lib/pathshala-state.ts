import {
  getLibraryEntryById,
  getLibrarySectionById,
  type LibraryTradition,
} from '@/lib/library-content';
import { getCanonicalChapter, getRamayanaKanda } from '@/lib/pathshala-canonical';
import { getPathshalaEntryHref } from '@/lib/pathshala-links';

export interface PathshalaUserStateRow {
  entry_id: string;
  section_id: string;
  tradition: LibraryTradition;
  last_opened_at: string;
  bookmarked_at: string | null;
}

export interface PathshalaStudySummary {
  entryId: string;
  title: string;
  source: string;
  tradition: LibraryTradition;
  sectionId: string;
  sectionTitle: string;
  href: string;
  lastOpenedAt: string;
  bookmarkedAt: string | null;
}

function resolveStateRow(row: PathshalaUserStateRow): PathshalaStudySummary | null {
  const section = getLibrarySectionById(row.section_id);
  const canonicalChapter = getCanonicalChapter(row.section_id, row.entry_id);
  const canonicalKanda = getRamayanaKanda(row.section_id, row.entry_id);
  const entry = getLibraryEntryById(row.entry_id);

  if (!section || section.tradition !== row.tradition) {
    return null;
  }

  if (canonicalChapter) {
    return {
      entryId: row.entry_id,
      title: `Chapter ${canonicalChapter.chapterNumber} · ${canonicalChapter.englishTitle}`,
      source: `Bhagavad Gita ${canonicalChapter.chapterNumber}`,
      tradition: row.tradition,
      sectionId: row.section_id,
      sectionTitle: section.title,
      href: getPathshalaEntryHref(row.tradition, row.section_id, row.entry_id),
      lastOpenedAt: row.last_opened_at,
      bookmarkedAt: row.bookmarked_at,
    };
  }

  if (canonicalKanda) {
    return {
      entryId: row.entry_id,
      title: `Kanda ${canonicalKanda.kandaNumber} · ${canonicalKanda.englishTitle}`,
      source: `Valmiki Ramayana ${canonicalKanda.transliterationTitle}`,
      tradition: row.tradition,
      sectionId: row.section_id,
      sectionTitle: section.title,
      href: getPathshalaEntryHref(row.tradition, row.section_id, row.entry_id),
      lastOpenedAt: row.last_opened_at,
      bookmarkedAt: row.bookmarked_at,
    };
  }

  if (!entry) {
    return null;
  }

  return {
    entryId: row.entry_id,
    title: entry.title,
    source: entry.source,
    tradition: row.tradition,
    sectionId: row.section_id,
    sectionTitle: section.title,
    href: getPathshalaEntryHref(row.tradition, row.section_id, row.entry_id),
    lastOpenedAt: row.last_opened_at,
    bookmarkedAt: row.bookmarked_at,
  };
}

export function getContinueLearningSummary(rows: PathshalaUserStateRow[]) {
  const sorted = [...rows].sort(
    (left, right) => new Date(right.last_opened_at).getTime() - new Date(left.last_opened_at).getTime()
  );

  for (const row of sorted) {
    const resolved = resolveStateRow(row);
    if (resolved) return resolved;
  }

  return null;
}

export function getBookmarkedStudySummaries(rows: PathshalaUserStateRow[], limit = 4) {
  return [...rows]
    .filter((row) => !!row.bookmarked_at)
    .sort((left, right) => new Date(right.bookmarked_at!).getTime() - new Date(left.bookmarked_at!).getTime())
    .map((row) => resolveStateRow(row))
    .filter(Boolean)
    .slice(0, limit) as PathshalaStudySummary[];
}
