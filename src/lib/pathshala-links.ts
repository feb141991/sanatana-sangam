import type { LibraryEntry, LibrarySection, LibraryTradition } from '@/lib/library-content';

export function getPathshalaTraditionHref(tradition: LibraryTradition) {
  return `/library/${tradition}`;
}

export function getPathshalaSectionHref(tradition: LibraryTradition, sectionId: string) {
  return `${getPathshalaTraditionHref(tradition)}/${sectionId}`;
}

export function getPathshalaEntryHref(tradition: LibraryTradition, sectionId: string, entryId: string) {
  return `${getPathshalaSectionHref(tradition, sectionId)}/${entryId}`;
}

export function getPathshalaEntryHrefFromSection(section: LibrarySection, entry: LibraryEntry) {
  return getPathshalaEntryHref(section.tradition, section.id, entry.id);
}

export function getPathshalaChapterHref(tradition: LibraryTradition, sectionId: string, chapterId: string) {
  return getPathshalaEntryHref(tradition, sectionId, chapterId);
}
