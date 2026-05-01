'use client';

// ─── Pathshala Lesson Viewer ──────────────────────────────────────────────────
// Displays scripture lessons grouped by chapter/section.
// Free: read + expand + mark complete.
// Pro (future): AI explanation, voice scoring, flashcards.

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, CheckCircle2,
  BookOpen, Mic, Sparkles, ChevronDown, ChevronUp,
  Copy, Loader2, Bookmark, Volume2, VolumeX, ZoomIn, ZoomOut, Maximize2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import { GITA_FULL_DATA } from '@/lib/gita-full-data';
import { ALL_LIBRARY_ENTRIES } from '@/lib/library-content';
import CircularProgress from '@/components/ui/CircularProgress';
import ConfettiOverlay from '@/components/ui/ConfettiOverlay';
import { SEED_PATHS } from '@/app/(main)/pathshala/PathshalaClient';
import { useSadhana } from '@/contexts/EngineContext';
import { getAIChatHref } from '@/lib/pathshala-links';
import type { LibraryEntry } from '@/lib/library-content';
import type { LibraryTradition } from '@/lib/library-content';

// ─── Lesson content builder ────────────────────────────────────────────────────
// Groups library entries into paginated lessons (~4 entries each)
const ENTRIES_PER_LESSON = 4;
const READER_FONT_STEPS = [0.92, 1, 1.12, 1.24, 1.38] as const;

function getEntryText(entry: LibraryEntry) {
  return [
    `${entry.title} — ${entry.source}`,
    entry.original,
    entry.meaning ? `Meaning: ${entry.meaning}` : '',
  ].filter(Boolean).join('\n\n');
}

