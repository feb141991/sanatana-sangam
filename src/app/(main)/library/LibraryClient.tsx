'use client';

import { useMemo, useState } from 'react';
import { Search, X, ChevronDown, ChevronUp, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  ALL_LIBRARY_ENTRIES,
  LIBRARY_SECTIONS,
  PATHSHALA_TRADITIONS,
  getDefaultSectionForTradition,
  getEntriesBySection,
  getPathshalaTrackGroups,
  getPathshalaTraditionMeta,
  getSectionsByTradition,
  searchEntries,
  type LibraryEntry,
  type LibrarySection,
  type LibraryTradition,
} from '@/lib/library-content';
import { getLibrarySourceMeta } from '@/lib/library-provenance';

async function shareEntry(entry: LibraryEntry) {
  const text = `${entry.title} — ${entry.source}\n\n${entry.original}\n\n${entry.transliteration}\n\nMeaning: ${entry.meaning}\n\n— Shared via Sanatana Sangam Pathshala`;
  if (navigator.share) {
    try {
      await navigator.share({ title: entry.title, text });
      return;
    } catch {
      // User cancelled share sheet.
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  } catch {
    toast.error('Unable to share');
  }
}

const TRADITION_STYLE: Record<LibraryTradition, { panel: string; border: string; badge: string; accent: string }> = {
  hindu: {
    panel: 'bg-orange-50/85',
    border: 'border-orange-100',
    badge: 'bg-orange-100 text-orange-700',
    accent: 'var(--brand-primary-strong)',
  },
  sikh: {
    panel: 'bg-sky-50/85',
    border: 'border-sky-100',
    badge: 'bg-sky-100 text-sky-700',
    accent: '#1f5d8a',
  },
  buddhist: {
    panel: 'bg-amber-50/90',
    border: 'border-amber-100',
    badge: 'bg-amber-100 text-amber-700',
    accent: '#8c5a1f',
  },
  jain: {
    panel: 'bg-emerald-50/85',
    border: 'border-emerald-100',
    badge: 'bg-emerald-100 text-emerald-700',
    accent: '#25624a',
  },
};

function getSectionForEntry(entry: LibraryEntry) {
  return LIBRARY_SECTIONS.find((section) => (
    (section.tradition === entry.tradition && section.category === entry.category) ||
    (section.id === 'gurbani' && entry.tradition === 'sikh' && (entry.category === 'gurbani' || entry.category === 'nitnem'))
  ));
}

function getSectionById(sectionId: string): LibrarySection | undefined {
  return LIBRARY_SECTIONS.find((section) => section.id === sectionId);
}

function EntryCard({ entry }: { entry: LibraryEntry }) {
  const [expanded, setExpanded] = useState(false);
  const style = TRADITION_STYLE[entry.tradition] ?? TRADITION_STYLE.hindu;
  const section = getSectionForEntry(entry);
  const sourceMeta = getLibrarySourceMeta(entry);

  return (
    <div className={`${style.panel} ${style.border} border rounded-[1.6rem] p-4 space-y-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
              {section?.emoji ?? '📚'} {section?.title ?? entry.category}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 text-gray-600 border border-gray-200">
              {sourceMeta.label}
            </span>
          </div>
          <h3 className="font-display font-bold text-sm leading-tight text-gray-900">{entry.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{entry.source}</p>
        </div>
        <button
          onClick={() => shareEntry(entry)}
          className="w-7 h-7 rounded-full bg-white/70 border border-gray-200 flex items-center justify-center flex-shrink-0 hover:bg-white transition"
          title="Share"
        >
          <Share2 size={12} className="text-gray-500" />
        </button>
      </div>

      <p
        className={`font-devanagari text-sm leading-relaxed whitespace-pre-line ${
          entry.tradition === 'sikh'
            ? 'font-sans text-sm'
            : entry.tradition === 'buddhist' || entry.tradition === 'jain'
              ? 'font-mono text-xs'
              : 'text-base'
        }`}
        style={{ fontFamily: entry.tradition === 'hindu' ? 'var(--font-devanagari, serif)' : 'inherit' }}
      >
        {entry.original}
      </p>

      <p className="text-xs text-gray-500 italic leading-relaxed whitespace-pre-line">
        {entry.transliteration}
      </p>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs font-medium transition"
        style={{ color: style.accent }}
      >
        {expanded ? 'Hide meaning' : 'Show meaning'}
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && (
        <div className="pt-2 border-t border-white/40">
          <div className="clay-card rounded-2xl px-3 py-2.5 mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Source note</p>
            <p className="text-xs text-gray-600 leading-relaxed mt-1">{sourceMeta.note}</p>
          </div>
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

export default function LibraryClient({ defaultSection = 'gita' }: { defaultSection?: string }) {
  const validDefaultSection = getSectionById(defaultSection)?.id ?? 'gita';
  const defaultTradition = getSectionById(validDefaultSection)?.tradition ?? 'hindu';
  const defaultGroup = getPathshalaTrackGroups(defaultTradition).find((group) => group.sectionIds.includes(validDefaultSection));

  const [selectedTradition, setSelectedTradition] = useState<LibraryTradition>(defaultTradition);
  const [activeGroupId, setActiveGroupId] = useState<string>(defaultGroup?.id ?? getPathshalaTrackGroups(defaultTradition)[0]?.id ?? '');
  const [activeSectionId, setActiveSectionId] = useState<string>(validDefaultSection);
  const [searchQuery, setSearchQuery] = useState('');

  const traditionMeta = useMemo(
    () => getPathshalaTraditionMeta(selectedTradition),
    [selectedTradition]
  );

  const trackGroups = useMemo(
    () => getPathshalaTrackGroups(selectedTradition),
    [selectedTradition]
  );

  const activeGroup = trackGroups.find((group) => group.id === activeGroupId) ?? trackGroups[0] ?? null;
  const visibleSections = useMemo(
    () => (activeGroup
      ? activeGroup.sectionIds.map((sectionId) => getSectionById(sectionId)).filter(Boolean) as LibrarySection[]
      : getSectionsByTradition(selectedTradition)),
    [activeGroup, selectedTradition]
  );

  const activeSection = visibleSections.find((section) => section.id === activeSectionId)
    ?? visibleSections[0]
    ?? getSectionById(getDefaultSectionForTradition(selectedTradition));

  const entries = useMemo(() => {
    if (searchQuery.trim()) {
      return searchEntries(searchQuery).filter((entry) => entry.tradition === selectedTradition);
    }
    if (activeSection) {
      return getEntriesBySection(activeSection.id);
    }
    return ALL_LIBRARY_ENTRIES.filter((entry) => entry.tradition === selectedTradition);
  }, [activeSection, searchQuery, selectedTradition]);

  function handleTraditionChange(tradition: LibraryTradition) {
    const nextGroups = getPathshalaTrackGroups(tradition);
    const nextGroup = nextGroups[0] ?? null;
    const nextSection = nextGroup?.sectionIds[0] ?? getDefaultSectionForTradition(tradition);

    setSelectedTradition(tradition);
    setActiveGroupId(nextGroup?.id ?? '');
    setActiveSectionId(nextSection);
    setSearchQuery('');
  }

  function handleGroupChange(groupId: string) {
    const nextGroup = trackGroups.find((group) => group.id === groupId);
    setActiveGroupId(groupId);
    if (nextGroup?.sectionIds[0]) {
      setActiveSectionId(nextGroup.sectionIds[0]);
    }
  }

  return (
    <div className="space-y-4 pb-6 fade-in">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-primary)]">
          Tradition-first study
        </p>
        <h1 className="font-display font-bold text-xl text-gray-900 mt-1">Parampara Pathshala</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Choose your tradition first, then move through scripture categories, study tracks, and source-aware passages.
        </p>
      </div>

      <div className="clay-card rounded-[1.6rem] px-4 py-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">Pathshala trust layer</p>
        <p className="text-sm text-gray-700 leading-relaxed">
          Pathshala is being rebuilt as a real study surface. Each text is anchored to a tradition, a scripture track, and a source note so study feels guided rather than random.
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">
          This is the first structural step. Rights-cleared full texts, deeper cataloging, and learning loops will come in stages.
        </p>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={`Search ${traditionMeta.label.replace(' Pathshala', '')} texts, verses, and concepts…`}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="glass-input w-full pl-9 pr-9 py-2.5 rounded-xl border border-white/60 focus:border-[color:var(--brand-primary)] outline-none text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <section className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Choose tradition</p>
          <p className="text-sm text-gray-500 mt-1">Each tradition opens its own scripture families and study tracks.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {PATHSHALA_TRADITIONS.map((tradition) => {
            const active = tradition.id === selectedTradition;
            const traditionSections = getSectionsByTradition(tradition.id);
            const traditionCount = ALL_LIBRARY_ENTRIES.filter((entry) => entry.tradition === tradition.id).length;

            return (
              <button
                key={tradition.id}
                onClick={() => handleTraditionChange(tradition.id)}
                className={`text-left rounded-[1.6rem] p-4 border transition ${
                  active
                    ? 'text-white shadow-lg'
                    : 'glass-panel hover:-translate-y-0.5'
                }`}
                style={active ? {
                  background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))',
                  borderColor: 'rgba(255,255,255,0.18)',
                } : undefined}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-2xl ${active ? '' : 'opacity-90'}`}>{tradition.emoji}</p>
                    <h2 className={`font-display font-bold text-base mt-2 ${active ? 'text-white' : 'text-gray-900'}`}>
                      {tradition.label}
                    </h2>
                  </div>
                  <span
                    className={`text-[11px] px-2.5 py-1 rounded-full border ${active ? 'border-white/20 bg-white/10 text-white' : 'border-white/70 bg-white/70 text-gray-600'}`}
                  >
                    {traditionSections.length} tracks
                  </span>
                </div>
                <p className={`text-sm leading-relaxed mt-3 ${active ? 'text-white/78' : 'text-gray-600'}`}>
                  {tradition.description}
                </p>
                <p className={`text-xs mt-3 ${active ? 'text-white/65' : 'text-gray-500'}`}>
                  {traditionCount} passages in this Pathshala
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Scripture categories</p>
          <p className="text-sm text-gray-500 mt-1">{traditionMeta.studyPrompt}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {trackGroups.map((group) => {
            const active = group.id === activeGroupId;
            const sectionCount = group.sectionIds.length;
            const passageCount = group.sectionIds.reduce((sum, sectionId) => {
              const section = getSectionById(sectionId);
              return sum + (section?.count ?? 0);
            }, 0);

            return (
              <button
                key={group.id}
                onClick={() => handleGroupChange(group.id)}
                className={`text-left rounded-[1.45rem] p-4 border transition ${
                  active
                    ? 'clay-card'
                    : 'glass-panel hover:-translate-y-0.5'
                }`}
                style={active ? {
                  borderColor: 'rgba(31, 107, 114, 0.22)',
                } : undefined}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{group.title}</p>
                    <p className="text-sm text-gray-600 leading-relaxed mt-1">{group.desc}</p>
                  </div>
                  <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">
                    {sectionCount} tracks
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-3">{passageCount} passages across this category</p>
              </button>
            );
          })}
        </div>
      </section>

      {visibleSections.length > 0 && (
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Study tracks</p>
            <p className="text-sm text-gray-500 mt-1">Choose the text-family you want to read from inside this category.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {visibleSections.map((section) => {
              const active = activeSection?.id === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-medium transition border ${
                    active
                      ? 'text-white'
                      : 'glass-chip text-gray-600 hover:text-gray-900'
                  }`}
                  style={active ? { background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))', borderColor: 'transparent' } : undefined}
                >
                  {section.emoji} {section.title}
                  <span className={`ml-1 ${active ? 'text-white/80' : 'text-gray-400'}`}>({section.count})</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {activeSection && !searchQuery && (
        <div className="glass-panel rounded-[1.5rem] px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{activeSection.emoji}</span>
            <div>
              <p className="font-semibold text-sm text-gray-800">{activeSection.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{activeSection.desc}</p>
            </div>
          </div>
        </div>
      )}

      {searchQuery ? (
        <p className="text-xs text-gray-400">
          {entries.length} result{entries.length !== 1 ? 's' : ''} in {traditionMeta.label} for &ldquo;{searchQuery}&rdquo;
        </p>
      ) : (
        <p className="text-xs text-gray-400">
          {entries.length} passage{entries.length !== 1 ? 's' : ''} in {activeSection?.title ?? traditionMeta.label}
        </p>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-[1.8rem]">
          <p className="text-3xl mb-3">📚</p>
          <p className="text-sm font-medium text-gray-700">No Pathshala entries found</p>
          <p className="text-xs text-gray-400 mt-1">
            Try a different search, or choose another tradition or study track.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      <div className="text-center py-4">
        <p className="text-xs text-gray-400">
          Pathshala translations are for study and orientation. For formal recitation, lineage practice, or doctrinal certainty, always defer to the cited source tradition.
        </p>
      </div>
    </div>
  );
}
