'use client';

// ─── Pathshala — Scripture Learning Hub ──────────────────────────────────────
//
// Three-tab layout:
//   1. My Learning  — Shloka of Day + enrolled paths + progress
//   2. {Tradition}  — Tradition-gated scripture library (Hindu → Shastra,
//                     Sikh → Gurbani, Buddhist → Dhamma, Jain → Agam)
//                     Sourced from static library-content.ts now;
//                     falls over to pathshala.corpus.listTexts() once DB is seeded.
//   3. Explore      — Browse all learning paths + enroll
//
// This replaces the old /library route entirely.
//
// Tradition filtering:
//   - Sikh users see ONLY Gurbani / Nitnem
//   - Buddhist users see ONLY Dhammapada / Suttas
//   - Jain users see ONLY Jain Agamas
//   - Hindu / Other sees all Hindu sections (Gita, Upanishads, Vedas, etc.)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, BookOpen, Mic, Trophy,
  Loader2, Play, Star, Plus, Search, X,
  Share2, ChevronDown, ChevronUp, GraduationCap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useEngine, usePathshala } from '@/contexts/EngineContext';
import { getTraditionMeta } from '@/lib/tradition-config';
import {
  ALL_LIBRARY_ENTRIES, LIBRARY_SECTIONS,
  getEntriesBySection,
  searchEntries,
  type LibraryEntry,
  type LibrarySection,
} from '@/lib/library-content';

