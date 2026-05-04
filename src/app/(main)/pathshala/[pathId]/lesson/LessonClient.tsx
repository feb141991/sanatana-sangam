'use client';

// ─── Pathshala Lesson Reader — parchment e-reader ────────────────────────────
// Solid warm-cream theme — no opacity tricks, readable for all ages.
// One verse at a time, full-screen, all features always visible.

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, CheckCircle2, BookOpen, Mic,
  Sparkles, Copy, Loader2, Bookmark, Volume2, VolumeX, EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import CircularProgress from '@/components/ui/CircularProgress';
import ConfettiOverlay from '@/components/ui/ConfettiOverlay';
import { useSadhana } from '@/contexts/EngineContext';
import { getAIChatHref } from '@/lib/pathshala-links';
import { getTransliteration } from '@/lib/transliteration';
import type { LibraryEntry, LibraryTradition } from '@/lib/library-content';
import type { Lesson } from '@/lib/pathshala-lessons';

// ─── Parchment palette — solid, no opacity tricks ────────────────────────────
const P = {
  bg:          '#F7EDD8',   // warm parchment
  bgCard:      '#FFFDF6',   // near-white card
  bgAccent:    '#FFF4E0',   // soft amber card
  border:      '#DEC89A',   // golden-tan border
  borderSoft:  '#EAD9B5',   // softer border
  ink:         '#2C1A0E',   // deep brown — body text
  inkMuted:    '#7A5C3A',   // mid-brown — secondary text
  sanskrit:    '#8B3A0F',   // deep terracotta — Sanskrit text
  accent:      '#C8924A',   // amber — buttons, chips
  accentDeep:  '#9B6B2A',   // darker amber for icons on light bg
  accentBg:    '#F2D9A8',   // amber chip background
  white:       '#FFFDF6',
  btnText:     '#FFFDF6',   // text on filled amber button
} as const;

// ─── Font steps — generous range for all ages ─────────────────────────────────
const READER_FONT_STEPS = [1.0, 1.15, 1.32, 1.5, 1.7] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getEntryText(entry: LibraryEntry) {
  return [
    `${entry.title} — ${entry.source}`,
    entry.original,
    entry.meaning ? `Meaning: ${entry.meaning}` : '',
  ].filter(Boolean).join('\n\n');
}

// ─── Lesson content — built server-side, passed as prop ─────────────────────
// getPathLessons() lives in src/lib/pathshala-lessons.ts.
// Keeping it out of this file removes ~900 KB from the client JS bundle.

