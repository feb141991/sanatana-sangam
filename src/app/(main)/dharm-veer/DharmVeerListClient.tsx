'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, BookOpen, CheckCircle2, Flame, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { DharmVeer } from '@/lib/dharm-veer';
import { TRADITION_META, selectDharmVeer } from '@/lib/dharm-veer';
import { localSpiritualDate } from '@/lib/sacred-time';

type TraditionFilter = 'all' | 'hindu' | 'sikh' | 'buddhist' | 'jain';

interface Props {
  todayHero: DharmVeer;
  roster: DharmVeer[];
  tradition: string | null;
}

const TRADITION_FILTERS: Array<{ key: TraditionFilter; label: string; emoji: string }> = [
  { key: 'all',      label: 'All',      emoji: '📚' },
  { key: 'hindu',    label: 'Hindu',    emoji: '🕉️' },
  { key: 'sikh',     label: 'Sikh',     emoji: '☬' },
  { key: 'buddhist', label: 'Buddhist', emoji: '☸️' },
  { key: 'jain',     label: 'Jain',     emoji: '🤲' },
];

// Stronger border colours per tradition for the filter pills
const TRADITION_ACCENT: Record<string, string> = {
  hindu:    '#FF7800',
  sikh:     '#4080FF',
  buddhist: '#FFC800',
  jain:     '#00C832',
  sufi:     '#8C5ADC',
  tribal:   '#3CA05A',
};