// ── Difficulty colours ─────────────────────────────────────────────────────────
const DIFF_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  beginner:     { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Beginner'     },
  intermediate: { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Intermediate' },
  advanced:     { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Advanced'     },
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
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm border-gray-100`}>
      <button
        className="w-full text-left px-4 py-4"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{entry.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{entry.source}</p>
          </div>
          {expanded
            ? <ChevronUp size={16} className="text-gray-400 shrink-0 mt-0.5" />
            : <ChevronDown size={16} className="text-gray-400 shrink-0 mt-0.5" />
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
        <div className="px-4 pb-4 space-y-3 border-t border-gray-50">
          {/* Full original */}
          <div className="pt-3">
            <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Original</p>
            <p className="text-sm font-[family:var(--font-deva)] leading-relaxed whitespace-pre-line"
              style={{ color: accentColour }}>
              {entry.original}
            </p>
          </div>
          {/* Transliteration */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Transliteration</p>
            <p className="text-sm text-gray-600 italic leading-relaxed">{entry.transliteration}</p>
          </div>
          {/* Meaning */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Meaning</p>
            <p className="text-sm text-gray-700 leading-relaxed">{entry.meaning}</p>
          </div>
          {/* Tags + Share */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex flex-wrap gap-1">
              {entry.tags.slice(0, 4).map(tag => (
                <span key={tag}
                  className="text-[10px] rounded-full px-2 py-0.5 font-medium"
                  style={{ background: `${accentColour}15`, color: accentColour }}>
                  {tag}
                </span>
              ))}
            </div>
            <button
              onClick={e => { e.stopPropagation(); shareEntry(entry); }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
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

  // Filter entries to the selected section, then optionally search
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
                    ? 'text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
          className="shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
        >
          {showSearch ? <X size={15} className="text-gray-500" /> : <Search size={15} className="text-gray-500" />}
        </button>
      </div>

      {/* Search box */}
      {showSearch && (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${navLabel}…`}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
      )}

      {/* Section description */}
      {!query && (
        <p className="text-xs text-gray-400 leading-relaxed">
          {sections.find(s => s.id === selectedSection)?.desc ?? ''}
        </p>
      )}

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-gray-400">No results for "{query}"</p>
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
  userId:    string;
  userName:  string;
  tradition: string;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PathshalaClient({ userId, userName, tradition }: Props) {
  const router      = useRouter();
  const { isReady } = useEngine();
  const pathshala   = usePathshala();
  const meta        = getTraditionMeta(tradition);

  const [shloka,      setShloka]    = useState<any>(null);
  const [activePaths, setActive]    = useState<any[]>([]);
  const [allPaths,    setAll]       = useState<any[]>([]);
  const [badges,      setBadges]    = useState<any[]>([]);
  const [loading,     setLoading]   = useState(true);
  const [enrolling,   setEnrolling] = useState<string | null>(null);

  // Tab: 'learn' | 'scripture' | 'explore'
  const [tab, setTab] = useState<'learn' | 'scripture' | 'explore'>('learn');

  // ── Load data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReady || !pathshala) return;
    async function load() {
      try {
        const [shlokaRes, active, all, earned] = await Promise.allSettled([
          pathshala!.shlokaOfDay.getOrFetch(userId),
          pathshala!.enrollment.getActive(userId),
          pathshala!.enrollment.getAllPaths(),
          pathshala!.badges.getEarned(userId),
        ]);
        if (shlokaRes.status === 'fulfilled') setShloka(shlokaRes.value);
        if (active.status    === 'fulfilled') setActive(active.value);
        if (all.status       === 'fulfilled') setAll(all.value);
        if (earned.status    === 'fulfilled') setBadges(earned.value);
      } catch (err) {
        console.error('[Pathshala] load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isReady, pathshala, userId]);

  // ── Enroll ───────────────────────────────────────────────────────────────────
  async function enroll(pathId: string) {
    if (!pathshala || enrolling) return;
    setEnrolling(pathId);
    try {
      await pathshala.enrollment.enroll(userId, pathId);
      const active = await pathshala.enrollment.getActive(userId);
      setActive(active);
      setTab('learn');
    } catch (err) {
      console.error('[Pathshala] enroll failed:', err);
    } finally {
      setEnrolling(null);
    }
  }

  // ── Shloka Card ──────────────────────────────────────────────────────────────
  function ShlokaCard() {
    if (!shloka) return null;
    return (
      <div className="rounded-3xl overflow-hidden shadow-sm border border-orange-100 mb-4">
        <div className="p-5" style={{ background: `linear-gradient(135deg, ${meta.accentColour} 0%, ${meta.accentColour}99 100%)` }}>
          <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-2">
            {meta.sacredTextLabel}
          </p>
          <p className="text-white font-bold text-lg font-[family:var(--font-deva)] leading-relaxed">
            {shloka.sanskrit ?? shloka.verse_text}
          </p>
          {shloka.transliteration && (
            <p className="text-white/70 text-sm mt-2 italic">{shloka.transliteration}</p>
          )}
        </div>
        <div className="bg-white p-4">
          <p className="text-sm text-gray-600 leading-relaxed">{shloka.meaning}</p>
          {shloka.source && <p className="text-xs text-gray-400 mt-2">— {shloka.source}</p>}
          {shloka.sankalpa_connection && (
            <div className="mt-3 bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-xs font-medium" style={{ color: meta.accentColour }}>🔗 Your sankalpa connection</p>
              <p className="text-xs text-gray-600 mt-1">{shloka.sankalpa_connection}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Active Path Card ──────────────────────────────────────────────────────────
  function ActivePathCard({ enrollment }: { enrollment: any }) {
    const path     = enrollment.path ?? {};
    const progress = enrollment.progress_percent ?? 0;
    const diff     = DIFF_STYLE[path.difficulty] ?? DIFF_STYLE.beginner;
    return (
      <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
            style={{ background: `${meta.accentColour}10` }}>
            {TRAD_ICON[path.tradition] ?? '📖'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 text-sm">{path.title}</h3>
              <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${diff.bg} ${diff.text}`}>
                {diff.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{path.description}</p>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{enrollment.verses_completed ?? 0} verses</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: meta.accentColour }} />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Link href={`/pathshala/${enrollment.path_id}/lesson`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: meta.accentColour }}>
            <Play size={14} /> Today's Lesson
          </Link>
          <Link href={`/pathshala/${enrollment.path_id}/recite`}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-sm border"
            style={{ borderColor: `${meta.accentColour}30`, color: meta.accentColour }}>
            <Mic size={14} /> Recite
          </Link>
        </div>
      </div>
    );
  }

  // ── Browse Path Card ──────────────────────────────────────────────────────────
  function BrowsePathCard({ path }: { path: any }) {
    const isEnrolled = activePaths.some(e => e.path_id === path.id);
    const diff       = DIFF_STYLE[path.difficulty] ?? DIFF_STYLE.beginner;
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0">
            {TRAD_ICON[path.tradition] ?? '📖'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 text-sm">{path.title}</h3>
              <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${diff.bg} ${diff.text}`}>
                {diff.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{path.description}</p>
            {path.total_verses && <p className="text-xs text-gray-400 mt-1">{path.total_verses} verses</p>}
          </div>
        </div>
        <button
          disabled={isEnrolled || enrolling !== null}
          onClick={() => enroll(path.id)}
          className={`mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            isEnrolled
              ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
              : 'border hover:text-white'
          }`}
          style={!isEnrolled ? {
            background: `${meta.accentColour}08`,
            color: meta.accentColour,
            borderColor: `${meta.accentColour}30`,
          } : {}}
          onMouseEnter={e => { if (!isEnrolled) (e.currentTarget as HTMLButtonElement).style.background = meta.accentColour; }}
          onMouseLeave={e => { if (!isEnrolled) (e.currentTarget as HTMLButtonElement).style.background = `${meta.accentColour}08`; }}
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
    { id: 'explore'   as const, label: 'Explore Paths',    count: allPaths.length || undefined },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F0E8]">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white/80 border border-orange-100 flex items-center justify-center shadow-sm">
          <ChevronLeft size={20} style={{ color: meta.accentColour }} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{meta.symbol}</span>
            <h1 className="font-bold text-lg" style={{ color: meta.accentColour }}>Pathshala</h1>
          </div>
          <p className="text-xs text-gray-400">Digital Gurukul · {meta.label}</p>
        </div>
        {badges.length > 0 && (
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-xl px-3 py-1.5">
            <Trophy size={14} className="text-amber-500" />
            <span className="text-xs font-semibold text-amber-700">{badges.length}</span>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="px-4 mb-4">
        <div className="flex bg-white rounded-2xl border border-orange-50 p-1 shadow-sm gap-0.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                tab === t.id ? 'text-white shadow-sm' : 'text-gray-500'
              }`}
              style={tab === t.id ? { background: meta.accentColour } : {}}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`ml-1 text-[10px] ${tab === t.id ? 'text-white/70' : 'text-gray-400'}`}>
                  ({t.count})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {loading && tab !== 'scripture' ? (
        <div className="flex items-center justify-center gap-3 pt-20">
          <Loader2 size={22} className="animate-spin" style={{ color: meta.accentColour }} />
          <span className="text-sm text-gray-400">Loading your gurukul…</span>
        </div>
      ) : (
        <div className="px-4 pb-24 space-y-3">

          {/* ── My Learning ─────────────────────────────────────────────────── */}
          {tab === 'learn' && (
            <>
              <ShlokaCard />
              {activePaths.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap size={44} className="mx-auto mb-3 text-gray-200" />
                  <p className="font-semibold text-gray-600">No active learning paths</p>
                  <p className="text-sm text-gray-400 mt-1">Enroll in a path to begin your journey</p>
                  <button onClick={() => setTab('explore')}
                    className="mt-4 px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
                    style={{ background: meta.accentColour }}>
                    Explore Paths
                  </button>
                </div>
              ) : (
                activePaths.map(e => <ActivePathCard key={e.id} enrollment={e} />)
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
            allPaths.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen size={40} className="mx-auto mb-3 text-gray-200" />
                <p className="font-semibold text-gray-600">Learning paths coming soon</p>
                <p className="text-xs text-gray-400 mt-1">Seed pathshala_paths table to show paths here</p>
              </div>
            ) : (
              allPaths.map(p => <BrowsePathCard key={p.id} path={p} />)
            )
          )}

        </div>
      )}
    </div>
  );
}
