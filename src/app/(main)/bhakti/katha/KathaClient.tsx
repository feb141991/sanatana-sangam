'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, BookOpen, Clock, Filter, Search, Sparkles, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Katha, KathaTradition } from '@/lib/katha-library';

interface Props {
  todayKatha: Katha;
  weekKathas: Katha[];
  traditionKathas: Katha[];
  allKathas: Katha[];
  tradition: string;
  userName: string;
}

const THEME = {
  bg: '#1A1918',
  void: '#010101',
  charcoal: '#2C2C2F',
  gold: '#C09759',
  goldGlow: 'rgba(192, 151, 89, 0.1)',
  textMuted: 'rgba(255, 255, 255, 0.4)',
};

const TRADITION_LABELS: Record<string, { label: string; termKatha: string; color: string }> = {
  hindu:    { label: 'Hindu',    termKatha: 'Kathas',  color: '#FF6B35' },
  sikh:     { label: 'Sikh',     termKatha: 'Sakhis',  color: '#1B7FD4' },
  buddhist: { label: 'Buddhist', termKatha: 'Dhamma Stories', color: '#7C5CBF' },
  jain:     { label: 'Jain',     termKatha: 'Kathas',  color: '#2D9E4A' },
};

const OCCASION_LABELS: Record<string, string> = {
  ekadashi: 'Ekadashi', purnima: 'Purnima', amavasya: 'Amavasya',
  pradosh: 'Pradosh', chaturthi: 'Chaturthi', shivaratri: 'Shivaratri',
  navratri: 'Navratri', diwali: 'Diwali', holi: 'Holi',
  janmashtami: 'Janmashtami', ramnavami: 'Ram Navami',
  'ganesh-chaturthi': 'Ganesh Chaturthi', 'karva-chauth': 'Karva Chauth',
  teej: 'Teej', gurpurab: 'Gurpurab', baisakhi: 'Baisakhi',
  vesak: 'Vesak', paryushana: 'Paryushana', general: 'General',
};