// ── (removed) switch-statement that referenced GITA_FULL_DATA / ALL_LIBRARY_ENTRIES ──


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
  pathTitle: string;
  tradition: string;
  accentColour: string;
  lessons: Lesson[];
  currentLesson: number;
  completedLessons: number[];
  transliterationLanguage?: string;
  hindiMeanings?: Record<string, string>;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function LessonClient({
  userId,
  pathId,
  pathTitle,
  tradition,
  accentColour: _accentColour, // kept in props for compat, we use P palette
  lessons,
  currentLesson: initialLesson,
  completedLessons: initialCompleted,
  transliterationLanguage,
  hindiMeanings,
}: Props) {
  const router   = useRouter();
  const engine   = useSadhana();
  const supabase = useRef(createClient()).current;

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
  const [showExplain,    setShowExplain]    = useState(false);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not generate explanation';
      toast.error(msg);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save progress';
      toast.error(msg);
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4"
           style={{ background: P.bg }}>
        <BookOpen size={40} style={{ color: P.inkMuted }} />
        <p className="font-semibold" style={{ color: P.ink }}>No lessons found for this path</p>
        <Link href="/pathshala" className="text-sm underline" style={{ color: P.accent }}>
          Back to Pathshala
        </Link>
      </div>
    );
  }

  // ── CTA text & action ──────────────────────────────────────────────────────
  const ctaAction = isLastVerse
    ? isCompleted ? () => goToLesson(lessonIndex + 1) : markComplete
    : goNextVerse;

  const ctaDisabled = isLastVerse && isCompleted && lessonIndex === totalLessons - 1;

  const ctaLabel = isLastVerse
    ? isCompleted
      ? <><span>Next Lesson</span><ChevronRight size={15} /></>
      : saving
        ? <Loader2 size={15} className="animate-spin" />
        : <><CheckCircle2 size={15} /><span>Mark Lesson Complete</span></>
    : <><span>Next Verse</span><ChevronRight size={15} /></>;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: P.bg }}>
      <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* ════════════ HEADER ════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
        style={{ background: P.bgCard, borderBottom: `1px solid ${P.border}` }}
      >
        {/* Back */}
        <button
          onClick={() => router.push('/pathshala')}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 motion-press"
          style={{ background: P.accentBg, border: `1px solid ${P.border}` }}
        >
          <ChevronLeft size={18} style={{ color: P.accentDeep }} />
        </button>

        {/* Titles */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] truncate font-medium" style={{ color: P.inkMuted }}>{pathTitle}</p>
          <p className="text-sm font-bold truncate" style={{ color: P.ink }}>{lesson.title}</p>
        </div>

        {/* Progress ring */}
        <CircularProgress
          pct={progressPct}
          accent={P.accent}
          size={32}
          strokeWidth={3}
          label={<span className="text-[8px] font-bold" style={{ color: P.accentDeep }}>{progressPct}%</span>}
        />

        {/* Font size cycle */}
        <button
          onClick={() => setFontStep(s => (s + 1) % READER_FONT_STEPS.length)}
          className="px-2.5 py-1.5 rounded-lg text-[12px] font-bold shrink-0 motion-press"
          style={{ background: P.accentBg, color: P.accentDeep, border: `1px solid ${P.border}` }}
          aria-label="Change text size"
        >
          Aa
        </button>

        {/* Recite shortcut */}
        <Link
          href={`/pathshala/${pathId}/recite`}
          className="hidden sm:flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 motion-press"
          style={{ color: P.accentDeep, background: P.accentBg, border: `1px solid ${P.border}` }}
        >
          <Mic size={12} /> Recite
        </Link>
      </header>

      {/* ════════════ SCROLLABLE CONTENT ════════════════════════════════════ */}
      <div className="flex-1 overflow-auto overscroll-contain">
        <div className="max-w-xl mx-auto px-5 pt-8 pb-56">

          {/* ── Verse progress dots ────────────────────────────────────── */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {lesson.entries.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setSlideDir(i > verseIndex ? 1 : -1);
                  setVerseIndex(i);
                  setShowExplain(false);
                  setExplainResult(null);
                }}
                aria-label={`Go to verse ${i + 1}`}
                style={{
                  height: '8px',
                  borderRadius: '4px',
                  transition: 'all 0.25s ease',
                  width: i === verseIndex ? '28px' : '8px',
                  background: i === verseIndex ? P.accent : P.borderSoft,
                }}
              />
            ))}
            <span className="ml-2 text-[11px] font-bold" style={{ color: P.inkMuted }}>
              {verseIndex + 1}/{totalVerses}
            </span>
          </div>

          {/* ── Animated verse panel ──────────────────────────────────── */}
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
                  style={{ background: P.accentBg, border: `1px solid ${P.border}` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: P.accent }} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: P.accentDeep }}>
                    {entry.source}
                  </span>
                </div>
                <h2
                  className="font-bold leading-snug"
                  style={{
                    color: P.ink,
                    fontFamily: 'var(--font-serif)',
                    fontSize: `${fontScale * 1.1}rem`,
                  }}
                >
                  {entry.title}
                </h2>
              </div>

              {/* OM ornament */}
              <div className="text-center mb-6">
                <span
                  className="text-4xl"
                  style={{ color: P.accent, fontFamily: 'var(--font-deva, serif)' }}
                >
                  ॐ
                </span>
              </div>

              {/* ── Sanskrit / Devanagari — the centrepiece ───────────── */}
              <div
                className="rounded-2xl p-6 mb-6 text-center"
                style={{ background: P.bgCard, border: `1px solid ${P.border}` }}
              >
                <p
                  className="leading-[2] font-semibold whitespace-pre-line"
                  style={{
                    color:      P.sanskrit,
                    fontFamily: 'var(--font-deva, "Noto Sans Devanagari", serif)',
                    fontSize:   `${fontScale * 1.62}rem`,
                  }}
                >
                  {entry.original}
                </p>
              </div>

              {/* ── Transliteration ───────────────────────────────────── */}
              {showTranslit && (
                <div
                  className="rounded-xl px-5 py-4 mb-5 text-center"
                  style={{ background: P.bgAccent, border: `1px solid ${P.borderSoft}` }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
                    style={{ color: P.inkMuted }}
                  >
                    Transliteration
                  </p>
                  <p
                    className="italic leading-relaxed"
                    style={{ color: P.ink, fontSize: `${fontScale * 0.95}rem` }}
                  >
                    {translitText}
                  </p>
                </div>
              )}

              {/* ── Meaning card ──────────────────────────────────────── */}
              {meaningText ? (
                <div
                  className="rounded-2xl p-5 mb-5"
                  style={{ background: P.bgCard, border: `1px solid ${P.border}` }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.22em] mb-3"
                    style={{ color: P.accent }}
                  >
                    {transliterationLanguage === 'hi' ? 'अर्थ' : 'Meaning'}
                  </p>
                  <p
                    className="font-medium leading-relaxed"
                    style={{ color: P.ink, fontSize: `${fontScale * 1.05}rem`, lineHeight: 1.85 }}
                  >
                    {meaningText}
                  </p>
                </div>
              ) : null}

              {/* ── AI Explain ────────────────────────────────────────── */}
              <div className="mb-2">
                <button
                  onClick={() => {
                    if (!showExplain && !explainResult) explainVerse();
                    setShowExplain(s => !s);
                  }}
                  disabled={explainLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all motion-press"
                  style={{
                    background: showExplain ? P.accentBg : P.bgCard,
                    color:      explainLoading ? P.inkMuted : P.accentDeep,
                    border:     `1.5px solid ${P.border}`,
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
                        style={{ background: P.bgCard, border: `1px solid ${P.border}` }}
                      >
                        {/* Teacher attribution */}
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🪔</span>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: P.accent }}>
                              {explainResult.tradition}
                            </p>
                            <p className="text-xs font-medium" style={{ color: P.inkMuted }}>
                              In the spirit of {explainResult.teacher}
                            </p>
                          </div>
                        </div>

                        {/* Meaning */}
                        {explainResult.explanation.meaning && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: P.accentDeep }}>Meaning</p>
                            <p className="text-sm leading-relaxed" style={{ color: P.ink }}>{explainResult.explanation.meaning}</p>
                          </div>
                        )}

                        {/* Commentary */}
                        {explainResult.explanation.commentary && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: P.accentDeep }}>Commentary</p>
                            <p className="text-sm leading-relaxed" style={{ color: P.ink, opacity: 0.85 }}>{explainResult.explanation.commentary}</p>
                          </div>
                        )}

                        {/* Today's practice */}
                        {explainResult.explanation.daily_application && (
                          <div
                            className="rounded-xl px-4 py-3"
                            style={{ background: P.accentBg, border: `1px solid ${P.border}` }}
                          >
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: P.accentDeep }}>Today&apos;s Practice</p>
                            <p className="text-sm leading-relaxed" style={{ color: P.ink }}>{explainResult.explanation.daily_application}</p>
                          </div>
                        )}

                        {/* Contemplation */}
                        {explainResult.explanation.contemplation && (
                          <p
                            className="text-sm text-center italic leading-relaxed pt-3"
                            style={{ color: P.inkMuted, borderTop: `1px solid ${P.borderSoft}` }}
                          >
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

          {/* ── Jump to lesson ──────────────────────────────────────── */}
          {totalLessons > 1 && (
            <div className="mt-12 pt-6" style={{ borderTop: `1px solid ${P.border}` }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: P.inkMuted }}>
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
                        background: current ? P.accent : done ? P.accentBg : P.bgCard,
                        color:      current ? P.btnText : done ? P.accentDeep : P.inkMuted,
                        border:     `1px solid ${current ? P.accent : P.border}`,
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

      {/* ════════════ FIXED BOTTOM BAR ══════════════════════════════════════ */}
      <div
        className="fixed bottom-0 inset-x-0 z-40"
        style={{ background: P.bgCard, borderTop: `1.5px solid ${P.border}` }}
      >
        {/* ── Quick actions ────────────────────────────────────────────── */}
        <div className="flex items-center justify-around px-4 pt-3 pb-1 max-w-xl mx-auto">

          {/* Listen */}
          <button
            onClick={() => speakEntry(entry)}
            className="flex flex-col items-center gap-1 min-w-[52px] motion-press"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{
                background: speakingId === entry.id ? P.accent : P.accentBg,
                border:     `1px solid ${P.border}`,
              }}
            >
              {ttsLoadingId === entry.id
                ? <Loader2 size={17} className="animate-spin" style={{ color: P.accentDeep }} />
                : speakingId === entry.id
                  ? <VolumeX size={17} style={{ color: P.btnText }} />
                  : <Volume2 size={17} style={{ color: P.accentDeep }} />
              }
            </div>
            <span className="text-[10px] font-semibold" style={{ color: P.inkMuted }}>
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
                background: bookmarkedIds.has(entry.id) ? P.accent : P.accentBg,
                border:     `1px solid ${P.border}`,
              }}
            >
              <Bookmark
                size={17}
                style={{ color: bookmarkedIds.has(entry.id) ? P.btnText : P.accentDeep }}
                className={bookmarkedIds.has(entry.id) ? 'fill-current' : ''}
              />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: P.inkMuted }}>
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
              style={{ background: P.accentBg, border: `1px solid ${P.border}` }}
            >
              <Copy size={17} style={{ color: P.accentDeep }} />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: P.inkMuted }}>Copy</span>
          </button>

          {/* Ask AI */}
          <Link
            href={askHref}
            className="flex flex-col items-center gap-1 min-w-[52px] motion-press"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: P.accentBg, border: `1px solid ${P.border}` }}
            >
              <Sparkles size={17} style={{ color: P.accentDeep }} />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: P.inkMuted }}>Ask AI</span>
          </Link>
        </div>

        {/* ── Navigation row ────────────────────────────────────────── */}
        <div className="flex gap-2.5 px-4 pt-2 pb-5 max-w-xl mx-auto">
          {/* Prev */}
          <button
            onClick={goPrevVerse}
            disabled={verseIndex === 0}
            className="w-12 flex items-center justify-center rounded-2xl disabled:opacity-30 transition-opacity motion-press"
            style={{ border: `1.5px solid ${P.border}`, background: P.accentBg, height: '52px' }}
          >
            <ChevronLeft size={20} style={{ color: P.accentDeep }} />
          </button>

          {/* Main CTA */}
          <button
            onClick={ctaAction}
            disabled={ctaDisabled || saving}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl text-sm font-bold disabled:opacity-40 transition-all motion-press shadow-md"
            style={{ background: P.accent, color: P.btnText, height: '52px' }}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
