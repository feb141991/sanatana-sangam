'use client';

// ─── Pathshala — Scripture Learning Hub ──────────────────────────────────────
//
// Three-tab layout:
//   1. My Learning  — Shloka of Day + enrolled paths + progress
//   2. {Tradition}  — Tradition-gated scripture library
//   3. Explore      — Browse all learning paths + enroll
//
// Enrollment uses guided_path_progress table directly (bypasses engine
// pathshala.enrollment which requires a learning_paths table not yet seeded).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, BookOpen, Mic, Trophy,
  Loader2, Play, Star, Plus, Search, X,
  Share2, ChevronDown, ChevronUp, GraduationCap, Lock, Sparkles, BarChart2,
  ChevronRight, Volume2, VolumeX, Bookmark, Copy, EyeOff, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfettiOverlay from '@/components/ui/ConfettiOverlay';
import { createClient } from '@/lib/supabase';
import PremiumActivateModal from "@/components/premium/PremiumActivateModal";
import { usePremium } from '@/hooks/usePremium';
import { getTraditionMeta } from '@/lib/tradition-config';
import { useLocation } from '@/lib/LocationContext';
import { useZenithSensory } from '@/contexts/ZenithSensoryContext';
import CircularProgress from '@/components/ui/CircularProgress';
import {
  ALL_LIBRARY_ENTRIES, LIBRARY_SECTIONS,
  getEntriesBySection,
  type LibraryEntry,
} from '@/lib/library-content';
import { SEED_PATHS as SEED_PATHS_LIB, PATHSHALA_PATH_IDS } from '@/lib/pathshala-paths';
import {
  RAMAYANA_STRUCTURE, BHAGAVATAM_STRUCTURE,
  type EpicStructure, type EpicKanda, type EpicChapter, type EpicVerse
} from '@/lib/epics-registry';
import { calculatePanchang, getTodaySpiritualPulses } from '@/lib/panchang';
import { getMeaningLabel, resolveEffectiveMeaningLanguage } from '@/lib/language-runtime';
import { useLocalizedMeaning } from '@/hooks/useLocalizedMeaning';
import { getTransliteration } from '@/lib/transliteration';
import { useLanguage } from '@/lib/i18n/LanguageContext';

// ── Difficulty badges — theme-aware so they read clearly on dark and light ─────
function getDiffStyle(difficulty: string, isDark: boolean) {
  const s = {
    beginner:     { bg: isDark ? 'rgba(34,197,94,0.12)'   : 'rgba(34,197,94,0.1)',  text: isDark ? '#4ade80' : '#16a34a', border: isDark ? 'rgba(74,222,128,0.28)'  : 'rgba(34,197,94,0.35)',  label: 'Beginner'     },
    intermediate: { bg: isDark ? 'rgba(251,191,36,0.12)'  : 'rgba(251,191,36,0.1)', text: isDark ? '#fcd34d' : '#92400e', border: isDark ? 'rgba(252,211,77,0.28)'  : 'rgba(251,191,36,0.35)', label: 'Intermediate' },
    advanced:     { bg: isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)', text: isDark ? '#f87171' : '#b91c1c', border: isDark ? 'rgba(248,113,113,0.28)' : 'rgba(220,38,38,0.3)',   label: 'Advanced'     },
  };
  return s[difficulty as keyof typeof s] ?? s.beginner;
}

const TRAD_ICON: Record<string, string> = {
  hindu: '🕉️', sikh: '☬', buddhist: '☸️', jain: '🤲', all: '📖',
};

// ── Which library sections belong to each tradition ────────────────────────────
const SECTIONS_BY_TRADITION: Record<string, string[]> = {
  hindu:    ['gita','bhagavatam','vishnu_sahasranama','ramayana','ramcharitmanas',
             'upanishad','veda','yoga_sutra','chanakya','shiva_purana','shakta','stotra'],
  sikh:     ['gurbani'],
  buddhist: ['dhammapada'],
  jain:     ['jain'],
  other:    ['gita','bhagavatam','vishnu_sahasranama','ramayana','ramcharitmanas',
             'upanishad','veda','yoga_sutra','chanakya','shiva_purana','shakta','stotra',
             'gurbani','dhammapada','jain'],
};

// ─── Reader Themes ───────────────────────────────────────────────────────────
function getReaderPalette(tradition: string, accent: string) {
  // Default: Warm Parchment (Hindu/General)
  const base = {
    bg:          '#F7EDD8',
    bgCard:      '#FFFDF6',
    bgAccent:    '#FFF4E0',
    border:      '#DEC89A',
    borderSoft:  '#EAD9B5',
    ink:         '#2C1A0E',
    inkMuted:    '#7A5C3A',
    sanskrit:    '#8B3A0F',
    accent:      accent,
    accentDeep:  '#9B6B2A',
    accentBg:    '#F2D9A8',
    white:       '#FFFDF6',
    btnText:     '#FFFDF6',
  };

  if (tradition === 'sikh') {
    return {
      ...base,
      bg:         '#F0F4F8', // Cool paper
      bgCard:     '#F8FBFF',
      bgAccent:   '#EBF3FF',
      border:     '#C2D4E5',
      borderSoft: '#D6E4F0',
      ink:        '#0F172A', // Deep navy ink
      inkMuted:   '#475569',
      sanskrit:   '#1E40AF', // Blue Gurmukhi text
      accent:     '#2563EB', // Blue
      accentDeep: '#1E3A8A',
      accentBg:   '#DBEAFE',
    };
  }

  return base;
}

const READER_FONT_STEPS = [1.0, 1.15, 1.32, 1.5, 1.7] as const;

function getEntryText(entry: LibraryEntry) {
  return [
    `${entry.title} — ${entry.source}`,
    entry.original,
    entry.meaning ? `Meaning: ${entry.meaning}` : '',
  ].filter(Boolean).join('\n\n');
}

// ── Static seed paths — sourced from shared lib so server components can import too ──
export const SEED_PATHS = SEED_PATHS_LIB as unknown as {
  id: string; title: string; description: string;
  difficulty: string; tradition: string; total_lessons: number; duration_days: number;
}[];

// ── Share helper ───────────────────────────────────────────────────────────────
async function shareEntry(entry: LibraryEntry) {
  const text = `${entry.title} — ${entry.source}\n\n${entry.original}\n\n${entry.transliteration}\n\nMeaning: ${entry.meaning}\n\n— Shared via Shoonaya`;
  if (navigator.share) {
    try { await navigator.share({ title: entry.title, text }); return; } catch { /* cancelled */ }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  } catch { toast.error('Unable to share'); }
}

