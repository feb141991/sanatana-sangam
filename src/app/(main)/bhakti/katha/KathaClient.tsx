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
    <div className="relative min-h-screen pb-60 overflow-x-hidden bg-[#050506] font-outfit selection:bg-[var(--premium-gold)] selection:text-black">
      {/* ── Ultra-Immersive Atmospheric Layer ── */}
      <div className="fixed top-[-10%] right-[-10%] w-[100vw] h-[100vw] bg-[var(--premium-gold)]/5 blur-[160px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-rose-500/5 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none -z-10" />

      {/* ── Organic Edge-to-Edge Header ── */}
      <header className="sticky top-0 z-50 w-full px-10 pt-16 pb-12 backdrop-blur-[40px] border-b border-white/[0.03] bg-[#050506]/30">
        <div className="w-full flex items-center justify-between gap-12">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="w-16 h-16 rounded-[2.2rem] border border-white/[0.08] flex items-center justify-center bg-white/[0.03] shadow-[0_20px_40px_rgba(0,0,0,0.3)] group transition-all"
          >
            <ChevronLeft size={28} className="text-[var(--premium-gold)] group-hover:-translate-x-1 transition-transform" />
          </motion.button>
          
          <div className="flex-1 flex flex-col items-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-6 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md mb-4"
            >
              <span className="text-[11px] font-black uppercase tracking-[0.6em] text-[var(--premium-gold)] drop-shadow-[0_0_10px_rgba(192,151,89,0.3)]">Sanatan Sangam</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-7xl font-serif font-bold text-white tracking-tighter"
            >
              Sacred <span className="text-white/20">Archive</span>
            </motion.h1>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSearch(s => !s)}
            className="w-16 h-16 rounded-[2.2rem] border border-white/[0.08] flex items-center justify-center bg-white/[0.03] shadow-[0_20px_40px_rgba(0,0,0,0.3)] group transition-all"
          >
            <Search size={24} className="text-[var(--premium-gold)] group-hover:scale-110 transition-transform" />
          </motion.button>
        </div>

        {/* Dynamic Organic Search */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 48 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="w-full overflow-hidden"
            >
              <div className="relative group max-w-5xl mx-auto">
                <input
                  type="text"
                  placeholder="Whisper a deity, occasion, or sacred truth…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-14 py-8 rounded-[3.5rem] bg-white/[0.02] border border-white/[0.06] text-white text-2xl font-light placeholder:text-white/5 outline-none focus:border-[var(--premium-gold)]/30 focus:bg-white/[0.05] transition-all shadow-[0_40px_80px_rgba(0,0,0,0.4)]"
                  autoFocus
                />
                <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-4">
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-colors">✕</button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Fluid Content Stream ── */}
      <main className="w-full pt-16">
        
        {/* ── Organic Hero Feature ── */}
        {!searchQuery && (
          <section className="w-full px-10 mb-24">
            <Link href={`/bhakti/katha/${todayKatha.id}`}>
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -10 }}
                whileTap={{ scale: 0.99 }}
                className="group relative rounded-[6rem] p-[1px] overflow-hidden shadow-[0_80px_160px_rgba(0,0,0,0.6)]"
                style={{ background: `linear-gradient(135deg, rgba(192, 151, 89, 0.4), transparent, rgba(255,255,255,0.05))` }}
              >
                <div className="relative z-10 bg-[#0d0d0f] rounded-[6rem] p-16 md:p-24 flex flex-col md:flex-row gap-20 items-center overflow-hidden">
                  
                  {/* Decorative Radial Background */}
                  <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(192,151,89,0.08)_0%,transparent_60%)] pointer-events-none" />

                  {/* Text Content */}
                  <div className="flex-1 space-y-12 relative z-10">
                    <div className="flex items-center gap-6">
                      <div className="px-6 py-2.5 rounded-full bg-[var(--premium-gold)]/10 border border-[var(--premium-gold)]/20 flex items-center gap-3">
                        <Sparkles size={16} className="text-[var(--premium-gold)] animate-pulse" />
                        <span className="text-[12px] font-black text-[var(--premium-gold)] uppercase tracking-[0.3em]">Eternal Pick</span>
                      </div>
                      <div className="text-[12px] font-bold text-white/10 uppercase tracking-[0.3em] flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[var(--premium-gold)]/40 shadow-[0_0_10px_rgba(192,151,89,0.5)]" />
                        {todayKatha.durationMin} MINUTES OF WISDOM
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h2 className="text-6xl md:text-8xl font-serif font-bold text-white leading-[0.95] tracking-tighter group-hover:text-[var(--premium-gold)] transition-colors duration-700">{todayKatha.title}</h2>
                      <p className="text-white/30 text-2xl leading-relaxed line-clamp-3 max-w-4xl font-light italic tracking-tight">&quot;{todayKatha.preview}&quot;</p>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                      <span className="text-[11px] font-black uppercase tracking-[0.3em] px-8 py-3.5 rounded-[1.5rem] bg-white/[0.03] border border-white/[0.08] text-white/40 group-hover:bg-white/[0.08] transition-all">
                        {TRADITION_LABELS[todayKatha.tradition]?.label}
                      </span>
                      <span className="text-[11px] font-black uppercase tracking-[0.3em] px-8 py-3.5 rounded-[1.5rem] bg-white/[0.03] border border-white/[0.08] text-white/40 group-hover:bg-white/[0.08] transition-all">
                        {OCCASION_LABELS[todayKatha.occasion]}
                      </span>
                    </div>
                  </div>

                  {/* Organic CTA Circle */}
                  <div className="relative">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-[-40px] border border-white/5 rounded-full border-dashed"
                    />
                    <div className="w-48 h-48 rounded-full bg-[var(--premium-gold)] flex items-center justify-center text-black shadow-[0_30px_60px_rgba(192,151,89,0.4)] group-hover:scale-110 transition-all duration-700 relative z-10">
                      <BookOpen size={60} strokeWidth={1} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </section>
        )}

        {/* ── Horizon Scroll — Full Width ── */}
        {!searchQuery && (
          <section className="w-full mb-32 overflow-hidden">
            <div className="px-16 flex items-center justify-between mb-12">
              <div className="flex flex-col">
                <h3 className="text-5xl font-serif font-bold text-white tracking-tighter italic">Weekly <span className="text-white/10 not-italic">Sadhana</span></h3>
                <div className="h-1 w-20 bg-[var(--premium-gold)] mt-2 rounded-full" />
              </div>
              <motion.button whileHover={{ x: 10 }} className="text-[11px] font-black text-[var(--premium-gold)] uppercase tracking-[0.4em] flex items-center gap-3">
                The Full Journey <ChevronRight size={18} />
              </motion.button>
            </div>
            
            <div className="flex gap-10 overflow-x-auto px-16 pb-20 scrollbar-none snap-x">
              {weekKathas.map((k, i) => (
                <motion.div 
                  key={k.id} 
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 50 }}
                  viewport={{ once: true }}
                  className="flex-shrink-0 w-[450px] snap-start"
                >
                  <KathaCard katha={k} size="compact" />
                </motion.div>
              ))}
              <div className="flex-shrink-0 w-16" /> {/* Extra padding at end */}
            </div>
          </section>
        )}

        {/* ── The Great Archive ── */}
        <section className="w-full px-16 pb-60">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-20 gap-12">
            <div className="space-y-4">
              <h3 className="text-6xl font-serif font-bold text-white tracking-tighter">
                {searchQuery ? 'Revealing Insights' : 'The Great Archive'}
              </h3>
              <p className="text-white/15 text-[13px] font-black uppercase tracking-[0.5em] ml-2">Wisdom distilled from the ancient ages</p>
            </div>

            {/* Hyper-Rounded Filter System */}
            {!searchQuery && (
              <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-none">
                {TRADITIONS.map(t => (
                  <motion.button
                    key={t}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveFilter(t)}
                    className={`flex-shrink-0 px-10 py-5 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.3em] border transition-all duration-700 shadow-2xl ${
                      activeFilter === t
                        ? 'border-[var(--premium-gold)] text-[var(--premium-gold)] bg-[var(--premium-gold)]/10 shadow-[0_20px_40px_rgba(192,151,89,0.15)] ring-1 ring-[var(--premium-gold)]/20'
                        : 'border-white/[0.03] text-white/15 bg-white/[0.02] hover:bg-white/[0.05] hover:text-white/30'
                    }`}
                  >
                    {t === 'all' ? 'Universal' : TRADITION_LABELS[t]?.label ?? t}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Liquid Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-16">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 40 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="col-span-full py-60 rounded-[6rem] border border-white/[0.03] bg-white/[0.01] flex flex-col items-center justify-center text-center space-y-8"
                >
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-32 h-32 rounded-full bg-white/[0.03] flex items-center justify-center text-white/5 shadow-inner"
                  >
                    <BookOpen size={60} />
                  </motion.div>
                  <p className="text-white/10 text-xl font-medium tracking-tight">The archives remain silent. Try another sacred keyword.</p>
                </motion.div>
              ) : (
                filtered.map((k, i) => (
                  <motion.div
                    key={k.id}
                    layout
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: (i % 9) * 0.08, type: "spring", damping: 20 }}
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
        whileHover={{ y: -16, backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(192, 151, 89, 0.2)' }}
        whileTap={{ scale: 0.97 }}
        className={`group relative rounded-[5.5rem] border border-white/[0.04] bg-white/[0.03] p-12 flex flex-col gap-10 transition-all duration-700 shadow-[0_40px_100px_rgba(0,0,0,0.5)] ${size === 'compact' ? 'h-[520px] justify-between' : ''}`}
      >
        <div className="flex items-center justify-between relative z-10">
          <div 
            className="text-[10px] font-black uppercase tracking-[0.4em] px-7 py-3 rounded-full border transition-all duration-500 shadow-lg"
            style={{ color: trad.color, borderColor: `${trad.color}30`, background: `${trad.color}10` }}
          >
            {trad.label}
          </div>
          <div className="flex items-center gap-3 text-[11px] font-black text-white/10 uppercase tracking-[0.3em] group-hover:text-[var(--premium-gold)] transition-colors">
            <Clock size={16} className="text-[var(--premium-gold)]/20" /> {katha.durationMin}M
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          <h3 className="text-white font-serif font-bold text-3xl leading-[1.1] tracking-tighter group-hover:text-[var(--premium-gold)] transition-all duration-700 line-clamp-2">
            {katha.title}
          </h3>
          <p className="text-white/20 text-lg leading-relaxed line-clamp-4 font-light tracking-tight group-hover:text-white/40 transition-all duration-700">
            {katha.preview}
          </p>
        </div>

        <div className="flex items-center justify-between pt-8 border-t border-white/[0.04] relative z-10">
          <div className="flex gap-3 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 bg-white/[0.03] px-6 py-2.5 rounded-[1rem] group-hover:bg-white/[0.08] transition-colors">
              {OCCASION_LABELS[katha.occasion] ?? katha.occasion}
            </span>
          </div>
          <div className="w-14 h-14 rounded-full border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-[var(--premium-gold)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-6 transition-all duration-700 shadow-xl">
            <ChevronRight size={28} strokeWidth={1.5} />
          </div>
        </div>

        {/* Corner Ambient Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--premium-gold)]/0 group-hover:bg-[var(--premium-gold)]/5 blur-[40px] rounded-full transition-all duration-1000" />
      </motion.div>
    </Link>
  );
}
