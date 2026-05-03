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
  Copy, Loader2, Bookmark, Volume2, VolumeX,
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
import { getTransliteration } from '@/lib/transliteration';
import type { LibraryEntry } from '@/lib/library-content';
import type { LibraryTradition } from '@/lib/library-content';

// ─── Lesson content builder ────────────────────────────────────────────────────
// Groups library entries into paginated lessons (~4 entries each)
const ENTRIES_PER_LESSON = 4;
// Starts at a comfortable reading size; users can increase further
const READER_FONT_STEPS = [1.1, 1.25, 1.4, 1.58, 1.78] as const;

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
  transliterationLanguage,
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
  transliterationLanguage?: string;
}) {
  const [expanded, setExpanded] = useState(true); // all verses open by default
  const [overflowOpen, setOverflowOpen] = useState(false);
  const askHref = getAIChatHref(
    `Explain this Pathshala verse in simple Hindi and English, with practical learning guidance: ${entry.title}`,
    getEntryText(entry)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="pathshala-glass-card rounded-[1.6rem] overflow-hidden"
    >
      {/* Verse header — tap to collapse */}
      <button className="w-full text-left px-5 pt-5 pb-3" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accentColour }} />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--brand-muted)]">{entry.source}</p>
            </div>
            <p className="font-semibold text-sm text-[color:var(--brand-ink)] leading-snug">{entry.title}</p>
          </div>
          <span className="shrink-0 opacity-40 mt-0.5">
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </span>
        </div>
      </button>

      {/* Devanagari — always visible, large and readable */}
      <div className="px-5 pb-4">
        <p
          className="leading-[1.75] font-medium whitespace-pre-line text-center"
          style={{
            color: accentColour,
            fontFamily: 'var(--font-deva, serif)',
            fontSize: `${fontScale * 1.55}rem`,
            textShadow: `0 0 28px ${accentColour}22`,
          }}
        >
          {entry.original}
        </p>
      </div>

      {/* Action strip — 2 primary + overflow */}
      <div className="px-5 pb-4 flex gap-2 items-center">
        <button onClick={() => onSpeak(entry)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold motion-press"
          style={{ color: accentColour, background: `${accentColour}12`, border: `1px solid ${accentColour}24` }}>
          {ttsLoading ? <Loader2 size={12} className="animate-spin" /> : speaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
          {speaking ? 'Stop' : 'Listen'}
        </button>
        <button onClick={() => onBookmark(entry)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold motion-press"
          style={{ color: bookmarked ? '#1c1c1a' : accentColour, background: bookmarked ? accentColour : `${accentColour}12`, border: `1px solid ${accentColour}24` }}>
          <Bookmark size={12} className={bookmarked ? 'fill-current' : ''} /> {bookmarked ? 'Saved' : 'Save'}
        </button>

        {/* Overflow — Copy + Ask AI */}
        <div className="relative ml-auto">
          <button
            onClick={() => setOverflowOpen(o => !o)}
            className="w-7 h-7 rounded-full inline-flex items-center justify-center text-[color:var(--brand-muted)] motion-press"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,146,74,0.14)' }}
          >
            ···
          </button>
          {overflowOpen && (
            <div
              className="absolute right-0 top-9 z-20 rounded-2xl shadow-xl overflow-hidden flex flex-col"
              style={{ background: 'var(--brand-background)', border: '1px solid rgba(200,146,74,0.18)', minWidth: '120px' }}
            >
              <button
                onClick={() => { onCopy(entry); setOverflowOpen(false); }}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[color:var(--brand-muted)] hover:text-[color:var(--brand-ink)] transition"
              >
                <Copy size={12} /> Copy
              </button>
              <Link
                href={askHref}
                onClick={() => setOverflowOpen(false)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-t border-white/6"
                style={{ color: accentColour }}
              >
                <Sparkles size={12} /> Ask AI
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Expanded: transliteration + meaning */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="overflow-hidden"
          >
            <div className="mx-5 mb-5 rounded-[1.1rem] overflow-hidden"
              style={{ background: 'rgba(200,146,74,0.06)', border: '1px solid rgba(200,146,74,0.16)' }}>
              {/* Transliteration */}
              {getTransliteration(entry.original, entry.transliteration, transliterationLanguage ?? 'en') !== entry.original && (
                <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(200,146,74,0.12)' }}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: accentColour, opacity: 0.6 }}>Transliteration</p>
                  <p className="italic leading-relaxed" style={{ color: 'var(--brand-muted)', fontSize: `${fontScale * 0.9}rem` }}>
                    {getTransliteration(entry.original, entry.transliteration, transliterationLanguage ?? 'en')}
                  </p>
                </div>
              )}

              {/* Meaning */}
              <div className="px-4 py-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: accentColour, opacity: 0.7 }}>Meaning</p>
                <p className="leading-relaxed font-medium" style={{ color: 'var(--brand-ink)', fontSize: `${fontScale * 1.0}rem`, lineHeight: 1.75 }}>
                  {entry.meaning}
                </p>
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
  transliterationLanguage?: string;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function LessonClient({
  userId,
  pathId,
  tradition,
  accentColour,
  currentLesson: initialLesson,
  completedLessons: initialCompleted,
  transliterationLanguage,
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

      {/* Header — clean, uncluttered, solid so it's always readable */}
      <div className="sticky top-0 z-30 px-4 py-3"
        style={{
          background: 'var(--brand-background)',
          borderBottom: '1px solid rgba(200,146,74,0.15)',
        }}>
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/pathshala')}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 motion-press"
            style={{ background: `${accentColour}14`, border: `1px solid ${accentColour}20` }}
          >
            <ChevronLeft size={18} style={{ color: accentColour }} />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[color:var(--brand-muted)] truncate font-medium">{path?.title ?? pathId}</p>
            <p className="text-sm font-bold text-[color:var(--brand-ink)] truncate">
              {lesson.title}
            </p>
          </div>

          {/* Progress pill */}
          <div className="flex items-center gap-2 shrink-0">
            <CircularProgress
              pct={progressPct}
              accent={accentColour}
              size={32}
              strokeWidth={3}
              label={<span className="text-[8px] font-bold" style={{ color: accentColour }}>{progressPct}%</span>}
            />
            <span className="text-[10px] text-[color:var(--brand-muted)] hidden sm:block">
              {completed.length}/{totalLessons}
            </span>
          </div>

          {/* Font size — tap to cycle */}
          <button
            onClick={() => setFontStep(step => (step + 1) % READER_FONT_STEPS.length)}
            className="shrink-0 px-2 py-1 rounded-lg text-[11px] font-bold motion-press"
            style={{ background: 'rgba(255,255,255,0.06)', color: accentColour, border: '1px solid rgba(200,146,74,0.14)' }}
            aria-label="Cycle text size"
          >
            Aa
          </button>

          <Link
            href={`/pathshala/${pathId}/recite`}
            className="hidden sm:flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full motion-press shrink-0"
            style={{ color: accentColour, background: `${accentColour}10`, border: '1px solid rgba(200,146,74,0.16)' }}
          >
            <Mic size={12} /> Recite
          </Link>
        </div>
      </div>

      {/* Lesson content */}
      <div className="px-4 pt-5 space-y-4 max-w-2xl mx-auto">

        {/* ── Ritual opening ─────────────────────────────────────────────────── */}
        <div className="text-center pb-2">
          <p className="text-[2.4rem] mb-2 opacity-80" style={{ fontFamily: 'var(--font-deva, serif)', color: accentColour, textShadow: `0 0 32px ${accentColour}44` }}>ॐ</p>
          <h2 className="font-bold text-lg leading-tight" style={{ fontFamily: 'var(--font-serif)', color: 'var(--brand-ink)' }}>
            {lesson.title}
          </h2>
          <p className="text-xs text-[color:var(--brand-muted)] mt-1">
            Lesson {lessonIndex + 1} of {totalLessons} · {lesson.entries.length} {lesson.entries.length === 1 ? 'verse' : 'verses'}
          </p>
          <div className="flex items-center gap-3 justify-center mt-3">
            <div className="h-px flex-1 max-w-[60px]" style={{ background: `linear-gradient(to right, transparent, ${accentColour}30)` }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-40" style={{ color: accentColour }}>Begin</span>
            <div className="h-px flex-1 max-w-[60px]" style={{ background: `linear-gradient(to left, transparent, ${accentColour}30)` }} />
          </div>
        </div>

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
              transliterationLanguage={transliterationLanguage}
            />
          ))
        )}

        {/* ── Ritual divider before completion ──────────────────────────── */}
        <div className="flex items-center gap-3 py-2">
          <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${accentColour}20)` }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30" style={{ color: accentColour }}>
            {isCompleted ? 'completed' : 'complete the lesson'}
          </span>
          <div className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${accentColour}20)` }} />
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={() => goTo(lessonIndex - 1)}
            disabled={lessonIndex === 0}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold text-[color:var(--brand-muted)] disabled:opacity-30 transition-opacity motion-press"
            style={{ border: '1px solid rgba(200,146,74,0.16)', background: 'rgba(255,255,255,0.04)' }}
          >
            <ChevronLeft size={16} />
          </button>

          {isCompleted ? (
            <button
              onClick={() => goTo(lessonIndex + 1)}
              disabled={lessonIndex === totalLessons - 1}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-[#1c1c1a] disabled:opacity-40 transition-opacity shadow-lg"
              style={{ background: accentColour, boxShadow: `0 6px 20px ${accentColour}33` }}
            >
              Next Lesson <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={markComplete}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-[#1c1c1a] disabled:opacity-60 transition-all shadow-lg"
              style={{ background: accentColour, boxShadow: `0 6px 20px ${accentColour}33` }}
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
