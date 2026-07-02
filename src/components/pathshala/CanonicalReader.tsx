'use client';

// ─── Pathshala Canonical Reader — parchment e-reader ──────────────────────────
// Solid warm-cream theme — no opacity tricks, readable for all ages.
// One verse at a time, full-screen, all features always visible.

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, CheckCircle2, BookOpen, Mic,
  Globe, Type, Loader2, EyeOff, Sparkles, Bookmark
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import CircularProgress from '@/components/ui/CircularProgress';
import { getAIChatHref } from '@/lib/pathshala-links';
import { getTransliteration } from '@/lib/transliteration';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useReaderDisplayPreferences } from '@/lib/i18n/reader-display';
import ReaderShell from '@/components/reader/ReaderShell';
import {
  getMeaningLabel,
  normalizeContentLanguage
} from '@/lib/language-runtime';
import { useLocalizedMeaning } from '@/hooks/useLocalizedMeaning';
import type { LibraryEntry, LibraryTradition } from '@/lib/library-content';
import { buildReadableCapabilities } from '@/lib/readable-content';
import { useReaderControls } from '@/hooks/useReaderControls';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import ScriptureCorrectionModal from '@/components/ScriptureCorrectionModal';

// ─── Parchment palette — solid, no opacity tricks ────────────────────────────
const getPalette = (isDark: boolean) => isDark ? {
  bg:          '#0E0E0F',
  bgCard:      'rgba(255,255,255,0.05)',
  bgAccent:    'rgba(197,160,89,0.12)',
  border:      'rgba(197,160,89,0.15)',
  borderSoft:  'rgba(197,160,89,0.12)',
  ink:         '#F0EDE6',
  inkMuted:    'rgba(197,160,89,0.6)',
  sanskrit:    '#F0EDE6',
  translit:    'rgba(240,220,180,0.5)',
  accent:      '#C5A059',
  accentDeep:  '#C5A059',
  accentBg:    'rgba(197,160,89,0.12)',
  white:       '#0E0E0F',
  btnText:     '#1C150A',
} : {
  bg:          '#F7EDD8',   // warm parchment
  bgCard:      '#FFFDF6',   // near-white card
  bgAccent:    '#FFF4E0',   // soft amber card
  border:      '#DEC89A',   // golden-tan border
  borderSoft:  '#EAD9B5',   // softer border
  ink:         '#2C1A0E',   // deep brown — body text
  inkMuted:    '#7A5C3A',   // mid-brown — secondary text
  sanskrit:    '#8B3A0F',   // deep terracotta — Sanskrit text
  translit:    '#2C1A0E',
  accent:      '#C5A059',   // amber — buttons, chips
  accentDeep:  '#9B6B2A',   // darker amber for icons on light bg
  accentBg:    '#F2D9A8',   // amber chip background
  white:       '#FFFDF6',
  btnText:     '#FFFDF6',   // text on filled amber button
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getEntryText(entry: LibraryEntry, meaningLabel: string) {
  return [
    `${entry.title} — ${entry.source}`,
    entry.original,
    entry.meaning ? `${meaningLabel}: ${entry.meaning}` : '',
  ].filter(Boolean).join('\n\n');
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
  is_fallback?: boolean;
};

// ─── Props ─────────────────────────────────────────────────────────────────────
export interface CanonicalReaderProps {
  entries: LibraryEntry[];
  title: string;
  subtitle?: string;
  userId: string;
  tradition: string;
  appLanguage?: string;
  meaningLanguage?: string;
  transliterationLanguage?: string;
  showTransliteration?: boolean;
  hindiMeanings?: Record<string, string>;
  isModal?: boolean;
  onClose?: () => void;
  // Overrides for the final action
  ctaConfig?: {
    label: React.ReactNode;
    disabled?: boolean;
    action: () => void;
  };
  // Lesson specific navigation
  lessonsNavigation?: {
    totalLessons: number;
    completedLessons: number[];
    currentLesson: number;
    onGoToLesson: (index: number) => void;
    progressPct: number;
  };
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CanonicalReader({
  entries,
  title,
  subtitle,
  userId,
  tradition,
  appLanguage,
  meaningLanguage,
  transliterationLanguage,
  showTransliteration = true,
  hindiMeanings,
  isModal = false,
  onClose,
  ctaConfig,
  lessonsNavigation,
}: CanonicalReaderProps) {
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';
  const P = getPalette(isDark);

  const supabase = useRef(createClient()).current;
  const totalVerses = entries.length;

  // ── Verse navigation within a lesson ──────────────────────────────────────
  const [verseIndex, setVerseIndex] = useState(0);
  const [slideDir,   setSlideDir]   = useState<1 | -1>(1);

  // ── Bookmarks ──────────────────────────────────────────────────────────────
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // ── TTS ────────────────────────────────────────────────────────────────────
  const [speakingId,   setSpeakingId]   = useState<string | null>(null);
  const [ttsRate,      setTtsRate]      = useState<number>(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── AI Explain ─────────────────────────────────────────────────────────────
  const [showExplain,          setShowExplain]          = useState(false);
  const [explainLoading,       setExplainLoading]       = useState(false);
  const [explainResult,        setExplainResult]        = useState<ExplainResult | null>(null);
  const [explainUpgradeNeeded, setExplainUpgradeNeeded] = useState(false);
  const [correctionModalOpen,  setCorrectionModalOpen]  = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────
  const entry       = entries[verseIndex];
  const isLastVerse = verseIndex === totalVerses - 1;

  const translitText = entry
    ? getTransliteration(entry.original, entry.transliteration, transliterationLanguage ?? 'en')
    : '';

  const capabilities = buildReadableCapabilities({
    original: entry?.original || entry?.fullText,
    transliteration: entry?.transliteration,
    meaning: entry?.meaning,
    pipelineTags: {
      content_type: 'sacred_verse',
      audio_mode: 'pandit',
    },
  });

  const readerControls = useReaderControls(capabilities);

  const showTranslit = showTransliteration && capabilities.canToggleTransliteration && translitText && translitText !== (entry?.original || entry?.fullText);

  const { t } = useLanguage();
  const {
    language: customLang,
    setLanguage: setCustomLang,
    labels,
    languages,
    fontPresets,
    fontStep,
    setFontStep,
    fontScale,
  } = useReaderDisplayPreferences({
    resolvedLanguage: normalizeContentLanguage(meaningLanguage || appLanguage),
    initialFontStep: 2,
  });

  const effectiveMeaningLanguage = customLang;
  const reviewedMeaning = entry && effectiveMeaningLanguage === 'hi' ? hindiMeanings?.[entry.id] : undefined;
  const localizedMeaning = useLocalizedMeaning({
    entryId: entry?.id,
    sourceMeaning: entry?.meaning,
    sourceLabel: entry?.source,
    targetLanguage: effectiveMeaningLanguage,
    providedMeaning: reviewedMeaning,
  });
  const meaningText = entry ? localizedMeaning.meaning : '';
  const meaningLabel = getMeaningLabel(effectiveMeaningLanguage);

  const handleCopy = () => {
    if (!entry) return;
    readerControls.handlers.copyText(getEntryText(entry, labels.meaning), 'Scripture verse');
  };

  const handleShare = () => {
    const link = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Pathshala reading on Shoonaya: "${title}". Read here: ${link}`;
    readerControls.handlers.share(text, title, link);
  };

  const askHref = entry
    ? getAIChatHref(
        `Explain this scripture verse in simple language with practical guidance: ${entry.title}`,
        getEntryText(entry, labels.meaning)
      )
    : '/ai-chat';

  // ── Stop TTS when verse changes ───────────────────────────────────────────
  useEffect(() => { stopTTS(); }, [verseIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load bookmarks for current entries ─────────────────────────────────────
  useEffect(() => {
    if (!userId || !entries.length) return;
    let cancelled = false;
    async function load() {
      const ids = entries.map(e => e.id);
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
  }, [entries, supabase, userId]);

  // ── TTS ────────────────────────────────────────────────────────────────────
  const stopTTS = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    setSpeakingId(null);
  }, []);

  useEffect(() => () => stopTTS(), [stopTTS]);

  // ── Reset verse + explain state when lesson (entries) changes ──────────────
  // Without this, navigating to a new lesson keeps the stale explanation from
  // the previous lesson because explainResult/showExplain are component state
  // that survive prop changes.
  useEffect(() => {
    setVerseIndex(0);
    setSlideDir(1);
    setShowExplain(false);
    setExplainResult(null);
    setExplainUpgradeNeeded(false);
    stopTTS();
  }, [entries, stopTTS]);

  // ── Reset explain state when the reader language changes ───────────────────
  // The explain button only fetches when (!showExplain && !explainResult).
  // Without this reset, a cached explanation in the old language is shown
  // instead of re-fetching in the newly selected language.
  useEffect(() => {
    setShowExplain(false);
    setExplainResult(null);
    setExplainUpgradeNeeded(false);
  }, [customLang]);

  async function speakEntry(e: LibraryEntry) {
    if (speakingId === e.id || readerControls.state.isGeneratingTTS) { stopTTS(); return; }
    const ttsText = e.original || e.transliteration || e.fullText || '';
    if (!ttsText) {
      toast.error(labels.audioUnavailableRightNow);
      return;
    }
    stopTTS();
    try {
      const audioUrl = await readerControls.handlers.requestTTS(ttsText, {
        quality: 'pandit',
        rate: ttsRate,
        pipelineTags: {
          content_type: 'sacred_verse',
          audio_mode: 'pandit'
        }
      });
      if (!audioUrl) return;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => { setSpeakingId(null); };
      audio.onerror = () => { setSpeakingId(null); };
      await audio.play();
      setSpeakingId(e.id);
    } catch {
      toast.error(labels.audioUnavailableRightNow);
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
    toast.success(next ? labels.savedForLater : labels.removedFromSaved);
  }

  // ── Copy ───────────────────────────────────────────────────────────────────
  async function copyEntry(e: LibraryEntry) {
    await readerControls.handlers.copyText(getEntryText(e, labels.meaning), 'Verse');
  }

  // ── AI Explain ─────────────────────────────────────────────────────────────
  async function explainVerse() {
    if (!entry || explainLoading) return;
    setExplainResult(null);
    setExplainUpgradeNeeded(false);
    setExplainLoading(true);
    try {
      const explainText = entry.original || entry.transliteration || entry.fullText || '';
      const result = await readerControls.handlers.requestExplain(explainText, {
        source:          entry.source,
        title:           entry.title,
        tradition,
        language:        effectiveMeaningLanguage,
        transliteration: entry.transliteration,
        translation:     entry.meaning,
        contentType:     'sacred_verse',
      });
      if (result) setExplainResult(result as ExplainResult);
      else {
        toast.error(labels.couldNotGenerateExplanation);
      }
    } catch (err: any) {
      if (err?.upgrade_required) {
        setExplainUpgradeNeeded(true);
        setShowExplain(true); // Keep the panel open to show upgrade card
      } else {
        const msg = err instanceof Error ? err.message : labels.couldNotGenerateExplanation;
        toast.error(msg);
      }
    } finally {
      setExplainLoading(false);
    }
  }

  // ── Navigation helpers ─────────────────────────────────────────────────────
  function goNextVerse() {
    if (verseIndex < totalVerses - 1) {
      setSlideDir(1);
      setVerseIndex(v => v + 1);
      setShowExplain(false);
      setExplainResult(null);
      setExplainUpgradeNeeded(false);
    }
  }

  function goPrevVerse() {
    if (verseIndex > 0) {
      setSlideDir(-1);
      setVerseIndex(v => v - 1);
      setShowExplain(false);
      setExplainResult(null);
      setExplainUpgradeNeeded(false);
    }
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4"
           style={{ background: P.bg }}>
        <BookOpen size={40} style={{ color: P.inkMuted }} />
        <p className="font-semibold" style={{ color: P.ink }}>{labels.noLessonsFound || 'No verses found'}</p>
        <button onClick={onClose} className="text-sm underline flex items-center gap-1" style={{ color: P.accent }}>
          <ChevronLeft size={16} />
          {t('done')}
        </button>
      </div>
    );
  }

  const handleBack = () => {
    if (isModal && onClose) onClose();
  };

  const readerContent = (
    <ReaderShell
      title={title}
      subtitle={subtitle}
      fallbackBackUrl="/pathshala"
      onBack={isModal || onClose ? handleBack : undefined}
      themeColor={P.accent}
      shellBackgroundColor={P.bg}
      shellHeaderBackgroundColor={P.bg}
      headerCenterContent={
        <div className="flex items-center justify-center gap-3">
          <div className="text-center min-w-0 flex-1">
              {subtitle && (
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] truncate" style={{ color: P.accent }}>
                  {subtitle}
                </p>
              )}
              <h1 className="text-sm font-semibold truncate" style={{ color: P.ink }}>
                {title}
              </h1>
          </div>
          {lessonsNavigation && (
            <CircularProgress
              pct={lessonsNavigation.progressPct}
              accent={P.accent}
              size={32}
              strokeWidth={3}
              label={<span className="text-[8px] font-bold" style={{ color: P.accentDeep }}>{lessonsNavigation.progressPct}%</span>}
            />
          )}
        </div>
      }
      fontPresets={fontPresets}
      fontStep={fontStep}
      setFontStep={setFontStep}
      languages={languages}
      currentLanguage={customLang}
      setLanguage={setCustomLang}
      showTransliterationToggle={false}
      showMeaningToggle={false}
      onTTS={() => entry && speakEntry(entry)}
      ttsRate={ttsRate}
      onTTSRateChange={setTtsRate}
      isSpeaking={!!speakingId}
      isTTSGenerating={readerControls.state.isGeneratingTTS}
      onCopy={handleCopy}
      isCopied={readerControls.state.isCopied}
      onShare={handleShare}
      bottomBar={
        <div className="px-5 py-4 max-w-xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            {/* Primary CTA (Next/Complete) */}
            <div className="flex-1">
              {ctaConfig ? (
                <button
                  onClick={ctaConfig.action}
                  disabled={ctaConfig.disabled}
                  className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all motion-press shadow-md disabled:opacity-40"
                  style={{ background: P.accent, color: P.btnText }}
                >
                  {ctaConfig.label}
                </button>
              ) : isLastVerse ? (
                <button
                  onClick={() => handleBack()}
                  className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all motion-press shadow-md"
                  style={{ background: P.accent, color: P.btnText }}
                >
                  <CheckCircle2 size={18} />
                  <span>{t(customLang, 'donePranam') || 'Done'}</span>
                </button>
              ) : (
                <button
                  onClick={() => { setSlideDir(1); setVerseIndex(i => i + 1); setShowExplain(false); setExplainResult(null); setExplainUpgradeNeeded(false); }}
                  className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all motion-press"
                  style={{ background: P.bgCard, color: P.accentDeep, border: `2px solid ${P.borderSoft}` }}
                >
                  <span>{t(customLang, 'nextVerse') || 'Next Verse'}</span>
                  <ChevronRight size={18} />
                </button>
              )}
            </div>

            {/* Quick Actions container */}
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => entry && toggleBookmark(entry)}
                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all motion-press"
                style={{ background: P.bgCard, border: `1px solid ${P.borderSoft}` }}
                aria-label="Save for later"
              >
                <Bookmark
                  size={20}
                  className="transition-all"
                  style={{ color: P.accentDeep }}
                  fill={entry && bookmarkedIds.has(entry.id) ? P.accentDeep : 'none'}
                />
              </button>
              <Link
                href={askHref}
                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all motion-press"
                style={{ background: P.bgCard, border: `1px solid ${P.borderSoft}` }}
                aria-label="Ask Guruji"
              >
                <Sparkles size={20} style={{ color: P.accentDeep }} />
              </Link>
            </div>
          </div>
        </div>
      }
      contentClassName="flex-1 overflow-auto overscroll-contain"
    >
      {/* ════════════ SCROLLABLE CONTENT ════════════════════════════════════ */}
      <div className="max-w-xl mx-auto px-5 pt-8 pb-56">

        {/* ── Verse progress dots ────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 mb-10">
            {entries.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setSlideDir(i > verseIndex ? 1 : -1);
                  setVerseIndex(i);
                  setShowExplain(false);
                  setExplainResult(null);
                  setExplainUpgradeNeeded(false);
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
              key={`${entry.id}-${verseIndex}`}
              custom={slideDir}
              initial={{ opacity: 0, x: slideDir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideDir * -40 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {/* Source chip + title */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ background: P.accentBg, border: `1px solid ${P.border}` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: P.accent }} />
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: P.accentDeep }}>
                      {entry.source}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCorrectionModalOpen(true)}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors animate-fade-in"
                    title="Report translation issue"
                  >
                    <span className="text-xs">🚩</span>
                  </button>
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
                    {t('transliteration')}
                  </p>
                  <p
                    className="italic leading-relaxed"
                    style={{ color: P.translit, fontSize: `${fontScale * 0.95}rem` }}
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
                    {meaningLabel}
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
                    ? <><Loader2 size={14} className="animate-spin" /> {labels.askingTeacher}</>
                    : showExplain
                      ? <><EyeOff size={14} /> {labels.hideExplanation}</>
                      : <><Sparkles size={14} /> {labels.explainVerse}</>
                  }
                </button>

                <AnimatePresence>
                  {showExplain && explainUpgradeNeeded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.26 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="mt-3 rounded-2xl px-5 py-6 flex flex-col items-center gap-3 text-center"
                        style={{ background: 'rgba(197,160,89,0.07)', border: `1px solid rgba(197,160,89,0.25)` }}
                      >
                        <span className="text-2xl">✨</span>
                        <p className="text-sm font-semibold" style={{ color: P.ink }}>
                          AI verse explanations are a Zenith feature
                        </p>
                        <p className="text-xs" style={{ color: P.inkMuted }}>
                          Upgrade to unlock deep, tradition-aware explanations for every verse.
                        </p>
                        <a
                          href="/settings/subscription"
                          className="mt-1 text-xs font-bold px-5 py-2.5 rounded-full transition-opacity hover:opacity-80"
                          style={{ background: 'rgba(197,160,89,0.90)', color: '#1c1208' }}
                        >
                          Upgrade to Zenith →
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showExplain && explainResult && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.26 }}
                      className="overflow-hidden"
                    >
                      {/* ── Fallback: AI unavailable — show retry card ── */}
                      {explainResult.is_fallback ? (
                        <div
                          className="mt-3 rounded-2xl px-5 py-6 flex flex-col items-center gap-3 text-center"
                          style={{ background: P.bgCard, border: `1px solid ${P.border}` }}
                        >
                          <span className="text-2xl">🪔</span>
                          <p className="text-sm font-medium" style={{ color: P.ink }}>
                            {labels.couldNotGenerateExplanation}
                          </p>
                          <button
                            onClick={() => { setExplainResult(null); explainVerse(); }}
                            className="mt-1 text-xs font-semibold px-4 py-2 rounded-full transition-opacity hover:opacity-80"
                            style={{ background: P.accentBg, color: P.accentDeep, border: `1px solid ${P.border}` }}
                          >
                            ↻ {labels.askingTeacher ? 'Retry' : 'Try again'}
                          </button>
                        </div>
                      ) : (
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
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: P.accentDeep }}>{labels.meaning}</p>
                            <p className="text-sm leading-relaxed" style={{ color: P.ink }}>{explainResult.explanation.meaning}</p>
                          </div>
                        )}

                        {/* Commentary */}
                        {explainResult.explanation.commentary && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: P.accentDeep }}>{labels.commentary}</p>
                            <p className="text-sm leading-relaxed" style={{ color: P.ink, opacity: 0.85 }}>{explainResult.explanation.commentary}</p>
                          </div>
                        )}

                        {/* Today's practice */}
                        {explainResult.explanation.daily_application && (
                          <div
                            className="rounded-xl px-4 py-3"
                            style={{ background: P.accentBg, border: `1px solid ${P.border}` }}
                          >
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: P.accentDeep }}>{t(customLang, 'dailyApp')}</p>
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
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ── Jump to lesson ──────────────────────────────────────── */}
          {lessonsNavigation && lessonsNavigation.totalLessons > 1 && (
            <div className="mt-12 pt-6" style={{ borderTop: `1px solid ${P.border}` }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: P.inkMuted }}>
                Lessons
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: lessonsNavigation.totalLessons }).map((_, i) => {
                  const done    = lessonsNavigation.completedLessons.includes(i);
                  const current = i === lessonsNavigation.currentLesson;
                  return (
                    <button
                      key={i}
                      onClick={() => lessonsNavigation.onGoToLesson(i)}
                      className="w-[44px] h-[44px] rounded-full text-xs font-semibold flex items-center justify-center transition-all"
                      style={{
                        background: current ? P.accent : done ? P.accentBg : P.bgCard,
                        color:      current ? P.btnText : done ? P.accentDeep : P.inkMuted,
                        border:     `1px solid ${current ? P.accent : P.border}`,
                      }}
                    >
                      {done && !current ? <CheckCircle2 size={13} /> : i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      <ScriptureCorrectionModal
        isOpen={correctionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        scriptureSource={entry.source}
        verseText={entry.original || entry.fullText || ''}
      />
    </ReaderShell>
  );

  if (isModal) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-0 z-[999] flex flex-col"
      >
        {readerContent}
      </motion.div>
    );
  }

  return readerContent;
}
