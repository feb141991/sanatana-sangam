'use client';

// ─── Pathshala Lesson Reader — ground-up rewrite ──────────────────────────────
// One verse at a time, focused e-reader layout.
// All features visible and reachable without hunting: listen, save, copy, AI,
// font size, progress, lesson nav, mark complete.

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, CheckCircle2, BookOpen, Mic,
  Sparkles, Copy, Loader2, Bookmark, Volume2, VolumeX, EyeOff,
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
import type { LibraryEntry, LibraryTradition } from '@/lib/library-content';

// ─── Font steps — generous range for all ages ─────────────────────────────────
const READER_FONT_STEPS = [1.0, 1.15, 1.32, 1.5, 1.7] as const;
const ENTRIES_PER_LESSON = 4;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getEntryText(entry: LibraryEntry) {
  return [
    `${entry.title} — ${entry.source}`,
    entry.original,
    entry.meaning ? `Meaning: ${entry.meaning}` : '',
  ].filter(Boolean).join('\n\n');
}

// ─── Lesson content builder ────────────────────────────────────────────────────
function getPathLessons(pathId: string): { title: string; entries: LibraryEntry[] }[] {
  let entries: LibraryEntry[] = [];

  switch (pathId) {
    case 'bhagavad-gita-intro': {
      const chapters = Array.from({ length: 18 }, (_, i) => i + 1);
      return chapters.map(ch => {
        const tag = `chapter-${ch}`;
        const chEntries = GITA_FULL_DATA.filter(e => (e.tags as readonly string[]).includes(tag));
        return { title: `Chapter ${ch}`, entries: chEntries.slice(0, 8) as unknown as LibraryEntry[] };
      }).filter(l => l.entries.length > 0);
    }

    case 'upanishads-core': {
      const upanishads = ['isha', 'kena', 'katha', 'mandukya'];
      const result: { title: string; entries: LibraryEntry[] }[] = [];
      for (const name of upanishads) {
        const uEntries = ALL_LIBRARY_ENTRIES.filter(e =>
          e.category === 'upanishad' && e.tags.some(t => t.includes(name))
        );
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
        result.push({ title: `Stotra Session ${Math.floor(i / ENTRIES_PER_LESSON) + 1}`, entries: stotraEntries.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Daily Stotras', entries: stotraEntries.slice(0, 4) }];
    }

    case 'yoga-sutras': {
      const yogaEntries = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'yoga_sutra');
      const result: { title: string; entries: LibraryEntry[] }[] = [];
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
        result.push({ title: `Nitnem Session ${Math.floor(i / ENTRIES_PER_LESSON) + 1}`, entries: gurbaniEntries.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Nitnem Banis', entries: gurbaniEntries.slice(0, 4) }];
    }

    case 'dhammapada-path': {
      const dhamma = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'dhammapada');
      const result: { title: string; entries: LibraryEntry[] }[] = [];
      for (let i = 0; i < dhamma.length; i += ENTRIES_PER_LESSON) {
        result.push({ title: `Chapter ${Math.floor(i / ENTRIES_PER_LESSON) + 1} — Dhammapada`, entries: dhamma.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Dhammapada', entries: dhamma.slice(0, 4) }];
    }

    default: {
      entries = GITA_FULL_DATA.slice(0, 30) as unknown as LibraryEntry[];
      const result: { title: string; entries: LibraryEntry[] }[] = [];
      for (let i = 0; i < entries.length; i += ENTRIES_PER_LESSON) {
        result.push({ title: `Session ${Math.floor(i / ENTRIES_PER_LESSON) + 1}`, entries: entries.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result;
    }
  }
}

// ─── Explain result type ───────────────────────────────────────────────────────
type ExplainResult = {
  explanation: {
    meaning: string;
    commentary: string;
    daily_application: string;
    contemplation: string;
  };
  tradition: string;
  teacher: string;
};

// ─── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  userId: string;
  pathId: string;
  tradition: string;
  accentColour: string;
  currentLesson: number;
  completedLessons: number[];
  transliterationLanguage?: string;
  hindiMeanings?: Record<string, string>;
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
  hindiMeanings,
}: Props) {
  const router   = useRouter();
  const engine   = useSadhana();
  const supabase = useRef(createClient()).current;

  const path        = SEED_PATHS.find(p => p.id === pathId);
  const lessons     = useMemo(() => getPathLessons(pathId), [pathId]);
  const totalLessons = lessons.length;

  // ── Lesson navigation ──────────────────────────────────────────────────────
  const [lessonIndex, setLessonIndex] = useState(initialLesson ?? 0);
  const [completed,   setCompleted]   = useState<number[]>(initialCompleted ?? []);
  const [saving,      setSaving]      = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // ── Verse navigation within a lesson ──────────────────────────────────────
  const [verseIndex, setVerseIndex] = useState(0);
  const [slideDir,   setSlideDir]   = useState<1 | -1>(1);

  // ── Reader settings ────────────────────────────────────────────────────────
  const [fontStep, setFontStep] = useState(2); // 1.32rem — readable default
  const fontScale = READER_FONT_STEPS[fontStep];

  // ── Bookmarks ──────────────────────────────────────────────────────────────
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // ── TTS ────────────────────────────────────────────────────────────────────
  const [ttsLoadingId, setTtsLoadingId] = useState<string | null>(null);
  const [speakingId,   setSpeakingId]   = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── AI Explain ─────────────────────────────────────────────────────────────
  const [showExplain,   setShowExplain]   = useState(false);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainResult,  setExplainResult]  = useState<ExplainResult | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const lesson      = lessons[lessonIndex];
  const entry       = lesson?.entries[verseIndex];
  const totalVerses = lesson?.entries.length ?? 0;
  const isLastVerse = verseIndex === totalVerses - 1;
  const isCompleted = completed.includes(lessonIndex);
  const progressPct = totalLessons > 0 ? Math.round((completed.length / totalLessons) * 100) : 0;

  const translitText = entry
    ? getTransliteration(entry.original, entry.transliteration, transliterationLanguage ?? 'en')
    : '';
  const showTranslit = translitText && translitText !== entry?.original;

  const meaningText = entry
    ? (transliterationLanguage === 'hi' && hindiMeanings?.[entry.id]) || entry.meaning
    : '';

  const askHref = entry
    ? getAIChatHref(
        `Explain this scripture verse in simple language with practical guidance: ${entry.title}`,
        getEntryText(entry)
      )
    : '/ai-chat';

  // ── Reset verse when lesson changes ───────────────────────────────────────
  useEffect(() => {
    setVerseIndex(0);
    setSlideDir(1);
    setShowExplain(false);
    setExplainResult(null);
    stopTTS();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonIndex]);

  // ── Stop TTS when verse changes ───────────────────────────────────────────
  useEffect(() => { stopTTS(); }, [verseIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load bookmarks for current lesson ─────────────────────────────────────
  useEffect(() => {
    if (!userId || !lesson?.entries.length) return;
    let cancelled = false;
    async function load() {
      const ids = lesson.entries.map(e => e.id);
      const { data } = await supabase
        .from('pathshala_user_state')
        .select('entry_id, bookmarked_at')
        .eq('user_id', userId)
        .in('entry_id', ids);
      if (cancelled) return;
      setBookmarkedIds(new Set((data ?? []).filter(r => r.bookmarked_at).map(r => r.entry_id)));
    }
    load();
    return () => { cancelled = true; };
  }, [lesson?.entries, supabase, userId]);

  // ── TTS ────────────────────────────────────────────────────────────────────
  const stopTTS = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    setSpeakingId(null);
    setTtsLoadingId(null);
  }, []);

  useEffect(() => () => stopTTS(), [stopTTS]);

  async function speakEntry(e: LibraryEntry) {
    if (speakingId === e.id || ttsLoadingId === e.id) { stopTTS(); return; }
    stopTTS();
    setTtsLoadingId(e.id);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: e.original, rate: 0.78 }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const { audioContent } = await res.json() as { audioContent: string };
      const bytes = Uint8Array.from(atob(audioContent), c => c.charCodeAt(0));
      const blob  = new Blob([bytes], { type: 'audio/mpeg' });
      const url   = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setSpeakingId(null); URL.revokeObjectURL(url); };
      audio.onerror = () => { setSpeakingId(null); URL.revokeObjectURL(url); };
      await audio.play();
      setSpeakingId(e.id);
    } catch {
      toast.error('Audio unavailable right now');
    } finally {
      setTtsLoadingId(null);
    }
  }

  // ── Bookmark ───────────────────────────────────────────────────────────────
  async function toggleBookmark(e: LibraryEntry) {
    const next = !bookmarkedIds.has(e.id);
    const prev  = new Set(bookmarkedIds);
    const ts    = new Date().toISOString();
    setBookmarkedIds(s => { const c = new Set(s); if (next) c.add(e.id); else c.delete(e.id); return c; });

    const { error } = await supabase
      .from('pathshala_user_state')
      .upsert({
        user_id: userId,
        tradition: tradition as LibraryTradition,
        section_id: e.category,
        entry_id: e.id,
        last_opened_at: ts,
        bookmarked_at: next ? ts : null,
      }, { onConflict: 'user_id,entry_id' });

    if (error) { setBookmarkedIds(prev); toast.error(error.message); return; }
    toast.success(next ? 'Saved for later' : 'Removed from saved');
  }

  // ── Copy ───────────────────────────────────────────────────────────────────
  async function copyEntry(e: LibraryEntry) {
    try {
      await navigator.clipboard.writeText(getEntryText(e));
      toast.success('Copied');
    } catch {
      toast.error('Copy unavailable');
    }
  }

  // ── AI Explain ─────────────────────────────────────────────────────────────
  async function explainVerse() {
    if (!entry || explainLoading) return;
    setExplainResult(null);
    setExplainLoading(true);
    try {
      const res = await fetch('/api/pathshala/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sanskrit:        entry.original,
          transliteration: entry.transliteration,
          translation:     entry.meaning,
          source:          entry.source,
          title:           entry.title,
          tradition,
          language:        'en',
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Error ${res.status}`);
      setExplainResult(await res.json());
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not generate explanation');
    } finally {
      setExplainLoading(false);
    }
  }

  // ── Mark lesson complete ───────────────────────────────────────────────────
  async function markComplete() {
    if (isCompleted || saving) return;
    setSaving(true);
    const newCompleted = [...completed, lessonIndex];
    const nextLesson   = Math.min(lessonIndex + 1, totalLessons - 1);
    try {
      const { error } = await supabase
        .from('guided_path_progress')
        .update({
          current_lesson:    nextLesson,
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
      if (engine) {
        engine.tracker.trackShlokaRead(pathId, lessonIndex, 0, 0).catch(() => {});
        engine.streaks.markDone(userId, 'shloka').catch(() => {});
      }
      if (newCompleted.length < totalLessons) goToLesson(nextLesson);
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not save progress');
    } finally {
      setSaving(false);
    }
  }

  // ── Navigation helpers ─────────────────────────────────────────────────────
  function goNextVerse() {
    if (verseIndex < totalVerses - 1) {
      setSlideDir(1);
      setVerseIndex(v => v + 1);
      setShowExplain(false);
      setExplainResult(null);
    }
  }

  function goPrevVerse() {
    if (verseIndex > 0) {
      setSlideDir(-1);
      setVerseIndex(v => v - 1);
      setShowExplain(false);
      setExplainResult(null);
    }
  }

  function goToLesson(index: number) {
    if (index < 0 || index >= totalLessons) return;
    setLessonIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!lesson || !entry) {
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

  // ── CTA text & action ──────────────────────────────────────────────────────
  const ctaAction = isLastVerse
    ? isCompleted
      ? () => goToLesson(lessonIndex + 1)
      : markComplete
    : goNextVerse;

  const ctaDisabled = isLastVerse && isCompleted && lessonIndex === totalLessons - 1;

  const ctaLabel = isLastVerse
    ? isCompleted
      ? <><span>Next Lesson</span> <ChevronRight size={15} /></>
      : saving
        ? <Loader2 size={15} className="animate-spin" />
        : <><CheckCircle2 size={15} /> <span>Mark Lesson Complete</span></>
    : <><span>Next Verse</span> <ChevronRight size={15} /></>;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--brand-background)' }}>
      <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* ════════════════════ HEADER ════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
        style={{ background: 'var(--brand-background)', borderBottom: '1px solid rgba(200,146,74,0.12)' }}
      >
        {/* Back */}
        <button
          onClick={() => router.push('/pathshala')}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 motion-press"
          style={{ background: `${accentColour}14`, border: `1px solid ${accentColour}22` }}
        >
          <ChevronLeft size={18} style={{ color: accentColour }} />
        </button>

        {/* Titles */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-[color:var(--brand-muted)] truncate font-medium">{path?.title ?? pathId}</p>
          <p className="text-sm font-bold text-[color:var(--brand-ink)] truncate">{lesson.title}</p>
        </div>

        {/* Progress ring */}
        <CircularProgress
          pct={progressPct}
          accent={accentColour}
          size={32}
          strokeWidth={3}
          label={<span className="text-[8px] font-bold" style={{ color: accentColour }}>{progressPct}%</span>}
        />

        {/* Font size cycle */}
        <button
          onClick={() => setFontStep(s => (s + 1) % READER_FONT_STEPS.length)}
          className="px-2 py-1 rounded-lg text-[11px] font-bold shrink-0 motion-press"
          style={{ background: 'rgba(255,255,255,0.06)', color: accentColour, border: '1px solid rgba(200,146,74,0.14)' }}
          aria-label="Increase text size"
        >
          Aa
        </button>

        {/* Recite shortcut */}
        <Link
          href={`/pathshala/${pathId}/recite`}
          className="hidden sm:flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 motion-press"
          style={{ color: accentColour, background: `${accentColour}10`, border: `1px solid ${accentColour}22` }}
        >
          <Mic size={12} /> Recite
        </Link>
      </header>

      {/* ════════════════════ SCROLLABLE CONTENT ════════════════════════════ */}
      <div className="flex-1 overflow-auto overscroll-contain">
        <div className="max-w-xl mx-auto px-5 pt-8 pb-48">

          {/* ── Verse progress dots ──────────────────────────────────────── */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {lesson.entries.map((_, i) => (
              <button
                key={i}
                onClick={() => { setSlideDir(i > verseIndex ? 1 : -1); setVerseIndex(i); setShowExplain(false); setExplainResult(null); }}
                aria-label={`Go to verse ${i + 1}`}
                style={{
                  height: '8px',
                  borderRadius: '4px',
                  transition: 'all 0.25s ease',
                  width: i === verseIndex ? '28px' : '8px',
                  background: i === verseIndex ? accentColour : `${accentColour}30`,
                }}
              />
            ))}
            <span className="ml-2 text-[10px] font-bold" style={{ color: `${accentColour}70` }}>
              {verseIndex + 1}/{totalVerses}
            </span>
          </div>

          {/* ── Animated verse panel ─────────────────────────────────────── */}
          <AnimatePresence mode="wait" custom={slideDir}>
            <motion.div
              key={`${lessonIndex}-${verseIndex}`}
              custom={slideDir}
              initial={{ opacity: 0, x: slideDir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideDir * -40 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {/* Source chip + title */}
              <div className="text-center mb-8">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4"
                  style={{ background: `${accentColour}12`, border: `1px solid ${accentColour}22` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accentColour }} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: accentColour }}>
                    {entry.source}
                  </span>
                </div>
                <h2
                  className="font-bold leading-snug"
                  style={{ color: 'var(--brand-ink)', fontFamily: 'var(--font-serif)', fontSize: `${fontScale * 1.05}rem` }}
                >
                  {entry.title}
                </h2>
              </div>

              {/* OM ornament */}
              <div className="text-center mb-7">
                <span
                  className="text-4xl"
                  style={{ color: accentColour, opacity: 0.18, fontFamily: 'var(--font-deva, serif)' }}
                >
                  ॐ
                </span>
              </div>

              {/* ── Devanagari — the centrepiece ──────────────────────────── */}
              <div className="text-center mb-8 px-2">
                <p
                  className="leading-[1.9] font-medium whitespace-pre-line"
                  style={{
                    color:       accentColour,
                    fontFamily:  'var(--font-deva, serif)',
                    fontSize:    `${fontScale * 1.62}rem`,
                    textShadow:  `0 0 40px ${accentColour}20`,
                  }}
                >
                  {entry.original}
                </p>
              </div>

              {/* ── Transliteration ──────────────────────────────────────── */}
              {showTranslit && (
                <p
                  className="text-center italic mb-8 leading-relaxed px-3"
                  style={{ color: 'var(--brand-muted)', fontSize: `${fontScale * 1.0}rem` }}
                >
                  {translitText}
                </p>
              )}

              {/* ── Meaning card ─────────────────────────────────────────── */}
              {meaningText ? (
                <div
                  className="rounded-2xl p-5 mb-6"
                  style={{ background: 'rgba(200,146,74,0.06)', border: '1px solid rgba(200,146,74,0.15)' }}
                >
                  <p
                    className="text-[9px] font-bold uppercase tracking-[0.24em] mb-3"
                    style={{ color: accentColour, opacity: 0.65 }}
                  >
                    {transliterationLanguage === 'hi' ? 'अर्थ' : 'Meaning'}
                  </p>
                  <p
                    className="font-medium"
                    style={{ color: 'var(--brand-ink)', fontSize: `${fontScale * 1.1}rem`, lineHeight: 1.85 }}
                  >
                    {meaningText}
                  </p>
                </div>
              ) : null}

              {/* ── AI Explain ───────────────────────────────────────────── */}
              <div className="mb-2">
                <button
                  onClick={() => {
                    if (!showExplain && !explainResult) explainVerse();
                    setShowExplain(s => !s);
                  }}
                  disabled={explainLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all motion-press"
                  style={{
                    background: showExplain ? `${accentColour}15` : 'rgba(255,255,255,0.05)',
                    color:      explainLoading ? 'var(--brand-muted)' : accentColour,
                    border:     `1px solid ${showExplain ? accentColour + '35' : 'rgba(200,146,74,0.16)'}`,
                  }}
                >
                  {explainLoading
                    ? <><Loader2 size={14} className="animate-spin" /> Asking teacher…</>
                    : showExplain
                      ? <><EyeOff size={14} /> Hide explanation</>
                      : <><Sparkles size={14} /> Explain this verse</>
                  }
                </button>

                <AnimatePresence>
                  {showExplain && explainResult && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.26 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="mt-3 rounded-2xl p-5 space-y-4"
                        style={{ background: `linear-gradient(135deg, ${accentColour}08, rgba(255,255,255,0.02))`, border: `1px solid ${accentColour}20` }}
                      >
                        {/* Teacher attribution */}
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🪔</span>
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: accentColour + 'aa' }}>
                              {explainResult.tradition}
                            </p>
                            <p className="text-xs text-[color:var(--brand-muted)]">In the spirit of {explainResult.teacher}</p>
                          </div>
                        </div>

                        {/* Meaning */}
                        {explainResult.explanation.meaning && (
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: accentColour + '88' }}>Meaning</p>
                            <p className="text-sm text-[color:var(--brand-ink)] leading-relaxed">{explainResult.explanation.meaning}</p>
                          </div>
                        )}

                        {/* Commentary */}
                        {explainResult.explanation.commentary && (
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: accentColour + '88' }}>Commentary</p>
                            <p className="text-sm text-[color:var(--brand-muted)] leading-relaxed">{explainResult.explanation.commentary}</p>
                          </div>
                        )}

                        {/* Today's practice */}
                        {explainResult.explanation.daily_application && (
                          <div
                            className="rounded-xl px-4 py-3"
                            style={{ background: `${accentColour}10`, border: `1px solid ${accentColour}22` }}
                          >
                            <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: accentColour }}>Today&apos;s Practice</p>
                            <p className="text-sm text-[color:var(--brand-ink)] leading-relaxed">{explainResult.explanation.daily_application}</p>
                          </div>
                        )}

                        {/* Contemplation */}
                        {explainResult.explanation.contemplation && (
                          <p className="text-sm text-center italic text-[color:var(--brand-muted)] border-t border-white/6 pt-3 leading-relaxed">
                            &ldquo;{explainResult.explanation.contemplation}&rdquo;
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ── Jump to lesson ───────────────────────────────────────────── */}
          {totalLessons > 1 && (
            <div className="mt-12 pt-6" style={{ borderTop: '1px solid rgba(200,146,74,0.12)' }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: `${accentColour}55` }}>
                Lessons
              </p>
              <div className="flex flex-wrap gap-2">
                {lessons.map((l, i) => {
                  const done    = completed.includes(i);
                  const current = i === lessonIndex;
                  return (
                    <button
                      key={i}
                      onClick={() => goToLesson(i)}
                      className="w-9 h-9 rounded-full text-xs font-semibold flex items-center justify-center transition-all"
                      style={{
                        background: current ? accentColour : done ? `${accentColour}20` : 'rgba(255,255,255,0.06)',
                        color:      current ? '#1c1c1a' : done ? accentColour : 'var(--brand-muted)',
                        border:     current ? 'none' : `1px solid ${done ? `${accentColour}30` : 'rgba(255,255,255,0.08)'}`,
                      }}
                      title={l.title}
                    >
                      {done && !current ? <CheckCircle2 size={13} /> : i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════ FIXED BOTTOM BAR ══════════════════════════════ */}
      <div
        className="fixed bottom-0 inset-x-0 z-40"
        style={{ background: 'var(--brand-background)', borderTop: '1px solid rgba(200,146,74,0.14)' }}
      >
        {/* ── Quick actions ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-around px-4 pt-3 pb-1 max-w-xl mx-auto">

          {/* Listen */}
          <button
            onClick={() => speakEntry(entry)}
            className="flex flex-col items-center gap-1 min-w-[52px] motion-press"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{
                background: speakingId === entry.id ? `${accentColour}22` : 'rgba(255,255,255,0.06)',
                border:     `1px solid ${speakingId === entry.id ? accentColour + '40' : 'rgba(200,146,74,0.14)'}`,
              }}
            >
              {ttsLoadingId === entry.id
                ? <Loader2 size={17} className="animate-spin" style={{ color: accentColour }} />
                : speakingId === entry.id
                  ? <VolumeX size={17} style={{ color: accentColour }} />
                  : <Volume2 size={17} style={{ color: accentColour }} />
              }
            </div>
            <span className="text-[9px] font-semibold" style={{ color: 'var(--brand-muted)' }}>
              {speakingId === entry.id ? 'Stop' : 'Listen'}
            </span>
          </button>

          {/* Save / Bookmark */}
          <button
            onClick={() => toggleBookmark(entry)}
            className="flex flex-col items-center gap-1 min-w-[52px] motion-press"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{
                background: bookmarkedIds.has(entry.id) ? accentColour : 'rgba(255,255,255,0.06)',
                border:     `1px solid ${bookmarkedIds.has(entry.id) ? accentColour : 'rgba(200,146,74,0.14)'}`,
              }}
            >
              <Bookmark
                size={17}
                style={{ color: bookmarkedIds.has(entry.id) ? '#1c1c1a' : accentColour }}
                className={bookmarkedIds.has(entry.id) ? 'fill-current' : ''}
              />
            </div>
            <span className="text-[9px] font-semibold" style={{ color: 'var(--brand-muted)' }}>
              {bookmarkedIds.has(entry.id) ? 'Saved' : 'Save'}
            </span>
          </button>

          {/* Copy */}
          <button
            onClick={() => copyEntry(entry)}
            className="flex flex-col items-center gap-1 min-w-[52px] motion-press"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,146,74,0.14)' }}
            >
              <Copy size={17} style={{ color: accentColour }} />
            </div>
            <span className="text-[9px] font-semibold" style={{ color: 'var(--brand-muted)' }}>Copy</span>
          </button>

          {/* Ask AI */}
          <Link
            href={askHref}
            className="flex flex-col items-center gap-1 min-w-[52px] motion-press"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,146,74,0.14)' }}
            >
              <Sparkles size={17} style={{ color: accentColour }} />
            </div>
            <span className="text-[9px] font-semibold" style={{ color: 'var(--brand-muted)' }}>Ask AI</span>
          </Link>
        </div>

        {/* ── Navigation row ────────────────────────────────────────────── */}
        <div className="flex gap-2.5 px-4 pt-2 pb-5 max-w-xl mx-auto">
          {/* Prev */}
          <button
            onClick={goPrevVerse}
            disabled={verseIndex === 0}
            className="w-12 h-13 flex items-center justify-center rounded-2xl disabled:opacity-25 transition-opacity motion-press"
            style={{ border: '1px solid rgba(200,146,74,0.18)', background: 'rgba(255,255,255,0.04)', height: '52px' }}
          >
            <ChevronLeft size={20} style={{ color: 'var(--brand-muted)' }} />
          </button>

          {/* Main CTA */}
          <button
            onClick={ctaAction}
            disabled={ctaDisabled || saving}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl text-sm font-bold text-[#1c1c1a] disabled:opacity-40 transition-all motion-press shadow-lg"
            style={{ background: accentColour, boxShadow: `0 6px 20px ${accentColour}30`, height: '52px' }}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
