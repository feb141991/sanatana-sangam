'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Headphones, CheckCircle2, BookOpen, X } from 'lucide-react';
import { MotionFade, MotionItem, MotionStagger } from '@/components/motion/MotionPrimitives';
import type { GitaAudioTrack } from '@/lib/gita-audio';
import {
  markGitaAudioCompleted,
  markGitaAudioOpened,
  readGitaAudioState,
  type GitaAudioState,
} from '@/lib/gita-audio-state';
import {
  getPathshalaSectionHref,
  getPathshalaTraditionHref,
} from '@/lib/pathshala-links';

function openCompanion(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function GitaRecitationClient({
  tracks,
  highlightedChapterId,
  traditionLabel,
}: {
  tracks: GitaAudioTrack[];
  highlightedChapterId?: string;
  traditionLabel: string;
}) {
  const [audioState, setAudioState] = useState<GitaAudioState>({
    currentChapterId: null,
    lastOpenedAt: null,
    completedChapterIds: [],
  });
  const [focusedChapterId, setFocusedChapterId] = useState<string | null>(highlightedChapterId ?? null);

  useEffect(() => {
    const saved = readGitaAudioState();
    setAudioState(saved);
    if (!focusedChapterId && (highlightedChapterId ?? saved.currentChapterId)) {
      setFocusedChapterId(highlightedChapterId ?? saved.currentChapterId);
    }
  }, [focusedChapterId, highlightedChapterId]);

  const activeTrack = useMemo(
    () =>
      tracks.find((track) => track.chapterId === (focusedChapterId ?? audioState.currentChapterId)) ??
      tracks.find((track) => track.chapterId === highlightedChapterId) ??
      null,
    [audioState.currentChapterId, focusedChapterId, highlightedChapterId, tracks]
  );

  const completedCount = audioState.completedChapterIds.length;

  function startTrack(track: GitaAudioTrack) {
    setFocusedChapterId(track.chapterId);
    setAudioState(markGitaAudioOpened(track));
    openCompanion(track.companionAudioUrl);
  }

  function completeTrack(track: GitaAudioTrack) {
    setAudioState(markGitaAudioCompleted(track));
  }

  return (
    <MotionFade className="space-y-4 pb-6 fade-in">
      <div className="glass-panel rounded-[1.8rem] px-5 py-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
          <Link href="/library" className="text-[color:var(--brand-primary)]">Pathshala</Link>
          <span>•</span>
          <Link href={getPathshalaTraditionHref('hindu')} className="text-[color:var(--brand-primary)]">{traditionLabel}</Link>
          <span>•</span>
          <Link href={getPathshalaSectionHref('hindu', 'gita')} className="text-[color:var(--brand-primary)]">Bhagavad Gita</Link>
          <span>•</span>
          <span>Recitation</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">Companion-audio foundation</span>
            <span className="glass-chip px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-600">Gita-first rollout</span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Bhagavad Gita recitation</h1>
            <p className="text-sm text-gray-700 leading-relaxed mt-2">
              This is the first in-app audio foundation for Pathshala: choose a chapter, open the authoritative companion audio, keep your place, and return straight to study. Playback stays companion-first until rights-safe in-app hosting is confirmed.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="clay-card rounded-[1.4rem] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Audio stance</p>
          <p className="font-semibold text-gray-900 mt-2">Authoritative companion</p>
          <p className="text-sm text-gray-600 mt-1">We keep the chanting source honest while the in-app player layer is still being built.</p>
        </div>
        <div className="glass-panel rounded-[1.4rem] px-4 py-4 border border-white/60">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Progress</p>
          <p className="font-semibold text-gray-900 mt-2">{completedCount} of {tracks.length} chapters marked complete</p>
          <p className="text-sm text-gray-600 mt-1">Your last opened chapter is kept locally on this device for a smoother return loop.</p>
        </div>
        <div className="glass-panel rounded-[1.4rem] px-4 py-4 border border-white/60">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Next layer later</p>
          <p className="font-semibold text-gray-900 mt-2">Hosted playback when rights are clear</p>
          <p className="text-sm text-gray-600 mt-1">This structure is ready for a future in-app player without pretending we already have hosted authoritative chanting.</p>
        </div>
      </div>

      {activeTrack ? (
        <div className="glass-panel rounded-[1.6rem] px-5 py-5 border border-white/60 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">Focused recitation</p>
              <p className="font-display text-2xl font-bold text-gray-900 mt-2">
                Chapter {activeTrack.chapterNumber} · {activeTrack.title}
              </p>
              <p className="text-sm text-gray-600 mt-1">{activeTrack.transliterationTitle} · {activeTrack.verseCount} verses</p>
            </div>
            <button
              type="button"
              onClick={() => setFocusedChapterId(null)}
              className="rounded-full border border-[color:var(--brand-primary-soft)] bg-white/80 p-2 text-gray-500"
              aria-label="Close focused recitation"
            >
              <X size={16} />
            </button>
          </div>

          <div className="rounded-[1.6rem] bg-[var(--brand-primary-soft)]/60 px-5 py-10 text-center space-y-4">
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[color:var(--brand-primary)]">Stay with one chapter</p>
            <p className="font-display text-4xl font-bold text-[color:var(--brand-primary-strong)]">Chapter {activeTrack.chapterNumber}</p>
            <p className="max-w-xl mx-auto text-sm leading-relaxed text-gray-700">{activeTrack.summary}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => startTrack(activeTrack)}
                className="glass-button-primary rounded-full px-5 py-3 text-sm font-semibold text-white inline-flex items-center justify-center gap-2"
              >
                <Headphones size={16} />
                Open authoritative audio
              </button>
              <a
                href={activeTrack.companionTextUrl}
                target="_blank"
                rel="noreferrer"
                className="glass-button-secondary rounded-full px-5 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
                style={{ color: 'var(--brand-primary)' }}
              >
                <ExternalLink size={16} />
                Open companion text
              </a>
              <Link
                href={activeTrack.returnHref}
                className="glass-button-secondary rounded-full px-5 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
                style={{ color: 'var(--brand-primary)' }}
              >
                <BookOpen size={16} />
                Return to study
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => completeTrack(activeTrack)}
              className="glass-button-secondary rounded-full px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
              style={{ color: 'var(--brand-primary)' }}
            >
              <CheckCircle2 size={16} />
              Mark chapter complete
            </button>
            {audioState.completedChapterIds.includes(activeTrack.chapterId) ? (
              <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">Completed on this device</span>
            ) : null}
          </div>
        </div>
      ) : null}

      <section className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Chapter audio map</p>
          <p className="text-sm text-gray-600 mt-1">Choose a chapter, open the companion audio, and keep your progress grounded inside Pathshala.</p>
        </div>

        <MotionStagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" delay={0.05}>
          {tracks.map((track) => {
            const isFocused = activeTrack?.chapterId === track.chapterId;
            const isCompleted = audioState.completedChapterIds.includes(track.chapterId);

            return (
              <MotionItem key={track.id}>
                <div className="glass-panel rounded-[1.45rem] px-4 py-4 border border-white/60 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">Chapter {track.chapterNumber}</p>
                      <p className="font-semibold text-gray-900 mt-2">{track.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{track.transliterationTitle}</p>
                    </div>
                    <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">{track.verseCount} verses</span>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed">{track.summary}</p>

                  <div className="flex flex-wrap gap-2">
                    {isFocused ? (
                      <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">Focused now</span>
                    ) : null}
                    {isCompleted ? (
                      <span className="rounded-full bg-[var(--brand-primary-soft)] px-3 py-1 text-[11px] font-semibold text-[color:var(--brand-primary-strong)]">
                        Completed
                      </span>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() => setFocusedChapterId(track.chapterId)}
                      className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold text-center"
                      style={{ color: 'var(--brand-primary)' }}
                    >
                      Focus recitation
                    </button>
                    <button
                      type="button"
                      onClick={() => startTrack(track)}
                      className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold text-center"
                      style={{ color: 'var(--brand-primary)' }}
                    >
                      Open audio companion
                    </button>
                    <Link
                      href={track.returnHref}
                      className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold text-center"
                      style={{ color: 'var(--brand-primary)' }}
                    >
                      Study in Pathshala
                    </Link>
                  </div>
                </div>
              </MotionItem>
            );
          })}
        </MotionStagger>
      </section>
    </MotionFade>
  );
}
