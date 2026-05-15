import type { LibraryEntry, LibrarySection, LibraryTradition } from '@/lib/library-content';

export function getPathshalaTraditionHref(tradition: LibraryTradition) {
  return `/pathshala?tab=scripture&tradition=${tradition}`;
}

export function getPathshalaSectionHref(tradition: LibraryTradition, sectionId: string) {
  return `/pathshala?tab=scripture&sectionId=${sectionId}`;
}

export function getPathshalaEntryHref(tradition: LibraryTradition, sectionId: string, entryId: string) {
  return `/pathshala?tab=scripture&entryId=${entryId}`;
}

export function getPathshalaEntryHrefFromSection(section: LibrarySection, entry: LibraryEntry) {
  return getPathshalaEntryHref(section.tradition, section.id, entry.id);
}

export function getPathshalaChapterHref(tradition: LibraryTradition, sectionId: string, chapterId: string) {
  return getPathshalaEntryHref(tradition, sectionId, chapterId);
}

export function getGitaRecitationHref(chapterId?: string) {
  const base = '/pathshala?tab=scripture&sectionId=gita';
  if (!chapterId) return base;
  return `/pathshala?tab=scripture&entryId=${chapterId}`;
}
export function getAIChatHref(prompt: string, context?: string) {
  const params = new URLSearchParams({ prefill: prompt });
  if (context) params.set('context', context);
  return `/ai-chat?${params.toString()}`;
}
