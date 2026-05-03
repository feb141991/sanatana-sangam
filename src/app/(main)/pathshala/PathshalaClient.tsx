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

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ChevronLeft, BookOpen, Mic, Trophy,
  Loader2, Play, Star, Plus, Search, X,
  Share2, ChevronDown, ChevronUp, GraduationCap, Lock, Sparkles, BarChart2,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import { getTraditionMeta } from '@/lib/tradition-config';
import { usePremium } from '@/hooks/usePremium';
import { calculatePanchang, getTodaySpiritualPulse, type SpiritualPulse } from '@/lib/panchang';
import { useLocation } from '@/lib/LocationContext';
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

// ── Difficulty badges — inline styles so they read clearly on any bg ──────────
const DIFF_STYLE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  beginner:     { bg: 'rgba(34,197,94,0.12)',  text: '#4ade80', border: 'rgba(74,222,128,0.28)',   label: 'Beginner'     },
  intermediate: { bg: 'rgba(251,191,36,0.12)', text: '#fcd34d', border: 'rgba(252,211,77,0.28)',   label: 'Intermediate' },
  advanced:     { bg: 'rgba(248,113,113,0.12)',text: '#f87171', border: 'rgba(248,113,113,0.28)',  label: 'Advanced'     },
};

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
  other:    ['gita','bhagavatam','ramayana','upanishad','gurbani','dhammapada','jain'],
};

// ── Static seed paths — sourced from shared lib so server components can import too ──
export const SEED_PATHS = SEED_PATHS_LIB as unknown as {
  id: string; title: string; description: string;
  difficulty: string; tradition: string; total_lessons: number; duration_days: number;
}[];

// ── Share helper ───────────────────────────────────────────────────────────────
async function shareEntry(entry: LibraryEntry) {
  const text = `${entry.title} — ${entry.source}\n\n${entry.original}\n\n${entry.transliteration}\n\nMeaning: ${entry.meaning}\n\n— Shared via Sanatana Sangam`;
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
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accentColour }}>Begin Reading</span>
          </div>
        </div>
        
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5 group-hover:scale-110 transition-transform duration-500">
          <Sparkles size={18} style={{ color: accentColour }} className="opacity-40" />
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/5 relative">
        <p className="text-sm font-[family:var(--font-deva)] leading-relaxed line-clamp-1 opacity-60 italic"
          style={{ color: accentColour }}>
          {entry.original.split('\n')[0]}
        </p>
      </div>
    </motion.button>
  );
}

