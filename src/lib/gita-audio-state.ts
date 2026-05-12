'use client';

import type { GitaAudioTrack } from '@/lib/gita-audio';

const STORAGE_KEY = 'shoonaya:gita-audio-state';

export interface GitaAudioState {
  currentChapterId: string | null;
  lastOpenedAt: string | null;
  completedChapterIds: string[];
}

const EMPTY_STATE: GitaAudioState = {
  currentChapterId: null,
  lastOpenedAt: null,
  completedChapterIds: [],
};

export function readGitaAudioState(): GitaAudioState {
  if (typeof window === 'undefined') return EMPTY_STATE;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<GitaAudioState>;
    return {
      currentChapterId: parsed.currentChapterId ?? null,
      lastOpenedAt: parsed.lastOpenedAt ?? null,
      completedChapterIds: Array.isArray(parsed.completedChapterIds) ? parsed.completedChapterIds : [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

export function writeGitaAudioState(state: GitaAudioState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function markGitaAudioOpened(track: GitaAudioTrack) {
  const state = readGitaAudioState();
  const nextState: GitaAudioState = {
    ...state,
    currentChapterId: track.chapterId,
    lastOpenedAt: new Date().toISOString(),
  };
  writeGitaAudioState(nextState);
  return nextState;
}

export function markGitaAudioCompleted(track: GitaAudioTrack) {
  const state = readGitaAudioState();
  const nextState: GitaAudioState = {
    ...state,
    currentChapterId: track.chapterId,
    lastOpenedAt: new Date().toISOString(),
    completedChapterIds: Array.from(new Set([...state.completedChapterIds, track.chapterId])),
  };
  writeGitaAudioState(nextState);
  return nextState;
}
