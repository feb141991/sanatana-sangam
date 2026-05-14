'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Share2, Clock, BookOpen, Sparkles, Heart,
  Star, ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react';
import Link from 'next/link';
import type { Katha } from '@/lib/katha-library';

interface Props { katha: Katha; }

const THEME = {
  bg: '#1A1918',
  void: '#010101',
  charcoal: '#2C2C2F',
  gold: '#C09759',
  textMuted: 'rgba(255,255,255,0.4)',
};

const TRADITION_COLORS: Record<string, string> = {
  hindu: '#FF6B35', sikh: '#1B7FD4', buddhist: '#7C5CBF', jain: '#2D9E4A',
};

const TRADITION_LABELS: Record<string, { label: string; termKatha: string }> = {
  hindu:    { label: 'Hindu', termKatha: 'Katha' },
  sikh:     { label: 'Sikh', termKatha: 'Sakhi' },
  buddhist: { label: 'Buddhist', termKatha: 'Dhamma Story' },
  jain:     { label: 'Jain', termKatha: 'Katha' },
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

export default function KathaReaderClient({ katha }: Props) {
  const router = useRouter();
  const [showHindi, setShowHindi] = useState(false);
  const [sankalpaDismissed, setSankalpaDismissed] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showPhal, setShowPhal] = useState(false);

  const tradColor = TRADITION_COLORS[katha.tradition] ?? '#C09759';
  const trad = TRADITION_LABELS[katha.tradition] ?? TRADITION_LABELS.hindu;
  const hasHindi = (katha.bodyHi?.length ?? 0) > 0;

  const bodyToShow = showHindi && hasHindi ? (katha.bodyHi ?? katha.body) : katha.body;
  const phalToShow = showHindi && katha.phalHi ? katha.phalHi : katha.phal;

  return (
    <div
      className="relative min-h-screen pb-36 overflow-x-hidden"
      style={{ backgroundColor: THEME.bg, color: 'white' }}
    >
      {/* Ambient glow */}
      <div
        className="fixed top-0 left-0 w-96 h-96 blur-[140px] rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none -z-10 opacity-20"
        style={{ background: tradColor }}
      />

      {/* ── Header ── */}
      <div className="sticky top-0 z-40 px-6 pt-12 pb-4 backdrop-blur-xl" style={{ background: 'rgba(26,25,24,0.9)' }}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5"
          >
            <ChevronLeft size={20} color={THEME.gold} />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] opacity-50" style={{ color: tradColor }}>
              {trad.termKatha}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasHindi && (
              <button
                onClick={() => setShowHindi(s => !s)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                  showHindi
                    ? 'border-[#C09759] text-[#C09759] bg-[#C09759]/10'
                    : 'border-white/10 text-white/40'
                }`}
              >
                {showHindi ? 'EN' : 'हिं'}
              </button>
            )}
            <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
              <Share2 size={15} color={THEME.gold} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Sankalpa Nudge ── */}
      <AnimatePresence>
        {!sankalpaDismissed && katha.occasion !== 'general' && (
          <motion.section
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="mx-6 mt-4"
          >
            <div
              className="rounded-2xl p-4 border flex items-start gap-3"
              style={{ borderColor: `${tradColor}25`, background: `${tradColor}08` }}
            >
              <Sparkles size={14} color={tradColor} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: tradColor }}>
                  Sankalpa Moment
                </p>
                <p className="text-white/50 text-[12px] leading-relaxed">
                  Before you begin, take a breath. Set your intention — read this katha with an open heart and let its wisdom guide your practice of{' '}
                  <span className="text-white/70 font-medium">{OCCASION_LABELS[katha.occasion]}</span>.
                </p>
              </div>
              <button onClick={() => setSankalpaDismissed(true)} className="text-white/20 text-xs mt-0.5">✕</button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Title Block ── */}
      <section className="px-6 mt-8 space-y-4">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <span
            className="text-[9px] font-bold uppercase tracking-[0.25em] px-3 py-1.5 rounded-full border"
            style={{ color: tradColor, borderColor: `${tradColor}30`, background: `${tradColor}10` }}
          >
            {trad.label}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10 text-white/35">
            {OCCASION_LABELS[katha.occasion] ?? katha.occasion}
          </span>
          {katha.deity && (
            <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-[#C09759]/15 text-[#C09759]/60">
              {katha.deity.charAt(0).toUpperCase() + katha.deity.slice(1)}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-4xl font-serif text-white leading-tight">
          {showHindi && katha.titleHi ? katha.titleHi : katha.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-white/25 text-[11px]">
          <div className="flex items-center gap-1.5">
            <Clock size={11} />
            <span>{katha.durationMin} min read</span>
          </div>
          {katha.relatedJapaMantra && (
            <div className="flex items-center gap-1.5">
              <Star size={10} />
              <span className="font-medium text-[#C09759]/50">{katha.relatedJapaMantra}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-2xl opacity-30">🕉️</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>
      </section>

      {/* ── Katha Body ── */}
      <section className="px-6 mt-8 space-y-6">
        {bodyToShow.map((para, idx) => (
          <motion.p
            key={`${showHindi}-${idx}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.4 }}
            className="text-white/75 text-[15px] leading-[1.8] font-light"
            style={{ fontFamily: showHindi ? 'inherit' : 'var(--font-serif, Georgia, serif)' }}
          >
            {para}
          </motion.p>
        ))}
      </section>

      {/* ── Phal (Fruit / Moral) ── */}
      <section className="px-6 mt-12">
        <motion.button
          onClick={() => setShowPhal(s => !s)}
          className="w-full rounded-[2rem] p-6 border border-[#C09759]/20 bg-[#C09759]/5 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: `${THEME.gold}20`, border: `1px solid ${THEME.gold}30` }}
            >
              <Star size={16} color={THEME.gold} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#C09759]/70 mb-0.5">Phal — Fruit of the Katha</p>
              <p className="text-white/60 text-[12px]">Tap to reveal the blessing and moral</p>
            </div>
          </div>
          {showPhal ? <ChevronUp size={16} color={THEME.gold} /> : <ChevronDown size={16} color={THEME.gold} />}
        </motion.button>

        <AnimatePresence>
          {showPhal && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-[2rem] p-6 border border-[#C09759]/15 bg-[#C09759]/5">
                <p className="text-white/70 text-[14px] leading-[1.8] font-light italic">
                  &ldquo;{phalToShow}&rdquo;
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Cross-links ── */}
      <section className="px-6 mt-10 space-y-4">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/25">Continue Your Practice</h3>

        {katha.relatedJapaMantra && (
          <Link href="/japa">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="rounded-[2rem] p-5 border border-white/5 bg-[#2C2C2F]/20 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-[#C09759]/10 border border-[#C09759]/20 flex items-center justify-center text-xl">
                  📿
                </div>
                <div>
                  <p className="text-white/70 text-[13px] font-medium">Start Japa</p>
                  <p className="text-white/30 text-[11px] mt-0.5">{katha.relatedJapaMantra}</p>
                </div>
              </div>
              <ExternalLink size={14} color={THEME.gold} className="opacity-40" />
            </motion.div>
          </Link>
        )}

        <Link href="/bhakti/katha">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="rounded-[2rem] p-5 border border-white/5 bg-[#2C2C2F]/20 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">
                📚
              </div>
              <div>
                <p className="text-white/70 text-[13px] font-medium">More Kathas</p>
                <p className="text-white/30 text-[11px] mt-0.5">Explore the sacred library</p>
              </div>
            </div>
            <ExternalLink size={14} color={THEME.gold} className="opacity-40" />
          </motion.div>
        </Link>
      </section>

      {/* ── Like / Appreciate ── */}
      <section className="px-6 mt-10 flex justify-center">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setLiked(l => !l)}
          className={`flex items-center gap-2 px-6 py-3 rounded-full border text-[13px] font-semibold transition-all duration-300 ${
            liked
              ? 'border-rose-400/40 bg-rose-400/10 text-rose-300'
              : 'border-white/10 text-white/40'
          }`}
        >
          <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
          <span>{liked ? 'Jai Shri Hari 🙏' : 'Appreciate this Katha'}</span>
        </motion.button>
      </section>
    </div>
  );
}
