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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import { getTraditionMeta } from '@/lib/tradition-config';
import { usePremium } from '@/hooks/usePremium';
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
    <button
      className="w-full text-left p-4 rounded-[1.45rem] transition-all active:scale-[0.98]"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      onClick={() => window.dispatchEvent(new CustomEvent('open-reader', { detail: { entry } }))}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[color:var(--brand-ink)] text-sm leading-tight">{entry.title}</p>
          <p className="text-[10px] text-[color:var(--brand-muted)] mt-1 uppercase tracking-wider">{entry.source}</p>
        </div>
        <BookOpen size={14} className="text-[color:var(--brand-muted)] shrink-0 mt-0.5" />
      </div>
      <p className="mt-3 text-sm font-[family:var(--font-deva)] leading-relaxed line-clamp-1"
        style={{ color: accentColour }}>
        {entry.original.split('\n')[0]}
      </p>
    </button>
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
      <div className="sticky top-0 z-20 flex items-center gap-3 p-4 bg-[var(--brand-background)]/80 backdrop-blur-xl border-b border-white/5">
        <button onClick={onClose} className="p-2 rounded-full bg-white/5">
          <X size={20} style={{ color: accentColour }} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-sm truncate">{content.title}</h2>
          <p className="text-[10px] text-[color:var(--brand-muted)] uppercase tracking-wider">{content.source}</p>
        </div>
        <button onClick={() => entry && shareEntry(entry)} className="p-2 rounded-full bg-white/5">
          <Share2 size={16} className="text-[color:var(--brand-muted)]" />
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-10 pb-32">
        {content.verses.length > 0 ? (
          content.verses.map((v, i) => (
            <div key={i} className="space-y-4">
              {content.verses.length > 1 && <p className="text-[10px] font-mono opacity-30">Verse {i + 1}</p>}
              <p className="text-xl md:text-2xl font-[family:var(--font-deva)] leading-loose text-center py-4"
                style={{ color: accentColour }}>
                {v.original}
              </p>
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[10px] font-bold text-[color:var(--brand-muted)] uppercase tracking-[0.2em] mb-2">Transliteration</p>
                  <p className="text-sm text-[color:var(--brand-muted)] italic leading-relaxed">{v.transliteration}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[color:var(--brand-muted)] uppercase tracking-[0.2em] mb-2">Meaning</p>
                  <p className="text-base text-[color:var(--brand-ink)] leading-relaxed">{v.meaning}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20">
            <Loader2 className="animate-spin mx-auto mb-4" style={{ color: accentColour }} />
            <p className="text-sm text-[color:var(--brand-muted)]">Unrolling sacred verses…</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[var(--brand-background)] to-transparent pointer-events-none">
        <button
          onClick={onClose}
          className="pointer-events-auto w-full py-4 rounded-2xl font-bold text-sm shadow-xl"
          style={{ background: accentColour, color: '#1c1c1a' }}
        >
          Close Reader
        </button>
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
    <div className="space-y-4">
      {/* Kanda Selector - Small chips */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-1">
        {structure.kandas.map(k => (
          <button
            key={k.id}
            onClick={() => setKanda(k)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${
              selectedKanda.id === k.id
                ? 'bg-white/10 border-white/20'
                : 'bg-white/5 border-white/5 text-[color:var(--brand-muted)] hover:bg-white/8'
            }`}
            style={selectedKanda.id === k.id ? { color: accentColour } : {}}
          >
            {k.title}
          </button>
        ))}
      </div>

      <p className="text-xs text-[color:var(--brand-muted)] px-1">{selectedKanda.description}</p>

      {/* Chapter List */}
      <div className="grid gap-2">
        {selectedKanda.chapters.length > 0 ? (
          selectedKanda.chapters.map(c => (
            <button
              key={c.id}
              onClick={() => handleOpenChapter(c)}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition text-left group"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-[10px] font-bold text-[color:var(--brand-muted)] group-hover:scale-110 transition">
                {c.chapterNumber}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold truncate">{c.title}</h4>
                <p className="text-xs text-[color:var(--brand-muted)] truncate">{c.summary}</p>
              </div>
              <Play size={14} className="opacity-0 group-hover:opacity-100 transition" style={{ color: accentColour }} />
            </button>
          ))
        ) : (
          <div className="py-12 text-center opacity-40">
            <Loader2 className="mx-auto mb-2 animate-spin-slow" />
            <p className="text-xs italic">Compiling chapters for {selectedKanda.title}…</p>
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

  const [activePaths, setActive]    = useState<ActiveEnrollment[]>([]);
  const [loading,     setLoading]   = useState(true);
  const [enrolling,   setEnrolling] = useState<string | null>(null);
  const [isDark,      setIsDark]    = useState(true);

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

  // ── Continue Learning hero card ──────────────────────────────────────────────
  // Shows the most recently enrolled (first in list) active path as a top hero card
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
    const lessonLabel  = resumeLesson > 0 ? `Lesson ${resumeLesson + 1}` : 'First Lesson';

    return (
      <motion.div
        className="rounded-[1.8rem] overflow-hidden mb-1"
        style={{
          ...cardStyle,
          background: isDark
            ? `linear-gradient(135deg, rgba(28,20,12,0.96) 0%, rgba(18,12,8,0.98) 100%)`
            : `linear-gradient(135deg, rgba(255,244,228,0.98) 0%, rgba(250,235,210,0.99) 100%)`,
          boxShadow: `0 8px 32px ${meta.accentColour}15`,
          border: `1px solid ${meta.accentColour}25`
        }}
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 14 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: meta.accentColour }}>
            Continue Learning
          </p>
          <div className="flex items-center gap-4">
            {/* Big progress ring */}
            <CircularProgress
              pct={progressPct}
              accent={meta.accentColour}
              size={72}
              strokeWidth={5}
              label={
                <div className="text-center">
                  <div className="text-base font-bold" style={{ color: meta.accentColour }}>{progressPct}%</div>
                  <div className="text-[8px] leading-none" style={{ color: tertiaryText }}>done</div>
                </div>
              }
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-base leading-snug" style={{ color: primaryText }}>{path.title}</h2>
              <p className="text-xs mt-1" style={{ color: secondaryText }}>
                {doneLessons} of {path.total_lessons} lessons · Up next: {lessonLabel}
              </p>
              <Link
                href={`/pathshala/${enrollment.path_id}/lesson`}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[#1c1c1a] text-sm font-bold shadow-sm"
                style={{ background: meta.accentColour }}
              >
                <Play size={13} /> Resume
              </Link>
            </div>
          </div>
        </div>
        {/* Quick actions strip */}
        <div className="flex divide-x" style={{ borderTop: `1px solid ${glassBorder}`, borderColor: glassBorder }}>
          <Link
            href={`/pathshala/${enrollment.path_id}/recite`}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all hover:bg-white/4"
            style={{ color: meta.accentColour }}
          >
            <Mic size={13} /> Recite
          </Link>
          <button
            onClick={() => startOver(enrollment.path_id, path.title)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all hover:bg-white/4"
            style={{ color: secondaryText }}
          >
            <Trophy size={13} /> Start over
          </button>
          <button
            onClick={() => unenroll(enrollment.path_id, path.title)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all hover:bg-white/4"
            style={{ color: secondaryText }}
          >
            <X size={13} /> Leave
          </button>
        </div>
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
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: tertiaryText }}>
            {meta.sacredTextLabel} · Today
          </p>
          <p className="font-[family:var(--font-deva)] font-semibold text-base leading-relaxed" style={{ color: primaryText }}>
            {meta.dailyVersePrompt.verse}
          </p>
        </div>
        <div className="p-4" style={{ borderTop: `1px solid ${glassBorder}`, background: isDark ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.38)' }}>
          <p className="text-sm leading-relaxed" style={{ color: secondaryText }}>
            {meta.dailyVersePrompt.meaning}
          </p>
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

      {/* Tab bar */}
      <div className="px-4 mb-4">
        <div className="flex rounded-2xl p-1 shadow-sm gap-0.5" style={cardStyle}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                tab === t.id ? 'text-[#1c1c1a] shadow-sm' : ''
              }`}
              style={tab === t.id ? { background: meta.accentColour } : { color: secondaryText }}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="ml-1 text-[10px]" style={{ color: tab === t.id ? 'rgba(28,28,26,0.62)' : tertiaryText }}>
                  ({t.count})
                </span>
              )}
            </button>
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
                  <DailyVersePrompt />
                  <div className="pathshala-glass-card rounded-[1.8rem] text-center py-10 px-5">
                    <GraduationCap size={44} className="mx-auto mb-3" style={{ color: `${meta.accentColour}88` }} />
                    <p className="font-semibold" style={{ color: primaryText }}>No active learning paths</p>
                    <p className="text-sm mt-1" style={{ color: secondaryText }}>Enroll in a path to begin your journey</p>
                    <button onClick={() => setTab('explore')}
                      className="mt-4 px-6 py-2.5 rounded-xl text-[#1c1c1a] font-semibold text-sm"
                      style={{ background: meta.accentColour }}>
                      Explore Paths
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Hero card for top active path */}
                  <ContinueLearningHero />

                  {/* Additional active paths (Pro only gets multiple) */}
                  {activePaths.slice(1).map(e => (
                    <ActivePathCard key={e.path_id} enrollment={e} />
                  ))}

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
              <div className="flex items-center justify-between pb-1">
                <p className="text-xs" style={{ color: secondaryText }}>
                  {allPaths.length} paths available for {meta.label}
                </p>
                {!isPro && (
                  <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 flex items-center gap-1"
                    style={{ background: `${meta.accentColour}15`, color: meta.accentColour }}>
                    <Lock size={9} /> Pro: unlimited
                  </span>
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
