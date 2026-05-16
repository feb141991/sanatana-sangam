'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, BookOpen, Clock, Search, Sparkles, ChevronRight } from 'lucide-react';
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

const TRADITIONS = ['all', 'hindu', 'sikh', 'buddhist', 'jain'] as const;

export default function KathaClient({
  todayKatha, weekKathas, traditionKathas, allKathas, tradition, userName
}: Props) {
  const router = useRouter();
  const trad = TRADITION_LABELS[tradition] ?? TRADITION_LABELS.hindu;

  const [activeFilter, setActiveFilter] = useState<'all' | KathaTradition>(tradition as any);
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

  return (
    <div className="relative min-h-screen pb-24 overflow-x-hidden bg-[var(--divine-bg)] font-outfit selection:bg-[var(--brand-primary)] selection:text-black">
      {/* Atmospheric ambient glows */}
      <div className="fixed top-0 right-0 w-[60vw] h-[60vw] max-w-[400px] max-h-[400px] bg-[var(--brand-primary)]/[0.04] blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[50vw] h-[50vw] max-w-[300px] max-h-[300px] bg-rose-500/[0.03] blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 w-full px-4 pt-4 pb-3 backdrop-blur-[30px] bg-[var(--divine-bg)]/60 border-b border-white/[0.04]">
        <div className="flex items-center justify-between gap-3">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => router.back()}
            className="w-10 h-10 rounded-2xl border border-white/[0.08] flex items-center justify-center bg-white/[0.03] flex-shrink-0"
          >
            <ChevronLeft size={20} className="text-[var(--brand-primary)]" />
          </motion.button>

          <div className="flex flex-col items-center flex-1 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--brand-primary)]/60 mb-0.5">Sacred Library</span>
            <h1 className="text-[17px] font-serif font-bold text-white tracking-tight">Sacred Kathas</h1>
          </div>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowSearch(s => !s)}
            className="w-10 h-10 rounded-2xl border border-white/[0.08] flex items-center justify-center bg-white/[0.03] flex-shrink-0"
          >
            <Search size={18} className={showSearch ? 'text-[var(--brand-primary)]' : 'text-white/50'} />
          </motion.button>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 10 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by deity, occasion, title…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-9 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/20 outline-none focus:border-[var(--brand-primary)]/40 transition-all"
                  autoFocus
                />
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-lg leading-none"
                  >
                    ✕
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Main Content ── */}
      <main className="px-4 pt-5 space-y-6">

        {/* ── Today's Pick — Hero Card ── */}
        {!searchQuery && (
          <section>
            <Link href={`/bhakti/katha/${todayKatha.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.985 }}
                className="group relative rounded-3xl overflow-hidden border border-white/[0.06] bg-white/[0.02]"
                style={{ background: 'linear-gradient(135deg, rgba(192,151,89,0.08) 0%, rgba(5,5,6,0.98) 60%)' }}
              >
                {/* Subtle radial glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--brand-primary)]/[0.07] blur-[60px] rounded-full pointer-events-none" />

                <div className="relative z-10 p-5">
                  {/* Labels row */}
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20">
                      <Sparkles size={11} className="text-[var(--brand-primary)]" />
                      <span className="text-[10px] font-black text-[var(--brand-primary)] uppercase tracking-[0.25em]">Today&apos;s Pick</span>
                    </div>
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
                      {todayKatha.durationMin} min
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-white leading-tight tracking-tight group-hover:text-[var(--brand-primary)] transition-colors duration-500 mb-2">
                    {todayKatha.title}
                  </h2>

                  {/* Preview */}
                  <p className="text-white/30 text-sm leading-relaxed line-clamp-2 font-light mb-4">
                    &quot;{todayKatha.preview}&quot;
                  </p>

                  {/* Footer row */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/30">
                        {TRADITION_LABELS[todayKatha.tradition]?.label}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/30">
                        {OCCASION_LABELS[todayKatha.occasion]}
                      </span>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[var(--brand-primary)] flex items-center justify-center shadow-[0_8px_20px_rgba(192,151,89,0.35)]">
                      <BookOpen size={16} strokeWidth={1.5} className="text-black" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </section>
        )}

        {/* ── This Week — Horizontal Scroll ── */}
        {!searchQuery && weekKathas.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3 px-0.5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--brand-primary)]/60 block mb-0.5">This Week</span>
                <h3 className="text-base font-serif font-bold text-white tracking-tight">Weekly Sadhana</h3>
              </div>
              <button className="text-[10px] font-black text-[var(--brand-primary)]/60 uppercase tracking-[0.3em] flex items-center gap-1">
                All <ChevronRight size={13} />
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x -mx-4 px-4">
              {weekKathas.map((k, i) => (
                <motion.div
                  key={k.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, type: 'spring', stiffness: 80 }}
                  viewport={{ once: true }}
                  className="flex-shrink-0 w-[220px] snap-start"
                >
                  <KathaCard katha={k} size="compact" />
                </motion.div>
              ))}
              <div className="flex-shrink-0 w-4" />
            </div>
          </section>
        )}

        {/* ── Browse All — Filter + Grid ── */}
        <section className="pb-6">
          {/* Section header */}
          <div className="flex items-end justify-between mb-3 px-0.5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--brand-primary)]/60 block mb-0.5">
                {searchQuery ? 'Results' : 'Explore'}
              </span>
              <h3 className="text-base font-serif font-bold text-white tracking-tight">
                {searchQuery ? 'Revealing Insights' : 'All Kathas'}
              </h3>
            </div>
            {!searchQuery && (
              <span className="text-[11px] text-white/20 font-medium">{filtered.length} stories</span>
            )}
          </div>

          {/* Filter tabs */}
          {!searchQuery && (
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none -mx-4 px-4 mb-4">
              {TRADITIONS.map(t => (
                <motion.button
                  key={t}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setActiveFilter(t)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] border transition-all duration-300 ${
                    activeFilter === t
                      ? 'border-[var(--brand-primary)]/50 text-[var(--brand-primary)] bg-[var(--brand-primary)]/10'
                      : 'border-white/[0.06] text-white/25 bg-white/[0.02] hover:text-white/40'
                  }`}
                >
                  {t === 'all' ? 'All' : TRADITION_LABELS[t]?.label ?? t}
                </motion.button>
              ))}
            </div>
          )}

          {/* Katha grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="col-span-full py-16 rounded-3xl border border-white/[0.04] bg-white/[0.01] flex flex-col items-center justify-center text-center space-y-3"
                >
                  <BookOpen size={36} className="text-white/10" />
                  <p className="text-white/20 text-sm font-medium">The archive is silent. Try another keyword.</p>
                </motion.div>
              ) : (
                filtered.map((k, i) => (
                  <motion.div
                    key={k.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: (i % 8) * 0.05, type: 'spring', damping: 22, stiffness: 120 }}
                  >
                    <KathaCard katha={k} />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </div>
  );
}

function KathaCard({ katha, size = 'normal' }: { katha: Katha; size?: 'normal' | 'compact' }) {
  const trad = TRADITION_LABELS[katha.tradition] ?? TRADITION_LABELS.hindu;

  if (size === 'compact') {
    return (
      <Link href={`/bhakti/katha/${katha.id}`}>
        <motion.div
          whileTap={{ scale: 0.96 }}
          className="group relative rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 flex flex-col gap-3 h-[160px] justify-between transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.08]"
        >
          {/* Tradition badge */}
          <div
            className="text-[9px] font-black uppercase tracking-[0.3em] px-2.5 py-1 rounded-full border self-start"
            style={{ color: trad.color, borderColor: `${trad.color}30`, background: `${trad.color}10` }}
          >
            {trad.label}
          </div>

          {/* Title */}
          <h3 className="text-white font-serif font-bold text-[13px] leading-snug tracking-tight line-clamp-2 group-hover:text-[var(--brand-primary)] transition-colors duration-300 flex-1">
            {katha.title}
          </h3>

          {/* Duration */}
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/25">
            <Clock size={11} className="text-[var(--brand-primary)]/30" />
            {katha.durationMin} min
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link href={`/bhakti/katha/${katha.id}`}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="group relative rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 flex flex-col gap-3 transition-all duration-300 hover:bg-white/[0.05] hover:border-[var(--brand-primary)]/15"
      >
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div
            className="text-[9px] font-black uppercase tracking-[0.3em] px-2.5 py-1 rounded-full border"
            style={{ color: trad.color, borderColor: `${trad.color}30`, background: `${trad.color}10` }}
          >
            {trad.label}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-white/20">
            <Clock size={11} className="text-[var(--brand-primary)]/30" />
            {katha.durationMin}m
          </div>
        </div>

        {/* Title */}
        <h3 className="text-white font-serif font-bold text-[15px] leading-snug tracking-tight line-clamp-2 group-hover:text-[var(--brand-primary)] transition-colors duration-300">
          {katha.title}
        </h3>

        {/* Preview */}
        <p className="text-white/25 text-[12px] leading-relaxed line-clamp-2 font-light">
          {katha.preview}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/20 bg-white/[0.03] px-2.5 py-1 rounded-full">
            {OCCASION_LABELS[katha.occasion] ?? katha.occasion}
          </span>
          <div className="w-7 h-7 rounded-full border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-[var(--brand-primary)] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            <ChevronRight size={14} strokeWidth={2} />
          </div>
        </div>

        {/* Corner glow on hover */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--brand-primary)]/0 group-hover:bg-[var(--brand-primary)]/[0.04] blur-[30px] rounded-full transition-all duration-700 pointer-events-none" />
      </motion.div>
    </Link>
  );
}
