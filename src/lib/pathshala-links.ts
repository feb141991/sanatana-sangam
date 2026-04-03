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

export function getGitaStoryHref(standalone = false) {
  return standalone ? '/gita-story' : '/library/hindu/gita/story';
}

export function getGitaStoryEpisodeHref(episodeId: string, standalone = false) {
  return `${getGitaStoryHref(standalone)}/${episodeId}`;
}

export function getGitaRecitationHref(chapterId?: string) {
  const base = '/library/hindu/gita/recite';
  if (!chapterId) return base;
  return `${base}?chapter=${encodeURIComponent(chapterId)}`;
}

export function getAIChatHref(prompt: string, context?: string) {
  const params = new URLSearchParams({ prefill: prompt });
  if (context) params.set('context', context);
  return `/ai-chat?${params.toString()}`;
}
