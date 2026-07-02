'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Compass, 
  HelpCircle, 
  BookOpen, 
  ChevronRight, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export type DiscoverPiece = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all';
  category: 'festival' | 'practice' | 'scripture' | 'symbol' | 'story';
  hook_question: string;
  body_short: string;
  body_full: string;
  scripture_line: string | null;
  scripture_source: string | null;
  app_deep_link: string;
  og_image_url: string | null;
  published: boolean;
  created_at: string;
};

type DiscoverGatewayClientProps = {
  initialPieces: DiscoverPiece[];
};

const TRADITION_TABS = [
  { id: 'all', label: 'All Wisdom', emoji: '🪔' },
  { id: 'hindu', label: 'Hindu', emoji: '🧘' },
  { id: 'sikh', label: 'Sikh', emoji: '☬' },
  { id: 'buddhist', label: 'Buddhist', emoji: '☸️' },
  { id: 'jain', label: 'Jain', emoji: '🤲' }
] as const;

const TRADITION_STYLES: Record<string, { badge: string; text: string; glow: string; border: string }> = {
  hindu: {
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
    text: 'text-amber-400',
    glow: 'from-amber-600/10',
    border: 'hover:border-amber-500/30'
  },
  sikh: {
    badge: 'bg-blue-500/10 text-blue-300 border-blue-500/25',
    text: 'text-blue-400',
    glow: 'from-blue-600/10',
    border: 'hover:border-blue-500/30'
  },
  buddhist: {
    badge: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
    text: 'text-rose-400',
    glow: 'from-rose-600/10',
    border: 'hover:border-rose-500/30'
  },
  jain: {
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
    text: 'text-emerald-400',
    glow: 'from-emerald-600/10',
    border: 'hover:border-emerald-500/30'
  },
  all: {
    badge: 'bg-purple-500/10 text-purple-300 border-purple-500/25',
    text: 'text-purple-400',
    glow: 'from-purple-600/10',
    border: 'hover:border-purple-500/30'
  }
};

export default function DiscoverGatewayClient({ initialPieces }: DiscoverGatewayClientProps) {
  const [selectedTradition, setSelectedTradition] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPieces = initialPieces.filter(piece => {
    const matchesTradition = selectedTradition === 'all' || piece.tradition === selectedTradition;
    const matchesSearch = 
      piece.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      piece.hook_question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      piece.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      piece.body_short.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTradition && matchesSearch;
  });

  return (
    <div className="min-h-screen pb-20 pt-4" style={{ color: 'var(--brand-ink)' }}>
      
      {/* Dynamic Header */}
      <div className="pt-6 pb-6 text-center max-w-xl mx-auto px-4">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/20">
          <Compass size={24} className="text-[#C5A059]" />
        </div>
        <h1 className="text-3xl font-bold font-serif text-white tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
          Discover Dharma
        </h1>
        <p className="mt-2.5 text-xs leading-relaxed text-[#C5A059]/80 uppercase tracking-widest font-semibold">
          Clarifying Traditions • Dissolving Guilt • Finding Connection
        </p>
        <p className="mt-3 text-sm text-white/60 leading-relaxed">
          Explore the profound philosophical and scientific reasons behind our daily practices. You don&apos;t have to feel disconnected.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1 max-w-2xl mx-auto scrollbar-none justify-start md:justify-center">
          {TRADITION_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTradition(tab.id)}
              className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-full border text-xs font-semibold shrink-0 transition-all ${
                selectedTradition === tab.id
                  ? 'bg-[#C5A059] border-[#C5A059] text-[#0E0E0F] shadow-lg scale-102 font-bold'
                  : 'bg-white/[0.02] border-white/[0.06] text-white/70 hover:bg-white/[0.04]'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 mb-8 max-w-md mx-auto">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search questions, practices, or stories..."
          className="w-full bg-white/[0.02] border border-white/[0.08] rounded-2xl px-5 py-3.5 text-sm text-white outline-none focus:border-[#C5A059]/40 focus:bg-white/[0.04] transition-all placeholder-white/30"
        />
      </div>

      {/* Grid of Cards */}
      <div className="px-4 max-w-4xl mx-auto">
        <AnimatePresence mode="popLayout">
          {filteredPieces.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-3xl border border-white/[0.05] bg-white/[0.01] p-12 text-center text-white/40"
            >
              <HelpCircle size={32} className="mx-auto mb-3 text-white/20" />
              <p className="text-sm font-semibold">No gateway pieces found.</p>
              <p className="text-xs mt-1">Try selecting a different filter or clearing your search.</p>
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {filteredPieces.map(piece => {
                const style = TRADITION_STYLES[piece.tradition] || TRADITION_STYLES.all;
                return (
                  <motion.div
                    key={piece.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className={`rounded-3xl border p-6 transition-all flex flex-col justify-between relative overflow-hidden backdrop-blur-md bg-white/[0.02] border-white/[0.06] ${style.border}`}
                  >
                    {/* Corner gradient for visual glow */}
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${style.glow} to-transparent rounded-bl-full pointer-events-none`} />

                    <div>
                      {/* Header Row */}
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg border ${style.badge}`}>
                          {piece.tradition} • {piece.category}
                        </span>
                        <span className="text-white/20 select-none">
                          <ArrowUpRight size={16} />
                        </span>
                      </div>

                      {/* Hook Question */}
                      <h3 className="text-lg font-bold text-white font-serif leading-snug mb-2 group-hover:text-[#C5A059] transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>
                        {piece.hook_question}
                      </h3>

                      {/* Short Description */}
                      <p className="text-xs text-white/60 leading-relaxed mb-6 line-clamp-3">
                        {piece.body_short}
                      </p>
                    </div>

                    {/* Footer CTA */}
                    <Link
                      href={`/discover/${piece.slug}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C5A059] tracking-wider uppercase group mt-auto self-start"
                    >
                      <span>Understand Why</span>
                      <ChevronRight size={12} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
