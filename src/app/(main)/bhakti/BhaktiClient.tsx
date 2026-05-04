'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, BarChart2, ChevronRight, Sparkles, Play, Music, Mic2, Heart, BookOpen, Sun, Moon, Wind } from 'lucide-react';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import type { Shloka } from '@/lib/shlokas';
import { DEITY_META, MOOD_META } from '@/lib/stotrams';
import { getTraditionMeta } from '@/lib/tradition-config';
import { CURATED_SOUNDS, BHAKTI_COLLECTIONS } from '@/lib/curated-bhakti';
import DivineDiya from '@/components/bhakti/DivineDiya';
import Image from 'next/image';

// ─── Ambient Particles ────────────────────────────────────────────────────────
function AmbientParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ 
            width: Math.random() * 2 + 1, 
            height: Math.random() * 2 + 1, 
            left: `${Math.random() * 100}%`, 
            top: `${Math.random() * 100}%`, 
            background: '#C5A059',
            opacity: 0.2
          }}
          animate={{ 
            opacity: [0.1, 0.4, 0.1], 
            y: [0, -30, 0],
            x: [0, (Math.random() - 0.5) * 20, 0]
          }}
          transition={{ 
            duration: 4 + Math.random() * 4, 
            repeat: Infinity, 
            delay: Math.random() * 5 
          }}
        />
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

