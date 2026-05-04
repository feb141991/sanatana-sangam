'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, BarChart2, ChevronRight } from 'lucide-react';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import type { Shloka } from '@/lib/shlokas';
import { DEITY_META, MOOD_META } from '@/lib/stotrams';
import { getTraditionMeta } from '@/lib/tradition-config';
import { CURATED_SOUNDS, BHAKTI_COLLECTIONS } from '@/lib/curated-bhakti';
import { Sparkles } from 'lucide-react';

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
// Orders are now managed in TRADITION_CONFIG

export default function BhaktiClient({
  shloka, tradition, userName, japaStreak,
  sessionCountToday, dailyStotramId, dailyStotramTitle, dailyStotramDeityEmoji,
}: Props) {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';
  const [showShloka, setShowShloka] = useState(false);

  // ── Premium Theme Tokens (Sattvic Ivory & Sacred Gold) ──────────────────────
  const pageBg   = isDark ? '#0A0A0A' : '#FDFCF8';
  const glassBg  = isDark ? 'rgba(25,25,25,0.7)' : 'rgba(255,255,255,0.6)';
  const glassBdr = isDark ? 'rgba(200,160,80,0.1)' : 'rgba(200,160,80,0.2)';
  const gold     = '#C5A059';
  const textMain = isDark ? '#F5F5F5' : '#1A1A1A';
  const textDim  = isDark ? 'rgba(245,245,245,0.5)' : 'rgba(26,26,26,0.5)';

  const meta = getTraditionMeta(tradition);
  const greeting = meta.bhaktiGreeting + ' 🙏';
  
  // If the tradition doesn't specify a deity order, or if it's short, we fill it with defaults
  const baseOrder = meta.bhaktiDeityOrder.length > 0 ? meta.bhaktiDeityOrder : ['universal'];
  const fullOrder = Array.from(new Set([...baseOrder, 'ganesha', 'shiva', 'vishnu', 'devi', 'hanuman', 'surya']));
  const deityOrder = fullOrder.slice(0, 6);

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

        {/* ── Sacred Altar (Hero) ── */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative rounded-[3rem] px-6 py-12 text-center overflow-hidden"
          style={{ background: glassBg, border: `1px solid ${glassBdr}` }}>
          <div className="absolute inset-0 pointer-events-none opacity-20"
            style={{ background: `radial-gradient(circle at 50% 0%, ${gold}, transparent 70%)` }} />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4 scale-75 opacity-80"><DiyaFlame /></div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', color: textMain, fontWeight: 500 }}>
              The Altar
            </h1>
            <p className="text-[10px] uppercase tracking-[0.3em] mt-2" style={{ color: gold }}>
              Sanatana Sanctuary
            </p>
          </div>
        </motion.section>

        {/* ── Sound Sanctuary (High Research Content) ── */}
        <section className="space-y-5">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: textMain }}>Sound Sanctuary</h2>
            <Link href="/bhakti/sounds" className="text-[10px] font-bold" style={{ color: gold }}>Explore All</Link>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none px-1">
            {BHAKTI_COLLECTIONS.map((collection, idx) => (
              <motion.div key={idx} whileTap={{ scale: 0.98 }}
                className="flex-shrink-0 w-72 rounded-[2.5rem] p-6 relative overflow-hidden"
                style={{ background: glassBg, border: `1px solid ${glassBdr}` }}>
                <div className="relative z-10">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: gold }}>Collection</p>
                  <p className="text-sm font-bold mb-1" style={{ color: textMain }}>{collection.title}</p>
                  <p className="text-[10px] opacity-60 leading-relaxed mb-4" style={{ color: textDim }}>{collection.description}</p>
                  <div className="flex items-center gap-2">
                    <button className="flex-1 py-2.5 rounded-full text-[10px] font-bold bg-[#C5A059] text-white">Play All</button>
                  </div>
                </div>
                {/* Decorative Pattern */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10" style={{ color: gold }}>
                   <Sparkles size={80} />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="space-y-3 px-1">
            <p className="text-[10px] font-bold uppercase tracking-widest px-2 opacity-50">Featured Mantras</p>
            <div className="grid grid-cols-1 gap-2">
              {CURATED_SOUNDS.slice(0, 3).map(sound => (
                <motion.div key={sound.id} whileTap={{ scale: 0.99 }}
                  className="rounded-3xl p-4 flex items-center gap-4 transition-all"
                  style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${glassBdr}` }}>
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg" style={{ background: glassBg }}>
                    {sound.type === 'mantra' ? '🕉️' : sound.type === 'chant' ? '📿' : '🪕'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold truncate" style={{ color: textMain }}>{sound.title}</p>
                    <p className="text-[10px] opacity-50 truncate" style={{ color: textDim }}>{sound.artist}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] opacity-40">{sound.duration}</span>
                    {sound.isPremium && (
                      <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-amber-500/10 text-amber-500 uppercase">Pro</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Guided Sadhana (High Revenue / Premium Only) ── */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest px-2" style={{ color: textMain }}>Guided Sadhana</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none px-2">
            {[
              { title: '21 Days of Ganesh Bhakti', author: 'Swami Haridas', duration: '21 days', price: 'Premium' },
              { title: 'The Path of Shiva', author: 'Ma Ananda', duration: '14 days', price: 'Premium' },
            ].map((path, i) => (
              <div key={i} className="flex-shrink-0 w-64 rounded-[2.5rem] p-6 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1A1A1A, #000)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="absolute top-0 right-0 p-4">
                  <span className="px-2 py-1 rounded-md text-[8px] font-bold bg-amber-500/20 text-amber-500 uppercase tracking-tighter">Premium</span>
                </div>
                <p className="text-xs font-bold text-white mb-1">{path.title}</p>
                <p className="text-[10px] text-white/50 mb-4">{path.author}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[9px] text-white/40">{path.duration}</span>
                  <button className="px-4 py-1.5 rounded-full text-[10px] font-bold bg-white text-black">Start Journey</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Practice Portals ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="grid grid-cols-2 gap-3">
          {PORTALS.map((p, i) => (
            <motion.div key={p.href} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}>
              <Link href={p.href}
                className="group flex flex-col rounded-[2rem] p-5 h-full relative overflow-hidden"
                style={{ background: glassBg, border: `1px solid ${glassBdr}` }}>
                <span className="text-2xl mb-3">{p.emoji}</span>
                <p className="text-[13px] font-bold" style={{ color: textMain }}>{p.title}</p>
                <p className="text-[9px] mt-0.5 font-bold uppercase tracking-wider" style={{ color: gold }}>{p.sub}</p>
                <p className="text-[10px] mt-2 leading-relaxed flex-1" style={{ color: textDim }}>{p.desc}</p>
                <div className="mt-4 flex items-center justify-end text-[10px] font-bold" style={{ color: gold }}>
                  Enter <ChevronRight size={10} className="ml-1" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Browse by Deity ── */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="rounded-[2.5rem] p-5" style={{ background: glassBg, border: `1px solid ${glassBdr}` }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: textDim }}>By Deity</p>
            <Link href="/bhakti/browse" className="text-[10px] font-bold" style={{ color: gold }}>Browse All</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {deityOrder.map((deity) => {
              const meta = DEITY_META[deity];
              if (!meta) return null;
              return (
                <Link key={deity} href={`/bhakti/browse?deity=${deity}`}
                  className="flex-shrink-0 flex flex-col items-center gap-2 rounded-2xl px-4 py-4 transition-all hover:scale-[1.03]"
                  style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${glassBdr}`, minWidth: 70 }}>
                  <span className="text-2xl">{meta.emoji}</span>
                  <span className="text-[9px] font-bold uppercase tracking-tighter" style={{ color: textMain }}>{meta.label}</span>
                </Link>
              );
            })}
          </div>
        </motion.section>

        {/* ── Browse by Mood ── */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="rounded-[2.5rem] p-5" style={{ background: glassBg, border: `1px solid ${glassBdr}` }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: textDim }}>By Mood</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(MOOD_META).map(([mood, meta]) => (
              <Link key={mood} href={`/bhakti/browse?mood=${mood}`}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all hover:scale-[1.01]"
                style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${glassBdr}` }}>
                <span className="text-xl">{meta.emoji}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold leading-tight truncate" style={{ color: textMain }}>{meta.label}</p>
                  <p className="text-[9px] mt-0.5 leading-tight" style={{ color: textDim }}>{meta.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* ── Guided Aarti CTA ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <Link href="/bhakti/aarti"
            className="flex items-center justify-between rounded-[2.5rem] px-6 py-5 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1A1A1A, #000)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: gold }}>Sacred Ritual</p>
              <p className="font-bold text-sm text-white">🪔 Guided Aarti Ceremony</p>
              <p className="text-[10px] mt-1 text-white/50">Experience the complete ritual step-by-step</p>
            </div>
            <ChevronRight size={16} className="text-white" />
          </Link>
        </motion.div>

        {/* ── Daily Shloka ── */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
          className="rounded-[2.5rem] px-6 py-6"
          style={{ background: glassBg, border: `1px solid ${glassBdr}` }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: textDim }}>Verse of the Day</p>
            <button onClick={() => setShowShloka(v => !v)} className="text-[10px] font-bold" style={{ color: gold }}>
              {showShloka ? 'Close' : 'Reflection'}
            </button>
          </div>
          <p className="text-lg leading-relaxed italic" style={{ fontFamily: 'var(--font-serif)', color: textMain }}>
            &ldquo;{shloka.sanskrit}&rdquo;
          </p>
          <AnimatePresence>
            {showShloka && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <p className="text-sm mt-4 leading-relaxed" style={{ color: textDim }}>{shloka.meaning}</p>
                <p className="text-[10px] mt-3 font-bold uppercase tracking-wider" style={{ color: gold }}>{shloka.source}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

      </div>
    </div>
  );
}
