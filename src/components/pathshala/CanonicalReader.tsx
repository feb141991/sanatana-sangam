'use client';

// ─── Pathshala Canonical Reader — parchment e-reader ──────────────────────────
// Solid warm-cream theme — no opacity tricks, readable for all ages.
// One verse at a time, full-screen, all features always visible.

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, CheckCircle2, BookOpen, Mic,
  Sparkles, Copy, Loader2, Bookmark, Volume2, VolumeX, EyeOff, Share2, Check,
  Globe, Type
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import CircularProgress from '@/components/ui/CircularProgress';
import { getAIChatHref } from '@/lib/pathshala-links';
import { getTransliteration } from '@/lib/transliteration';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useReaderDisplayPreferences } from '@/lib/i18n/reader-display';
import {
  getMeaningLabel,
  normalizeContentLanguage
} from '@/lib/language-runtime';
import { useLocalizedMeaning } from '@/hooks/useLocalizedMeaning';
import type { LibraryEntry, LibraryTradition } from '@/lib/library-content';
import { buildReadableCapabilities } from '@/lib/readable-content';
import { useReaderControls } from '@/hooks/useReaderControls';

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
  const supabase = useRef(createClient()).current;
  const totalVerses = entries.length;

  // ── Verse navigation within a lesson ──────────────────────────────────────
  const [verseIndex, setVerseIndex] = useState(0);
  const [slideDir,   setSlideDir]   = useState<1 | -1>(1);

  // ── Bookmarks ──────────────────────────────────────────────────────────────
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // ── TTS ────────────────────────────────────────────────────────────────────
  const [speakingId,   setSpeakingId]   = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── AI Explain ─────────────────────────────────────────────────────────────
  const [showExplain,    setShowExplain]    = useState(false);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainResult,  setExplainResult]  = useState<ExplainResult | null>(null);

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
    } catch (err) {
      const msg = err instanceof Error ? err.message : labels.couldNotGenerateExplanation;
      toast.error(msg);
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

  // ── CTA text & action ──────────────────────────────────────────────────────
  const defaultCtaAction = isLastVerse ? (onClose || (() => {})) : goNextVerse;
  const defaultCtaLabel = isLastVerse 
    ? <><CheckCircle2 size={15} /><span>{t('done')}</span></>
    : <><span>{labels.nextVerse}</span><ChevronRight size={15} /></>;

  const activeCtaAction = isLastVerse && ctaConfig ? ctaConfig.action : defaultCtaAction;
  const activeCtaLabel = isLastVerse && ctaConfig ? ctaConfig.label : defaultCtaLabel;
  const activeCtaDisabled = isLastVerse && ctaConfig ? ctaConfig.disabled : false;

  // ── Render ─────────────────────────────────────────────────────────────────
  const content = (
    <div className="min-h-dvh flex flex-col" style={{ background: P.bg }}>
      {/* ════════════ HEADER ════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-30 px-4 py-3 flex flex-col gap-2"
        style={{ background: P.bgCard, borderBottom: `1px solid ${P.border}` }}
      >
        <div className="flex items-center gap-3">
          {/* Back */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 motion-press"
            style={{ background: P.accentBg, border: `1px solid ${P.border}` }}
          >
            <ChevronLeft size={18} style={{ color: P.accentDeep }} />
          </button>

          {/* Titles */}
          <div className="flex-1 min-w-0">
            {subtitle && <p className="text-[10px] truncate font-medium" style={{ color: P.inkMuted }}>{subtitle}</p>}
            <p className="text-sm font-bold truncate" style={{ color: P.ink }}>{title}</p>
          </div>

          {/* Progress ring */}
          {lessonsNavigation && (
            <CircularProgress
              pct={lessonsNavigation.progressPct}
              accent={P.accent}
              size={32}
              strokeWidth={3}
              label={<span className="text-[8px] font-bold" style={{ color: P.accentDeep }}>{lessonsNavigation.progressPct}%</span>}
            />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[rgba(200,146,74,0.12)] border border-[rgba(200,146,74,0.2)] transition active:scale-90"
              title="Copy Scripture"
            >
              {readerControls.state.isCopied ? <Check size={13} style={{ color: P.accentDeep }} /> : <Copy size={13} style={{ color: P.accentDeep }} />}
            </button>
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[rgba(200,146,74,0.12)] border border-[rgba(200,146,74,0.2)] transition active:scale-90"
              title="Share Lesson"
            >
              <Share2 size={13} style={{ color: P.accentDeep }} />
            </button>
          </div>
        </div>

        {/* ── Subheader Controls row for Zoom & Language ── */}
        <div className="flex items-center justify-between pt-2 border-t border-[rgba(200,146,74,0.1)]">
          {/* Zoom Selector */}
          <div className="flex items-center gap-1">
            <Type size={12} style={{ color: P.inkMuted, marginRight: 2 }} />
            {fontPresets.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setFontStep(idx)}
                className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${
                  fontStep === idx
                    ? 'text-white shadow-sm'
                    : ''
                }`}
                style={{
                  backgroundColor: fontStep === idx ? P.accent : P.accentBg,
                  color: fontStep === idx ? P.btnText : P.accentDeep
                }}
              >
                {['A−', 'A', 'A+', 'A++', 'A+++'][idx]}
              </button>
            ))}
          </div>

          {/* Language Toggle */}
          <div className="flex items-center gap-1">
            <Globe size={12} style={{ color: P.inkMuted, marginRight: 2 }} />
            {languages.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setCustomLang(code)}
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all ${
                  customLang === code
                    ? 'text-white'
                    : ''
                }`}
                style={{
                  backgroundColor: customLang === code ? P.accent : P.accentBg,
                  color: customLang === code ? P.btnText : P.accentDeep
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ════════════ SCROLLABLE CONTENT ════════════════════════════════════ */}
      <div className="flex-1 overflow-auto overscroll-contain">
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
                    {t('transliteration')}
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
                      className="w-9 h-9 rounded-full text-xs font-semibold flex items-center justify-center transition-all"
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
      </div>

      {/* ════════════ FIXED BOTTOM BAR ══════════════════════════════════════ */}
      <div
        className="fixed bottom-0 inset-x-0 z-40"
        style={{ background: P.bgCard, borderTop: `1.5px solid ${P.border}` }}
      >
        {/* ── Quick actions ────────────────────────────────────────────── */}
        <div className="flex items-center justify-around px-4 pt-3 pb-1 max-w-xl mx-auto">

          {/* Listen */}
          {capabilities.canGenerateTTS ? (
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
                {readerControls.state.isGeneratingTTS
                  ? <Loader2 size={17} className="animate-spin" style={{ color: P.accentDeep }} />
                  : speakingId === entry.id
                    ? <VolumeX size={17} style={{ color: P.btnText }} />
                    : <Volume2 size={17} style={{ color: P.accentDeep }} />
                }
              </div>
              <span className="text-[10px] font-semibold" style={{ color: P.inkMuted }}>
                {speakingId === entry.id ? labels.stopReading : labels.listen}
              </span>
            </button>
          ) : (
            <div className="flex flex-col items-center gap-1 min-w-[52px] opacity-30">
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: P.accentBg, border: `1px solid ${P.border}` }}>
                <VolumeX size={17} style={{ color: P.accentDeep }} />
              </div>
              <span className="text-[10px] font-semibold" style={{ color: P.inkMuted }}>{labels.audioUnavailable}</span>
            </div>
          )}

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
              {bookmarkedIds.has(entry.id) ? t('done') : t('save')}
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
            <span className="text-[10px] font-semibold" style={{ color: P.inkMuted }}>{t('copy')}</span>
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
            <span className="text-[10px] font-semibold" style={{ color: P.inkMuted }}>{t('askAI')}</span>
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
            onClick={activeCtaAction}
            disabled={activeCtaDisabled}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl text-sm font-bold disabled:opacity-40 transition-all motion-press shadow-md"
            style={{ background: P.accent, color: P.btnText, height: '52px' }}
          >
            {activeCtaLabel}
          </button>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-0 z-[999] bg-[var(--background)] flex flex-col"
      >
        {content}
      </motion.div>
    );
  }

  return content;
}
