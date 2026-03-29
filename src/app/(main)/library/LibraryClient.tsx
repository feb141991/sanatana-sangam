'use client';

import { useState, useMemo } from 'react';
import { Search, X, ChevronDown, ChevronUp, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  ALL_LIBRARY_ENTRIES,
  LIBRARY_SECTIONS,
  getEntriesBySection,
  searchEntries,
  type LibraryEntry,
} from '@/lib/library-content';

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

// ── Tradition colours ──────────────────────────────────────────────────────────
const TRADITION_STYLE: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  hindu:    { bg: 'bg-orange-50', border: 'border-orange-100', badge: 'bg-orange-100 text-orange-700',  text: 'text-[#7B1A1A]' },
  sikh:     { bg: 'bg-blue-50',   border: 'border-blue-100',   badge: 'bg-blue-100 text-blue-700',      text: 'text-blue-700'   },
  buddhist: { bg: 'bg-amber-50',  border: 'border-amber-100',  badge: 'bg-amber-100 text-amber-700',    text: 'text-amber-700'  },
  jain:     { bg: 'bg-emerald-50',border: 'border-emerald-100',badge: 'bg-emerald-100 text-emerald-700',text: 'text-emerald-700'},
};

// ── Scripture Entry Card ───────────────────────────────────────────────────────
function EntryCard({ entry }: { entry: LibraryEntry }) {
  const [expanded, setExpanded] = useState(false);
  const style = TRADITION_STYLE[entry.tradition] ?? TRADITION_STYLE.hindu;
  const section = LIBRARY_SECTIONS.find((s) => s.id === entry.category || (s.id === 'gurbani' && (entry.category === 'gurbani' || entry.category === 'nitnem')));

  return (
    <div className={`${style.bg} ${style.border} border rounded-2xl p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
              {section?.emoji} {section?.title ?? entry.category}
            </span>
          </div>
          <h3 className={`font-display font-bold text-sm leading-tight ${style.text}`}>{entry.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{entry.source}</p>
        </div>
        <button onClick={() => shareEntry(entry)}
          className="w-7 h-7 rounded-full bg-white/60 border border-gray-200 flex items-center justify-center flex-shrink-0 hover:bg-white transition"
          title="Share">
          <Share2 size={12} className="text-gray-500" />
        </button>
      </div>

      {/* Original text */}
      <p className={`font-devanagari text-sm leading-relaxed whitespace-pre-line ${
        entry.tradition === 'sikh' ? 'font-sans text-sm' :
        entry.tradition === 'buddhist' || entry.tradition === 'jain' ? 'font-mono text-xs' :
        'text-base'
      }`} style={{ fontFamily: entry.tradition === 'hindu' ? 'var(--font-devanagari, serif)' : 'inherit' }}>
        {entry.original}
      </p>

      {/* Transliteration */}
      <p className="text-xs text-gray-500 italic leading-relaxed whitespace-pre-line">
        {entry.transliteration}
      </p>

      {/* Meaning toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-1 text-xs font-medium transition ${style.text}`}>
        {expanded ? 'Hide meaning' : 'Show meaning'}
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && (
        <div className="pt-2 border-t border-white/40">
          <p className="text-sm text-gray-700 leading-relaxed">{entry.meaning}</p>
          {entry.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-2">
              {entry.tags.map((tag) => (
                <span key={tag} className="text-[10px] bg-white/60 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Library Client ────────────────────────────────────────────────────────
export default function LibraryClient({ defaultSection = 'all' }: { defaultSection?: string }) {
  const [activeSection, setActiveSection] = useState<string>(defaultSection);
  const [searchQuery,   setSearchQuery]   = useState('');

  const entries = useMemo(() => {
    if (searchQuery.trim()) return searchEntries(searchQuery);
    if (activeSection === 'all') return ALL_LIBRARY_ENTRIES;
    return getEntriesBySection(activeSection);
  }, [activeSection, searchQuery]);

  return (
    <div className="space-y-4 pb-6 fade-in">

      {/* ── Header ── */}
      <div>
        <h1 className="font-display font-bold text-xl text-gray-900">Parampara Library</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Scriptures of Sanatan Dharma — Hindu · Sikh · Buddhist · Jain
        </p>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search shlokas, mantras, gurbani…"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setActiveSection('all'); }}
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none text-sm bg-white"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── Section tabs ── */}
      {!searchQuery && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveSection('all')}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              activeSection === 'all'
                ? 'text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-orange-200'
            }`}
            style={activeSection === 'all' ? { background: '#7B1A1A' } : {}}>
            🕉️ All ({ALL_LIBRARY_ENTRIES.length})
          </button>
          {LIBRARY_SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                activeSection === sec.id
                  ? TRADITION_STYLE[sec.tradition].badge + ' border-transparent'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-orange-200'
              }`}>
              {sec.emoji} {sec.title}
              <span className="text-[10px] opacity-60">({sec.count})</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Active section description ── */}
      {!searchQuery && activeSection !== 'all' && (
        <div className="rounded-xl px-4 py-3 border border-gray-100 bg-white">
          {(() => {
            const sec = LIBRARY_SECTIONS.find((s) => s.id === activeSection);
            return sec ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl">{sec.emoji}</span>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{sec.title}</p>
                  <p className="text-xs text-gray-500">{sec.desc}</p>
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* ── Results ── */}
      {searchQuery && (
        <p className="text-xs text-gray-400">
          {entries.length} result{entries.length !== 1 ? 's' : ''} for "{searchQuery}"
        </p>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">📚</p>
          <p className="text-sm font-medium text-gray-600">No results found</p>
          <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {/* ── Footer note ── */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-400">
          Translations are for understanding — consult a qualified teacher for deep study
        </p>
      </div>
    </div>
  );
}