function getPathLessons(pathId: string): { title: string; entries: LibraryEntry[] }[] {
  let entries: LibraryEntry[] = [];

  switch (pathId) {
    case 'bhagavad-gita-intro': {
      // Group by chapter — one lesson per chapter
      const chapters = Array.from({ length: 18 }, (_, i) => i + 1);
      return chapters.map(ch => {
        const tag = `chapter-${ch}`;
        const chEntries = GITA_FULL_DATA.filter(e => (e.tags as readonly string[]).includes(tag));
        // Limit to first 8 verses per chapter to keep lessons digestible
        return {
          title: `Chapter ${ch}`,
          entries: chEntries.slice(0, 8) as unknown as LibraryEntry[],
        };
      }).filter(l => l.entries.length > 0);
    }

    case 'upanishads-core': {
      // Core four Upanishads: Isha, Kena, Katha, Mandukya
      const upanishads = ['isha', 'kena', 'katha', 'mandukya'];
      const result: { title: string; entries: LibraryEntry[] }[] = [];
      for (const name of upanishads) {
        const uEntries = ALL_LIBRARY_ENTRIES.filter(e =>
          e.category === 'upanishad' && e.tags.some(t => t.includes(name))
        );
        // Chunk into groups
        for (let i = 0; i < uEntries.length; i += ENTRIES_PER_LESSON) {
          result.push({
            title: `${name.charAt(0).toUpperCase() + name.slice(1)} Upanishad — Part ${Math.floor(i / ENTRIES_PER_LESSON) + 1}`,
            entries: uEntries.slice(i, i + ENTRIES_PER_LESSON),
          });
        }
      }
      return result.length > 0 ? result : [{ title: 'Upanishad Verses', entries: ALL_LIBRARY_ENTRIES.filter(e => e.category === 'upanishad').slice(0, ENTRIES_PER_LESSON) }];
    }

    case 'stotra-path': {
      const stotraEntries = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'stotra');
      const result: { title: string; entries: LibraryEntry[] }[] = [];
      for (let i = 0; i < stotraEntries.length; i += ENTRIES_PER_LESSON) {
        result.push({
          title: `Stotra Session ${Math.floor(i / ENTRIES_PER_LESSON) + 1}`,
          entries: stotraEntries.slice(i, i + ENTRIES_PER_LESSON),
        });
      }
      return result.length > 0 ? result : [{ title: 'Daily Stotras', entries: stotraEntries.slice(0, 4) }];
    }

    case 'yoga-sutras': {
      const yogaEntries = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'yoga_sutra');
      const result: { title: string; entries: LibraryEntry[] }[] = [];
      // Group by chapter
      const yogaChapters = ['samadhi', 'sadhana', 'vibhuti', 'kaivalya'];
      for (const chapter of yogaChapters) {
        const cEntries = yogaEntries.filter(e => e.tags.some(t => t.includes(chapter)));
        for (let i = 0; i < cEntries.length; i += ENTRIES_PER_LESSON) {
          result.push({
            title: `${chapter.charAt(0).toUpperCase() + chapter.slice(1)} Pada — Part ${Math.floor(i / ENTRIES_PER_LESSON) + 1}`,
            entries: cEntries.slice(i, i + ENTRIES_PER_LESSON),
          });
        }
      }
      return result.length > 0 ? result : [{ title: 'Yoga Sutras', entries: yogaEntries.slice(0, 4) }];
    }

    case 'nitnem-daily': {
      const gurbaniEntries = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'gurbani' || e.category === 'nitnem');
      const result: { title: string; entries: LibraryEntry[] }[] = [];
      for (let i = 0; i < gurbaniEntries.length; i += ENTRIES_PER_LESSON) {
        result.push({
          title: `Nitnem Session ${Math.floor(i / ENTRIES_PER_LESSON) + 1}`,
          entries: gurbaniEntries.slice(i, i + ENTRIES_PER_LESSON),
        });
      }
      return result.length > 0 ? result : [{ title: 'Nitnem Banis', entries: gurbaniEntries.slice(0, 4) }];
    }

    case 'dhammapada-path': {
      const dhamma = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'dhammapada');
      const result: { title: string; entries: LibraryEntry[] }[] = [];
      for (let i = 0; i < dhamma.length; i += ENTRIES_PER_LESSON) {
        result.push({
          title: `Chapter ${Math.floor(i / ENTRIES_PER_LESSON) + 1} — Dhammapada`,
          entries: dhamma.slice(i, i + ENTRIES_PER_LESSON),
        });
      }
      return result.length > 0 ? result : [{ title: 'Dhammapada', entries: dhamma.slice(0, 4) }];
    }

    default: {
      // Fallback: first 30 Gita verses split into groups
      entries = GITA_FULL_DATA.slice(0, 30) as unknown as LibraryEntry[];
      const result: { title: string; entries: LibraryEntry[] }[] = [];
      for (let i = 0; i < entries.length; i += ENTRIES_PER_LESSON) {
        result.push({ title: `Session ${Math.floor(i / ENTRIES_PER_LESSON) + 1}`, entries: entries.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result;
    }
  }
}

// ─── Entry Card ────────────────────────────────────────────────────────────────
function VerseCard({
  entry,
  accentColour,
  index,
  fontScale,
  bookmarked,
  speaking,
  ttsLoading,
  onBookmark,
  onCopy,
  onSpeak,
}: {
  entry: LibraryEntry;
  accentColour: string;
  index: number;
  fontScale: number;
  bookmarked: boolean;
  speaking: boolean;
  ttsLoading: boolean;
  onBookmark: (entry: LibraryEntry) => void;
  onCopy: (entry: LibraryEntry) => void;
  onSpeak: (entry: LibraryEntry) => void;
}) {
  const [expanded, setExpanded] = useState(index === 0); // first verse auto-opens
  const askHref = getAIChatHref(
    `Explain this Pathshala verse in simple Hindi and English, with practical learning guidance: ${entry.title}`,
    getEntryText(entry)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="pathshala-glass-card rounded-[1.45rem] overflow-hidden"
    >
      <button className="w-full text-left p-4" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-[color:var(--brand-ink)]">{entry.title}</p>
            <p className="text-xs text-[color:var(--brand-muted)] mt-0.5">{entry.source}</p>
          </div>
          {expanded
            ? <ChevronUp size={15} className="text-[color:var(--brand-muted)] shrink-0 mt-0.5" />
            : <ChevronDown size={15} className="text-[color:var(--brand-muted)] shrink-0 mt-0.5" />
          }
        </div>
        <p
          className="mt-2.5 text-base leading-relaxed font-medium"
          style={{ color: accentColour, fontFamily: 'var(--font-deva, serif)', fontSize: `${1.05 * fontScale}rem` }}
        >
          {entry.original.split('\n')[0]}
          {entry.original.includes('\n') && !expanded ? '…' : ''}
        </p>
      </button>

      <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
        <button onClick={() => onSpeak(entry)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold motion-press"
          style={{ color: accentColour, background: `${accentColour}12`, border: `1px solid ${accentColour}24` }}>
          {ttsLoading ? <Loader2 size={13} className="animate-spin" /> : speaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
          {speaking ? 'Stop' : 'Listen'}
        </button>
        <button onClick={() => onCopy(entry)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold motion-press"
          style={{ color: 'var(--brand-muted)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,146,74,0.14)' }}>
          <Copy size={13} /> Copy
        </button>
        <button onClick={() => onBookmark(entry)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold motion-press"
          style={{ color: bookmarked ? '#1c1c1a' : accentColour, background: bookmarked ? accentColour : `${accentColour}12`, border: `1px solid ${accentColour}24` }}>
          <Bookmark size={13} className={bookmarked ? 'fill-current' : ''} /> {bookmarked ? 'Saved' : 'Save'}
        </button>
        <Link href={askHref}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold motion-press"
          style={{ color: accentColour, background: `${accentColour}12`, border: `1px solid ${accentColour}24` }}>
          <Sparkles size={13} /> Ask AI
        </Link>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 pt-3" style={{ borderTop: '1px solid rgba(200,146,74,0.14)' }}>
              {/* Full original */}
              {entry.original.includes('\n') && (
                <div>
                  <p className="text-[10px] font-semibold text-[color:var(--brand-muted)] uppercase tracking-wider mb-1.5">Original</p>
                  <p
                    className="text-sm leading-relaxed whitespace-pre-line"
                    style={{ color: accentColour, fontFamily: 'var(--font-deva, serif)', fontSize: `${0.95 * fontScale}rem` }}
                  >
                    {entry.original}
                  </p>
                </div>
              )}

              {/* Transliteration */}
              {entry.transliteration && (
                <div>
                  <p className="text-[10px] font-semibold text-[color:var(--brand-muted)] uppercase tracking-wider mb-1.5">Hindi learning guide</p>
                  <p className="text-sm italic text-[color:var(--brand-muted)] leading-relaxed">
                    {entry.transliteration}
                  </p>
                </div>
              )}

              {/* Meaning */}
              <div>
                <p className="text-[10px] font-semibold text-[color:var(--brand-muted)] uppercase tracking-wider mb-1.5">Meaning</p>
                <p className="text-sm text-[color:var(--brand-ink)] leading-relaxed" style={{ fontSize: `${0.92 * fontScale}rem` }}>{entry.meaning}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  userId: string;
  pathId: string;
  tradition: string;
  accentColour: string;
  currentLesson: number;
  completedLessons: number[];
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function LessonClient({
  userId,
  pathId,
  tradition,
  accentColour,
  currentLesson: initialLesson,
  completedLessons: initialCompleted,
}: Props) {
  const router  = useRouter();
  const engine  = useSadhana();
  const supabase = useRef(createClient()).current;

  const path = SEED_PATHS.find(p => p.id === pathId);
  const lessons = useMemo(() => getPathLessons(pathId), [pathId]);
  const totalLessons = lessons.length;

  const [lessonIndex, setLessonIndex] = useState(initialLesson ?? 0);
  const [completed, setCompleted] = useState<number[]>(initialCompleted ?? []);
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [fontStep, setFontStep] = useState(1);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [ttsLoadingId, setTtsLoadingId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const lesson = lessons[lessonIndex];
  const isCompleted = completed.includes(lessonIndex);
  const progressPct = totalLessons > 0 ? Math.round((completed.length / totalLessons) * 100) : 0;
  const fontScale = READER_FONT_STEPS[fontStep];

  useEffect(() => {
    if (!userId || lesson.entries.length === 0) return;
    let cancelled = false;
    async function loadBookmarks() {
      const ids = lesson.entries.map(entry => entry.id);
      const { data } = await supabase
        .from('pathshala_user_state')
        .select('entry_id, bookmarked_at')
        .eq('user_id', userId)
        .in('entry_id', ids);
      if (cancelled) return;
      setBookmarkedIds(new Set((data ?? []).filter(row => row.bookmarked_at).map(row => row.entry_id)));
    }
    loadBookmarks();
    return () => { cancelled = true; };
  }, [lesson.entries, supabase, userId]);

  const stopTTS = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setSpeakingId(null);
    setTtsLoadingId(null);
  }, []);

  useEffect(() => () => stopTTS(), [stopTTS]);

  async function copyEntry(entry: LibraryEntry) {
    try {
      await navigator.clipboard.writeText(getEntryText(entry));
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Copy unavailable');
    }
  }

  async function speakEntry(entry: LibraryEntry) {
    if (speakingId === entry.id || ttsLoadingId === entry.id) {
      stopTTS();
      return;
    }

    stopTTS();
    setTtsLoadingId(entry.id);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: entry.original, rate: 0.78 }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const { audioContent } = await res.json() as { audioContent: string };
      const bytes = Uint8Array.from(atob(audioContent), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setSpeakingId(null); URL.revokeObjectURL(url); };
      audio.onerror = () => { setSpeakingId(null); URL.revokeObjectURL(url); };
      await audio.play();
      setSpeakingId(entry.id);
    } catch {
      toast.error('Audio is unavailable right now');
    } finally {
      setTtsLoadingId(null);
    }
  }

  async function toggleBookmark(entry: LibraryEntry) {
    const next = !bookmarkedIds.has(entry.id);
    const timestamp = new Date().toISOString();
    const previous = new Set(bookmarkedIds);
    setBookmarkedIds(prev => {
      const clone = new Set(prev);
      if (next) clone.add(entry.id); else clone.delete(entry.id);
      return clone;
    });

    const { error } = await supabase
      .from('pathshala_user_state')
      .upsert({
        user_id: userId,
        tradition: tradition as LibraryTradition,
        section_id: entry.category,
        entry_id: entry.id,
        last_opened_at: timestamp,
        bookmarked_at: next ? timestamp : null,
      }, { onConflict: 'user_id,entry_id' });

    if (error) {
      setBookmarkedIds(previous);
      toast.error(error.message);
      return;
    }

    toast.success(next ? 'Saved for later' : 'Removed from saved');
  }

  async function saveSelectedText() {
    const text = window.getSelection()?.toString().trim();
    if (!text) {
      toast('Select a line first, then tap Save selection.');
      return;
    }
    const key = `pathshala_saved_selection_${userId}`;
    const payload = {
      text,
      pathId,
      lesson: lessonIndex,
      title: lesson.title,
      savedAt: new Date().toISOString(),
    };
    try {
      const existing = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown[];
      localStorage.setItem(key, JSON.stringify([payload, ...existing].slice(0, 50)));
      toast.success('Selection saved on this device');
    } catch {
      toast.error('Could not save selection');
    }
  }

  async function enterFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      toast('Fullscreen is blocked by this browser. Reader mode is still active.');
    }
  }

  async function markComplete() {
    if (isCompleted || saving) return;
    setSaving(true);
    const newCompleted = [...completed, lessonIndex];
    const nextLesson = Math.min(lessonIndex + 1, totalLessons - 1);

    try {
      const { error } = await supabase
        .from('guided_path_progress')
        .update({
          current_lesson: nextLesson,
          completed_lessons: newCompleted,
          ...(newCompleted.length === totalLessons ? { status: 'completed', completed_at: new Date().toISOString() } : {}),
        })
        .eq('user_id', userId)
        .eq('path_id', pathId);

      if (error) throw error;

      setCompleted(newCompleted);
      const isPathDone = newCompleted.length === totalLessons;
      toast.success(isPathDone ? 'Path completed! 🎉 Jai Ho!' : 'Lesson complete 🙏');
      if (isPathDone) setShowConfetti(true);

      // Fire-and-forget engine tracking (don't block UI)
      if (engine) {
        engine.tracker.trackShlokaRead(pathId, lessonIndex, 0, 0).catch(() => {});
        engine.streaks.markDone(userId, 'shloka').catch(() => {});
      }

      if (newCompleted.length < totalLessons) {
        setLessonIndex(nextLesson);
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not save progress');
    } finally {
      setSaving(false);
    }
  }

  function goTo(index: number) {
    if (index < 0 || index >= totalLessons) return;
    setLessonIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <BookOpen size={40} className="text-[color:var(--brand-muted)]" />
        <p className="text-[color:var(--brand-ink)] font-semibold">No lessons found for this path</p>
        <Link href="/pathshala" className="text-sm underline" style={{ color: accentColour }}>
          Back to Pathshala
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-28">

      {/* Sacred confetti on path completion */}
      <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Header */}
      <div className="sticky top-0 z-30 px-4 py-2"
        style={{
          background: 'var(--card-bg)',
          borderBottom: '1px solid rgba(200,146,74,0.14)',
          backdropFilter: 'blur(18px) saturate(125%)',
          WebkitBackdropFilter: 'blur(18px) saturate(125%)',
        }}>
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/pathshala')}
            className="w-9 h-9 rounded-full flex items-center justify-center motion-press"
            style={{ background: `${accentColour}14` }}
          >
            <ChevronLeft size={18} style={{ color: accentColour }} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[color:var(--brand-muted)] truncate">{path?.title ?? pathId}</p>
            <p className="text-sm font-semibold text-[color:var(--brand-ink)]">
              {lesson.title}
              <span className="text-xs font-normal text-[color:var(--brand-muted)] ml-2">
                {lessonIndex + 1} / {totalLessons}
              </span>
            </p>
          </div>
          <Link
            href={`/pathshala/${pathId}/recite`}
            className="hidden sm:flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full motion-press"
            style={{ color: accentColour, background: `${accentColour}10`, border: '1px solid rgba(200,146,74,0.16)' }}
          >
            <Mic size={13} /> Recite
          </Link>
        </div>

        <div className="mt-2 max-w-2xl mx-auto flex items-center gap-2">
          <CircularProgress
            pct={progressPct}
            accent={accentColour}
            size={34}
            strokeWidth={3.5}
            label={<span className="text-[9px] font-bold" style={{ color: accentColour }}>{progressPct}%</span>}
          />
          <p className="text-[10px] text-[color:var(--brand-muted)] flex-1">{completed.length}/{totalLessons} lessons complete</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setFontStep(step => Math.max(0, step - 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center motion-press"
              style={{ color: 'var(--brand-muted)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,146,74,0.12)' }}
              aria-label="Decrease text size">
              <ZoomOut size={14} />
            </button>
            <button onClick={() => setFontStep(step => Math.min(READER_FONT_STEPS.length - 1, step + 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center motion-press"
              style={{ color: accentColour, background: `${accentColour}12`, border: `1px solid ${accentColour}24` }}
              aria-label="Increase text size">
              <ZoomIn size={14} />
            </button>
            <button onClick={saveSelectedText}
              className="w-8 h-8 rounded-full flex items-center justify-center motion-press"
              style={{ color: accentColour, background: `${accentColour}12`, border: `1px solid ${accentColour}24` }}
              aria-label="Save selected text">
              <Bookmark size={14} />
            </button>
            <button onClick={enterFullscreen}
              className="w-8 h-8 rounded-full flex items-center justify-center motion-press"
              style={{ color: 'var(--brand-muted)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,146,74,0.12)' }}
              aria-label="Enter fullscreen">
              <Maximize2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Lesson content */}
      <div className="px-4 pt-4 space-y-3">
        {lesson.entries.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={36} className="mx-auto mb-3 text-[color:var(--brand-muted)]" />
            <p className="text-sm text-[color:var(--brand-muted)]">Content for this lesson is coming soon.</p>
          </div>
        ) : (
          lesson.entries.map((entry, i) => (
            <VerseCard
              key={entry.id}
              entry={entry}
              accentColour={accentColour}
              index={i}
              fontScale={fontScale}
              bookmarked={bookmarkedIds.has(entry.id)}
              speaking={speakingId === entry.id}
              ttsLoading={ttsLoadingId === entry.id}
              onBookmark={toggleBookmark}
              onCopy={copyEntry}
              onSpeak={speakEntry}
            />
          ))
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => goTo(lessonIndex - 1)}
            disabled={lessonIndex === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-[color:var(--brand-muted)] disabled:opacity-30 transition-opacity motion-press"
            style={{ border: '1px solid rgba(200,146,74,0.16)', background: 'rgba(255,255,255,0.04)' }}
          >
            <ChevronLeft size={16} /> Previous
          </button>

          {isCompleted ? (
            <button
              onClick={() => goTo(lessonIndex + 1)}
              disabled={lessonIndex === totalLessons - 1}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-[#1c1c1a] disabled:opacity-40 transition-opacity"
              style={{ background: accentColour }}
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={markComplete}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-[#1c1c1a] disabled:opacity-60 transition-all"
              style={{ background: accentColour }}
            >
              {saving
                ? <Loader2 size={15} className="animate-spin" />
                : <><CheckCircle2 size={15} /> Mark Complete</>
              }
            </button>
          )}
        </div>

        {/* Lesson index */}
        {totalLessons <= 30 && (
          <div className="pt-2">
            <p className="text-xs text-[color:var(--brand-muted)] mb-2">Jump to lesson</p>
            <div className="flex flex-wrap gap-1.5">
              {lessons.map((l, i) => {
                const done = completed.includes(i);
                const current = i === lessonIndex;
                return (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="w-8 h-8 rounded-full text-xs font-semibold transition-all flex items-center justify-center"
                    style={{
                      background: current ? accentColour : done ? `${accentColour}20` : 'rgba(255,255,255,0.06)',
                      color: current ? '#1c1c1a' : done ? accentColour : 'var(--brand-muted)',
                      border: current ? 'none' : `1px solid ${done ? `${accentColour}30` : 'rgba(255,255,255,0.08)'}`,
                    }}
                    title={l.title}
                  >
                    {done && !current ? <CheckCircle2 size={12} /> : i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
