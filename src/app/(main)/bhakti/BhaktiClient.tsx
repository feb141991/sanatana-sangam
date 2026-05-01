'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, BarChart2, ChevronRight } from 'lucide-react';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import type { Shloka } from '@/lib/shlokas';
import { DEITY_META, MOOD_META } from '@/lib/stotrams';

// ─── Tradition-aware greeting ─────────────────────────────────────────────────
const TRADITION_GREETINGS: Record<string, string> = {
  hindu:    'Jai Shri Ram 🙏',
  sikh:     'Waheguru Ji Ka Khalsa 🙏',
  buddhist: 'Namo Buddhaya 🙏',
  jain:     'Jai Jinendra 🙏',
};

// ─── Animated diya flame ──────────────────────────────────────────────────────
function DiyaFlame() {
  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <motion.div className="absolute rounded-full"
        style={{ width: 80, height: 80, background: 'radial-gradient(circle, rgba(220,120,20,0.22) 0%, transparent 68%)' }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute rounded-full"
        style={{ width: 52, height: 52, background: 'radial-gradient(circle, rgba(255,165,40,0.38) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.22, 0.94, 1], opacity: [0.65, 1, 0.75, 0.65] }}
        transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div style={{
        width: 13, height: 24,
        background: 'linear-gradient(180deg, #fff8e0 0%, #ffb820 45%, #ff6515 100%)',
        borderRadius: '50% 50% 50% 50% / 38% 38% 62% 62%',
        boxShadow: '0 0 16px rgba(255,148,22,0.9)',
        position: 'relative', top: -6,
      }}
        animate={{ scaleX: [1, 1.1, 0.93, 1.07, 1], scaleY: [1, 0.93, 1.06, 0.97, 1], rotate: [-3, 4, -2, 3, -3] }}
        transition={{ duration: 0.85, repeat: Infinity, ease: 'easeInOut' }} />
      <div style={{
        position: 'absolute', top: '52%', width: 32, height: 9,
        background: 'linear-gradient(90deg, #7a3f1c 0%, #c97c3a 48%, #7a3f1c 100%)',
        borderRadius: '2px 2px 50% 50% / 2px 2px 80% 80%',
      }} />
    </div>
  );
}

// ─── Ambient specks ────────────────────────────────────────────────────────────
function AmbientSpecks() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ width: 1 + (i % 2), height: 1 + (i % 2), left: `${(i * 5.6) % 100}%`, top: `${(i * 7.1) % 75}%`, background: 'rgba(245,220,150,0.7)' }}
          animate={{ opacity: [0.1, 0.5, 0.1], scale: [0.8, 1.4, 0.8] }}
          transition={{ duration: 2.5 + (i % 5) * 0.7, repeat: Infinity, delay: i * 0.3 }} />
      ))}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  shloka: Shloka;
  tradition: string;
  userName: string;
  japaStreak: number;
  sessionCountToday: number;
  dailyStotramId: string;
  dailyStotramTitle: string;
  dailyStotramDeityEmoji: string;
}

// ─── Deity cards data ─────────────────────────────────────────────────────────
const DEITY_ORDER: Record<string, string[]> = {
  hindu:    ['ganesha', 'shiva', 'vishnu', 'devi', 'hanuman', 'surya'],
  sikh:     ['universal', 'ganesha', 'shiva', 'vishnu', 'devi', 'hanuman'],
  buddhist: ['universal', 'ganesha', 'shiva', 'vishnu', 'devi', 'hanuman'],
  jain:     ['universal', 'ganesha', 'shiva', 'vishnu', 'devi', 'hanuman'],
};

