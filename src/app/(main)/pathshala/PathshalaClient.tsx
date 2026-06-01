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
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, BookOpen, Mic, Trophy,
  Loader2, Play, Star, Plus, Search, X,
  Share2, ChevronDown, ChevronUp, GraduationCap, Lock, Sparkles, BarChart2,
  ChevronRight, Volume2, VolumeX, Bookmark, Copy, EyeOff, CheckCircle2,
  RotateCcw, LogOut, SlidersHorizontal, Check,
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
  getEntriesBySection, getPathshalaSectionDetail,
  type LibraryEntry,
} from '@/lib/library-content';
import { SEED_PATHS as SEED_PATHS_LIB, PATHSHALA_PATH_IDS } from '@/lib/pathshala-paths';
import {
  RAMAYANA_STRUCTURE, BHAGAVATAM_STRUCTURE,
  type EpicStructure, type EpicKanda, type EpicChapter, type EpicVerse
} from '@/lib/epics-registry';
import { calculatePanchang, getTodaySpiritualPulses } from '@/lib/panchang';
import { getTodayShloka, getShlokaByLanguage } from '@/lib/shlokas';
import { getMeaningLabel, resolveEffectiveMeaningLanguage } from '@/lib/language-runtime';
import { useLocalizedMeaning } from '@/hooks/useLocalizedMeaning';
import { getTransliteration } from '@/lib/transliteration';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import CanonicalReader from '@/components/pathshala/CanonicalReader';
import { useReaderDisplayPreferences } from '@/lib/i18n/reader-display';
import { buildReadableCapabilities } from '@/lib/readable-content';
import { useReaderControls } from '@/hooks/useReaderControls';
import PageIntro from '@/components/ui/PageIntro';

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

function getEntryText(entry: LibraryEntry, meaningLabel: string) {
  return [
    `${entry.title} — ${entry.source}`,
    entry.original,
    entry.meaning ? `${meaningLabel}: ${entry.meaning}` : '',
  ].filter(Boolean).join('\n\n');
}

// ── Static seed paths — sourced from shared lib so server components can import too ──
export const SEED_PATHS = SEED_PATHS_LIB as unknown as {
  id: string; title: string; description: string;
  difficulty: string; proRequired: boolean; tradition: string; total_lessons: number; duration_days: number;
}[];

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

