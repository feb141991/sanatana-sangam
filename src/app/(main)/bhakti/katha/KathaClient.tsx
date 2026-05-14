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
    <div className="relative min-h-screen pb-40 overflow-x-hidden bg-[#080809] font-outfit">
      {/* ── Immersive Zenith Background ── */}
      <div className="fixed top-0 right-0 w-[80vw] h-[80vw] bg-[var(--premium-gold)]/5 blur-[140px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[60vw] h-[60vw] bg-rose-500/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(192,151,89,0.03)_0%,transparent_70%)] pointer-events-none -z-10" />

      {/* ── Full-Bleed Header ── */}
      <header className="sticky top-0 z-50 w-full px-8 pt-16 pb-8 backdrop-blur-[30px] border-b border-white/5 bg-[#080809]/40">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between mb-8">
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="w-14 h-14 rounded-[1.8rem] border border-white/10 flex items-center justify-center bg-white/5 shadow-2xl transition-all"
          >
            <ChevronLeft size={26} className="text-[var(--premium-gold)]" />
          </motion.button>
          
          <div className="flex flex-col items-center">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-1.5 rounded-full bg-[var(--premium-gold)]/10 border border-[var(--premium-gold)]/20 mb-2"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--premium-gold)]">Sanatan Sangam</span>
            </motion.div>
          </div>

          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSearch(s => !s)}
            className="w-14 h-14 rounded-[1.8rem] border border-white/10 flex items-center justify-center bg-white/5 shadow-2xl transition-all"
          >
            <Search size={22} className="text-[var(--premium-gold)]" />
          </motion.button>
        </div>

        <div className="max-w-[1800px] mx-auto">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-6xl font-serif font-bold text-white tracking-tighter"
          >
            Sacred <span className="text-[var(--premium-gold)]">Katha</span>
          </motion.h1>
          <p className="text-white/30 text-sm mt-3 font-medium tracking-wide max-w-xl leading-relaxed">
            Immerse yourself in the timeless narratives of the {trad.label} tradition, 
            preserved through generations for the modern seeker.
          </p>
        </div>

        {/* Dynamic Search Interface */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 32 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="max-w-[1800px] mx-auto overflow-hidden"
            >
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search by deity, occasion, or sacred keyword…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-10 py-6 rounded-[2.5rem] bg-white/5 border border-white/10 text-white text-lg placeholder:text-white/10 outline-none focus:border-[var(--premium-gold)]/40 focus:bg-white/[0.08] transition-all shadow-2xl"
                  autoFocus
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[var(--premium-gold)]/20 rounded-full group-focus-within:bg-[var(--premium-gold)] transition-colors" />
                {searchQuery && (
                   <button onClick={() => setSearchQuery('')} className="absolute right-8 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">
                     <span className="text-2xl font-light">✕</span>
                   </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Main Content Area (Edge-to-Edge with limited max-width for extreme screens) ── */}
      <main className="w-full max-w-[1920px] mx-auto">
        
        {/* ── Hero Feature Section ── */}
        {!searchQuery && (
          <section className="px-8 mt-12">
            <Link href={`/bhakti/katha/${todayKatha.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8 }}
                whileTap={{ scale: 0.99 }}
                className="group relative rounded-[4rem] p-[1.5px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.4)]"
                style={{ background: `linear-gradient(135deg, rgba(192, 151, 89, 0.4), rgba(255,255,255,0.05))` }}
              >
                <div className="relative z-10 bg-[#121214] rounded-[4rem] p-12 md:p-16 flex flex-col md:flex-row gap-12 items-center">
                  
                  {/* Text Content */}
                  <div className="flex-1 space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="px-5 py-2 rounded-full bg-[var(--premium-gold)]/10 border border-[var(--premium-gold)]/20 flex items-center gap-2">
                        <Sparkles size={14} className="text-[var(--premium-gold)] animate-pulse" />
                        <span className="text-[11px] font-black text-[var(--premium-gold)] uppercase tracking-[0.2em]">Mandali Pick</span>
                      </div>
                      <div className="h-px w-12 bg-white/10" />
                      <div className="text-[11px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={14} /> {todayKatha.durationMin} MIN READ
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-5xl md:text-6xl font-serif text-white leading-[1.1] group-hover:text-[var(--premium-gold)] transition-colors duration-500">{todayKatha.title}</h2>
                      <p className="text-white/40 text-lg leading-relaxed line-clamp-3 max-w-2xl font-light italic">&quot;{todayKatha.preview}&quot;</p>
                    </div>

                    <div className="flex items-center gap-6 pt-4">
                      <div className="flex gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/40">
                          {TRADITION_LABELS[todayKatha.tradition]?.label}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/40">
                          {OCCASION_LABELS[todayKatha.occasion]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visual CTA */}
                  <div className="w-full md:w-auto">
                    <div className="w-32 h-32 rounded-[3rem] bg-[var(--premium-gold)] flex items-center justify-center text-black shadow-[0_20px_40px_rgba(192,151,89,0.3)] group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                      <BookOpen size={40} strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
                
                {/* Immersive Hover Layer */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--premium-gold)]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </motion.div>
            </Link>
          </section>
        )}

        {/* ── Horizontal Path Section ── */}
        {!searchQuery && (
          <section className="mt-24">
            <div className="px-12 flex items-center justify-between mb-10">
              <div className="flex items-center gap-6">
                <h3 className="text-3xl font-serif font-bold text-white tracking-tight">Weekly <span className="text-white/20">Path</span></h3>
                <div className="w-24 h-[1px] bg-white/10" />
              </div>
              <button className="text-[10px] font-black text-[var(--premium-gold)] uppercase tracking-[0.3em] hover:tracking-[0.4em] transition-all">Explore All →</button>
            </div>
            
            <div className="flex gap-8 overflow-x-auto px-12 pb-12 scrollbar-none snap-x">
              {weekKathas.map((k, i) => (
                <motion.div 
                  key={k.id} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex-shrink-0 w-[340px] snap-start"
                >
                  <KathaCard katha={k} size="compact" />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ── Universal Library Section ── */}
        <section className="px-12 mt-20 pb-40">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="space-y-2">
              <h3 className="text-4xl font-serif font-bold text-white">
                {searchQuery ? `Refining Results (${filtered.length})` : 'Universal Archive'}
              </h3>
              <p className="text-white/20 text-xs font-bold uppercase tracking-widest ml-1">Spanning {TRADITIONS.length - 1} Traditions</p>
            </div>

            {/* Premium Filter Pills */}
            {!searchQuery && (
              <div className="flex gap-3 overflow-x-auto pb-4 md:pb-0 scrollbar-none">
                {TRADITIONS.map(t => (
                  <motion.button
                    key={t}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveFilter(t)}
                    className={`flex-shrink-0 px-8 py-4 rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.2em] border transition-all duration-500 shadow-xl ${
                      activeFilter === t
                        ? 'border-[var(--premium-gold)] text-[var(--premium-gold)] bg-[var(--premium-gold)]/10 ring-4 ring-[var(--premium-gold)]/5'
                        : 'border-white/5 text-white/20 bg-white/5 hover:bg-white/10 hover:text-white/40'
                    }`}
                  >
                    {t === 'all' ? 'Universal' : TRADITION_LABELS[t]?.label ?? t}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Result Grid with Masonry-like spacing */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="col-span-full py-40 rounded-[4rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center space-y-4"
                >
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white/10">
                    <BookOpen size={40} />
                  </div>
                  <p className="text-white/20 text-sm font-bold uppercase tracking-widest">The archives are silent for this search.</p>
                </motion.div>
              ) : (
                filtered.map((k, i) => (
                  <motion.div
                    key={k.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: (i % 12) * 0.05 }}
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
  return (
    <Link href={`/bhakti/katha/${katha.id}`}>
      <motion.div
        whileHover={{ y: -12, borderColor: 'rgba(192, 151, 89, 0.3)', backgroundColor: 'rgba(255,255,255,0.08)' }}
        whileTap={{ scale: 0.97 }}
        className={`group relative rounded-[3.5rem] border border-white/5 bg-white/[0.04] p-10 flex flex-col gap-8 transition-all duration-500 hover:shadow-[0_40px_80px_rgba(0,0,0,0.5)] ${size === 'compact' ? 'h-[420px] justify-between' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div 
            className="text-[9px] font-black uppercase tracking-[0.3em] px-5 py-2.5 rounded-2xl border transition-all"
            style={{ color: trad.color, borderColor: `${trad.color}40`, background: `${trad.color}15` }}
          >
            {trad.label}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-white/10 uppercase tracking-widest group-hover:text-[var(--premium-gold)] transition-colors">
            <Clock size={14} /> {katha.durationMin}M
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-white font-serif font-bold text-2xl leading-tight group-hover:text-[var(--premium-gold)] transition-all duration-500 line-clamp-2">
            {katha.title}
          </h3>
          <p className="text-white/20 text-sm leading-relaxed line-clamp-4 font-light group-hover:text-white/40 transition-colors">
            {katha.preview}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex gap-2 flex-wrap">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20 bg-white/5 px-4 py-2 rounded-xl group-hover:bg-white/10 transition-colors">
              {OCCASION_LABELS[katha.occasion] ?? katha.occasion}
            </span>
            {katha.deity && (
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--premium-gold)]/40 bg-[var(--premium-gold)]/5 px-4 py-2 rounded-xl group-hover:bg-[var(--premium-gold)]/10 transition-colors">
                {katha.deity}
              </span>
            )}
          </div>
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-[var(--premium-gold)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4 transition-all duration-500">
            <ChevronRight size={20} />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