// ── Scripture Entry Card ───────────────────────────────────────────────────────
function EntryCard({ entry, accentColour }: { entry: LibraryEntry; accentColour: string }) {
  const { t } = useLanguage();
  return (
    <motion.button
      whileHover={{ scale: 1.01, translateY: -2 }}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left p-5 rounded-[2rem] transition-all relative overflow-hidden group"
      style={{ 
        background: 'rgba(255,255,255,0.02)', 
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}
      onClick={() => window.dispatchEvent(new CustomEvent('open-reader', { detail: { entry } }))}
    >
      {/* Decorative Gradient Background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${accentColour}08, transparent 70%)` }} />
      
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: accentColour }} />
            <p className="text-[10px] text-[color:var(--brand-muted)] uppercase tracking-[0.2em] font-bold">{entry.source}</p>
          </div>
          <h3 className="font-bold text-[color:var(--brand-ink)] text-base md:text-lg leading-tight mb-3 group-hover:text-[var(--brand-ink)] transition-colors">
            {entry.title}
          </h3>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors">
            <BookOpen size={12} style={{ color: accentColour }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accentColour }}>{t('beginReading')}</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 group-hover:scale-110 transition-transform duration-500">
          <Sparkles size={18} style={{ color: accentColour }} className="opacity-40" />
        </div>
      </div>
      <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/5 relative">
        <p className="text-sm font-[family:var(--font-deva)] leading-relaxed line-clamp-1 opacity-60 italic"
          style={{ color: accentColour }}>
          {entry.original.split('\n')[0]}
        </p>
      </div>
    </motion.button>
  );
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

// ─── Immersive Reader ─────────────────────────────────────────────────────────
function ScriptureReader({
  entry: initialEntry, chapter, onClose, accentColour: _accentColour, userId, tradition,
  appLanguage, meaningLanguage, transliterationLanguage, showTransliteration = true,
}: {
  entry?: LibraryEntry;
  chapter?: EpicChapter & { kandaTitle?: string };
  onClose: () => void;
  accentColour: string;
  userId: string;
  tradition: string;
  appLanguage?: string;
  meaningLanguage?: string;
  transliterationLanguage?: string;
  showTransliteration?: boolean;
}) {
  const isPro = usePremium();
  const supabase = useRef(createClient()).current;
  const { t } = useLanguage();
  const [sattvaMode, setSattvaMode] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const P = getReaderPalette(tradition, _accentColour);

  // ── Reader settings ────────────────────────────────────────────────────────
  const [fontStep, setFontStep] = useState(2);
  const fontScale = READER_FONT_STEPS[fontStep];
  const [verseIndex, setVerseIndex] = useState(0);

  // ── Bookmarks ──────────────────────────────────────────────────────────────
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // ── TTS ────────────────────────────────────────────────────────────────────
  const [ttsLoadingId, setTtsLoadingId] = useState<string | null>(null);
  const [speakingId,   setSpeakingId]   = useState<string | null>(null);

  // ── AI Explain ─────────────────────────────────────────────────────────────
  const [showExplain,    setShowExplain]    = useState(false);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainResult,  setExplainResult]  = useState<ExplainResult | null>(null);

  const verses = initialEntry 
    ? [{ ...initialEntry }] 
    : chapter?.verses?.map(v => ({ 
        id: `${chapter.id}-v${v.verseNumber}`,
        title: chapter.title,
        source: `${chapter.kandaTitle} · Chapter ${chapter.chapterNumber}`,
        original: v.original,
        transliteration: v.transliteration,
        meaning: v.meaning,
        category: 'scripture' as LibraryEntry['category'],
        tradition: tradition as LibraryEntry['tradition'],
        tags: [] as string[],
      })) || [];

  const activeVerse = verses[verseIndex];
  const totalVerses = verses.length;
  const effectiveMeaningLanguage = resolveEffectiveMeaningLanguage(appLanguage, meaningLanguage);
  const localizedMeaning = useLocalizedMeaning({
    entryId: activeVerse?.id,
    sourceMeaning: activeVerse?.meaning,
    sourceLabel: activeVerse?.source,
    targetLanguage: effectiveMeaningLanguage,
  });
  const activeTransliteration = activeVerse
    ? getTransliteration(activeVerse.original, activeVerse.transliteration, transliterationLanguage ?? 'en')
    : '';
  const showActiveTransliteration = showTransliteration && activeTransliteration && activeTransliteration !== activeVerse?.original;

  useEffect(() => {
    if (sattvaMode) {
      audioRef.current = new Audio('https://f005.backblazeb2.com/file/sangam-assets/audio/sattva_ambient_loop.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.4;
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current?.pause();
      audioRef.current = null;
    }
    return () => { audioRef.current?.pause(); };
  }, [sattvaMode]);

  const toggleSattva = () => {
    if (!isPro) { setShowPremiumModal(true); return; }
    setSattvaMode(!sattvaMode);
    if (!sattvaMode) toast('Sattva Mode active ✦ Deep immersion enabled', { icon: '✨' });
  };

  const stopTTS = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    setSpeakingId(null);
    setTtsLoadingId(null);
  }, []);

  useEffect(() => () => stopTTS(), [stopTTS]);

  async function speakEntry(v: any) {
    if (speakingId === v.id || ttsLoadingId === v.id) { stopTTS(); return; }
    stopTTS();
    setTtsLoadingId(v.id);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: v.original, rate: 0.78 }),
      });
      const { audioContent } = await res.json();
      const bytes = Uint8Array.from(atob(audioContent), c => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setSpeakingId(null); URL.revokeObjectURL(url); };
      await audio.play();
      setSpeakingId(v.id);
    } catch { toast.error('Audio unavailable'); } finally { setTtsLoadingId(null); }
  }

  async function toggleBookmark(v: any) {
    const next = !bookmarkedIds.has(v.id);
    const prev = new Set(bookmarkedIds);
    setBookmarkedIds(s => { const c = new Set(s); if (next) c.add(v.id); else c.delete(v.id); return c; });
    const { error } = await supabase
      .from('pathshala_user_state')
      .upsert({
        user_id: userId,
        entry_id: v.id,
        tradition: v.tradition ?? tradition,
        bookmarked_at: next ? new Date().toISOString() : null,
      }, { onConflict: 'user_id,entry_id' });
    if (error) { setBookmarkedIds(prev); toast.error(error.message); return; }
    toast.success(next ? 'Saved for later' : 'Removed from saved');
  }

  async function explainVerse() {
    if (!activeVerse || explainLoading) return;
    setExplainLoading(true);
    try {
      const res = await fetch('/api/pathshala/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sanskrit: activeVerse.original,
          transliteration: activeVerse.transliteration,
          translation: activeVerse.meaning,
          source: activeVerse.source,
          title: activeVerse.title,
          tradition,
          language: effectiveMeaningLanguage,
        }),
      });
      setExplainResult(await res.json());
    } catch { toast.error('Could not generate explanation'); } finally { setExplainLoading(false); }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[999] overflow-y-auto"
      style={{ background: P.bg }}
    >
      <PremiumActivateModal open={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
      
      <header
        className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
        style={{ background: P.bgCard, borderBottom: `1px solid ${P.border}` }}
      >
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: P.accentBg, border: `1px solid ${P.border}` }}>
          <ChevronLeft size={18} style={{ color: P.accentDeep }} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-sm truncate" style={{ color: P.ink }}>{activeVerse?.title}</h2>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: P.inkMuted }}>{activeVerse?.source}</p>
        </div>
        <button 
          onClick={toggleSattva}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${sattvaMode ? 'bg-amber-500/20' : 'bg-white/5'}`}
        >
          <Sparkles size={16} style={{ color: sattvaMode ? '#f59e0b' : P.accentDeep }} />
        </button>
        <button
          onClick={() => setFontStep(s => (s + 1) % READER_FONT_STEPS.length)}
          className="px-2 py-1 rounded-lg text-[11px] font-bold"
          style={{ background: P.accentBg, color: P.accentDeep, border: `1px solid ${P.border}` }}
        >
          Aa
        </button>
      </header>

      <div className="max-w-xl mx-auto px-5 pt-8 pb-56">
        {totalVerses > 1 && (
          <div className="flex items-center justify-center gap-1.5 mb-8">
            {verses.map((_, i) => (
              <div key={i} className="h-1 rounded-full transition-all" 
                style={{ 
                  width: i === verseIndex ? '20px' : '6px', 
                  background: i === verseIndex ? P.accent : P.borderSoft 
                }} />
            ))}
          </div>
        )}

        <motion.div
          key={verseIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center mb-6">
            <span className="text-4xl" style={{ color: P.accent, fontFamily: 'var(--font-deva, serif)' }}>ॐ</span>
          </div>

          <div className="rounded-2xl p-6 mb-6 text-center" style={{ background: P.bgCard, border: `1px solid ${P.border}` }}>
            <p className="leading-[2] font-semibold whitespace-pre-line" 
              style={{ color: P.sanskrit, fontFamily: 'var(--font-deva, serif)', fontSize: `${fontScale * 1.5}rem` }}>
              {activeVerse?.original}
            </p>
          </div>

          {showActiveTransliteration && (
            <div className="rounded-xl px-5 py-4 mb-5 text-center" style={{ background: P.bgAccent, border: `1px solid ${P.borderSoft}` }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: P.inkMuted }}>{t('transliteration')}</p>
              <p className="italic leading-relaxed break-words" style={{ color: P.ink, fontSize: `${fontScale * 0.9}rem` }}>
                {activeTransliteration}
              </p>
            </div>
          )}

          {activeVerse?.meaning && (
            <div className="rounded-2xl p-5 mb-5" style={{ background: P.bgCard, border: `1px solid ${P.border}` }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: P.accent }}>{getMeaningLabel(effectiveMeaningLanguage)}</p>
              <p className="font-medium leading-relaxed break-words" style={{ color: P.ink, fontSize: `${fontScale * 1.0}rem`, lineHeight: 1.8 }}>
                {localizedMeaning.meaning}
              </p>
            </div>
          )}

          <div className="mb-2">
            <button
              onClick={() => { if (!showExplain && !explainResult) explainVerse(); setShowExplain(s => !s); }}
              disabled={explainLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all"
              style={{ background: showExplain ? P.accentBg : P.bgCard, color: P.accentDeep, border: `1.5px solid ${P.border}` }}
            >
              {explainLoading ? <Loader2 size={14} className="animate-spin" /> : showExplain ? <EyeOff size={14} /> : <Sparkles size={14} />}
              {explainLoading ? 'Asking teacher…' : showExplain ? 'Hide explanation' : 'Explain this verse'}
            </button>

            <AnimatePresence>
              {showExplain && explainResult && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
                  <div className="mt-3 rounded-2xl p-5 space-y-4" style={{ background: P.bgCard, border: `1px solid ${P.border}` }}>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: P.accent }}>{t('deepMeaning')}</p>
                        <p className="text-sm leading-relaxed" style={{ color: P.ink }}>{explainResult.explanation.meaning}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: P.accent }}>{t('dailyApp')}</p>
                        <p className="text-sm leading-relaxed italic" style={{ color: P.inkMuted }}>{explainResult.explanation.daily_application}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-[1000]" style={{ background: P.bgCard, borderTop: `1.5px solid ${P.border}` }}>
        <div className="flex items-center justify-around px-4 pt-3 pb-4 max-w-xl mx-auto">
          {/* Listen */}
          <button onClick={() => speakEntry(activeVerse)} className="flex flex-col items-center gap-1 min-w-[52px]">
            <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: speakingId === activeVerse?.id ? '#2563EB' : P.accentBg, border: `1px solid ${P.border}` }}>
              {ttsLoadingId === activeVerse?.id ? <Loader2 size={17} className="animate-spin" style={{ color: speakingId === activeVerse?.id ? '#fff' : P.accentDeep }} /> : speakingId === activeVerse?.id ? <VolumeX size={17} style={{ color: '#fff' }} /> : <Volume2 size={17} style={{ color: P.accentDeep }} />}
            </div>
            <span className="text-[10px] font-semibold" style={{ color: P.inkMuted }}>{speakingId === activeVerse?.id ? t('done') : t('listen')}</span>
          </button>

          {/* Save */}
          <button onClick={() => toggleBookmark(activeVerse)} className="flex flex-col items-center gap-1 min-w-[52px]">
            <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: bookmarkedIds.has(activeVerse?.id) ? '#2563EB' : P.accentBg, border: `1px solid ${P.border}` }}>
              <Bookmark size={17} style={{ color: bookmarkedIds.has(activeVerse?.id) ? '#fff' : P.accentDeep }} className={bookmarkedIds.has(activeVerse?.id) ? 'fill-current' : ''} />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: P.inkMuted }}>{bookmarkedIds.has(activeVerse?.id) ? t('done') : t('save')}</span>
          </button>

          {/* Copy */}
          <button onClick={() => { if (activeVerse) { navigator.clipboard.writeText(getEntryText(activeVerse)); toast.success('Copied'); } }} className="flex flex-col items-center gap-1 min-w-[52px]">
            <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: P.accentBg, border: `1px solid ${P.border}` }}>
              <Copy size={17} style={{ color: P.accentDeep }} />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: P.inkMuted }}>{t('copy')}</span>
          </button>

          {/* Ask AI */}
          <Link href="/ai-chat" className="flex flex-col items-center gap-1 min-w-[52px]">
            <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: P.accentBg, border: `1px solid ${P.border}` }}>
              <Sparkles size={17} style={{ color: P.accentDeep }} />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: P.inkMuted }}>{t('askAI')}</span>
          </Link>

          {/* Conclude */}
          <button onClick={onClose} className="px-5 h-11 rounded-2xl font-bold text-xs flex items-center justify-center shadow-lg transition-transform active:scale-95" style={{ background: P.accent, color: P.btnText }}>
            {t('done')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Epic Viewer — for massive texts ───────────────────────────────────────────
function EpicViewer({ structure, accentColour }: { structure: EpicStructure; accentColour: string }) {
  const [selectedKanda, setKanda] = useState<EpicKanda>(structure.kandas[0]);

  const handleOpenChapter = async (c: EpicChapter) => {
    let verses: EpicVerse[] = [];
    if (c.id === 'ram-bal-1') {
      const { RAMAYANA_BAL_KANDA_1 } = await import('@/lib/data/ramayana-bal-kanda-1');
      verses = RAMAYANA_BAL_KANDA_1.verses || [];
    } else if (c.id === 'bhag-1-1') {
      const { BHAGAVATAM_CANTO_1_CH_1 } = await import('@/lib/data/bhagavatam-canto-1-ch-1');
      verses = BHAGAVATAM_CANTO_1_CH_1.verses || [];
    } else if (c.id === 'bhag-1-2') {
      const { BHAGAVATAM_CANTO_1_CH_2 } = await import('@/lib/data/bhagavatam-canto-1-ch-2');
      verses = BHAGAVATAM_CANTO_1_CH_2.verses || [];
    } else if (c.id === 'bhag-1-3') {
      const { BHAGAVATAM_CANTO_1_CH_3 } = await import('@/lib/data/bhagavatam-canto-1-ch-3');
      verses = BHAGAVATAM_CANTO_1_CH_3.verses || [];
    }
    if (verses.length === 0) {
      // Chapter content not yet transcribed — show a friendly toast
      const { default: toast } = await import('react-hot-toast');
      toast('This chapter is being transcribed. Check back soon! 🙏', { icon: '📖', duration: 3000 });
      return;
    }
    window.dispatchEvent(new CustomEvent('open-reader', {
      detail: { chapter: { ...c, kandaTitle: selectedKanda.title, verses } }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Kanda Selector - Premium Horizontal Scroll */}
      <div className="relative -mx-4 px-4">
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
          {structure.kandas.map(k => (
            <button
              key={k.id}
              onClick={() => setKanda(k)}
              className={`px-4 py-2 rounded-2xl text-[10px] font-bold whitespace-nowrap transition-all border ${
                selectedKanda.id === k.id
                  ? 'bg-white/10 border-white/20'
                  : 'bg-white/5 border-white/5 text-[color:var(--brand-muted)] hover:bg-white/8'
              }`}
              style={selectedKanda.id === k.id ? { color: accentColour, boxShadow: `0 4px 15px ${accentColour}10` } : {}}
            >
              {k.title}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 rounded-[2rem] bg-white/5 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <BookOpen size={60} style={{ color: accentColour }} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: accentColour }}>Current Kanda</p>
        <h3 className="text-xl font-bold mb-2">{selectedKanda.title}</h3>
        <p className="text-xs text-[color:var(--brand-muted)] leading-relaxed max-w-[80%]">{selectedKanda.description}</p>
      </div>

      {/* Chapter List - Step Journey Design */}
      <div className="grid gap-3 relative">
        {/* Journey Line */}
        <div className="absolute left-[2.25rem] top-6 bottom-6 w-px bg-white/5" />
        
        {selectedKanda.chapters.length > 0 ? (
          selectedKanda.chapters.map(c => (
            <motion.button
              key={c.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOpenChapter(c)}
              className="flex items-center gap-4 p-4 rounded-[1.8rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left relative z-10 group"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1c1c1a] border border-white/10 text-xs font-bold transition-all group-hover:border-white/20 group-hover:scale-110 shadow-lg"
                style={{ color: accentColour }}>
                {c.chapterNumber}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold truncate group-hover:text-[var(--brand-ink)] transition-colors">{c.title}</h4>
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                </div>
                <p className="text-[10px] text-[color:var(--brand-muted)] truncate mt-0.5">{c.summary}</p>
              </div>
            </motion.button>
          ))
        ) : (
          <div className="py-20 text-center rounded-[2rem] border border-dashed border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/2">
            <Loader2 className="mx-auto mb-3 animate-spin-slow opacity-20" size={32} />
            <p className="text-xs font-medium tracking-wide opacity-40 uppercase">Compiling chapters for the Path…</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Scripture Library Tab — Scripture cards → drill-in view ───────────────────
function ScriptureTab({
  tradition, accentColour, navLabel, isDark, initialSectionId,
}: {
  tradition: string; accentColour: string; navLabel: string; isDark: boolean; initialSectionId?: string;
}) {
  const allowedSections = SECTIONS_BY_TRADITION[tradition] ?? SECTIONS_BY_TRADITION.other;
  const sections        = LIBRARY_SECTIONS.filter(s => allowedSections.includes(s.id));

  const [drillSection, setDrillSection] = useState<string | null>(initialSectionId ?? null);
  const [query,        setQuery]        = useState('');
  const [showSearch,   setSearch]       = useState(false);

  // Theme tokens
  const cardBg     = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.75)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)';
  const inkColor   = isDark ? '#f5dfa0' : '#2a1002';
  const mutedColor = isDark ? 'rgba(245,210,130,0.50)' : 'rgba(100,55,10,0.55)';

  const entries = useMemo(() => {
    if (!drillSection) return [];
    const base = getEntriesBySection(drillSection);
    if (!query.trim()) return base;
    const q = query.toLowerCase().trim();
    return base.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.meaning.toLowerCase().includes(q) ||
      e.source.toLowerCase().includes(q) ||
      e.tags.some(t => t.includes(q))
    );
  }, [drillSection, query]);

  // ── Drill-in view: inside a specific scripture ────────────────────────────────
  if (drillSection) {
    const section = sections.find(s => s.id === drillSection);
    return (
      <div className="space-y-4">
        {/* Back to library */}
        <button
          onClick={() => { setDrillSection(null); setQuery(''); setSearch(false); }}
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition-opacity hover:opacity-70"
          style={{ color: accentColour }}
        >
          <ChevronLeft size={14} /> Scripture Library
        </button>

        {/* Scripture header */}
        <div className="p-5 rounded-[2rem] relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${accentColour}14, ${accentColour}04)`, border: `1px solid ${accentColour}22` }}>
          <div className="absolute top-3 right-4 text-7xl opacity-[0.07] select-none pointer-events-none">{section?.emoji}</div>
          <p className="text-3xl mb-2 leading-none">{section?.emoji}</p>
          <h3 className="font-bold text-xl mb-1 leading-tight" style={{ color: inkColor }}>{section?.title}</h3>
          <p className="text-xs leading-relaxed max-w-[85%] mb-3" style={{ color: mutedColor }}>{section?.desc}</p>
          <span className="text-[10px] font-bold rounded-full px-2.5 py-1"
            style={{ background: `${accentColour}18`, color: accentColour }}>
            {section?.count} passages
          </span>
        </div>

        {/* Search toggle (not for epic viewers) */}
        {drillSection !== 'ramayana' && drillSection !== 'bhagavatam' && (
          <div className="flex justify-end">
            <button
              onClick={() => setSearch(s => !s)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition"
              style={{ background: cardBg, border: `1px solid ${cardBorder}`, color: mutedColor }}
            >
              {showSearch ? <X size={15} /> : <Search size={15} />}
            </button>
          </div>
        )}

        {/* Search box */}
        {showSearch && (
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--brand-muted)]" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Search ${section?.title ?? navLabel}…`}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/6 text-sm text-[color:var(--brand-ink)] placeholder:text-[color:var(--brand-muted)] focus:outline-none focus:border-white/20"
            />
          </div>
        )}

        {/* Content */}
        {drillSection === 'ramayana' || drillSection === 'bhagavatam' ? (
          <div className="space-y-10">
            <EpicViewer
              structure={drillSection === 'ramayana' ? RAMAYANA_STRUCTURE : BHAGAVATAM_STRUCTURE}
              accentColour={accentColour}
            />
            {entries.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 px-2">
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Featured Passages</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>
                <div className="grid gap-3">
                  {entries.map(e => <EntryCard key={e.id} entry={e} accentColour={accentColour} />)}
                </div>
              </div>
            )}
          </div>
        ) : entries.length === 0 && query ? (
          <div className="text-center py-10">
            <p className="text-sm text-[color:var(--brand-muted)]">No results for &ldquo;{query}&rdquo;</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {entries.map(e => <EntryCard key={e.id} entry={e} accentColour={accentColour} />)}
          </div>
        )}
      </div>
    );
  }

  // ── Scripture card grid ───────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider px-0.5" style={{ color: mutedColor }}>
        {sections.length} Scriptures · {navLabel}
      </p>
      <div className="grid gap-3">
        {sections.map(section => (
          <motion.button
            key={section.id}
            whileHover={{ scale: 1.01, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setDrillSection(section.id)}
            className="w-full text-left p-5 rounded-[2rem] relative overflow-hidden group transition-all"
            style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[2rem]"
              style={{ background: `radial-gradient(circle at top right, ${accentColour}0C, transparent 70%)` }} />

            <div className="relative flex items-start gap-4">
              {/* Emoji icon */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-105 duration-300"
                style={{ background: `${accentColour}14`, border: `1px solid ${accentColour}20` }}>
                {section.emoji}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base mb-0.5 leading-tight" style={{ color: inkColor }}>
                  {section.title}
                </h3>
                <p className="text-[11px] leading-relaxed mb-2.5 line-clamp-2" style={{ color: mutedColor }}>
                  {section.desc}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold rounded-full px-2.5 py-0.5"
                    style={{ background: `${accentColour}15`, color: accentColour }}>
                    {section.count} passages
                  </span>
                  {(section.id === 'ramayana' || section.id === 'bhagavatam') && (
                    <span className="text-[10px] font-bold rounded-full px-2.5 py-0.5"
                      style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', color: mutedColor }}>
                      Full Text
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight size={18} className="shrink-0 mt-1 opacity-20 group-hover:opacity-60 transition-all duration-300 group-hover:translate-x-0.5"
                style={{ color: accentColour }} />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface Props {
  userId:      string;
  userName:    string;
  tradition:   string;
  initialTab?: 'learn' | 'scripture' | 'explore';
  initialEntryId?: string;
  initialSectionId?: string;
  appLanguage?: string;
  meaningLanguage?: string;
  transliterationLanguage?: string;
  showTransliteration?: boolean;
}

// ── Active enrollment record ───────────────────────────────────────────────────
interface ActiveEnrollment {
  path_id:           string;
  status:            string;
  completed_at:      string | null;
  current_lesson:    number;
  completed_lessons: number[];
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PathshalaClient({
  userId,
  userName,
  tradition,
  initialTab,
  initialEntryId,
  initialSectionId,
  appLanguage,
  meaningLanguage,
  transliterationLanguage,
  showTransliteration = true,
}: Props) {
  const router    = useRouter();
  const supabase  = useRef(createClient()).current;
  const meta      = getTraditionMeta(tradition);
  const isPro     = usePremium();
  const prefersReducedMotion = useReducedMotion();
  const { playHaptic } = useZenithSensory();
  const { t } = useLanguage();

  const { coords: _pathCoords } = useLocation();
  const lat = _pathCoords?.lat ?? undefined;
  const lon = _pathCoords?.lon ?? undefined;
  const [activePaths, setActive]    = useState<ActiveEnrollment[]>([]);
  const [loading,     setLoading]   = useState(true);
  const [enrolling,   setEnrolling] = useState<string | null>(null);
  const [isDark,      setIsDark]    = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const pulse = useMemo(() => {
    const p = calculatePanchang(new Date(), lat ?? undefined, lon ?? undefined);
    return getTodaySpiritualPulses(p.tithiIndex, tradition)[0] ?? null;
  }, [tradition, lat, lon]);

  const [tab, setTab] = useState<'learn' | 'scripture' | 'explore'>(initialTab ?? 'learn');
  const switchTab = (t: 'learn' | 'scripture' | 'explore') => {
    setTab(t);
    playHaptic('medium');
  };

  // Show all 44 paths across all traditions in the Explore tab
  const allPaths = SEED_PATHS as unknown as {
    id: string; title: string; description: string;
    difficulty: string; tradition: string; total_lessons: number; duration_days: number;
  }[];

  useEffect(() => {
    const checkTheme = () => setIsDark(document.documentElement.dataset.theme !== 'light');
    checkTheme();
    const obs = new MutationObserver(checkTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  const primaryText = isDark ? '#f5dfa0' : '#2a1002';
  const secondaryText = isDark ? 'rgba(245,210,130,0.55)' : 'rgba(120,65,10,0.55)';
  const tertiaryText = isDark ? 'rgba(245,210,130,0.35)' : 'rgba(100,55,10,0.40)';
  
  const pageBg = isDark ? 'linear-gradient(180deg,#160b08 0%,#1c1008 40%,#120a05 100%)' : 'linear-gradient(180deg,#fdf6ee 0%,#f7ede0 40%,#f2e8d5 100%)';
  const glassSurface = isDark ? 'linear-gradient(140deg,rgba(28,20,12,0.92),rgba(18,12,8,0.96))' : 'linear-gradient(140deg,rgba(255,244,228,0.96),rgba(250,235,210,0.98))';
  const glassSurfaceStrong = isDark ? 'rgba(28,18,10,0.95)' : 'rgba(255,245,230,0.95)';
  const glassBorder = isDark ? 'rgba(200,146,74,0.14)' : 'rgba(180,110,30,0.15)';
  const glassShadow = isDark
    ? '0 4px 24px rgba(200,146,74,0.05), inset 0 1px 0 rgba(255,255,255,0.04)'
    : '0 4px 24px rgba(180,110,30,0.06), inset 0 1px 0 rgba(255,255,255,0.6)';
    
  // ── Modal state for immersive reading ──────────────────────────────────────────
  const [readingEntry, setReadingEntry] = useState<LibraryEntry | undefined>();
  const [readingChapter, setReadingChapter] = useState<(EpicChapter & { kandaTitle?: string }) | undefined>();

  useEffect(() => {
    const handleOpen = (e: any) => {
      if (e.detail.entry) setReadingEntry(e.detail.entry);
      if (e.detail.chapter) setReadingChapter(e.detail.chapter);
    };
    window.addEventListener('open-reader', handleOpen);
    return () => window.removeEventListener('open-reader', handleOpen);
  }, []);

  useEffect(() => {
    if (initialEntryId) {
      const entry = ALL_LIBRARY_ENTRIES.find(e => e.id === initialEntryId);
      if (entry) setReadingEntry(entry);
    }
  }, [initialEntryId]);

  const cardStyle = {
    background: glassSurface,
    border: `1px solid ${glassBorder}`,
    boxShadow: glassShadow,
  };

  // ── Load active enrollments from guided_path_progress ───────────────────────
  // PATHSHALA_PATH_IDS is imported from @/lib/pathshala-paths.
  // It scopes all queries away from NityaKarma guided-plan rows (brahma-muhurta-7 etc.)
  // which share the guided_path_progress table. Without it those rows inflate the badge.

  useEffect(() => {
    async function loadEnrollments() {
      try {
        const { data, error } = await supabase
          .from('guided_path_progress')
          .select('path_id, status, completed_at, current_lesson, completed_lessons')
          .eq('user_id', userId)
          .eq('status', 'active')
          .in('path_id', PATHSHALA_PATH_IDS);  // ← only Pathshala paths

        if (error) throw error;
        setActive(data ?? []);
      } catch (err) {
        console.error('[Pathshala] load enrollments error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEnrollments();
  }, [userId, supabase]);

  // ── Render Reader Modal ──
  const ReaderModal = () => {
    if (!readingEntry && !readingChapter) return null;
    return (
      <AnimatePresence>
        {(readingEntry || readingChapter) && (
          <ScriptureReader
            entry={readingEntry}
            chapter={readingChapter}
            userId={userId}
            tradition={tradition}
            appLanguage={appLanguage}
            meaningLanguage={meaningLanguage}
            transliterationLanguage={transliterationLanguage}
            showTransliteration={showTransliteration}
            onClose={() => { setReadingEntry(undefined); setReadingChapter(undefined); }}
            accentColour={meta.accentColour}
          />
        )}
      </AnimatePresence>
    );
  };

  // ── Enroll — uses guided_path_progress directly ──────────────────────────────
  async function enroll(pathId: string) {
    if (enrolling) return;

    const pathToEnroll = allPaths.find(p => p.id === pathId);

    // Intermediate & Advanced paths require Pro
    if (!isPro && pathToEnroll && pathToEnroll.difficulty !== 'beginner') {
      toast('🔒 Intermediate & Advanced paths require Shoonaya Pro. Upgrade to unlock all paths.', {
        duration: 4000,
        style: { background: '#1c1c1a', color: 'var(--brand-ink)' },
      });
      return;
    }

    setEnrolling(pathId);
    playHaptic('medium');
    try {
      const { error } = await supabase
        .from('guided_path_progress')
        .upsert(
          { user_id: userId, path_id: pathId, status: 'active' },
          { onConflict: 'user_id,path_id' }
        );

      if (error) throw error;

      // Refresh active list — scoped to PATHSHALA_PATH_IDS so NityaKarma rows don't bleed in
      const { data } = await supabase
        .from('guided_path_progress')
        .select('path_id, status, completed_at, current_lesson, completed_lessons')
        .eq('user_id', userId)
        .eq('status', 'active')
        .in('path_id', PATHSHALA_PATH_IDS);

      setActive(data ?? []);
      toast.success('Enrolled! Your journey begins. 🙏');
      setTab('learn');
    } catch (err: any) {
      console.error('[Pathshala] enroll failed:', err);
      toast.error(err?.message ?? 'Could not enroll. Please try again.');
    } finally {
      setEnrolling(null);
    }
  }

  // ── Unenroll (leave path) ─────────────────────────────────────────────────────
  async function unenroll(pathId: string, pathTitle: string) {
    if (!confirm(`Leave "${pathTitle}"? Your progress will be saved and you can re-enroll anytime.`)) return;
    playHaptic('medium');
    try {
      const { error } = await supabase
        .from('guided_path_progress')
        .update({ status: 'dismissed' })   // 'paused' is not in CHECK constraint
        .eq('user_id', userId)
        .eq('path_id', pathId);
      if (error) throw error;
      setActive(prev => prev.filter(e => e.path_id !== pathId));
      toast.success('Removed from active paths. You can re-enroll anytime.');
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not unenroll. Please try again.');
    }
  }

  // ── Start Over — resets lesson progress but keeps enrollment active ──────────
  async function startOver(pathId: string, pathTitle: string) {
    if (!confirm(`Start "${pathTitle}" from the beginning? This will reset your lesson progress.`)) return;
    playHaptic('medium');
    try {
      const { error } = await supabase
        .from('guided_path_progress')
        .update({ current_lesson: 0, completed_lessons: [], status: 'active' })
        .eq('user_id', userId)
        .eq('path_id', pathId);
      if (error) throw error;
      setActive(prev => prev.map(e =>
        e.path_id === pathId
          ? { ...e, current_lesson: 0, completed_lessons: [] }
          : e
      ));
      toast.success('Path reset! Starting fresh from Lesson 1. 🙏');
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not reset. Please try again.');
    }
  }

  // ── Tradition-specific seat vocabulary ───────────────────────────────────────
  const TRADITION_SEAT: Record<string, { scriptWord: string; eyebrow: string }> = {
    hindu:    { scriptWord: 'गुरुकुल',   eyebrow: 'Your Seat · Gurukul' },
    sikh:     { scriptWord: 'ਪਾਠਸ਼ਾਲਾ', eyebrow: 'Your Seat · Pathshala' },
    buddhist: { scriptWord: 'धम्म',     eyebrow: 'Your Seat · Dhamma Path' },
    jain:     { scriptWord: 'ज्ञान',    eyebrow: 'Your Seat · Svadhyaya' },
  };
  const seatMeta = TRADITION_SEAT[tradition] ?? { scriptWord: 'गुरुकुल', eyebrow: 'Your Seat · Learning' };

  // ── Your Seat — seamless full-bleed immersive hero ────────────────────────────
  function ContinueLearningHero() {
    if (activePaths.length === 0) return null;
    const enrollment = activePaths[0];
    const path = allPaths.find(p => p.id === enrollment.path_id);
    if (!path) return null;

    const doneLessons = (enrollment.completed_lessons ?? []).length;
    const progressPct = path.total_lessons > 0
      ? Math.round((doneLessons / path.total_lessons) * 100)
      : 0;
    const resumeLesson = enrollment.current_lesson ?? 0;
    const lessonLabel  = resumeLesson > 0 ? `Lesson ${resumeLesson + 1}` : 'Begin';
    const masterySignal = doneLessons > 0
      ? `${doneLessons} ${meta.vocabulary?.shloka ?? 'lesson'}${doneLessons === 1 ? '' : 's'} mastered`
      : `${path.total_lessons} lessons ahead`;

    return (
      <motion.div
        // bleed to full width — no card border, merges with page
        className="relative -mx-4 overflow-hidden mb-1"
        initial={prefersReducedMotion ? undefined : { opacity: 0 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Full-width ambient glow — radiates from centre-top */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${meta.accentColour}28, transparent 72%)`,
        }} />

        {/* Tradition mark — large faint watermark behind content */}
        <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none overflow-hidden">
          <span style={{
            fontFamily: 'var(--font-deva, serif)',
            fontSize: '14rem',
            lineHeight: 1,
            color: meta.accentColour,
            opacity: isDark ? 0.03 : 0.045,
            letterSpacing: '-0.02em',
          }}>
            {meta.heroFallback.mark}
          </span>
        </div>

        {/* Content */}
        <div className="relative z-10 px-6 pt-2 pb-5 text-center">
          {/* Eyebrow */}
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-4"
            style={{ color: meta.accentColour, opacity: 0.7 }}>
            {seatMeta.eyebrow}
          </p>

          {/* Progress ring — centre stage */}
          <div className="flex justify-center mb-4">
            <CircularProgress
              pct={progressPct}
              accent={meta.accentColour}
              size={96}
              strokeWidth={5}
              label={
                <div className="text-center leading-none">
                  <div className="text-[1.35rem] font-bold" style={{ color: meta.accentColour }}>{progressPct}%</div>
                  <div className="text-[7px] mt-0.5 uppercase tracking-wider" style={{ color: tertiaryText }}>done</div>
                </div>
              }
            />
          </div>

          {/* Path title */}
          <h2 className="font-bold text-2xl leading-tight mb-1"
            style={{ fontFamily: 'var(--font-serif)', color: primaryText }}>
            {path.title}
          </h2>
          <p className="text-xs mb-1 mx-auto max-w-[220px]" style={{ color: secondaryText }}>
            {path.description}
          </p>
          <p className="text-[10px] font-semibold mb-5" style={{ color: meta.accentColour, opacity: 0.7 }}>
            {masterySignal} · {path.duration_days}-day journey
          </p>

          {/* Animated progress bar */}
          <div className="h-[3px] rounded-full mx-auto max-w-[200px] mb-5 overflow-hidden"
            style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(to right, ${meta.accentColour}88, ${meta.accentColour})` }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          {/* CTA */}
          <Link
            href={`/pathshala/${enrollment.path_id}/lesson`}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-[#1c1c1a] transition-transform active:scale-[0.97]"
            style={{
              background: `linear-gradient(135deg, ${meta.accentColour}, ${meta.accentColour}cc)`,
              boxShadow: `0 8px 28px ${meta.accentColour}40`,
            }}
          >
            <Play size={14} fill="currentColor" />
            {lessonLabel === 'Begin' ? 'Begin First Lesson' : `Resume · ${lessonLabel}`}
          </Link>
        </div>

        {/* Quick actions strip — floats below, no hard border-top on left/right */}
        <div className="relative z-10 flex mx-4 rounded-[1.4rem] overflow-hidden mb-2"
          style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${glassBorder}` }}>
          <Link
            href={`/pathshala/${enrollment.path_id}/recite`}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all hover:bg-white/4"
            style={{ color: meta.accentColour }}
          >
            <Mic size={12} /> {t('navPathshala')}
          </Link>
          <div className="w-px self-stretch" style={{ background: glassBorder }} />
          <button
            onClick={() => startOver(enrollment.path_id, path.title)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all hover:bg-white/4"
            style={{ color: secondaryText }}
          >
            <Trophy size={12} /> {t('back')}
          </button>
          <div className="w-px self-stretch" style={{ background: glassBorder }} />
          <button
            onClick={() => unenroll(enrollment.path_id, path.title)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all hover:bg-white/4"
            style={{ color: secondaryText }}
          >
            <X size={12} /> {t('skip')}
          </button>
        </div>

        {/* Bottom fade — seamlessly dissolves into page */}
        <div className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none"
          style={{ background: `linear-gradient(to bottom, transparent, ${pageBg.includes('#') ? pageBg.split(',')[0].replace('linear-gradient(180deg,','').trim() : 'transparent'})` }} />
      </motion.div>
    );
  }

  // ── Shloka-of-day placeholder ─────────────────────────────────────────────────
  // (Engine shloka-of-day wired separately; show a motivational prompt for now)
  function DailyVersePrompt() {
    return (
      <Link href="/pathshala?tab=scripture" className="block rounded-[1.8rem] overflow-hidden mb-4 motion-press"
        style={cardStyle}>
        <div className="p-5" style={{ background: `linear-gradient(135deg, ${meta.accentColour}12 0%, transparent 100%)` }}>
          {pulse && (
            <div className="flex items-center gap-2 mb-3 bg-white/5 w-max px-2 py-0.5 rounded-full border border-white/5">
              <span className="text-[10px]">{pulse.emoji}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: meta.accentColour }}>
                {t('todayIs')} {pulse.label}
              </span>
            </div>
          )}
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: tertiaryText }}>
            {meta.sacredTextLabel} · {t('today')}
          </p>
          <p className="font-[family:var(--font-deva)] font-semibold text-base leading-relaxed" style={{ color: primaryText }}>
            {meta.dailyVersePrompt.verse}
          </p>
        </div>
        <div className="p-4" style={{ borderTop: `1px solid ${glassBorder}`, background: isDark ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.38)' }}>
          <p className="text-sm leading-relaxed" style={{ color: secondaryText }}>
            {pulse ? pulse.description : meta.dailyVersePrompt.meaning}
          </p>
          <p className="text-xs mt-2" style={{ color: meta.accentColour }}>
            {t('explore')} {meta.navLibraryLabel} →
          </p>
        </div>
      </Link>
    );
  }

  // ── Active Path Card ──────────────────────────────────────────────────────────
  function ActivePathCard({ enrollment }: { enrollment: ActiveEnrollment }) {
    const path = allPaths.find(p => p.id === enrollment.path_id);
    if (!path) return null;
    const diff        = getDiffStyle(path.difficulty, isDark);
    const doneLessons = (enrollment.completed_lessons ?? []).length;
    const progressPct = path.total_lessons > 0
      ? Math.round((doneLessons / path.total_lessons) * 100)
      : 0;
    const resumeLesson = enrollment.current_lesson ?? 0;
    const lessonLabel  = resumeLesson > 0
      ? `Resume · L${resumeLesson + 1}`
      : 'Start';

    return (
      <motion.div
        className="rounded-[1.45rem] p-4"
        style={cardStyle}
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <CircularProgress
              pct={progressPct}
              accent={meta.accentColour}
              size={52}
              strokeWidth={4}
              label={<span className="text-xl">{TRAD_ICON[path.tradition] ?? '📖'}</span>}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm" style={{ color: primaryText }}>{path.title}</h3>
                  <span className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                    style={{ background: diff.bg, color: diff.text, border: `1px solid ${diff.border}` }}>
                    {diff.label}
                  </span>
                </div>
                <p className="text-xs mt-0.5 truncate" style={{ color: secondaryText }}>{path.description}</p>
              </div>
              {/* Unenroll */}
              <button
                onClick={() => unenroll(enrollment.path_id, path.title)}
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center opacity-40 hover:opacity-80 transition"
                style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.62)', border: `1px solid ${glassBorder}` }}
                title="Leave this path"
              >
                <X size={13} style={{ color: tertiaryText }} />
              </button>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: meta.accentColour }}>{progressPct}%</span>
              <span className="text-xs" style={{ color: secondaryText }}>
                {doneLessons}/{path.total_lessons} lessons · {path.duration_days} days
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Link
            href={`/pathshala/${enrollment.path_id}/lesson`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[#1c1c1a] font-semibold text-sm"
            style={{ background: meta.accentColour }}
          >
            <Play size={14} /> {lessonLabel}
          </Link>
          <Link
            href={`/pathshala/${enrollment.path_id}/recite`}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-sm"
            style={{ color: meta.accentColour, border: `1px solid ${glassBorder}`, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.62)' }}
          >
            <Mic size={14} /> {t('navPathshala')}
          </Link>
        </div>
      </motion.div>
    );
  }
  // ── Browse Path Card ──────────────────────────────────────────
  function BrowsePathCard({ path }: { path: typeof allPaths[0] }) {
    const isEnrolled = activePaths.some(e => e.path_id === path.id);
    const isProGated = !isPro && path.difficulty !== 'beginner';
    const diff       = getDiffStyle(path.difficulty, isDark);
    return (
      <motion.div
        className="rounded-[1.45rem] p-4"
        style={cardStyle}
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: `${meta.accentColour}14` }}>
            {TRAD_ICON[path.tradition] ?? '📖'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm" style={{ color: primaryText }}>{path.title}</h3>
              <span className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                style={{ background: diff.bg, color: diff.text, border: `1px solid ${diff.border}` }}>
                {diff.label}
              </span>
              {isProGated && !isEnrolled && (
                <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 flex items-center gap-0.5"
                  style={{ background: `${meta.accentColour}15`, color: meta.accentColour, border: `1px solid ${meta.accentColour}25` }}>
                  <Lock size={8} /> Pro
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: secondaryText }}>{path.description}</p>
            <p className="text-xs mt-1" style={{ color: tertiaryText }}>
              {path.total_lessons} lessons · {path.duration_days}-day journey
            </p>
          </div>
        </div>
        <button
          disabled={isEnrolled || enrolling !== null}
          onClick={() => enroll(path.id)}
          className={`mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm transition-all border ${isEnrolled ? 'cursor-default' : ''}`}
          style={isEnrolled ? {
            background: isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)',
            color: isDark ? '#4ade80' : '#16a34a',
            border: `1px solid ${isDark ? 'rgba(74,222,128,0.2)' : 'rgba(34,197,94,0.25)'}`,
          } : isProGated ? {
            background: `${meta.accentColour}10`,
            color: meta.accentColour,
            border: `1px solid ${meta.accentColour}20`,
          } : {
            background: `${meta.accentColour}12`,
            color: meta.accentColour,
            border: `1px solid ${glassBorder}`,
          }}
        >
          {enrolling === path.id
            ? <Loader2 size={14} className="animate-spin" />
            : isEnrolled
              ? <><Star size={14} /> {t('enrolled')}</>
              : isProGated
                ? <><Lock size={14} /> Unlock with Pro</>
                : <><Plus size={14} /> Enroll</>
          }
        </button>
      </motion.div>
    );
  }

  // ── Tab definitions ─────────────────────────────────────────
  const TABS = [
    { id: 'learn'     as const, label: 'My Learning',      count: activePaths.length || undefined },
    { id: 'scripture' as const, label: meta.navLibraryLabel, count: undefined },
    { id: 'explore'   as const, label: 'Explore',          count: allPaths.length || undefined },
  ];

  // ─────────────────────────────────────────────
  return (
    <div className="divine-home-shell min-h-screen bg-[var(--divine-bg)] -mx-3 sm:-mx-4 relative selection:bg-[#C5A059]/30">
      <div className="relative pb-24">

        {/* ── Zenith Header Overlay ─────────────────────────────────────────── */}
        <div className="absolute top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 pt-5 pb-3 pointer-events-none">
          <button onClick={() => router.back()}
            className="w-10 h-10 rounded-full glass-panel border border-black/10 dark:border-white/10 flex items-center justify-center pointer-events-auto transition-transform active:scale-90">
            <ChevronLeft size={20} className="text-[var(--divine-text)] dark:text-white" />
          </button>
          
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xl drop-shadow-md">{meta.symbol}</span>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--divine-text)] dark:text-white/70 opacity-70 dark:opacity-100">
              {t('navPathshala')} · {meta.label}
            </p>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {activePaths.length > 0 && (
              <div className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 border border-white/10 bg-white/5 backdrop-blur-md">
                <Trophy size={12} style={{ color: meta.accentColour }} />
                <span className="text-[10px] font-bold" style={{ color: meta.accentColour }}>
                  {activePaths.length}
                </span>
              </div>
            )}
            <Link
              href="/pathshala/insights"
              className="w-10 h-10 rounded-full glass-panel border border-white/10 flex items-center justify-center transition-transform active:scale-90"
            >
              <BarChart2 size={18} style={{ color: meta.accentColour }} />
            </Link>
          </div>
        </div>

        {/* Tab Control Area */}
        <div className="pt-20">
          <div className="px-4 mb-6 relative z-30">
            <div className="flex overflow-x-auto no-scrollbar gap-2 items-center pb-0.5">
              {TABS.map(t => (
                <motion.button
                  key={t.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border shadow-sm flex items-center gap-1.5 ${
                    tab === t.id
                      ? 'border-white/20 text-[#1c1c1a]'
                      : 'bg-white/5 border-white/5 text-[color:var(--brand-muted)] hover:bg-white/8 hover:border-white/10'
                  }`}
                  style={tab === t.id ? { 
                    background: meta.accentColour,
                    boxShadow: `0 4px 12px ${meta.accentColour}33`
                  } : {}}
                >
                  {t.label}
                  {t.count !== undefined && t.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                      tab === t.id ? 'bg-black/10 text-black/60' : 'bg-white/5 text-[color:var(--brand-muted)]'
                    }`}>
                      {t.count}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab content */}
        {loading && tab === 'learn' ? (
          <div className="flex items-center justify-center gap-3 pt-20">
            <Loader2 size={22} className="animate-spin" style={{ color: meta.accentColour }} />
            <span className="text-sm text-[color:var(--brand-muted)]">Loading your gurukul…</span>
          </div>
        ) : (
          <div className="px-4 space-y-3 relative z-20">
            {tab === 'learn' && (
              <>
                {activePaths.length === 0 ? (
                  <>
                    <motion.div
                      className="relative -mx-4 overflow-hidden text-center rounded-b-[3rem] mb-6"
                      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
                      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[#1c1c1a] via-[#2c1a0e] to-[#1c1c1a] opacity-40 dark:opacity-60" />
                      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--divine-bg)] to-transparent z-10" />
                      
                      <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none overflow-hidden opacity-10">
                        <span style={{
                          fontFamily: 'var(--font-deva, serif)',
                          fontSize: '15rem',
                          lineHeight: 1,
                          color: meta.accentColour,
                        }}>
                          {meta.heroFallback.mark}
                        </span>
                      </div>

                      <div className="relative z-20 px-6 pt-8 pb-12">
                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-4 text-[#C5A059]">
                          {meta.symbol} {meta.label} · {meta.navLibraryLabel}
                        </p>
                        <p className="text-[3.2rem] leading-none mb-4 font-medium"
                          style={{ fontFamily: 'var(--font-deva, serif)', color: isDark ? 'white' : 'var(--divine-text)', opacity: 0.9 }}>
                          {seatMeta.scriptWord}
                        </p>
                        <h2 className="font-bold text-2xl mb-2 text-[var(--divine-text)] dark:text-white" style={{ fontFamily: 'var(--font-serif)' }}>
                          Your seat awaits
                        </h2>
                        <p className="text-sm leading-relaxed mb-8 mx-auto max-w-[260px] text-[var(--divine-text)] dark:text-white/70 opacity-70 dark:opacity-100">
                          Begin your study of {meta.pathshalaVocabulary} — one lesson at a time.
                        </p>
                        <button onClick={() => setTab('explore')}
                          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-[#1c1c1a] font-bold text-sm transition-transform active:scale-95"
                          style={{
                            background: `linear-gradient(135deg, ${meta.accentColour}, ${meta.accentColour}cc)`,
                            boxShadow: `0 12px 32px ${meta.accentColour}40`,
                          }}>
                          <GraduationCap size={18} /> Choose a Path
                        </button>
                      </div>
                    </motion.div>
                    <DailyVersePrompt />
                  </>
                ) : (
                  <>
                    <ContinueLearningHero />
                    {activePaths.slice(1).length > 0 && (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] px-1 pt-1" style={{ color: tertiaryText }}>
                          Also enrolled
                        </p>
                        {activePaths.slice(1).map(e => (
                          <ActivePathCard key={e.path_id} enrollment={e} />
                        ))}
                      </>
                    )}
                    <DailyVersePrompt />
                    {!isPro && (
                      <div className="flex items-center gap-3 rounded-[1.45rem] p-4"
                        style={{ ...cardStyle, background: isDark ? `${meta.accentColour}10` : `${meta.accentColour}12` }}>
                        <Lock size={18} style={{ color: meta.accentColour }} className="flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold" style={{ color: primaryText }}>Beginner paths are free</p>
                          <p className="text-[10px] mt-0.5" style={{ color: secondaryText }}>
                            Intermediate &amp; Advanced paths require Pro. Upgrade for all 44 paths, From Memory &amp; Timed recitation, and analytics.
                          </p>
                        </div>
                        <Link href="/profile"
                          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold text-[#1c1c1a]"
                          style={{ background: meta.accentColour }}>
                          <Sparkles size={10} /> Upgrade
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {tab === 'scripture' && (
              <ScriptureTab
                tradition={tradition}
                accentColour={meta.accentColour}
                navLabel={meta.navLibraryLabel}
                isDark={isDark}
                initialSectionId={initialSectionId}
              />
            )}

            {tab === 'explore' && (
              <>
                <div className="flex items-center gap-3 pb-1">
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ fontFamily: 'var(--font-serif)', color: primaryText }}>
                      Sacred Learning Paths
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: secondaryText }}>
                      {allPaths.length} paths across all traditions
                      {!isPro && <span style={{ color: meta.accentColour }}> · Beginner free</span>}
                    </p>
                  </div>
                  {!isPro && (
                    <Link href="/profile"
                      className="text-[10px] font-bold rounded-full px-3 py-1.5 flex items-center gap-1 shrink-0"
                      style={{ background: `${meta.accentColour}15`, color: meta.accentColour, border: `1px solid ${meta.accentColour}20` }}>
                      <Sparkles size={9} /> Unlock All
                    </Link>
                  )}
                </div>
                {allPaths.map(p => <BrowsePathCard key={p.id} path={p} />)}
              </>
            )}
          </div>
        )}

        {(readingEntry || readingChapter) && (
          <ScriptureReader
            entry={readingEntry}
            chapter={readingChapter}
            accentColour={meta.accentColour}
            userId={userId}
            tradition={tradition}
            appLanguage={appLanguage}
            meaningLanguage={meaningLanguage}
            transliterationLanguage={transliterationLanguage}
            showTransliteration={showTransliteration}
            onClose={() => { setReadingEntry(undefined); setReadingChapter(undefined); }}
          />
        )}
      </div>
      <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  );
}