export default function DharmVeerListClient({ todayHero, roster, tradition }: Props) {
  const router = useRouter();
  const [filter, setFilter]     = useState<TraditionFilter>('all');
  const [readIds, setReadIds]   = useState<Set<string>>(new Set());
  const [readCount, setReadCount] = useState(0);
  const [liveTodayHero, setLiveTodayHero] = useState<DharmVeer>(todayHero);

  // Load read history from localStorage
  useEffect(() => {
    try {
      const ids = new Set<string>();
      const tz    = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
      const today = localSpiritualDate(tz, 4);

      // Collect ALL read ids from the new history
      const historyRaw = localStorage.getItem('shoonaya-dharmveer-history');
      if (historyRaw) {
        const historyArr = JSON.parse(historyRaw) as string[];
        historyArr.forEach(id => ids.add(id));
      }

      // Legacy fallback: today's hero read status
      if (localStorage.getItem(`shoonaya-dharmveer-done-${today}`)) {
        ids.add(todayHero.id);
      }
      setReadIds(ids);
      setReadCount(ids.size);

      // Resolve the true user-specific daily hero
      const lastSelectedDate = localStorage.getItem('shoonaya-dharmveer-last-selected-date');
      const lastSelectedId = localStorage.getItem('shoonaya-dharmveer-last-selected-id');

      if (lastSelectedDate === today && lastSelectedId) {
        const found = roster.find(h => h.id === lastSelectedId);
        if (found) setLiveTodayHero(found);
      } else {
        // If not set yet (they came here directly), run the selection logic
        const historyIds = Array.from(ids);
        const selected = selectDharmVeer({
          userTradition: tradition,
          historyIds,
          roster,
        });
        setLiveTodayHero(selected);

        // Save to cache
        const newHistory = [...historyIds, selected.id].slice(-14);
        localStorage.setItem('shoonaya-dharmveer-history', JSON.stringify(newHistory));
        localStorage.setItem('shoonaya-dharmveer-last-selected-date', today);
        localStorage.setItem('shoonaya-dharmveer-last-selected-id', selected.id);
      }

    } catch { /* ignore */ }
  }, [todayHero.id, roster, tradition]);

  const filtered = filter === 'all'
    ? roster
    : roster.filter(h => h.tradition === filter);

  const totalCount = roster.length;

  // Colour helpers
  const gold = '#C5A059';

  return (
    <div className="min-h-screen" style={{ background: 'var(--divine-bg)', color: 'var(--brand-ink)' }}>

      {/* ── Sticky header ───────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 pt-safe-top pb-4 border-b border-white/5 backdrop-blur-xl"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--surface-base) 85%, transparent)',
        }}
      >
        <div className="px-5 pb-3 max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90"
            style={{ border: `1px solid rgba(197,160,89,0.22)`, background: 'rgba(197,160,89,0.07)' }}
          >
            <ChevronLeft size={18} style={{ color: gold }} />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: `${gold}80` }}>
              Sacred Archive
            </p>
            <h1 className="font-serif text-xl leading-tight" style={{ color: 'var(--brand-ink)' }}>
              Dharm Veer
            </h1>
          </div>

          {/* Stats pill */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0"
            style={{ background: 'rgba(197,160,89,0.10)', border: `1px solid rgba(197,160,89,0.22)` }}
          >
            <Flame size={11} style={{ color: gold }} />
            <span className="text-[11px] font-bold" style={{ color: gold }}>
              {readCount}/{totalCount}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 pb-32">

        {/* ── Today's featured hero ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 mb-7"
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-2.5" style={{ color: `${gold}55` }}>
            Today&apos;s Dharm Veer
          </p>
          <Link href={`/dharm-veer/${liveTodayHero.id}`}>
            <div
              className="relative rounded-[1.8rem] overflow-hidden p-5 transition-transform active:scale-[0.99]"
              style={{
                background: 'linear-gradient(135deg, rgba(197,160,89,0.13), rgba(197,160,89,0.04))',
                border: '1px solid rgba(197,160,89,0.28)',
              }}
            >
              {/* Ambient glow */}
              <div
                className="pointer-events-none absolute -top-10 -right-10 w-44 h-44 rounded-full blur-[56px] opacity-25"
                style={{ background: gold }}
                aria-hidden="true"
              />

              <div className="flex items-start gap-4">
                {/* Emoji badge */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-4xl shadow-lg"
                  style={{
                    background: TRADITION_META[liveTodayHero.tradition]?.color.replace('0.12', '0.28') ?? 'rgba(197,160,89,0.2)',
                    border: '1px solid rgba(197,160,89,0.30)',
                  }}
                >
                  {liveTodayHero.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(197,160,89,0.15)', color: gold }}
                    >
                      {TRADITION_META[liveTodayHero.tradition]?.label ?? liveTodayHero.tradition}
                    </span>
                    {readIds.has(liveTodayHero.id) && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold" style={{ color: '#4ade80' }}>
                        <CheckCircle2 size={11} /> Read
                      </span>
                    )}
                  </div>
                  <h2 className="font-serif text-xl leading-tight" style={{ color: 'var(--brand-ink)' }}>
                    {liveTodayHero.name}
                  </h2>
                  <p className="text-[11px] mt-1 leading-snug line-clamp-2" style={{ color: 'rgba(255,240,200,0.52)' }}>
                    {liveTodayHero.tagline}
                  </p>
                </div>
              </div>

              {/* Read CTA */}
              <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 h-px" style={{ background: 'rgba(197,160,89,0.18)' }} />
                <span className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: gold }}>
                  <BookOpen size={13} /> Read story
                  <ChevronRight size={12} />
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(197,160,89,0.18)' }} />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* ── Tradition filter tabs ────────────────────────────────────────── */}
        <div
          className="flex gap-2 overflow-x-auto pb-1 mb-5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {TRADITION_FILTERS.map(t => {
            const active = filter === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-semibold transition-all active:scale-95"
                style={{
                  background:   active ? gold : 'rgba(197,160,89,0.07)',
                  color:        active ? '#1c1208' : `${gold}CC`,
                  border:       `1px solid ${active ? gold : 'rgba(197,160,89,0.18)'}`,
                }}
              >
                <span style={{ fontSize: '13px' }}>{t.emoji}</span>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Hero list ────────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-2.5"
          >
            {filtered.map((hero, idx) => {
              const isToday  = hero.id === todayHero.id;
              const isRead   = readIds.has(hero.id);
              const meta     = TRADITION_META[hero.tradition];
              const accent   = TRADITION_ACCENT[hero.tradition] ?? gold;

              return (
                <motion.div
                  key={hero.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.035, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link href={`/dharm-veer/${hero.id}`} className="block">
                    <div
                      className="flex items-center gap-3.5 p-4 rounded-2xl border transition-all active:scale-[0.985]"
                      style={{
                        background:   isToday ? 'rgba(197,160,89,0.08)' : 'rgba(255,255,255,0.025)',
                        borderColor:  isToday ? 'rgba(197,160,89,0.32)' : 'rgba(255,255,255,0.06)',
                      }}
                    >
                      {/* Emoji */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                        style={{
                          background:   meta?.color.replace('0.12', '0.22') ?? 'rgba(197,160,89,0.15)',
                          border:       `1px solid ${meta?.color.replace('0.12', '0.32') ?? 'rgba(197,160,89,0.2)'}`,
                        }}
                      >
                        {hero.emoji}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span
                            className="text-[9px] uppercase font-bold tracking-wider"
                            style={{ color: `${accent}CC` }}
                          >
                            {meta?.label ?? hero.tradition}
                          </span>
                          {isToday && (
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(197,160,89,0.15)', color: gold }}
                            >
                              Today
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-[14px] leading-tight truncate" style={{ color: 'var(--brand-ink)' }}>
                          {hero.name}
                        </p>
                        <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: 'rgba(255,240,200,0.42)' }}>
                          {hero.era} · {hero.region}
                        </p>
                      </div>

                      {/* Status icon */}
                      {isRead
                        ? <CheckCircle2 size={18} className="shrink-0" style={{ color: '#4ade80' }} />
                        : <div className="w-5 h-5 rounded-full border shrink-0" style={{ borderColor: 'rgba(197,160,89,0.22)' }} />
                      }
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* ── Retention nudge ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 rounded-2xl p-5 text-center"
          style={{ background: 'rgba(197,160,89,0.05)', border: '1px solid rgba(197,160,89,0.12)' }}
        >
          <p className="text-2xl mb-2">⚔️</p>
          <p className="font-serif text-lg" style={{ color: 'var(--brand-ink)' }}>
            Read daily — earn your Dharm Veer mark
          </p>
          <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: `${gold}70` }}>
            30 seconds of reading counts as your Sadhana.<br />
            A new hero surfaces each day.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
