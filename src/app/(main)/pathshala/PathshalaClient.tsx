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

// ── Static seed paths ──────────────────────────────────────────────────────────
export const SEED_PATHS = [
  {
    id: 'bhagavad-gita-intro',
    title: 'Bhagavad Gita — Foundations',
    description: 'The 18 chapters of the Gita distilled into 30 focused lessons. Begin at any chapter.',
    difficulty: 'beginner',
    tradition: 'hindu',
    total_lessons: 30,
    duration_days: 30,
  },
  {
    id: 'upanishads-core',
    title: 'Core Upanishads',
    description: 'Isha, Kena, Katha, Mandukya — the four shortest Upanishads with commentary.',
    difficulty: 'intermediate',
    tradition: 'hindu',
    total_lessons: 20,
    duration_days: 20,
  },
  {
    id: 'stotra-path',
    title: 'Daily Stotra Practice',
    description: 'Learn 7 core stotras by heart — Hanuman Chalisa, Durga Saptashati excerpts, Vishnu Sahasranama.',
    difficulty: 'beginner',
    tradition: 'hindu',
    total_lessons: 14,
    duration_days: 21,
  },
  {
    id: 'yoga-sutras',
    title: 'Patanjali Yoga Sutras',
    description: '196 sutras, 4 chapters — Samadhi, Sadhana, Vibhuti, Kaivalya.',
    difficulty: 'advanced',
    tradition: 'hindu',
    total_lessons: 40,
    duration_days: 40,
  },
  {
    id: 'nitnem-daily',
    title: 'Nitnem — Daily Banis',
    description: 'Five core Gurbani prayers for morning and evening practice.',
    difficulty: 'beginner',
    tradition: 'sikh',
    total_lessons: 10,
    duration_days: 30,
  },
  {
    id: 'dhammapada-path',
    title: 'Dhammapada — 26 Chapters',
    description: 'The path of truth — 423 verses on the Buddha\'s practical teachings.',
    difficulty: 'beginner',
    tradition: 'buddhist',
    total_lessons: 26,
    duration_days: 26,
  },
];

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
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-white/8">
      <button
        className="w-full text-left px-4 py-4"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[color:var(--brand-ink)] text-sm">{entry.title}</p>
            <p className="text-xs text-[color:var(--brand-muted)] mt-0.5">{entry.source}</p>
          </div>
          {expanded
            ? <ChevronUp size={16} className="text-[color:var(--brand-muted)] shrink-0 mt-0.5" />
            : <ChevronDown size={16} className="text-[color:var(--brand-muted)] shrink-0 mt-0.5" />
          }
        </div>
        {/* Original text preview */}
        <p className="mt-2 text-sm font-[family:var(--font-deva)] leading-relaxed"
          style={{ color: accentColour }}>
          {entry.original.split('\n')[0]}
          {entry.original.includes('\n') && !expanded ? '…' : ''}
        </p>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/6">
          {/* Full original */}
          <div className="pt-3">
            <p className="text-xs font-medium text-[color:var(--brand-muted)] mb-1 uppercase tracking-wide">Original</p>
            <p className="text-sm font-[family:var(--font-deva)] leading-relaxed whitespace-pre-line"
              style={{ color: accentColour }}>
              {entry.original}
            </p>
          </div>
          {/* Transliteration */}
          <div>
            <p className="text-xs font-medium text-[color:var(--brand-muted)] mb-1 uppercase tracking-wide">Transliteration</p>
            <p className="text-sm text-[color:var(--brand-muted)] italic leading-relaxed">{entry.transliteration}</p>
          </div>
          {/* Meaning */}
          <div>
            <p className="text-xs font-medium text-[color:var(--brand-muted)] mb-1 uppercase tracking-wide">Meaning</p>
            <p className="text-sm text-[color:var(--brand-ink)] leading-relaxed">{entry.meaning}</p>
          </div>
          {/* Tags + Share */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex flex-wrap gap-1">
              {entry.tags.slice(0, 4).map(tag => (
                <span key={tag}
                  className="text-[10px] rounded-full px-2 py-0.5 font-medium"
                  style={{ background: `${accentColour}20`, color: accentColour }}>
                  {tag}
                </span>
              ))}
            </div>
            <button
              onClick={e => { e.stopPropagation(); shareEntry(entry); }}
              className="flex items-center gap-1 text-xs text-[color:var(--brand-muted)] hover:text-[color:var(--brand-ink)] transition"
            >
              <Share2 size={13} /> Share
            </button>
          </div>
        </div>
      )}
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedSection === s.id
                    ? 'text-[#1c1c1a] shadow-sm'
                    : 'bg-white/8 text-[color:var(--brand-muted)] hover:bg-white/12'
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

      {/* Entries */}
      {entries.length === 0 ? (
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

  const [activePaths, setActive]    = useState<ActiveEnrollment[]>([]);
  const [loading,     setLoading]   = useState(true);
  const [enrolling,   setEnrolling] = useState<string | null>(null);

  // Tab: 'learn' | 'scripture' | 'explore'
  const [tab, setTab] = useState<'learn' | 'scripture' | 'explore'>(initialTab ?? 'learn');

  // Filter paths to those relevant to this tradition
  const traditionPaths = useMemo(() => {
    return SEED_PATHS.filter(p => p.tradition === tradition || p.tradition === 'all');
  }, [tradition]);
  const allPaths = traditionPaths.length > 0 ? traditionPaths : SEED_PATHS;

  // ── Load active enrollments from guided_path_progress ───────────────────────
  useEffect(() => {
    async function loadEnrollments() {
      try {
        const { data, error } = await supabase
          .from('guided_path_progress')
          .select('path_id, status, completed_at, current_lesson, completed_lessons')
          .eq('user_id', userId)
          .eq('status', 'active');

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

      // Refresh active list
      const { data } = await supabase
        .from('guided_path_progress')
        .select('path_id, status, completed_at, current_lesson, completed_lessons')
        .eq('user_id', userId)
        .eq('status', 'active');

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
      <div
        className="rounded-3xl overflow-hidden border border-white/10 mb-1"
        style={{ background: `linear-gradient(135deg, ${meta.accentColour}18 0%, ${meta.accentColour}08 100%)` }}
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
                  <div className="text-[8px] text-[color:var(--brand-muted)] leading-none">done</div>
                </div>
              }
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base text-[color:var(--brand-ink)] leading-snug">{path.title}</h2>
              <p className="text-xs text-[color:var(--brand-muted)] mt-1">
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
        <div className="border-t border-white/8 flex divide-x divide-white/8">
          <Link
            href={`/pathshala/${enrollment.path_id}/recite`}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all hover:bg-white/4"
            style={{ color: meta.accentColour }}
          >
            <Mic size={13} /> Recite
          </Link>
          <button
            onClick={() => startOver(enrollment.path_id, path.title)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-[color:var(--brand-muted)] hover:text-[color:var(--brand-ink)] transition-all hover:bg-white/4"
          >
            <Trophy size={13} /> Start over
          </button>
          <button
            onClick={() => unenroll(enrollment.path_id, path.title)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-[color:var(--brand-muted)] hover:text-[color:var(--brand-ink)] transition-all hover:bg-white/4"
          >
            <X size={13} /> Leave
          </button>
        </div>
      </div>
    );
  }

  // ── Shloka-of-day placeholder ─────────────────────────────────────────────────
  // (Engine shloka-of-day wired separately; show a motivational prompt for now)
  function DailyVersePrompt() {
    return (
      <Link href="/pathshala?tab=explore" className="block rounded-3xl overflow-hidden shadow-sm border border-white/8 mb-4">
        <div className="p-5" style={{ background: `linear-gradient(135deg, ${meta.accentColour} 0%, ${meta.accentColour}99 100%)` }}>
          <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-2">
            {meta.sacredTextLabel} · Today
          </p>
          <p className="text-white font-bold text-base leading-relaxed">
            {tradition === 'sikh'
              ? 'ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖ਼ਾਲਸਾ, ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫ਼ਤਹਿ'
              : tradition === 'buddhist'
              ? 'Appamādo amatapadaṃ — Diligence is the path to the deathless.'
              : 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत'}
          </p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-sm text-[color:var(--brand-muted)] leading-relaxed">
            {tradition === 'sikh'
              ? 'The Khalsa belongs to Waheguru, and victory belongs to Waheguru.'
              : tradition === 'buddhist'
              ? 'Dhammapada 21 — The Buddha\'s teaching on mindful effort.'
              : 'Bhagavad Gita 4.7 — Whenever there is a decline in righteousness…'}
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
      <div className="glass-panel rounded-2xl border border-white/8 p-4">
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
                  <h3 className="font-bold text-[color:var(--brand-ink)] text-sm">{path.title}</h3>
                  <span className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                    style={{ background: diff.bg, color: diff.text, border: `1px solid ${diff.border}` }}>
                    {diff.label}
                  </span>
                </div>
                <p className="text-xs text-[color:var(--brand-muted)] mt-0.5 truncate">{path.description}</p>
              </div>
              {/* Unenroll */}
              <button
                onClick={() => unenroll(enrollment.path_id, path.title)}
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center opacity-40 hover:opacity-80 transition"
                style={{ background: 'rgba(255,255,255,0.06)' }}
                title="Leave this path"
              >
                <X size={13} className="text-[color:var(--brand-muted)]" />
              </button>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: meta.accentColour }}>{progressPct}%</span>
              <span className="text-xs text-[color:var(--brand-muted)]">
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
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-sm border border-white/12"
            style={{ color: meta.accentColour }}
          >
            <Mic size={14} /> Recite
          </Link>
        </div>
      </div>
    );
  }

  // ── Browse Path Card ──────────────────────────────────────────────────────────
  function BrowsePathCard({ path }: { path: typeof SEED_PATHS[0] }) {
    const isEnrolled = activePaths.some(e => e.path_id === path.id);
    const diff       = DIFF_STYLE[path.difficulty] ?? DIFF_STYLE.beginner;
    return (
      <div className="glass-panel rounded-2xl border border-white/8 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: `${meta.accentColour}14` }}>
            {TRAD_ICON[path.tradition] ?? '📖'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-[color:var(--brand-ink)] text-sm">{path.title}</h3>
              <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${diff.bg} ${diff.text}`}>
                {diff.label}
              </span>
            </div>
            <p className="text-xs text-[color:var(--brand-muted)] mt-0.5 line-clamp-2">{path.description}</p>
            <p className="text-xs text-[color:var(--brand-muted)]/70 mt-1">
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
              : 'border-white/10 hover:border-transparent'
          }`}
          style={!isEnrolled ? {
            background: `${meta.accentColour}12`,
            color: meta.accentColour,
          } : {}}
        >
          {enrolling === path.id
            ? <Loader2 size={14} className="animate-spin" />
            : isEnrolled
              ? <><Star size={14} /> Enrolled</>
              : <><Plus size={14} /> Enroll in this Path</>
          }
        </button>
      </div>
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
    <div className="min-h-screen">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-full glass-panel border border-white/10 flex items-center justify-center shadow-sm">
          <ChevronLeft size={20} style={{ color: meta.accentColour }} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{meta.symbol}</span>
            <h1 className="font-bold text-lg text-[color:var(--brand-ink)]">Pathshala</h1>
          </div>
          <p className="text-xs text-[color:var(--brand-muted)]">Digital Gurukul · {meta.label}</p>
        </div>
        {activePaths.length > 0 && (
          <div className="flex items-center gap-1 rounded-xl px-3 py-1.5 border border-white/10"
            style={{ background: `${meta.accentColour}14` }}>
            <Trophy size={14} style={{ color: meta.accentColour }} />
            <span className="text-xs font-semibold" style={{ color: meta.accentColour }}>
              {activePaths.length} active
            </span>
          </div>
        )}
        <Link
          href="/pathshala/insights"
          className="w-9 h-9 rounded-full glass-panel border border-white/10 flex items-center justify-center shadow-sm"
          title="Learning Insights"
        >
          <BarChart2 size={17} style={{ color: meta.accentColour }} />
        </Link>
      </div>

      {/* Tab bar */}
      <div className="px-4 mb-4">
        <div className="flex glass-panel rounded-2xl border border-white/8 p-1 shadow-sm gap-0.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                tab === t.id ? 'text-[#1c1c1a] shadow-sm' : 'text-[color:var(--brand-muted)]'
              }`}
              style={tab === t.id ? { background: meta.accentColour } : {}}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`ml-1 text-[10px] ${tab === t.id ? 'text-[#1c1c1a]/60' : 'text-[color:var(--brand-muted)]'}`}>
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
                  <div className="text-center py-10">
                    <GraduationCap size={44} className="mx-auto mb-3 text-white/20" />
                    <p className="font-semibold text-[color:var(--brand-ink)]">No active learning paths</p>
                    <p className="text-sm text-[color:var(--brand-muted)] mt-1">Enroll in a path to begin your journey</p>
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
                    <div className="flex items-center gap-3 rounded-2xl border border-white/8 p-4"
                      style={{ background: `${meta.accentColour}08` }}>
                      <Lock size={18} style={{ color: meta.accentColour }} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[color:var(--brand-ink)]">Sangam Pro — unlimited paths</p>
                        <p className="text-[10px] text-[color:var(--brand-muted)] mt-0.5">
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
                <p className="text-xs text-[color:var(--brand-muted)]">
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
    </div>
  );
}