export default function BhaktiClient({
  shloka, tradition, userName, japaStreak,
  sessionCountToday, dailyStotramId, dailyStotramTitle, dailyStotramDeityEmoji,
}: Props) {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';
  const [showShloka, setShowShloka] = useState(false);

  // ── Premium Theme Tokens (Sattvic Ivory & Sacred Gold) ──────────────────────
  const pageBg   = isDark ? '#1A1A18' : '#FDFCF8';
  const glassBg  = isDark ? 'rgba(42,42,40,0.8)' : 'rgba(255,254,252,0.9)';
  const glassBdr = isDark ? 'rgba(197,160,89,0.15)' : 'rgba(197,160,89,0.12)';
  const gold     = '#C5A059';
  const textMain = isDark ? '#FDFCF8' : '#2A1B0A';
  const textDim  = isDark ? '#8E8E7A' : '#8E8E7A';

  const meta = getTraditionMeta(tradition);
  const greeting = meta.bhaktiGreeting + ' 🙏';
  
  // Manage Deity Order
  const baseOrder = meta.bhaktiDeityOrder.length > 0 ? meta.bhaktiDeityOrder : ['universal'];
  const fullOrder = Array.from(new Set([...baseOrder, 'ganesha', 'shiva', 'vishnu', 'devi', 'hanuman', 'surya']));
  const deityOrder = fullOrder.slice(0, 6);

  const PORTALS = [
    {
      href: '/bhakti/mala',
      icon: '📿',
      title: 'Japa Mala',
      sub: japaStreak > 0 ? `🔥 ${japaStreak}-day streak` : 'Start today',
      desc: 'Sacred chanting rhythm',
    },
    {
      href: '/bhakti/zen',
      icon: '🧘',
      title: 'Sattvic Mode',
      sub: 'Enter Stillness',
      desc: 'Meditative focus',
    },
    {
      href: `/bhakti/stotram/${dailyStotramId}`,
      icon: dailyStotramDeityEmoji,
      title: 'Daily Stotram',
      sub: dailyStotramTitle,
      desc: 'Sacred recitation',
    },
    {
      href: '/bhakti/aarti',
      icon: '🪔',
      title: 'Guided Aarti',
      sub: 'Ritual Ceremony',
      desc: 'Step-by-step devotion',
    },
  ];

  return (
    <div className="relative min-h-screen selection:bg-[#C5A059]/30 overflow-x-hidden" style={{ background: pageBg }}>
      <AmbientParticles />

      {/* Header Area */}
      <div className="px-6 pt-10 pb-6 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-white/50 dark:bg-black/20 border border-[#C5A059]/10 shadow-sm backdrop-blur-md active:scale-95 transition-all"
        >
          <ChevronLeft size={24} className="text-[#C5A059]" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C5A059] mb-1">{greeting}</p>
          <h2 className="text-xl font-serif text-[#2A1B0A] dark:text-[#FDFCF8]">Bhakti Yoga</h2>
        </div>
        <Link href="/bhakti/insights" className="w-12 h-12 rounded-full flex items-center justify-center bg-white/50 dark:bg-black/20 border border-[#C5A059]/10 shadow-sm backdrop-blur-md active:scale-95 transition-all">
          <BarChart2 size={20} className="text-[#C5A059]" />
        </Link>
      </div>

      <div className="px-6 space-y-12 pb-32">
        
        {/* ── Sacred Altar: The Spiritual Center ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[3.5rem] p-12 text-center overflow-hidden border-0 transition-all duration-700 hover:shadow-2xl hover:shadow-[#C5A059]/10"
          style={{ 
            background: 'linear-gradient(165deg, #FFFEFC 0%, #FDFCF8 100%)',
            boxShadow: '0 20px 80px rgba(197,160,89,0.08)'
          }}
        >
          <div className="absolute inset-0 opacity-30 transition-opacity duration-700 group-hover:opacity-50"
            style={{ background: 'radial-gradient(circle at center, #FFF4E0 0%, transparent 70%)' }} />
          
          <div className="relative z-10">
            <div className="mb-10 transform scale-110">
              <DivineDiya />
            </div>
            <h1 className="text-3xl font-serif text-[#2A1B0A] mb-2">Personal Altar</h1>
            <p className="text-xs text-[#8E8E7A] uppercase tracking-[0.2em]">Your Sacred Connection</p>
          </div>
        </motion.section>

        {/* ── Guided Sadhana: Premium Experiences ── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-serif text-[#2A1B0A] dark:text-[#FDFCF8]">Guided Sadhana</h3>
            <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">Premium Paths</span>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <div className="group relative rounded-[2.5rem] p-8 overflow-hidden bg-[#2A1B0A] text-white shadow-xl shadow-[#2A1B0A]/20 transition-all hover:-translate-y-1 active:scale-[0.98]">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#C5A059]/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3 py-1 rounded-full bg-[#C5A059] text-[9px] font-bold uppercase tracking-widest">Intensive</span>
                  <span className="text-xs text-white/50">21 Days</span>
                </div>
                <h4 className="text-xl font-serif mb-2">The Mahamantra Journey</h4>
                <p className="text-xs text-white/60 leading-relaxed mb-6 max-w-[240px]">Master the sacred vibrations with expert-led daily practices and deep meditation.</p>
                <button className="px-6 py-3 rounded-full bg-[#C5A059] text-white text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-[#C5A059]/20 transition-all hover:bg-[#D4AF37]">
                  Begin Initiation
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Practice Portals: Core Tools ── */}
        <section className="grid grid-cols-2 gap-4">
          {PORTALS.map((portal, i) => (
            <Link key={portal.href} href={portal.href}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="h-full p-6 rounded-[2.5rem] bg-white/40 dark:bg-black/20 border border-[#C5A059]/10 hover:border-[#C5A059]/30 transition-all flex flex-col items-center text-center group"
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{portal.icon}</div>
                <h4 className="text-sm font-bold text-[#2A1B0A] dark:text-[#FDFCF8] mb-1">{portal.title}</h4>
                <p className="text-[9px] font-bold text-[#C5A059] uppercase tracking-wider mb-2">{portal.sub}</p>
                <p className="text-[10px] text-[#8E8E7A] leading-relaxed">{portal.desc}</p>
              </motion.div>
            </Link>
          ))}
        </section>

        {/* ── Browse by Deity ── */}
        <section className="rounded-[2.5rem] p-8 bg-white/40 dark:bg-black/20 border border-[#C5A059]/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-[#C5A059] uppercase tracking-widest">Deity Portals</h3>
            <Link href="/bhakti/browse" className="text-[10px] font-bold text-[#C5A059] underline">See All</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {deityOrder.map((deity) => {
              const dMeta = DEITY_META[deity];
              if (!dMeta) return null;
              return (
                <Link key={deity} href={`/bhakti/browse?deity=${deity}`} className="flex-shrink-0 flex flex-col items-center gap-2 group">
                  <div className="w-14 h-14 rounded-full bg-white/50 dark:bg-white/5 flex items-center justify-center text-2xl shadow-sm border border-[#C5A059]/5 group-hover:scale-110 transition-transform">
                    {dMeta.emoji}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-tighter text-[#2A1B0A] dark:text-[#FDFCF8]">{dMeta.label}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Sound Sanctuary: Mantras & Bhajans ── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-serif text-[#2A1B0A] dark:text-[#FDFCF8]">Sound Sanctuary</h3>
            <Link href="/bhakti/sounds" className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">Explore All</Link>
          </div>
          <div className="space-y-4">
            {CURATED_SOUNDS.slice(0, 3).map((sound, i) => (
              <motion.div 
                key={sound.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="group flex items-center gap-4 p-4 rounded-[2rem] bg-white/40 dark:bg-black/20 border border-[#C5A059]/5 hover:border-[#C5A059]/20 transition-all active:scale-[0.99]"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#C5A059]/10 flex items-center justify-center text-xl group-hover:bg-[#C5A059]/20 transition-colors">
                  {sound.type === 'mantra' ? '🕉️' : '📿'}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-bold text-[#2A1B0A] dark:text-[#FDFCF8] truncate">{sound.title}</h5>
                  <p className="text-[10px] text-[#8E8E7A] uppercase tracking-wider truncate">{sound.artist}</p>
                </div>
                <button className="w-10 h-10 rounded-full flex items-center justify-center bg-[#C5A059] text-white shadow-lg shadow-[#C5A059]/10">
                  <Play size={16} className="ml-1" />
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Verse of the Day ── */}
        <section className="rounded-[3rem] p-8 bg-[#FDFCF8] dark:bg-[#1A1A18] border border-[#C5A059]/20 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[9px] font-bold text-[#C5A059] uppercase tracking-[0.2em]">Verse of the Day</span>
            <div className="flex gap-2">
              <button onClick={() => setShowShloka(!showShloka)} className="text-[9px] font-bold text-[#8E8E7A] uppercase">{showShloka ? 'Collapse' : 'Meaning'}</button>
            </div>
          </div>
          <p className="text-xl font-serif text-[#2A1B0A] dark:text-[#FDFCF8] leading-relaxed italic text-center">
            "{shloka.sanskrit}"
          </p>
          <AnimatePresence>
            {showShloka && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 pt-6 border-t border-[#C5A059]/10"
              >
                <p className="text-sm text-[#8E8E7A] leading-relaxed">{shloka.meaning}</p>
                <p className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest mt-4">— {shloka.source}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

      </div>
    </div>
  );
}