// ── Immersive Reader ─────────────────────────────────────────────────────────
function ScriptureReader({
  entry, chapter, onClose, accentColour
}: {
  entry?: LibraryEntry;
  chapter?: EpicChapter & { kandaTitle?: string };
  onClose: () => void;
  accentColour: string;
}) {
  const content = entry ? {
    title: entry.title,
    source: entry.source,
    verses: [{ original: entry.original, transliteration: entry.transliteration, meaning: entry.meaning }]
  } : {
    title: chapter?.title,
    source: `${chapter?.kandaTitle} · Chapter ${chapter?.chapterNumber}`,
    verses: chapter?.verses?.map(v => ({ original: v.original, transliteration: v.transliteration, meaning: v.meaning })) || []
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[100] overflow-y-auto"
      style={{ background: 'var(--brand-background)' }}
    >
      <div className="sticky top-0 z-20 flex items-center gap-4 p-4 md:p-6 bg-[var(--brand-background)]/80 backdrop-blur-2xl border-b border-white/5">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
          <ChevronLeft size={22} style={{ color: accentColour }} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-base md:text-lg truncate tracking-tight">{content.title}</h2>
          <p className="text-[10px] md:text-xs text-[color:var(--brand-muted)] uppercase tracking-[0.2em] font-bold">{content.source}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => entry && shareEntry(entry)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <Share2 size={18} className="text-[color:var(--brand-muted)]" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 md:p-12 space-y-16 pb-40">
        {content.verses.length > 0 ? (
          content.verses.map((v, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/5" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-30">Verse {i + 1}</span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/5" />
              </div>

              <p className="text-2xl md:text-4xl font-[family:var(--font-deva)] leading-[1.8] text-center mb-12 drop-shadow-sm px-4"
                style={{ color: accentColour }}>
                {v.original}
              </p>

              <div className="grid md:grid-cols-2 gap-8 pt-8">
                <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5">
                  <p className="text-[10px] font-bold text-[color:var(--brand-muted)] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[color:var(--brand-muted)]" />
                    Transliteration
                  </p>
                  <p className="text-sm md:text-base text-[color:var(--brand-muted)] italic leading-relaxed font-serif">
                    {v.transliteration}
                  </p>
                </div>
                <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5">
                  <p className="text-[10px] font-bold text-[color:var(--brand-muted)] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full" style={{ background: accentColour }} />
                    Divine Meaning
                  </p>
                  <p className="text-base md:text-lg text-[color:var(--brand-ink)] leading-relaxed font-medium">
                    {v.meaning}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-32">
            <Loader2 className="animate-spin mx-auto mb-6 opacity-20" size={40} style={{ color: accentColour }} />
            <p className="text-sm font-bold uppercase tracking-widest opacity-40">Unrolling sacred manuscript…</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-[var(--brand-background)] via-[var(--brand-background)]/95 to-transparent">
        <div className="max-w-2xl mx-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full py-4 rounded-2xl font-bold text-sm shadow-2xl transition-all"
            style={{ 
              background: `linear-gradient(135deg, ${accentColour}, ${accentColour}cc)`,
              color: '#1c1c1a',
              boxShadow: `0 10px 40px ${accentColour}33`
            }}
          >
            Conclude Path
          </motion.button>
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
          <div className="py-20 text-center rounded-[2rem] border border-dashed border-white/10 bg-white/2">
            <Loader2 className="mx-auto mb-3 animate-spin-slow opacity-20" size={32} />
            <p className="text-xs font-medium tracking-wide opacity-40 uppercase">Compiling chapters for the Path…</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Scripture Library Tab ──────────────────────────────────────────────────────
function ScriptureTab({
  tradition, accentColour, navLabel,
}: {
  tradition: string; accentColour: string; navLabel: string;
}) {
  const allowedSections = SECTIONS_BY_TRADITION[tradition] ?? SECTIONS_BY_TRADITION.other;
  const sections        = LIBRARY_SECTIONS.filter(s => allowedSections.includes(s.id));

  const [selectedSection, setSection] = useState<string>(allowedSections[0] ?? 'gita');
  const [query,           setQuery]   = useState('');
  const [showSearch,      setSearch]  = useState(false);

  const entries = useMemo(() => {
    const base = getEntriesBySection(selectedSection);
    if (!query.trim()) return base;
    const q = query.toLowerCase().trim();
    return base.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.meaning.toLowerCase().includes(q) ||
      e.source.toLowerCase().includes(q) ||
      e.tags.some(t => t.includes(q))
    );
  }, [selectedSection, query]);

  return (
    <div className="space-y-3">
      {/* Section pills + search toggle */}
      <div className="flex items-center gap-2">
        <div className="flex-1 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => { setSection(s.id); setQuery(''); }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${
                  selectedSection === s.id
                    ? 'text-[#1c1c1a] shadow-sm'
                    : 'bg-white/5 text-[color:var(--brand-muted)] hover:bg-white/8 border border-white/5'
                }`}
                style={selectedSection === s.id ? { background: accentColour } : {}}
              >
                <span>{s.emoji}</span>
                {s.title}
                <span className="opacity-60 font-normal">({s.count})</span>
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setSearch(s => !s)}
          className="shrink-0 w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-[color:var(--brand-muted)] hover:text-[color:var(--brand-ink)] transition"
        >
          {showSearch ? <X size={15} /> : <Search size={15} />}
        </button>
      </div>

      {/* Search box */}
      {showSearch && (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--brand-muted)]" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${navLabel}…`}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/6 text-sm text-[color:var(--brand-ink)] placeholder:text-[color:var(--brand-muted)] focus:outline-none focus:border-white/20"
          />
        </div>
      )}

      {/* Section description */}
      {!query && (
        <p className="text-xs text-[color:var(--brand-muted)] leading-relaxed">
          {sections.find(s => s.id === selectedSection)?.desc ?? ''}
        </p>
      )}

      {/* Entries / Epic Viewer */}
      {selectedSection === 'ramayana' ? (
        <EpicViewer structure={RAMAYANA_STRUCTURE} accentColour={accentColour} />
      ) : selectedSection === 'bhagavatam' ? (
        <EpicViewer structure={BHAGAVATAM_STRUCTURE} accentColour={accentColour} />
      ) : entries.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-[color:var(--brand-muted)]">No results for &ldquo;{query}&rdquo;</p>
        </div>
      ) : (
        entries.map(e => (
          <EntryCard key={e.id} entry={e} accentColour={accentColour} />
        ))
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
export default function PathshalaClient({ userId, userName, tradition, initialTab }: Props) {
  const router    = useRouter();
  const supabase  = useRef(createClient()).current;
  const meta      = getTraditionMeta(tradition);
  const isPro     = usePremium();
  const prefersReducedMotion = useReducedMotion();

  const { latitude: lat, longitude: lon } = useLocation();
  const [activePaths, setActive]    = useState<ActiveEnrollment[]>([]);
  const [loading,     setLoading]   = useState(true);
  const [enrolling,   setEnrolling] = useState<string | null>(null);
  const [isDark,      setIsDark]    = useState(true);
  
  const pulse = useMemo(() => {
    const p = calculatePanchang(new Date(), lat ?? undefined, lon ?? undefined);
    return getTodaySpiritualPulse(p.tithiIndex, tradition);
  }, [tradition, lat, lon]);

  // Tab: 'learn' | 'scripture' | 'explore'
  const [tab, setTab] = useState<'learn' | 'scripture' | 'explore'>(initialTab ?? 'learn');

  // Filter paths to those relevant to this tradition
  const traditionPaths = useMemo(() => {
    return SEED_PATHS.filter(p => p.tradition === tradition || p.tradition === 'all');
  }, [tradition]);
  const allPaths = traditionPaths.length > 0 ? traditionPaths : SEED_PATHS;

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

  // ── Enroll — uses guided_path_progress directly ──────────────────────────────
  const FREE_PATH_LIMIT = 1;

  async function enroll(pathId: string) {
    if (enrolling) return;

    // Free tier cap — max 1 active path
    if (!isPro && activePaths.length >= FREE_PATH_LIMIT) {
      toast('🔒 Free plan supports 1 active path. Upgrade to Sangam Pro for unlimited.', {
        duration: 4000,
        style: { background: '#1c1c1a', color: 'var(--brand-ink)' },
      });
      return;
    }

    setEnrolling(pathId);
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
            <Mic size={12} /> Recite
          </Link>
          <div className="w-px self-stretch" style={{ background: glassBorder }} />
          <button
            onClick={() => startOver(enrollment.path_id, path.title)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all hover:bg-white/4"
            style={{ color: secondaryText }}
          >
            <Trophy size={12} /> Start over
          </button>
          <div className="w-px self-stretch" style={{ background: glassBorder }} />
          <button
            onClick={() => unenroll(enrollment.path_id, path.title)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all hover:bg-white/4"
            style={{ color: secondaryText }}
          >
            <X size={12} /> Leave
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
      <Link href="/pathshala?tab=explore" className="block rounded-[1.8rem] overflow-hidden mb-4 motion-press"
        style={cardStyle}>
        <div className="p-5" style={{ background: `linear-gradient(135deg, ${meta.accentColour}12 0%, transparent 100%)` }}>
          {pulse && (
            <div className="flex items-center gap-2 mb-3 bg-white/5 w-max px-2 py-0.5 rounded-full border border-white/5">
              <span className="text-[10px]">{pulse.emoji}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: meta.accentColour }}>
                Today is {pulse.label}
              </span>
            </div>
          )}
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: tertiaryText }}>
            {meta.sacredTextLabel} · Today
          </p>
          <p className="font-[family:var(--font-deva)] font-semibold text-base leading-relaxed" style={{ color: primaryText }}>
            {meta.dailyVersePrompt.verse}
          </p>
        </div>
        <div className="p-4" style={{ borderTop: `1px solid ${glassBorder}`, background: isDark ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.38)' }}>
          <p className="text-sm leading-relaxed" style={{ color: secondaryText }}>
            {pulse ? pulse.description : meta.dailyVersePrompt.meaning}
          </p>
          {!pulse && (
            <p className="text-sm mt-2" style={{ color: secondaryText }}>
              {meta.dailyVersePrompt.meaning}
            </p>
          )}
          <p className="text-xs mt-2" style={{ color: meta.accentColour }}>
            Explore {meta.navLibraryLabel} →
          </p>
        </div>
      </Link>
    );
  }

  // ── Active Path Card ──────────────────────────────────────────────────────────
  function ActivePathCard({ enrollment }: { enrollment: ActiveEnrollment }) {
    const path = allPaths.find(p => p.id === enrollment.path_id);
    if (!path) return null;
    const diff        = DIFF_STYLE[path.difficulty] ?? DIFF_STYLE.beginner;
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
            <Mic size={14} /> Recite
          </Link>
        </div>
      </motion.div>
    );
  }

  // ── Browse Path Card ──────────────────────────────────────────────────────────
  function BrowsePathCard({ path }: { path: typeof SEED_PATHS[0] }) {
    const isEnrolled = activePaths.some(e => e.path_id === path.id);
    const diff       = DIFF_STYLE[path.difficulty] ?? DIFF_STYLE.beginner;
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
          className={`mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
            isEnrolled
              ? 'border-green-800/40 text-green-400 bg-green-900/20 cursor-default'
              : ''
          }`}
          style={!isEnrolled ? {
            background: `${meta.accentColour}12`,
            color: meta.accentColour,
            border: `1px solid ${glassBorder}`,
          } : {}}
        >
          {enrolling === path.id
            ? <Loader2 size={14} className="animate-spin" />
            : isEnrolled
              ? <><Star size={14} /> Enrolled</>
              : <><Plus size={14} /> Enroll in this Path</>
          }
        </button>
      </motion.div>
    );
  }

  // ── Tab definitions ───────────────────────────────────────────────────────────
  const TABS = [
    { id: 'learn'     as const, label: 'My Learning',      count: activePaths.length || undefined },
    { id: 'scripture' as const, label: meta.navLibraryLabel, count: undefined },
    { id: 'explore'   as const, label: 'Explore',          count: allPaths.length || undefined },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: pageBg }}>
      {/* Ambient background effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${meta.accentColour}08, transparent 60%)`, filter: 'blur(40px)' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${meta.accentColour}05, transparent 60%)`, filter: 'blur(40px)' }} />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-4 pb-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm motion-press"
          style={{ background: `${meta.accentColour}12`, border: `1px solid ${meta.accentColour}25` }}>
          <ChevronLeft size={20} style={{ color: meta.accentColour }} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[22px] drop-shadow-md">{meta.symbol}</span>
            <h1 className="font-bold text-xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: primaryText }}>Pathshala</h1>
          </div>
          <p className="text-xs" style={{ color: secondaryText }}>Digital Gurukul · {meta.label}</p>
        </div>
        {activePaths.length > 0 && (
          <div className="flex items-center gap-1 rounded-xl px-3 py-1.5"
            style={{ background: `${meta.accentColour}16`, border: `1px solid ${glassBorder}` }}>
            <Trophy size={14} style={{ color: meta.accentColour }} />
            <span className="text-xs font-semibold" style={{ color: meta.accentColour }}>
              {activePaths.length} active
            </span>
          </div>
        )}
        <Link
          href="/pathshala/insights"
          className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm motion-press"
          style={{ background: glassSurfaceStrong, border: `1px solid ${glassBorder}`, backdropFilter: 'blur(16px)' }}
          title="Learning Insights"
        >
          <BarChart2 size={17} style={{ color: meta.accentColour }} />
        </Link>
      </div>

      {/* Floating Navigation Chips */}
      <div className="px-4 mb-6">
        <div className="flex flex-wrap gap-2 items-center">
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

      {/* Tab content */}
      {loading && tab === 'learn' ? (
        <div className="flex items-center justify-center gap-3 pt-20">
          <Loader2 size={22} className="animate-spin" style={{ color: meta.accentColour }} />
          <span className="text-sm text-[color:var(--brand-muted)]">Loading your gurukul…</span>
        </div>
      ) : (
        <div className="px-4 pb-24 space-y-3">

          {/* ── My Learning ─────────────────────────────────────────────────── */}
          {tab === 'learn' && (
            <>
              {activePaths.length === 0 ? (
                <>
                  {/* Tradition-aware invitation — seamless, full-bleed */}
                  <motion.div
                    className="relative -mx-4 overflow-hidden text-center"
                    initial={prefersReducedMotion ? undefined : { opacity: 0 }}
                    animate={prefersReducedMotion ? undefined : { opacity: 1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {/* Wide ambient glow */}
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ background: `radial-gradient(ellipse 80% 55% at 50% -10%, ${meta.accentColour}22, transparent 70%)` }} />
                    {/* Tradition mark watermark */}
                    <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none overflow-hidden">
                      <span style={{
                        fontFamily: 'var(--font-deva, serif)',
                        fontSize: '13rem',
                        lineHeight: 1,
                        color: meta.accentColour,
                        opacity: isDark ? 0.035 : 0.05,
                      }}>
                        {meta.heroFallback.mark}
                      </span>
                    </div>
                    <div className="relative z-10 px-6 pt-4 pb-6">
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-4"
                        style={{ color: meta.accentColour, opacity: 0.65 }}>
                        {meta.symbol} {meta.label} · {meta.navLibraryLabel}
                      </p>
                      <p className="text-[2.8rem] leading-none mb-3 font-medium"
                        style={{ fontFamily: 'var(--font-deva, serif)', color: meta.accentColour, opacity: 0.55 }}>
                        {seatMeta.scriptWord}
                      </p>
                      <p className="font-bold text-xl mb-1" style={{ fontFamily: 'var(--font-serif)', color: primaryText }}>
                        Your seat awaits
                      </p>
                      <p className="text-sm leading-relaxed mb-5 mx-auto max-w-[240px]" style={{ color: secondaryText }}>
                        Begin your study of {meta.pathshalaVocabulary} — one lesson at a time.
                      </p>
                      <button onClick={() => setTab('explore')}
                        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-[#1c1c1a] font-bold text-sm"
                        style={{
                          background: `linear-gradient(135deg, ${meta.accentColour}, ${meta.accentColour}cc)`,
                          boxShadow: `0 8px 24px ${meta.accentColour}38`,
                        }}>
                        <GraduationCap size={15} /> Choose a Path
                      </button>
                    </div>
                  </motion.div>
                  <DailyVersePrompt />
                </>
              ) : (
                <>
                  {/* Hero card for top active path */}
                  <ContinueLearningHero />

                  {/* Additional active paths (Pro only gets multiple) */}
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

                  {/* Daily verse prompt below paths */}
                  <DailyVersePrompt />

                  {/* Pro upgrade nudge for free users */}
                  {!isPro && (
                    <div className="flex items-center gap-3 rounded-[1.45rem] p-4"
                      style={{ ...cardStyle, background: isDark ? `${meta.accentColour}10` : `${meta.accentColour}12` }}>
                      <Lock size={18} style={{ color: meta.accentColour }} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold" style={{ color: primaryText }}>Sangam Pro — unlimited paths</p>
                        <p className="text-[10px] mt-0.5" style={{ color: secondaryText }}>
                          Free plan: 1 active path. Pro unlocks all paths, From Memory &amp; Timed recitation modes, and progress analytics.
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

          {/* ── Tradition Scripture Library ──────────────────────────────────── */}
          {tab === 'scripture' && (
            <ScriptureTab
              tradition={tradition}
              accentColour={meta.accentColour}
              navLabel={meta.navLibraryLabel}
            />
          )}

          {/* ── Explore Paths ────────────────────────────────────────────────── */}
          {tab === 'explore' && (
            <>
              <div className="flex items-center gap-3 pb-1">
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ fontFamily: 'var(--font-serif)', color: primaryText }}>
                    Sacred Learning Paths
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: secondaryText }}>
                    {allPaths.length} paths · {meta.label} tradition
                    {!isPro && <span style={{ color: meta.accentColour }}> · 1 active (free)</span>}
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

      {/* Immersive Reader Overlay */}
      {(readingEntry || readingChapter) && (
        <ScriptureReader
          entry={readingEntry}
          chapter={readingChapter}
          accentColour={meta.accentColour}
          onClose={() => { setReadingEntry(undefined); setReadingChapter(undefined); }}
        />
      )}
    </div>
  );
}