function KathaCard({ katha, size = 'normal' }: { katha: Katha; size?: 'normal' | 'compact' }) {
  const trad = TRADITION_LABELS[katha.tradition] ?? TRADITION_LABELS.hindu;
  return (
    <Link href={`/bhakti/katha/${katha.id}`}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        className={`rounded-[2rem] border border-white/5 bg-[#2C2C2F]/30 p-5 flex flex-col gap-3 active:border-[#C09759]/20 transition-all ${size === 'compact' ? 'min-w-[260px]' : ''}`}
      >
        {/* Tags row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[9px] font-bold uppercase tracking-[0.25em] px-2.5 py-1 rounded-full border"
            style={{ color: trad.color, borderColor: `${trad.color}30`, background: `${trad.color}10` }}
          >
            {trad.label}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 px-2.5 py-1 rounded-full border border-white/5">
            {OCCASION_LABELS[katha.occasion] ?? katha.occasion}
          </span>
          {katha.deity && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#C09759]/60 px-2.5 py-1 rounded-full border border-[#C09759]/10">
              {katha.deity.charAt(0).toUpperCase() + katha.deity.slice(1)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-white font-semibold text-[15px] leading-snug line-clamp-2">{katha.title}</h3>

        {/* Preview */}
        <p className="text-white/40 text-[12px] leading-relaxed line-clamp-4">{katha.preview}</p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-[10px] text-white/25 font-medium">
            <Clock size={10} />
            <span>{katha.durationMin} min read</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-[#C09759]/70 uppercase tracking-widest">
            <span>Read</span>
            <ChevronRight size={10} />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

const TRADITIONS = ['all', 'hindu', 'sikh', 'buddhist', 'jain'] as const;

export default function KathaClient({
  todayKatha, weekKathas, traditionKathas, allKathas, tradition, userName
}: Props) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'all' | KathaTradition>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filtered = allKathas.filter(k => {
    const matchTrad = activeFilter === 'all' || k.tradition === activeFilter;
    const matchSearch = searchQuery.trim() === '' ||
      k.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.deity ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      OCCASION_LABELS[k.occasion]?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTrad && matchSearch;
  });

  const trad = TRADITION_LABELS[tradition] ?? TRADITION_LABELS.hindu;

  return (
    <div
      className="relative min-h-screen pb-32 overflow-x-hidden"
      style={{ backgroundColor: THEME.bg, color: 'white' }}
    >
      {/* ── Ambient glow ── */}
      <div className="fixed top-0 right-0 w-80 h-80 bg-[#C09759]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none -z-10" />

      {/* ── Header ── */}
      <div className="sticky top-0 z-40 px-6 pt-12 pb-4 backdrop-blur-xl" style={{ background: 'rgba(26,25,24,0.85)' }}>
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5"
          >
            <ChevronLeft size={20} color={THEME.gold} />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#C09759] opacity-70">Sacred Library</p>
          </div>
          <button
            onClick={() => setShowSearch(s => !s)}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5"
          >
            <Search size={16} color={THEME.gold} />
          </button>
        </div>
        <h1 className="text-4xl font-serif text-white mt-3">Sacred Kathas</h1>
        <p className="text-white/35 text-[12px] mt-1">{allKathas.length} stories across all traditions</p>

        {/* Search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <input
                type="text"
                placeholder="Search by name, deity, occasion…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full mt-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-[13px] placeholder:text-white/25 outline-none focus:border-[#C09759]/40"
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 1. Today's Katha Hero ── */}
      {!searchQuery && (
        <section className="px-6 mt-2">
          <Link href={`/bhakti/katha/${todayKatha.id}`}>
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="rounded-[2.5rem] p-1 border border-[#C09759]/25 shadow-2xl"
              style={{ background: `linear-gradient(135deg, #2C2C2F, #010101)` }}
            >
              <div className="p-6 space-y-4">
                {/* Badge */}
                <div className="flex items-center gap-2">
                  <Sparkles size={11} color={THEME.gold} />
                  <span className="text-[10px] font-bold text-[#C09759] uppercase tracking-[0.3em]">Today's Katha</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-[#C09759]/20 text-[#C09759]/80">
                    {TRADITION_LABELS[todayKatha.tradition]?.label}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/10 text-white/40">
                    {OCCASION_LABELS[todayKatha.occasion]}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-serif text-white leading-snug">{todayKatha.title}</h2>

                {/* Preview */}
                <p className="text-white/40 text-[13px] leading-relaxed line-clamp-4">{todayKatha.preview}</p>

                {/* CTA */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5 text-white/25 text-[11px]">
                    <Clock size={11} />
                    <span>{todayKatha.durationMin} min</span>
                  </div>
                  <div
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[#010101] text-[12px] font-bold"
                    style={{ backgroundColor: THEME.gold }}
                  >
                    <BookOpen size={13} />
                    <span>Read Katha</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        </section>
      )}

      {/* ── 2. This Week's Kathas (horizontal scroll) ── */}
      {!searchQuery && (
        <section className="mt-10">
          <div className="px-6 flex items-center justify-between mb-5">
            <h3 className="text-xl font-serif text-white">This Week</h3>
            <span className="text-[10px] font-bold text-[#C09759]/60 uppercase tracking-widest">5 stories</span>
          </div>
          <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-none snap-x">
            {weekKathas.map(k => (
              <div key={k.id} className="flex-shrink-0 w-[270px] snap-start">
                <KathaCard katha={k} size="compact" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 3. Your Tradition ── */}
      {!searchQuery && traditionKathas.length > 0 && (
        <section className="px-6 mt-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#C09759]/70 mb-1">Your Tradition</p>
              <h3 className="text-xl font-serif text-white">{trad.termKatha}</h3>
            </div>
          </div>
          <div className="space-y-4">
            {traditionKathas.map(k => (
              <KathaCard key={k.id} katha={k} />
            ))}
          </div>
        </section>
      )}

      {/* ── 4. Browse All — with tradition filter ── */}
      <section className="px-6 mt-12">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-serif text-white">
            {searchQuery ? `Results (${filtered.length})` : 'All Kathas'}
          </h3>
          <Filter size={14} color={THEME.gold} className="opacity-50" />
        </div>

        {/* Tradition filter tabs */}
        {!searchQuery && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
            {TRADITIONS.map(t => (
              <motion.button
                key={t}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveFilter(t)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest border transition-all duration-300 ${
                  activeFilter === t
                    ? 'border-[#C09759] text-[#C09759] bg-[#C09759]/10'
                    : 'border-white/10 text-white/35 bg-transparent'
                }`}
              >
                {t === 'all' ? 'All' : TRADITION_LABELS[t]?.label ?? t}
              </motion.button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-white/25 text-sm">
              No kathas found for &quot;{searchQuery}&quot;
            </div>
          ) : (
            filtered.map(k => (
              <KathaCard key={k.id} katha={k} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
