'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, MapPin, Clock, X, Search, Radio, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiveStream, LiveStreamCategory } from '@/lib/live-streams';
import SacredIcon, { SacredIconName } from '@/components/ui/SacredIcon';

interface LiveDarshanClientProps {
  tradition: string;
  userId: string;
  streams: LiveStream[];
}

type TraditionFilter = 'all' | 'hindu' | 'sikh' | 'jain' | 'buddhist';
type CategoryFilter = 'all' | LiveStreamCategory;

const TRADITION_LABELS: Record<TraditionFilter, { label: string; icon: SacredIconName }> = {
  all:      { label: 'All',      icon: 'sparkles' },
  hindu:    { label: 'Hindu',    icon: 'landmark' },
  sikh:     { label: 'Sikh',     icon: 'music' },
  jain:     { label: 'Jain',     icon: 'flower' },
  buddhist: { label: 'Buddhist', icon: 'flower' },
};

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all:     'All',
  mandir:  'Mandir',
  katha:   'Katha',
  satsang: 'Satsang',
};

export default function LiveDarshanClient({ tradition, userId, streams }: LiveDarshanClientProps) {
  const [activeTradition, setActiveTradition] = useState<TraditionFilter>('all');
  const [activeCategory, setActiveCategory]   = useState<CategoryFilter>('all');
  const [activePlayer, setActivePlayer]       = useState<string | null>(null);
  const [search, setSearch]                   = useState('');
  const [showFilters, setShowFilters]         = useState(false);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [activeIshta, setActiveIshta]         = useState<string>('all');
  const [activeState, setActiveState]         = useState<string>('all');

  const ALL_COLLECTIONS = [
    { id: 'Char Dham',     label: 'Char Dham',    icon: 'mountain' as SacredIconName, color: '#FF9933', desc: 'The 4 holy abodes', trad: 'hindu' },
    { id: 'Jyotirlinga',   label: 'Jyotirlinga',  icon: 'sparkles' as SacredIconName, color: '#660000', desc: '12 Radiant Lingas', trad: 'hindu' },
    { id: 'Rivers',        label: 'Holy Rivers',  icon: 'water' as SacredIconName, color: '#0066CC', desc: 'Ganga & Yamuna Aarti', trad: 'hindu' },
    { id: 'Panj Takht',    label: 'Panj Takht',   icon: 'landmark' as SacredIconName, color: '#FFCC00', desc: '5 Sikh Thrones',      trad: 'sikh'  },
    { id: 'Gurbani Kirtan',label: 'Kirtan',       icon: 'music' as SacredIconName, color: '#336600', desc: 'Akhand Gurbani',      trad: 'sikh'  },
    { id: 'Jain Path',     label: 'Jain Path',    icon: 'flower' as SacredIconName, color: '#FF6666', desc: 'Tirthankar Bhakti',   trad: 'jain'  },
    { id: 'Bodhi Path',    label: 'Bodhi Path',   icon: 'flower' as SacredIconName, color: '#9933CC', desc: 'Peace of Buddha',      trad: 'buddhist' },
    { id: 'Saptapuri',     label: 'Saptapuri',    icon: 'landmark' as SacredIconName, color: '#CC9900', desc: '7 Ancient Holy Cities', trad: 'hindu' },
    { id: 'Shaktipeeth',   label: 'Shaktipeeth',  icon: 'sparkles' as SacredIconName, color: '#FF3300', desc: 'Seats of the Goddess', trad: 'hindu' },
  ];

  // Sort collections to show user's tradition first
  const FEATURED_COLLECTIONS = [...ALL_COLLECTIONS].sort((a, b) => {
    if (a.trad === tradition && b.trad !== tradition) return -1;
    if (a.trad !== tradition && b.trad === tradition) return 1;
    return 0;
  });

  // Dynamically extract unique options from streams
  const ishtaOptions = ['all', ...Array.from(new Set(streams.map(s => s.ishtaDevata).filter(Boolean)))];
  const stateOptions = ['all', ...Array.from(new Set(streams.map(s => s.state).filter(Boolean)))];

  const filtered = streams
    .filter(s => {
      if (activeTradition !== 'all' && s.tradition !== activeTradition) return false;
      if (activeCategory  !== 'all' && s.category  !== activeCategory)  return false;
      if (activeIshta     !== 'all' && s.ishtaDevata !== activeIshta)   return false;
      if (activeState     !== 'all' && s.state       !== activeState)   return false;
      if (activeCollection && !s.collections?.includes(activeCollection)) return false;
      if (search && !s.title.toLowerCase().includes(search.toLowerCase()) &&
          !s.location.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      // Prioritize user's tradition if we are in 'all' view or if multiple match
      if (a.tradition === tradition && b.tradition !== tradition) return -1;
      if (a.tradition !== tradition && b.tradition === tradition) return 1;
      return 0;
    });

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] flex flex-col pb-28">
      <div className="bg-[var(--divine-bg)] border-b border-[var(--divine-border)] px-4 pt-6 pb-3 space-y-4">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[var(--divine-text)]">Live Darshan</h1>
            <p className="text-xs text-[var(--divine-muted)] mt-0.5">{filtered.length} streams available</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Live</span>
          </div>
        </div>
        {/* Collections Scroll */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 px-1">
          <button
            onClick={() => setActiveCollection(null)}
            className={`flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-2xl border transition-all ${
              !activeCollection 
                ? 'bg-[var(--divine-saffron)]/10 border-[var(--divine-saffron)] text-[var(--divine-saffron)]'
                : 'bg-[var(--divine-surface)] border-[var(--divine-border)] text-[var(--divine-muted)]'
            }`}
          >
            <SacredIcon name="sparkles" size={20} className="mb-1" />
            <span className="text-[10px] font-bold">Explore</span>
          </button>
          
          {FEATURED_COLLECTIONS.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveCollection(col.id === activeCollection ? null : col.id)}
              className={`flex-shrink-0 flex flex-col justify-between w-32 h-20 p-2.5 rounded-2xl border transition-all relative overflow-hidden ${
                activeCollection === col.id
                  ? 'border-transparent text-white shadow-lg'
                  : 'bg-[var(--divine-surface)] border-[var(--divine-border)] text-[var(--divine-text)]'
              }`}
              style={activeCollection === col.id ? { backgroundColor: col.color } : {}}
            >
              <div className="flex justify-between items-start">
                <SacredIcon name={col.icon} size={18} />
                {activeCollection === col.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </div>
              <div className="text-left">
                <p className={`text-[10px] font-black uppercase tracking-wider leading-none mb-0.5 ${activeCollection === col.id ? 'text-white/90' : 'text-[var(--divine-text)]'}`}>
                  {col.label}
                </p>
                <p className={`text-[8px] font-medium leading-none ${activeCollection === col.id ? 'text-white/70' : 'text-[var(--divine-muted)]'}`}>
                  {col.desc}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Search & Filter Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--divine-muted)]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search temple or city…"
              className="w-full pl-9 pr-4 py-2.5 rounded-full text-sm bg-[var(--divine-surface)] border border-[var(--divine-border)] text-[var(--divine-text)] placeholder:text-[var(--divine-muted)] focus:outline-none focus:border-[var(--divine-saffron)]/50"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-full border transition-all flex items-center gap-2 ${
              showFilters || activeTradition !== 'all' || activeCategory !== 'all' || activeIshta !== 'all' || activeState !== 'all'
                ? 'bg-[var(--divine-saffron)]/10 border-[var(--divine-saffron)]/30 text-[var(--divine-saffron)]'
                : 'bg-[var(--divine-surface)] border-[var(--divine-border)] text-[var(--divine-muted)]'
            }`}
          >
            <SlidersHorizontal size={18} />
            {(activeTradition !== 'all' || activeCategory !== 'all' || activeIshta !== 'all' || activeState !== 'all') && !showFilters && (
              <span className="text-[10px] font-bold uppercase tracking-wider pr-1">Active</span>
            )}
          </button>
        </div>

        {/* Collapsible Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden space-y-3"
            >
              {/* Tradition filter */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                {(Object.keys(TRADITION_LABELS) as TraditionFilter[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTradition(t)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                      activeTradition === t
                        ? 'bg-[var(--divine-saffron)] text-white border-transparent shadow-[0_4px_12px_rgba(216,138,28,0.3)]'
                        : 'bg-[var(--divine-surface)] text-[var(--divine-muted)] border-[var(--divine-border)]'
                    }`}
                  >
                    <SacredIcon name={TRADITION_LABELS[t].icon} size={13} />
                    {TRADITION_LABELS[t].label}
                  </button>
                ))}
              </div>

              {/* Category filter */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map(c => (
                  <button
                    key={c}
                    onClick={() => setActiveCategory(c)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border capitalize ${
                      activeCategory === c
                        ? 'bg-[var(--divine-text)] text-[var(--divine-bg)] border-transparent'
                        : 'bg-transparent text-[var(--divine-muted)] border-[var(--divine-border)]'
                    }`}
                  >
                    {CATEGORY_LABELS[c]}
                  </button>
                ))}
              </div>

              {/* Ishta Devata filter */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                {ishtaOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setActiveIshta(opt as string)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border capitalize ${
                      activeIshta === opt
                        ? 'bg-[var(--divine-text)] text-[var(--divine-bg)] border-transparent'
                        : 'bg-transparent text-[var(--divine-muted)] border-[var(--divine-border)]'
                    }`}
                  >
                    {opt === 'all' ? 'All Deities' : opt}
                  </button>
                ))}
              </div>

              {/* State filter */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                {stateOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setActiveState(opt as string)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border capitalize ${
                      activeState === opt
                        ? 'bg-[var(--divine-text)] text-[var(--divine-bg)] border-transparent'
                        : 'bg-transparent text-[var(--divine-muted)] border-[var(--divine-border)]'
                    }`}
                  >
                    {opt === 'all' ? 'All Locations' : opt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Stream Grid ── */}
      <main className="flex-1 px-4 pt-4 max-w-2xl mx-auto w-full">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <Radio size={40} className="text-[var(--divine-muted)] opacity-40" />
            <p className="text-[var(--divine-muted)] text-sm">No live streams found for this filter.</p>
            <button
              onClick={() => { setActiveTradition('all'); setActiveCategory('all'); setSearch(''); }}
              className="text-xs font-semibold text-[var(--divine-saffron)] underline"
            >Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((stream, i) => (
                <motion.div
                  key={stream.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="rounded-2xl overflow-hidden bg-[var(--divine-surface)] border border-[var(--divine-border)]"
                >
                  {/* Thumbnail / Player */}
                  <div className="relative w-full aspect-video bg-black">
                    {activePlayer === stream.id ? (
                      <div className="w-full h-full relative">
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${stream.youtubeVideoId}?autoplay=1&mute=0&controls=1`}
                          title={`${stream.title} Live`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                        />
                        <button
                          onClick={() => setActivePlayer(null)}
                          className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-black/60 text-white backdrop-blur-sm"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="w-full h-full relative cursor-pointer group"
                        onClick={() => setActivePlayer(stream.id)}
                      >
                        <Image
                          src={`https://i.ytimg.com/vi/${stream.youtubeVideoId}/hqdefault.jpg`}
                          alt={stream.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        {/* Play button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-xl group-hover:bg-red-500 group-hover:scale-110 transition-all duration-200">
                            <Play className="text-white fill-white ml-0.5" size={22} />
                          </div>
                        </div>

                        {/* Live badge */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600 shadow">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          <span className="text-[9px] font-bold text-white uppercase tracking-widest">Live</span>
                        </div>

                        {/* Tradition badge */}
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-black/50 text-white/80 backdrop-blur-sm capitalize">
                          {stream.tradition}
                        </div>

                        {/* Bottom info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5 pt-6">
                          <p className="text-white font-serif font-bold text-sm leading-tight drop-shadow">{stream.title}</p>
                          <p className="text-white/70 text-[10px] mt-0.5 drop-shadow">{stream.location}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[var(--divine-muted)] text-xs">
                        <MapPin size={11} />
                        <span>{stream.location}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[var(--divine-muted)] text-xs">
                        <Clock size={11} />
                        <span>{stream.schedule}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--divine-saffron)]/10 text-[var(--divine-saffron)] capitalize">
                      {stream.category}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