export default function BhaktiClient({
  shloka, tradition, userName, japaStreak,
  sessionCountToday, dailyStotramId, dailyStotramTitle, dailyStotramDeityEmoji,
}: Props) {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';
  const [showShloka, setShowShloka] = useState(false);

  // ── Theme tokens ────────────────────────────────────────────────────────────
  const pageBg   = isDark ? 'linear-gradient(180deg,#1a0d0d 0%,#20130e 40%,#1a1208 100%)' : 'linear-gradient(180deg,#fdf6ee 0%,#f7ede0 40%,#f2e8d5 100%)';
  const heroBg   = isDark ? 'linear-gradient(180deg,rgba(60,22,10,0.92),rgba(28,14,8,0.96))' : 'linear-gradient(180deg,rgba(255,240,220,0.96),rgba(255,230,200,0.98))';
  const heroBdr  = isDark ? 'rgba(200,146,74,0.18)' : 'rgba(160,90,30,0.18)';
  const cardBg   = isDark ? 'linear-gradient(140deg,rgba(28,20,12,0.92),rgba(18,12,8,0.96))' : 'linear-gradient(140deg,rgba(255,244,228,0.96),rgba(250,235,210,0.98))';
  const cardBdr  = isDark ? 'rgba(200,146,74,0.14)' : 'rgba(180,110,30,0.14)';
  const sectBg   = isDark ? 'rgba(18,12,8,0.9)' : 'rgba(255,245,230,0.95)';
  const sectBdr  = isDark ? 'rgba(200,146,74,0.10)' : 'rgba(180,110,30,0.15)';
  const headClr  = isDark ? '#f5dfa0' : '#2a1002';
  const subClr   = isDark ? 'rgba(245,210,130,0.50)' : 'rgba(120,65,10,0.55)';
  const dimClr   = isDark ? 'rgba(245,210,130,0.35)' : 'rgba(100,55,10,0.40)';
  const amber    = '#C8924A';

  const greeting = TRADITION_GREETINGS[tradition] ?? TRADITION_GREETINGS.hindu;
  const deityOrder = DEITY_ORDER[tradition] ?? DEITY_ORDER.hindu;

  // ── Practice portal cards ───────────────────────────────────────────────────
  const PORTALS = [
    {
      href: '/bhakti/mala',
      emoji: '📿',
      title: 'Japa Mala',
      sub: japaStreak > 0 ? `🔥 ${japaStreak}-day streak` : 'Start today',
      desc: 'Count your mantra with sacred rhythm.',
      glow: 'rgba(180,55,25,0.28)',
      accent: '#d4643a',
      bdr: 'rgba(212,100,50,0.20)',
    },
    {
      href: '/bhakti/zen',
      emoji: '🕉️',
      title: 'Sattvic Mode',
      sub: sessionCountToday > 0 ? `${sessionCountToday} session${sessionCountToday > 1 ? 's' : ''} today` : 'Enter stillness',
      desc: 'Prānāyāma, kīrtana, or silent svādhyāya.',
      glow: 'rgba(80,58,180,0.28)',
      accent: '#8b7de0',
      bdr: 'rgba(130,100,220,0.18)',
    },
    {
      href: `/bhakti/stotram/${dailyStotramId}`,
      emoji: dailyStotramDeityEmoji,
      title: 'Daily Stotram',
      sub: dailyStotramTitle,
      desc: 'Read, listen, and absorb the verse.',
      glow: 'rgba(80,160,60,0.22)',
      accent: '#5c8e4a',
      bdr: 'rgba(80,160,60,0.18)',
    },
    {
      href: '/bhakti/aarti',
      emoji: '🪔',
      title: 'Guided Aarti',
      sub: 'Step-by-step ceremony',
      desc: 'A complete aarti from bell to namaskar.',
      glow: 'rgba(212,140,20,0.25)',
      accent: '#d4a645',
      bdr: 'rgba(212,166,70,0.18)',
    },
  ] as const;

  return (
    <div className="relative min-h-screen" style={{ background: pageBg }}>
      <AmbientSpecks />

      {/* Safe area */}
      <div style={{ height: 'max(env(safe-area-inset-top,0px),16px)' }} />

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pb-2">
        <button onClick={() => router.back()} aria-label="Go back"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
          style={{ background: 'rgba(200,146,74,0.10)', border: '1px solid rgba(200,146,74,0.20)' }}>
          <ChevronLeft size={18} style={{ color: 'rgba(200,146,74,0.80)' }} />
        </button>
        <Link href="/bhakti/insights"
          className="flex items-center gap-1.5 text-[12px] font-medium"
          style={{ color: 'rgba(200,146,74,0.75)' }}>
          <BarChart2 size={13} /> Insights →
        </Link>
      </div>

      <div className="relative space-y-4 px-4 pb-28">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-[2.8rem] px-5 pb-7 pt-10 text-center"
          style={{ background: heroBg, border: `1px solid ${heroBdr}` }}>

          {/* Streak badge */}
          {japaStreak > 0 && (
            <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold"
              style={{ background: 'rgba(220,100,20,0.15)', border: '1px solid rgba(220,100,20,0.25)', color: '#f0a040' }}>
              🔥 Day {japaStreak}
            </div>
          )}

          <div className="relative space-y-3">
            <div className="flex justify-center"><DiyaFlame /></div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem,6vw,2.2rem)', fontWeight: 600, color: headClr, lineHeight: 1.1 }}>
                Bhakti
              </h1>
              <p className="text-sm tracking-widest mt-1" style={{ color: subClr }}>भक्ति — the path of devotion</p>
              <p className="text-xs mt-2 font-medium" style={{ color: amber }}>{greeting}, {userName.split(' ')[0]}</p>
            </motion.div>
          </div>
        </motion.section>

        {/* ── 2×2 Practice cards ───────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6 }}
          className="grid grid-cols-2 gap-3">
          {PORTALS.map((p, i) => (
            <motion.div key={p.href} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}>
              <Link href={p.href}
                className="group flex flex-col rounded-[1.5rem] p-4 h-full relative overflow-hidden"
                style={{ background: cardBg, border: `1px solid ${p.bdr}`, boxShadow: `0 4px 24px ${p.glow}` }}>
                <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
                  style={{ background: `radial-gradient(circle at top right,${p.glow},transparent 70%)` }} />
                <span className="text-2xl mb-2">{p.emoji}</span>
                <p className="text-sm font-semibold leading-tight" style={{ color: headClr }}>{p.title}</p>
                <p className="text-[10px] mt-0.5 font-medium" style={{ color: p.accent }}>{p.sub}</p>
                <p className="text-[11px] mt-1.5 leading-relaxed flex-1" style={{ color: dimClr }}>{p.desc}</p>
                <div className="mt-3 flex items-center justify-end text-[11px] font-semibold" style={{ color: p.accent }}>
                  Enter <ChevronRight size={12} className="ml-0.5" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Browse by Deity ───────────────────────────────────────────────── */}
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-[1.8rem] p-4" style={{ background: sectBg, border: `1px solid ${sectBdr}` }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: subClr }}>By Deity</p>
            <Link href="/bhakti/browse" className="text-[11px] font-semibold" style={{ color: amber }}>Browse all →</Link>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {deityOrder.map((deity) => {
              const meta = DEITY_META[deity];
              if (!meta) return null;
              return (
                <Link key={deity} href={`/bhakti/browse?deity=${deity}`}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 rounded-2xl px-3.5 py-3 transition-all hover:scale-[1.03]"
                  style={{ background: isDark ? 'rgba(28,18,10,0.7)' : 'rgba(240,220,190,0.8)', border: `1px solid ${meta.color}28`, minWidth: 64 }}>
                  <span className="text-2xl">{meta.emoji}</span>
                  <span className="text-[10px] font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                </Link>
              );
            })}
          </div>
        </motion.section>

        {/* ── Browse by Mood ────────────────────────────────────────────────── */}
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="rounded-[1.8rem] p-4" style={{ background: sectBg, border: `1px solid ${sectBdr}` }}>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: subClr }}>By Mood</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(MOOD_META).map(([mood, meta]) => (
              <Link key={mood} href={`/bhakti/browse?mood=${mood}`}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all hover:scale-[1.01]"
                style={{ background: isDark ? 'rgba(28,18,10,0.7)' : 'rgba(240,220,190,0.75)', border: `1px solid ${sectBdr}` }}>
                <span className="text-xl">{meta.emoji}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold leading-tight truncate" style={{ color: headClr }}>{meta.label}</p>
                  <p className="text-[9px] mt-0.5 leading-tight" style={{ color: dimClr }}>{meta.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* ── Guided Aarti CTA ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Link href="/bhakti/aarti"
            className="flex items-center justify-between rounded-[1.8rem] px-5 py-4 relative overflow-hidden"
            style={{ background: isDark ? 'linear-gradient(135deg,rgba(60,30,10,0.9),rgba(30,15,5,0.95))' : 'linear-gradient(135deg,rgba(255,235,200,0.98),rgba(255,220,170,0.98))', border: '1px solid rgba(212,166,70,0.20)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
              style={{ background: 'radial-gradient(circle at top right,rgba(212,140,20,0.15),transparent 70%)' }} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: 'rgba(200,146,74,0.6)' }}>New</p>
              <p className="font-semibold text-sm" style={{ color: headClr }}>🪔 Guided Aarti Ceremony</p>
              <p className="text-[11px] mt-0.5" style={{ color: dimClr }}>Bell → diya → flowers → namaskar — step by step</p>
            </div>
            <ChevronRight size={18} style={{ color: amber, flexShrink: 0 }} />
          </Link>
        </motion.div>

        {/* ── Daily Shloka ──────────────────────────────────────────────────── */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
          className="rounded-[1.8rem] px-5 py-5"
          style={{ background: isDark ? 'rgba(12,8,4,0.8)' : 'rgba(255,245,228,0.95)', border: `1px solid ${sectBdr}` }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'rgba(200,146,74,0.45)' }}>Verse of the day</p>
            <button onClick={() => setShowShloka(v => !v)} className="text-[10px] font-semibold" style={{ color: amber }}>
              {showShloka ? 'Less' : 'Read more'}
            </button>
          </div>
          <p className="text-base leading-relaxed italic" style={{ fontFamily: 'var(--font-serif)', color: isDark ? 'rgba(245,220,150,0.75)' : 'rgba(60,30,5,0.80)' }}>
            &ldquo;{shloka.sanskrit}&rdquo;
          </p>
          <AnimatePresence>
            {showShloka && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <p className="text-sm mt-3 leading-relaxed" style={{ color: dimClr }}>&ldquo;{shloka.meaning}&rdquo;</p>
                <p className="text-xs mt-2" style={{ color: 'rgba(200,146,74,0.35)' }}>{shloka.source}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

      </div>
    </div>
  );
}