// ── Epic Viewer — for massive texts ───────────────────────────────────────────
function EpicViewer({ structure, accentColour }: { structure: EpicStructure; accentColour: string }) {
  const { t, lang } = useLanguage();
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
      toast(t(lang, 'chapterBeingTranscribed'), { icon: '📖', duration: 3000 });
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
        <p className="text-xs text-[color:var(--brand-muted)] leading-relaxed max-w-[85%] mb-3">{selectedKanda.description}</p>
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
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--divine-bg)] border border-white/10 text-xs font-bold transition-all group-hover:border-white/20 group-hover:scale-110 shadow-lg"
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
  const { t } = useLanguage();
  const allowedSections = SECTIONS_BY_TRADITION[tradition] ?? SECTIONS_BY_TRADITION.other;
  const sections        = LIBRARY_SECTIONS.filter(s => allowedSections.includes(s.id));

  const [drillSection, setDrillSection] = useState<string | null>(initialSectionId ?? null);
  const [query,        setQuery]        = useState('');
  const [showSearch,   setSearch]       = useState(false);

  // Theme tokens — use global CSS vars so they auto-adapt to dark/light
  const cardBg     = 'var(--card-bg-soft)';
  const cardBorder = 'var(--card-border)';
  const inkColor   = 'var(--brand-ink)';
  const mutedColor = 'var(--brand-muted)';

  const entries = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!drillSection) {
      if (!q) return [];
      // Global search across all allowed sections for this tradition
      const allTraditionEntries = allowedSections.flatMap(sectionId => getEntriesBySection(sectionId));
      return allTraditionEntries.filter(e => (
        e.title.toLowerCase().includes(q) ||
        e.meaning.toLowerCase().includes(q) ||
        e.source.toLowerCase().includes(q) ||
        e.tags.some(t => t.includes(q))
      ));
    }
    const base = getEntriesBySection(drillSection);
    if (!q) return base;
    return base.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.meaning.toLowerCase().includes(q) ||
      e.source.toLowerCase().includes(q) ||
      e.tags.some(t => t.includes(q))
    );
  }, [drillSection, query, allowedSections]);

  // ── Drill-in view: inside a specific scripture ────────────────────────────────
  if (drillSection) {
    const section = sections.find(s => s.id === drillSection);
    return (
      <div className="space-y-4">
        {/* Back to library */}
        <button
          onClick={() => { setDrillSection(null); setQuery(''); setSearch(false); }}
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition-opacity hover:opacity-70 text-left focus:outline-none"
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
      {/* Global Search box */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--brand-muted)]" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={`Search all ${navLabel} scriptures…`}
          className="w-full pl-9 pr-4 py-3 rounded-2xl border bg-[var(--surface-soft)] text-sm text-[color:var(--brand-ink)] placeholder:text-[color:var(--brand-muted)] focus:outline-none transition-colors"
          style={{ borderColor: 'var(--card-border)' }}
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100">
            <X size={15} />
          </button>
        )}
      </div>

      {query.trim().length > 0 ? (
        <div className="grid gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider px-0.5 mb-1" style={{ color: mutedColor }}>
            Search Results ({entries.length})
          </p>
          {entries.length > 0 ? (
            entries.map(e => <EntryCard key={e.id} entry={e} accentColour={accentColour} />)
          ) : (
            <div className="text-center py-10">
              <p className="text-sm text-[color:var(--brand-muted)]">No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-wider px-0.5" style={{ color: mutedColor }}>
            {sections.length} Scriptures · {navLabel}
          </p>
          <div className="grid gap-3">
            {sections.map((section) => {
              const sectionDetail = getPathshalaSectionDetail(section.id);
              return (
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
                      {sectionDetail && (
                        <span className="text-[10px] font-bold rounded-full px-2.5 py-0.5"
                          style={{ background: 'var(--card-bg-soft)', color: mutedColor }}>
                          {sectionDetail.corpusState}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight size={18} className="shrink-0 mt-1 opacity-20 group-hover:opacity-60 transition-all duration-300 group-hover:translate-x-0.5"
                    style={{ color: accentColour }} />
                </div>
              </motion.button>
              );
            })}
          </div>
        </>
      )}
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
  isPro: boolean;
  shrutiStats?: any;
  communityRank?: number;
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
  isPro,
  shrutiStats,
  communityRank,
}: Props) {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  useEffect(() => {
    if (searchParams.get('upgrade') === '1') setShowUpgradeModal(true);
  }, [searchParams]);
  const supabase  = useRef(createClient()).current;
  const meta      = getTraditionMeta(tradition);
  const prefersReducedMotion = useReducedMotion();
  const { playHaptic } = useZenithSensory();
  const { t } = useLanguage();

  const { coords: _pathCoords } = useLocation();
  const lat = _pathCoords?.lat ?? undefined;
  const lon = _pathCoords?.lon ?? undefined;
  const [activePaths, setActive]    = useState<ActiveEnrollment[]>([]);
  const [loading,     setLoading]   = useState(true);
  const [enrolling,   setEnrolling] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<{ pathId: string; pathTitle: string; reason: string } | null>(null);
  const [isDark,      setIsDark]    = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  // ── Tab State & Layout ───────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'progress' | 'explore'>('progress');
  const [globalQuery, setGlobalQuery] = useState('');
  const [openDrawer, setOpenDrawer] = useState<'scriptures' | 'paths' | 'saved' | null>('scriptures');
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Premium UX state ──────────────────────────────────────────────────────────
  const [displayedVerse, setDisplayedVerse] = useState('');
  const [diffFilter, setDiffFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const scriptureRef = useRef<HTMLDivElement>(null);
  const pathsRef     = useRef<HTMLDivElement>(null);
  
  const pulse = useMemo(() => {
    const p = calculatePanchang(new Date(), lat ?? undefined, lon ?? undefined);
    return getTodaySpiritualPulses(p.tithiIndex, tradition)[0] ?? null;
  }, [tradition, lat, lon]);

  // Show all 44 paths across all traditions in the Explore tab
  const allPaths = SEED_PATHS as unknown as {
    id: string; title: string; description: string;
    difficulty: string; proRequired: boolean; tradition: string; total_lessons: number; duration_days: number;
  }[];

  useEffect(() => {
    const checkTheme = () => setIsDark(document.documentElement.dataset.theme !== 'light');
    checkTheme();
    const obs = new MutationObserver(checkTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  // ── Fetch Saved Verses Count ─────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    async function fetchSavedCount() {
      try {
        const { count, error } = await supabase
          .from('pathshala_user_state')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .not('bookmarked_at', 'is', null);

        if (error) throw error;
        setSavedCount(count ?? 0);
      } catch (err) {
        console.error('Failed to fetch saved verses count:', err);
        setSavedCount(0);
      }
    }
    fetchSavedCount();
  }, [userId, supabase]);

  // ── Use global CSS tokens — automatically handles dark/light theme ──────────
  const primaryText       = 'var(--brand-ink)';
  const secondaryText     = 'var(--brand-muted)';
  const tertiaryText      = 'var(--brand-muted)';
  const glassSurface      = 'var(--card-bg)';
  const glassBorder       = 'var(--card-border)';
  const glassShadow       = 'var(--shadow-soft)';
    
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

  // ── Typewriter verse reveal ───────────────────────────────────────────────────
  const todayShloka = getTodayShloka();
  const verseText = todayShloka.sanskrit;
  useEffect(() => {
    if (prefersReducedMotion) { setDisplayedVerse(verseText); return; }
    setDisplayedVerse('');
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayedVerse(verseText.slice(0, i));
      if (i >= verseText.length) clearInterval(timer);
    }, 38);
    return () => clearInterval(timer);
  }, [verseText, prefersReducedMotion]);

  // ── Scroll to section on deep-link ───────────────────────────────────────────
  useEffect(() => {
    if (initialTab === 'scripture') {
      setActiveTab('explore');
      setOpenDrawer('scriptures');
    }
    if (initialTab === 'explore') {
      setActiveTab('explore');
      setOpenDrawer('paths');
    }
  }, [initialTab]);

  const cardStyle = {
    background: glassSurface,
    border: `1px solid ${glassBorder}`,
    boxShadow: glassShadow,
  };

  // ── Load active enrollments from guided_path_progress ───────────────────────
  useEffect(() => {
    async function loadEnrollments() {
      try {
        const { data, error } = await supabase
          .from('guided_path_progress')
          .select('path_id, status, completed_at, current_lesson, completed_lessons')
          .eq('user_id', userId)
          .eq('status', 'active')
          .in('path_id', PATHSHALA_PATH_IDS);

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

  // ── Fetch Recommendation ───────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || recommendation) return;
    
    // Fetch recommendation silently
    fetch('/api/pathshala/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        tradition,
        language: appLanguage ?? 'en'
      })
    })
      .then(r => {
        if (!r.ok) throw new Error('Network response was not ok');
        return r.json();
      })
      .then(data => {
        if (data && data.pathId && data.reason) {
          setRecommendation({
            pathId: data.pathId,
            pathTitle: data.pathTitle || 'Today\'s Path',
            reason: data.reason
          });
        }
      })
      .catch(e => {
        console.error('Failed to fetch pathshala recommendation:', e);
      });
  }, [userId, tradition, appLanguage, recommendation]);

  // ── Render Reader Modal ──
  const ReaderModal = () => {
    if (!readingEntry && !readingChapter) return null;
    
    const verses = readingEntry
      ? [{ ...readingEntry }]
      : readingChapter?.verses?.map(v => ({
          id: `${readingChapter.id}-v${v.verseNumber}`,
          title: readingChapter.title,
          source: `${readingChapter.kandaTitle} · Chapter ${readingChapter.chapterNumber}`,
          original: v.original,
          transliteration: v.transliteration,
          meaning: v.meaning,
          fullText: '',
          category: 'scripture' as LibraryEntry['category'],
          tradition: tradition as LibraryEntry['tradition'],
          tags: [] as string[],
        })) || [];
        
    return (
      <AnimatePresence>
        {(readingEntry || readingChapter) && (
          <CanonicalReader
            entries={verses}
            title={readingEntry?.title || readingChapter?.title || ''}
            subtitle={readingEntry?.source || readingChapter?.kandaTitle || ''}
            userId={userId}
            tradition={tradition}
            appLanguage={appLanguage}
            meaningLanguage={meaningLanguage}
            transliterationLanguage={transliterationLanguage}
            showTransliteration={showTransliteration}
            isModal={true}
            onClose={() => { setReadingEntry(undefined); setReadingChapter(undefined); }}
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
    if (!isPro && pathToEnroll && pathToEnroll.proRequired) {
      toast(t('upgradeToShoonayaPro'), {
        duration: 4000,
        style: { background: 'var(--divine-bg)', color: 'var(--brand-ink)' },
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
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
      toast.success('Enrollment successful!');
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('[Pathshala] enroll failed:', err);
      toast.error(err?.message ?? 'Failed to enroll');
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
        .update({ status: 'dismissed' })
        .eq('user_id', userId)
        .eq('path_id', pathId);
      if (error) throw error;
      setActive(prev => prev.filter(e => e.path_id !== pathId));
      toast.success('Path removed');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to leave path');
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
      toast.success('Progress reset');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to reset progress');
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

  // ── Today's Lesson Card & Streak Widget ───────────────────────────────
  function ContinueLearningHero() {
    const streakDays = [true, true, true, false, true, true, 'pending'];

    if (activePaths.length === 0) return null;
    const enrollment = activePaths[0];
    const path = allPaths.find(p => p.id === enrollment.path_id);
    if (!path) return null;

    const doneLessons = (enrollment.completed_lessons ?? []).length;
    const progressPct = path.total_lessons > 0
      ? Math.round((doneLessons / path.total_lessons) * 100)
      : 0;
    const resumeLesson = enrollment.current_lesson ?? 0;
    const lessonLabel  = resumeLesson > 0 ? `Continue · Lesson ${resumeLesson + 1}` : 'Begin Path';

    return (
      <div className="mb-4">
        {/* Today's Lesson Card */}
        <motion.div
          className="clay-card rounded-2xl relative overflow-hidden mb-4"
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ borderLeft: '4px solid var(--brand-primary)', ...cardStyle }}
        >
          <div className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-2"
              style={{ color: 'var(--brand-primary)' }}>
              Today&apos;s Lesson
            </p>
            <h2 className="premium-serif text-2xl font-bold mb-1" style={{ color: primaryText }}>
              {path.title}
            </h2>
            <p className="text-sm" style={{ color: secondaryText }}>
              Lesson {resumeLesson + 1} of {path.total_lessons}
            </p>
            {recommendation?.pathId === enrollment.path_id && recommendation.reason && (
              <p className="text-[11px] italic mt-1 mb-4" style={{ color: meta.accentColour, opacity: 0.8 }}>
                ✦ {recommendation.reason}
              </p>
            )}
            {!(recommendation?.pathId === enrollment.path_id && recommendation?.reason) && (
              <div className="mb-4" />
            )}

            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span style={{ color: 'var(--brand-primary)' }}>{progressPct}% Complete</span>
                <span style={{ color: tertiaryText }}>{doneLessons}/{path.total_lessons}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-soft)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'var(--brand-primary)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.9, delay: 0.25 }}
                />
              </div>
            </div>

            <Link
              href={`/pathshala/${enrollment.path_id}/lesson`}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-[var(--divine-bg)] transition-transform active:scale-[0.97]"
              style={{ background: 'var(--brand-primary)' }}
            >
              <Play size={16} fill="currentColor" />
              {lessonLabel}
            </Link>
          </div>
        </motion.div>

        {/* Streak Widget */}
        <motion.div
          className="clay-card rounded-2xl p-4 flex flex-col items-center"
          style={cardStyle}
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--brand-primary)' }}>
            7-Day Learning Streak
          </h3>
          <div className="flex items-center gap-2">
            {streakDays.map((status, i) => {
              if (status === true) {
                return (
                  <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--brand-primary)' }}>
                    <CheckCircle2 size={16} color="var(--divine-bg)" />
                  </div>
                );
              } else if (status === 'pending') {
                return (
                  <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-dashed"
                    style={{ borderColor: 'var(--brand-primary)' }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: 'var(--brand-primary)' }} />
                  </div>
                );
              } else {
                return (
                  <div key={i} className="w-8 h-8 rounded-full border border-gray-500/30 flex items-center justify-center bg-black/10 dark:bg-white/5" />
                );
              }
            })}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Aaj ka Shloka — expandable in place ──────────────────────────────────────
  function DailyVersePrompt() {
    const [expanded, setExpanded] = useState(false);
    const shlokaMeaning = getShlokaByLanguage(todayShloka, appLanguage ?? 'en');
    return (
      <div className="rounded-[1.8rem] overflow-hidden mb-4" style={cardStyle}>
        <button
          className="w-full text-left p-5 transition-colors active:opacity-80 focus:outline-none"
          style={{ background: `linear-gradient(135deg, ${meta.accentColour}12 0%, transparent 100%)` }}
          onClick={() => setExpanded(v => !v)}
        >
          {pulse && (
            <div className="flex items-center gap-2 mb-3 bg-white/5 w-max px-2 py-0.5 rounded-full border border-white/5">
              <span className="text-[10px]">{pulse.emoji}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: meta.accentColour }}>
                {t('todayIs')} {pulse.label}
              </span>
            </div>
          )}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: tertiaryText }}>
                {todayShloka.source} · {t('today')}
              </p>
              <p className="font-[family:var(--font-deva)] font-semibold text-base leading-relaxed" style={{ color: primaryText }}>
                {todayShloka.sanskrit}
              </p>
            </div>
            <motion.span
              animate={prefersReducedMotion ? {} : { rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex-shrink-0 mt-1 text-[var(--brand-muted)]"
            >
              <ChevronDown size={16} />
            </motion.span>
          </div>
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="shloka-meaning"
              initial={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div className="p-4" style={{ borderTop: `1px solid ${glassBorder}`, background: 'var(--card-bg-soft)' }}>
                <p className="text-sm leading-relaxed mb-3" style={{ color: secondaryText }}>
                  {pulse ? pulse.description : shlokaMeaning}
                </p>
                <button
                  onClick={() => { setActiveTab('explore'); setOpenDrawer('scriptures'); }}
                  className="text-xs font-semibold bg-transparent border-0 p-0 hover:underline cursor-pointer"
                  style={{ color: meta.accentColour }}
                >
                  {t('explore')} {meta.navLibraryLabel} &rarr;
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
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
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center opacity-40 hover:opacity-80 transition focus:outline-none"
                style={{ background: 'var(--card-bg-soft)', border: `1px solid ${glassBorder}` }}
                title="Leave this Path"
              >
                <X size={13} style={{ color: tertiaryText }} />
              </button>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: meta.accentColour }}>{progressPct}%</span>
              <span className="text-xs" style={{ color: secondaryText }}>
                {doneLessons}/{path.total_lessons} Lessons · {path.duration_days} Days
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Link
            href={`/pathshala/${enrollment.path_id}/lesson`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[var(--divine-bg)] font-semibold text-sm"
            style={{ background: meta.accentColour }}
          >
            <Play size={14} /> {lessonLabel}
          </Link>
          <Link
            href={`/pathshala/${enrollment.path_id}/recite`}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-sm"
            style={{ color: meta.accentColour, border: `1px solid ${glassBorder}`, background: 'var(--card-bg-soft)' }}
          >
            <Mic size={14} /> {t('navPathshala')}
          </Link>
        </div>
      </motion.div>
    );
  }

  // ── Starter Path Card (Empty enrolled state) ───────────────────────────────
  function StarterPathCard({ path }: { path: typeof allPaths[0] }) {
    const diff = getDiffStyle(path.difficulty, isDark);
    return (
      <motion.div
        className="rounded-[1.45rem] p-4"
        style={cardStyle}
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <CircularProgress
              pct={0}
              accent={meta.accentColour}
              size={44}
              strokeWidth={3}
              label={<span className="text-lg">{TRAD_ICON[path.tradition] ?? '📖'}</span>}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-xs animate-none" style={{ color: primaryText }}>{path.title}</h3>
                  <span className="text-[9px] font-semibold rounded-full px-1.5 py-0.5"
                    style={{ background: diff.bg, color: diff.text, border: `1px solid ${diff.border}` }}>
                    {diff.label}
                  </span>
                </div>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: secondaryText }}>{path.description}</p>
              </div>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="text-[10px]" style={{ color: secondaryText }}>
                {path.total_lessons} Lessons · {path.duration_days} Days
              </span>
              <button
                disabled={enrolling !== null}
                onClick={() => enroll(path.id)}
                className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl font-bold text-[10px] text-[var(--divine-bg)] transition-transform active:scale-[0.97]"
                style={{ background: meta.accentColour }}
              >
                {enrolling === path.id ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <>
                    <Plus size={10} /> Enroll
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Browse Path Card ──────────────────────────────────────────
  function BrowsePathCard({ path }: { path: typeof allPaths[0] }) {
    const enrollment = activePaths.find(e => e.path_id === path.id);
    const isEnrolled = !!enrollment;
    const isProGated = !isPro && path.proRequired;
    const diff       = getDiffStyle(path.difficulty, isDark);
    const doneLessons = (enrollment?.completed_lessons ?? []).length;
    const progressPct = path.total_lessons > 0 ? Math.round((doneLessons / path.total_lessons) * 100) : 0;

    return (
      <motion.div
        className="clay-card rounded-[1.45rem] p-4 relative animate-none"
        style={cardStyle}
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        {isProGated && !isEnrolled && (
          <div className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest text-white px-2 py-1 rounded-full shadow-md z-10 flex items-center gap-1"
            style={{ background: 'linear-gradient(135deg,#c5a059,#a07830)' }}>
            <Lock size={8} /> Pro
          </div>
        )}
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            {isEnrolled ? (
              <CircularProgress
                pct={progressPct}
                accent={meta.accentColour}
                size={40}
                strokeWidth={3}
                label={<span className="text-lg">{TRAD_ICON[path.tradition] ?? '📖'}</span>}
              />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: `${meta.accentColour}14` }}>
                {TRAD_ICON[path.tradition] ?? '📖'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-sm" style={{ color: primaryText }}>{path.title}</h3>
              {isEnrolled ? (
                <span className="text-[10px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5"
                  style={{ background: 'var(--brand-primary)', color: 'var(--divine-bg)' }}>
                  Enrolled
                </span>
              ) : (
                <span className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                  style={{ background: diff.bg, color: diff.text, border: `1px solid ${diff.border}` }}>
                  {diff.label}
                </span>
              )}
            </div>
            <p className="text-xs line-clamp-2" style={{ color: secondaryText }}>{path.description}</p>
            {isEnrolled ? (
              <p className="text-[11px] mt-1.5 font-medium" style={{ color: meta.accentColour }}>
                {doneLessons} of {path.total_lessons} lessons done
              </p>
            ) : (
              <p className="text-xs mt-1" style={{ color: tertiaryText }}>
                {path.total_lessons} Lessons · {path.duration_days}-Day Journey
              </p>
            )}
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
              ? <><Star size={14} /> Enrolled</>
              : isProGated
                ? <><Lock size={14} /> Unlock with Pro</>
                : <><Plus size={14} /> Enroll</>
          }
        </button>
      </motion.div>
    );
  }

  // ── Accordion Drawer Component ──────────────────────────────────────────────
  const AccordionDrawer = ({
    id,
    label,
    count,
    children,
  }: {
    id: 'scriptures' | 'paths' | 'saved';
    label: string;
    count: string | number;
    children: React.ReactNode;
  }) => {
    const isOpen = openDrawer === id;
    const toggle = () => {
      setOpenDrawer(isOpen ? null : id);
      playHaptic('light');
    };

    return (
      <div className="mx-4 mb-4 rounded-2xl border border-[var(--card-border)] overflow-hidden bg-[var(--surface-base)]">
        <button
          onClick={toggle}
          className={`w-full p-4 flex justify-between items-center bg-[var(--card-bg)] focus:outline-none transition-all ${
            isOpen ? 'rounded-t-2xl border-b border-[var(--card-border)]' : 'rounded-2xl'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-bold uppercase tracking-widest text-left"
              style={{ color: meta.accentColour }}
            >
              {label}
            </span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${meta.accentColour}14`, color: meta.accentColour }}
            >
              {count}
            </span>
          </div>
          <motion.div
            animate={prefersReducedMotion ? {} : { rotate: isOpen ? 180 : 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.22 }}
          >
            <ChevronDown size={16} className="text-[color:var(--brand-muted)]" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div className="p-4 rounded-b-2xl bg-[var(--surface-base)]">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // ── Stagger variants ─────────────────────────────────────────
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 22 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
  };

  // ── Difficulty filter ─────────────────────────────────────────
  const filteredPaths = diffFilter === 'all'
    ? allPaths
    : allPaths.filter(p => p.difficulty === diffFilter);

  // ── Calculate total scriptures across allowed tradition sections ──────────────
  const totalScripturesCount = useMemo(() => {
    const allowed = SECTIONS_BY_TRADITION[tradition] ?? SECTIONS_BY_TRADITION.other;
    return allowed.reduce((sum, sectionId) => sum + getEntriesBySection(sectionId).length, 0);
  }, [tradition]);

  // ── Compute Level Progression details ─────────────────────────────────────────
  const completedIds = useMemo(() => {
    return activePaths
      .filter(e => {
        const p = allPaths.find(p => p.id === e.path_id);
        return p && (e.completed_lessons ?? []).length >= p.total_lessons;
      })
      .map(e => e.path_id);
  }, [activePaths, allPaths]);

  const hasCompletedBeginner     = allPaths.some(p => p.difficulty === 'beginner' && completedIds.includes(p.id));
  const hasCompletedIntermediate = allPaths.some(p => p.difficulty === 'intermediate' && completedIds.includes(p.id));
  const currentLevel =
    activePaths.some(e => allPaths.find(p => p.id === e.path_id)?.difficulty === 'advanced')
      ? 'advanced'
    : activePaths.some(e => allPaths.find(p => p.id === e.path_id)?.difficulty === 'intermediate')
      ? 'intermediate'
      : 'beginner';

  // ── Global Search Filter ──────────────────────────────────────────────────────
  const searchPathsResult = useMemo(() => {
    const q = globalQuery.toLowerCase().trim();
    if (q.length < 2) return [];
    return allPaths.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }, [globalQuery, allPaths]);

  const searchScripturesResult = useMemo(() => {
    const q = globalQuery.toLowerCase().trim();
    if (q.length < 2) return [];
    const allowed = SECTIONS_BY_TRADITION[tradition] ?? SECTIONS_BY_TRADITION.other;
    const allTraditionEntries = allowed.flatMap(sectionId => getEntriesBySection(sectionId));
    return allTraditionEntries.filter(e =>
      e.original.toLowerCase().includes(q) ||
      e.meaning.toLowerCase().includes(q)
    );
  }, [globalQuery, tradition]);

  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--surface-base)] -mx-3 sm:-mx-4 relative overflow-x-hidden selection:bg-[#C5A059]/30">
      <PageIntro
        pageKey="pathshala"
        steps={[
          { emoji: '📖', title: 'Pathshala', body: 'Study sacred scripture at your own pace. Progress is tracked daily.' },
          { emoji: '📈', title: 'Reading progress', body: "Spend at least a few minutes reading to mark today's Pathshala complete." },
        ]}
      />

      {/* ── Ambient breathing glow — fixed behind everything ──────────────────── */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        animate={prefersReducedMotion ? {} : { opacity: [0.35, 0.6, 0.35] }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: `radial-gradient(ellipse 70% 45% at 50% 0%, ${meta.accentColour}1e, transparent 65%)` }}
      />

      <div className="relative z-10 pb-28">

        {/* ── Sticky Header ───────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-40 flex items-center gap-3 px-4 pt-5 pb-3 backdrop-blur-xl"
          style={{ background: 'var(--surface-base)', borderBottom: `1px solid var(--card-border)`, opacity: 0.97 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center border focus:outline-none"
            style={{ background: 'var(--card-bg-soft)', borderColor: 'var(--card-border)' }}
          >
            <ChevronLeft size={18} style={{ color: 'var(--brand-ink)' }} />
          </motion.button>

          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-lg">{meta.symbol}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-bold leading-none" style={{ color: 'var(--brand-ink)', fontFamily: 'var(--font-serif)' }}>
                  Pathshala
                </p>
                {communityRank !== undefined && communityRank <= 500 && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{ background: 'var(--brand-primary)', color: 'var(--divine-bg)' }}>
                    You rank #{communityRank} in your community
                  </span>
                )}
              </div>
              <p className="text-[10px] uppercase tracking-[0.18em] mt-0.5 truncate" style={{ color: meta.accentColour }}>
                {meta.label} · Sacred Learning
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activePaths.length > 0 && (
              <div className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 border"
                style={{ background: `${meta.accentColour}14`, borderColor: `${meta.accentColour}28` }}>
                <Trophy size={11} style={{ color: meta.accentColour }} />
                <span className="text-[10px] font-bold" style={{ color: meta.accentColour }}>
                  {activePaths.length}
                </span>
              </div>
            )}
            <motion.div whileTap={{ scale: 0.9 }}>
              <Link href="/pathshala/saved"
                className="w-9 h-9 rounded-full flex items-center justify-center border"
                style={{ background: 'var(--card-bg-soft)', borderColor: 'var(--card-border)' }}>
                <Bookmark size={15} style={{ color: meta.accentColour }} />
              </Link>
            </motion.div>
            <motion.div whileTap={{ scale: 0.9 }}>
              <Link href="/pathshala/insights"
                className="w-9 h-9 rounded-full flex items-center justify-center border"
                style={{ background: 'var(--card-bg-soft)', borderColor: 'var(--card-border)' }}>
                <BarChart2 size={16} style={{ color: meta.accentColour }} />
              </Link>
            </motion.div>
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Pill Tabs Toggle */}
          <div className="px-4 mb-4 mt-2">
            <div className="flex p-1 rounded-2xl bg-[var(--surface-soft)] gap-1">
              <button
                onClick={() => { setActiveTab('progress'); playHaptic('light'); }}
                className="flex-1 relative py-2 rounded-xl text-xs font-bold transition-all focus:outline-none"
                style={{
                  color: activeTab === 'progress' ? meta.accentColour : 'var(--text-dim)',
                }}
              >
                {activeTab === 'progress' && !prefersReducedMotion && (
                  <motion.div
                    layoutId="pathshala-tab-pill"
                    className="absolute inset-0 rounded-xl shadow-sm bg-[var(--card-bg)]"
                    transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30 }}
                    style={{ zIndex: 0 }}
                  />
                )}
                {activeTab === 'progress' && prefersReducedMotion && (
                  <div
                    className="absolute inset-0 rounded-xl shadow-sm bg-[var(--card-bg)]"
                    style={{ zIndex: 0 }}
                  />
                )}
                <span className="relative z-10">My Progress</span>
              </button>
              <button
                onClick={() => { setActiveTab('explore'); playHaptic('light'); }}
                className="flex-1 relative py-2 rounded-xl text-xs font-bold transition-all focus:outline-none"
                style={{
                  color: activeTab === 'explore' ? meta.accentColour : 'var(--text-dim)',
                }}
              >
                {activeTab === 'explore' && !prefersReducedMotion && (
                  <motion.div
                    layoutId="pathshala-tab-pill"
                    className="absolute inset-0 rounded-xl shadow-sm bg-[var(--card-bg)]"
                    transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30 }}
                    style={{ zIndex: 0 }}
                  />
                )}
                {activeTab === 'explore' && prefersReducedMotion && (
                  <div
                    className="absolute inset-0 rounded-xl shadow-sm bg-[var(--card-bg)]"
                    style={{ zIndex: 0 }}
                  />
                )}
                <span className="relative z-10">Explore</span>
              </button>
            </div>
          </div>

          {activeTab === 'progress' ? (
            <div className="space-y-6">
              {/* DailyVersePrompt */}
              <div className="px-4">
                <DailyVersePrompt />
              </div>

              {/* Section 1: Today's Verse — premium immersive hero */}
              <motion.section variants={itemVariants} className="relative px-4 pt-8 pb-6 overflow-hidden">
                {/* Tradition watermark */}
                <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none overflow-hidden">
                  <span style={{
                    fontFamily: 'var(--font-deva, serif)',
                    fontSize: '16rem',
                    lineHeight: 1,
                    color: meta.accentColour,
                    opacity: isDark ? 0.032 : 0.045,
                  }}>
                    {meta.heroFallback.mark}
                  </span>
                </div>

                <div className="relative z-10">
                  {/* Eyebrow + spiritual pulse */}
                  <div className="flex items-center gap-2 mb-5">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border"
                      style={{ background: `${meta.accentColour}14`, borderColor: `${meta.accentColour}28` }}>
                      <span className="text-[10px]">{meta.sacredTextIcon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: meta.accentColour }}>
                        {meta.sacredTextLabel} · Today
                      </span>
                    </div>
                    {pulse && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full border"
                        style={{ background: 'var(--card-bg-soft)', borderColor: 'var(--card-border)' }}>
                        <span className="text-[10px]">{pulse.emoji}</span>
                        <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--brand-muted)' }}>
                          {pulse.label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sanskrit verse — typewriter */}
                  <p className="font-[family:var(--font-deva)] text-[1.55rem] leading-relaxed mb-3 min-h-[3.5rem]"
                    style={{ color: 'var(--brand-ink)', letterSpacing: '0.01em' }}>
                    {displayedVerse}
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.9, repeat: displayedVerse.length < verseText.length ? Infinity : 0 }}
                      className="inline-block w-[2px] h-[1.4rem] ml-1 align-middle rounded-full"
                      style={{ background: meta.accentColour, opacity: displayedVerse.length < verseText.length ? 1 : 0 }}
                    />
                  </p>

                  {/* Meaning */}
                  <div className="rounded-2xl p-4 mb-5 border"
                    style={{ background: `${meta.accentColour}0a`, borderColor: `${meta.accentColour}20` }}>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                      {pulse ? pulse.description : getShlokaByLanguage(todayShloka, appLanguage ?? 'en')}
                    </p>
                  </div>

                  {/* CTA row */}
                  <div className="flex flex-wrap items-center gap-3">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => { setActiveTab('explore'); setOpenDrawer('scriptures'); }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-[12px] text-[var(--divine-bg)] focus:outline-none"
                      style={{ background: `linear-gradient(135deg, ${meta.accentColour}, ${meta.accentColour}cc)`, boxShadow: `0 6px 20px ${meta.accentColour}35` }}
                    >
                      <BookOpen size={13} /> Explore {meta.navLibraryLabel}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => { setActiveTab('explore'); setOpenDrawer('paths'); }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-[12px] border focus:outline-none"
                      style={{ background: 'var(--card-bg-soft)', borderColor: 'var(--card-border)', color: 'var(--brand-muted)' }}
                    >
                      <GraduationCap size={13} /> Paths
                    </motion.button>
                    
                    {shrutiStats && shrutiStats.scored_count >= 3 && communityRank !== undefined && (
                      <Link
                        href="/pathshala/insights"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-[10px] font-bold text-amber-600 dark:text-amber-400 transition-all hover:bg-amber-500/15"
                      >
                        <Mic size={10} /> Your Shruti: {shrutiStats.avg_overall_score}/100 · #{communityRank} community
                      </Link>
                    )}
                  </div>
                </div>
              </motion.section>

              {/* Section 2: Your Gurukul / Starters */}
              {loading ? (
                <motion.div variants={itemVariants} className="flex items-center justify-center gap-3 py-8">
                  <Loader2 size={20} className="animate-spin" style={{ color: meta.accentColour }} />
                  <span className="text-sm" style={{ color: 'var(--brand-muted)' }}>Loading Gurukul...</span>
                </motion.div>
              ) : activePaths.length > 0 ? (
                <motion.section variants={itemVariants} className="px-4 mb-6">
                  {/* Section header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 rounded-full" style={{ background: meta.accentColour }} />
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: meta.accentColour }}>
                      {seatMeta.eyebrow}
                    </span>
                  </div>
                  <ContinueLearningHero />
                  {activePaths.slice(1).length > 0 && (
                    <div className="mt-3 space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] px-1" style={{ color: 'var(--brand-muted)' }}>
                        Also enrolled in
                      </p>
                      {activePaths.slice(1).map(e => (
                        <ActivePathCard key={e.path_id} enrollment={e} />
                      ))}
                    </div>
                  )}
                  {!isPro && (
                    <div className="flex items-center gap-3 rounded-[1.45rem] p-4 mt-3 border"
                      style={{ background: `${meta.accentColour}0c`, borderColor: `${meta.accentColour}22` }}>
                      <Lock size={16} style={{ color: meta.accentColour }} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold" style={{ color: 'var(--brand-ink)' }}>Free Beginner Paths</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand-muted)' }}>
                          Intermediate & Advanced paths require Shoonaya Pro
                        </p>
                      </div>
                      <Link href="/profile"
                        className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold text-[var(--divine-bg)]"
                        style={{ background: meta.accentColour }}>
                        <Sparkles size={9} /> Pro
                      </Link>
                    </div>
                  )}
                </motion.section>
              ) : (
                /* Empty enrolled state: 3 beginner cards + see all paths trigger */
                <motion.section variants={itemVariants} className="px-4 mb-6">
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-[color:var(--text-dim)]">
                    Begin your journey
                  </p>
                  <div className="space-y-3">
                    {allPaths.filter(p => p.difficulty === 'beginner').slice(0, 3).map(p => (
                      <StarterPathCard key={p.id} path={p} />
                    ))}
                  </div>
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={() => { setActiveTab('explore'); playHaptic('light'); }}
                      className="text-[11px] font-bold text-[color:var(--text-dim)] hover:underline focus:outline-none bg-transparent border-0"
                    >
                      See all paths &rarr;
                    </button>
                  </div>
                </motion.section>
              )}

              {/* Difficulty Progression Strip */}
              <div className="px-4">
                <div className="mt-4 mb-6 bg-[var(--surface-soft)] rounded-2xl p-5 border border-[var(--card-border)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-4 text-center" style={{ color: 'var(--brand-primary)' }}>
                    Your Path Progression
                  </p>
                  <div className="flex items-center justify-between relative px-2">
                    {/* Step 1: Beginner */}
                    <div className="flex flex-col items-center z-10">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border"
                        style={{
                          background: hasCompletedBeginner ? meta.accentColour : 'transparent',
                          borderColor: (hasCompletedBeginner || currentLevel === 'beginner') ? meta.accentColour : 'var(--card-border)',
                        }}
                      >
                        {hasCompletedBeginner ? (
                          <Check size={12} className="text-[var(--divine-bg)]" />
                        ) : currentLevel === 'beginner' ? (
                          prefersReducedMotion ? (
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: meta.accentColour }} />
                          ) : (
                            <motion.div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ background: meta.accentColour }}
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                            />
                          )
                        ) : (
                          <span className="text-[9px] font-bold text-[color:var(--text-dim)]">1</span>
                        )}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider mt-1.5 font-bold text-[color:var(--text-dim)]">
                        Beginner
                      </span>
                    </div>

                    {/* Line 1 -> 2 */}
                    <div
                      className="h-[1.5px] flex-1 mx-2"
                      style={{
                        background: hasCompletedBeginner ? meta.accentColour : 'var(--card-border)',
                      }}
                    />

                    {/* Step 2: Intermediate */}
                    <div className="flex flex-col items-center z-10">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border"
                        style={{
                          background: hasCompletedIntermediate ? meta.accentColour : 'transparent',
                          borderColor: (hasCompletedIntermediate || currentLevel === 'intermediate') ? meta.accentColour : 'var(--card-border)',
                        }}
                      >
                        {hasCompletedIntermediate ? (
                          <Check size={12} className="text-[var(--divine-bg)]" />
                        ) : currentLevel === 'intermediate' ? (
                          prefersReducedMotion ? (
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: meta.accentColour }} />
                          ) : (
                            <motion.div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ background: meta.accentColour }}
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                            />
                          )
                        ) : !hasCompletedBeginner ? (
                          <Lock size={10} className="text-[color:var(--text-dim)]" />
                        ) : (
                          <span className="text-[9px] font-bold text-[color:var(--text-dim)]">2</span>
                        )}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider mt-1.5 font-bold text-[color:var(--text-dim)]">
                        Intermediate
                      </span>
                    </div>

                    {/* Line 2 -> 3 */}
                    <div
                      className="h-[1.5px] flex-1 mx-2"
                      style={{
                        background: hasCompletedIntermediate ? meta.accentColour : 'var(--card-border)',
                      }}
                    />

                    {/* Step 3: Advanced */}
                    <div className="flex flex-col items-center z-10">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border"
                        style={{
                          background: false ? meta.accentColour : 'transparent',
                          borderColor: currentLevel === 'advanced' ? meta.accentColour : 'var(--card-border)',
                        }}
                      >
                        {currentLevel === 'advanced' ? (
                          prefersReducedMotion ? (
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: meta.accentColour }} />
                          ) : (
                            <motion.div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ background: meta.accentColour }}
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                            />
                          )
                        ) : !hasCompletedIntermediate ? (
                          <Lock size={10} className="text-[color:var(--text-dim)]" />
                        ) : (
                          <span className="text-[9px] font-bold text-[color:var(--text-dim)]">3</span>
                        )}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider mt-1.5 font-bold text-[color:var(--text-dim)]">
                        Advanced
                      </span>
                    </div>
                  </div>

                  {/* Context Line */}
                  <p className="text-[10px] text-[color:var(--text-dim)] italic text-center mt-4">
                    {hasCompletedIntermediate
                      ? 'Advanced paths unlocked'
                      : hasCompletedBeginner
                      ? 'Complete an Intermediate path to unlock Advanced'
                      : 'Complete a Beginner path to advance'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Tab B: Explore */
            <div className="space-y-4">
              {/* Global search bar */}
              <div className="px-4 mb-4">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--brand-muted)]"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={globalQuery}
                    onChange={e => setGlobalQuery(e.target.value)}
                    placeholder="Search paths and scriptures&hellip;"
                    className="w-full pl-11 pr-10 py-3 rounded-2xl border bg-[var(--surface-soft)] text-sm text-[color:var(--brand-ink)] placeholder:text-[color:var(--brand-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-all"
                    style={{ borderColor: 'var(--card-border)' }}
                  />
                  {globalQuery && (
                    <button
                      onClick={() => {
                        setGlobalQuery('');
                        searchInputRef.current?.blur();
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity focus:outline-none"
                    >
                      <X size={16} className="text-[color:var(--brand-ink)]" />
                    </button>
                  )}
                </div>
              </div>

              {globalQuery.trim().length >= 2 ? (
                /* Unified search results list */
                <div className="px-4 space-y-6">
                  {/* Section A: Paths */}
                  {searchPathsResult.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[9px] uppercase tracking-wider font-bold text-[color:var(--text-dim)]">
                        Paths
                      </p>
                      <div className="grid gap-3">
                        {searchPathsResult.map(p => (
                          <BrowsePathCard key={p.id} path={p} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section B: Scriptures */}
                  {searchScripturesResult.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[9px] uppercase tracking-wider font-bold text-[color:var(--text-dim)]">
                        Scriptures
                      </p>
                      <div className="grid gap-3">
                        {searchScripturesResult.map(e => (
                          <EntryCard key={e.id} entry={e} accentColour={meta.accentColour} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty search results */}
                  {searchPathsResult.length === 0 && searchScripturesResult.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-[13px] text-[color:var(--text-dim)]">
                        Nothing found for &apos;{globalQuery}&apos;
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* 3 accordion drawers */
                <div className="space-y-4">
                  {/* Drawer 1: Scriptures */}
                  <AccordionDrawer id="scriptures" label={meta.navLibraryLabel} count={totalScripturesCount}>
                    <ScriptureTab
                      key={`scripture-${activeTab}`}
                      tradition={tradition}
                      accentColour={meta.accentColour}
                      navLabel={meta.navLibraryLabel}
                      isDark={isDark}
                      initialSectionId={initialSectionId}
                    />
                  </AccordionDrawer>

                  {/* Drawer 2: Learning Paths */}
                  <AccordionDrawer id="paths" label="Sacred Paths" count={allPaths.length}>
                    {/* Difficulty filter pills */}
                    <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
                      {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(d => (
                        <motion.button
                          key={d}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => { setDiffFilter(d); playHaptic('light'); }}
                          className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all"
                          style={diffFilter === d ? {
                            background: meta.accentColour,
                            color: 'var(--divine-bg)',
                            borderColor: meta.accentColour,
                            boxShadow: `0 4px 12px ${meta.accentColour}30`,
                          } : {
                            background: 'var(--card-bg-soft)',
                            color: 'var(--brand-muted)',
                            borderColor: 'var(--card-border)',
                          }}
                        >
                          {d === 'all' ? `All (${allPaths.length})` : d.charAt(0).toUpperCase() + d.slice(1)}
                        </motion.button>
                      ))}
                    </div>

                    {/* BrowsePathCard list */}
                    <div className="grid gap-3">
                      <AnimatePresence mode="popLayout">
                        {filteredPaths.map((p, i) => (
                          <motion.div
                            key={p.id}
                            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                          >
                            <BrowsePathCard path={p} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </AccordionDrawer>

                  {/* Drawer 3: Saved Verses */}
                  <AccordionDrawer id="saved" label="Saved Verses" count={savedCount !== null ? savedCount : '–'}>
                    <Link
                      href="/pathshala/saved"
                      className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface-soft)] hover:opacity-90 transition-opacity"
                    >
                      <span className="text-sm font-semibold text-[color:var(--brand-ink)]">
                        View saved verses &rarr;
                      </span>
                      <ChevronRight size={16} style={{ color: meta.accentColour }} />
                    </Link>
                  </AccordionDrawer>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* ── Reader modal ──────────────────────────────────────────────────────── */}
        <ReaderModal />
        <PremiumActivateModal
          open={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
        <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />
      </div>
    </div>
  );
}
