import {
  GITA_CHAPTERS,
  getOfficialGitaAudioUrl,
  getOfficialGitaChapterUrl,
} from '@/lib/pathshala-canonical';
import { getPathshalaChapterHref } from '@/lib/pathshala-links';

export interface GitaAudioTrack {
  id: string;
  chapterId: string;
  chapterNumber: number;
  title: string;
  transliterationTitle: string;
  verseCount: number;
  summary: string;
  companionAudioUrl: string;
  companionTextUrl: string;
  returnHref: string;
}

export const GITA_AUDIO_TRACKS: GitaAudioTrack[] = GITA_CHAPTERS.map((chapter) => ({
  id: `gita-audio-${chapter.chapterNumber}`,
  chapterId: chapter.id,
  chapterNumber: chapter.chapterNumber,
  title: chapter.englishTitle,
  transliterationTitle: chapter.transliterationTitle,
  verseCount: chapter.verseCount,
  summary: chapter.summary,
  companionAudioUrl: getOfficialGitaAudioUrl(chapter.chapterNumber),
  companionTextUrl: getOfficialGitaChapterUrl(chapter.chapterNumber),
  returnHref: getPathshalaChapterHref('hindu', 'gita', chapter.id),
}));

export function getGitaAudioTrack(chapterId?: string | null) {
  if (!chapterId) return null;
  return GITA_AUDIO_TRACKS.find((track) => track.chapterId === chapterId) ?? null;
}
