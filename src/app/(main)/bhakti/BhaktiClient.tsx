'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, BarChart2, Play, Music, Heart, 
  Settings, CheckCircle2, Circle, Clock, Sun, 
  Moon, Volume2, VolumeX, Share2, Info, Sparkles, ChevronRight
} from 'lucide-react';
import { useZenithSensory } from '@/contexts/ZenithSensoryContext';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { Shloka } from '@/lib/shlokas';
import { DEITY_META } from '@/lib/stotrams';
import Image from 'next/image';
import Link from 'next/link';

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

// ── New Color Palette ────────────────────────────────────────────────────────
const THEME = {
  bg: '#1A1918',
  void: '#010101',
  charcoal: '#2C2C2F',
  gold: '#C09759',
  goldMuted: 'rgba(192, 151, 89, 0.4)',
  goldGlow: 'rgba(192, 151, 89, 0.1)',
  textGold: '#E2C28F',
  textMuted: 'rgba(255, 255, 255, 0.4)',
};

export default function BhaktiClient({
  shloka, tradition, userName, japaStreak, sessionCountToday,
  dailyStotramId, dailyStotramTitle, dailyStotramDeityEmoji
}: Props) {
  const router = useRouter();
  const { playHaptic } = useZenithSensory();
  const { t, lang } = useLanguage();

  const [activeDeity, setActiveDeity] = useState('shiva');
  const [checklist, setChecklist] = useState([
    { id: 'morning-prayer', label: t('morningRoutine'), done: false },
    { id: 'japa-session', label: t('japa'), done: false },
    { id: 'daily-shloka', label: t('dailyVerse'), done: false },
  ]);

  const toggleCheck = (id: string) => {
    playHaptic('light');
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  return (
    <div className="relative min-h-screen pb-48 overflow-x-hidden bg-[#050506] text-white font-outfit selection:bg-[var(--premium-gold)]/30">
      
      {/* ── Immersive Atmospheric Layers ── */}
      <div className="fixed top-[-10%] right-[-10%] w-[100vw] h-[100vw] bg-[var(--premium-gold)]/5 blur-[160px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-rose-500/5 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none -z-10" />

      {/* ── 1. Infinite Hero Sanctuary ────────────────────────────────────────── */}
      <section className="relative h-[85vh] w-full overflow-hidden">
        {/* Dynamic Background Image - Deep Immersion */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDeity}
            initial={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
            animate={{ opacity: 0.6, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image 
              src={`/images/deities/${activeDeity}-bg.png`}
              alt={activeDeity}
              fill
              className="object-cover grayscale contrast-125 brightness-50 opacity-60"
              priority
              onError={(e) => {
                (e.target as any).src = '/images/bhakti-hero.png';
              }}
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Organic Gradient Masking */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050506]/90 via-transparent to-[#050506]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050506_100%)] opacity-60" />
        
        {/* Divine Header Navigation */}
        <div className="absolute top-16 inset-x-10 flex items-center justify-between z-30">
          <motion.button 
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="w-16 h-16 rounded-[2.2rem] flex items-center justify-center border border-white/10 backdrop-blur-2xl bg-white/5 shadow-2xl transition-all"
          >
            <ChevronLeft size={28} className="text-[var(--premium-gold)]" />
          </motion.button>
          <div className="flex flex-col items-center">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-6 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md mb-2"
            >
              <span className="text-[11px] font-black uppercase tracking-[0.5em] text-[var(--premium-gold)]">
                {t('sacredSanctuary')}
              </span>
            </motion.div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 rounded-[2.2rem] flex items-center justify-center border border-white/10 backdrop-blur-2xl bg-white/5 shadow-2xl transition-all"
          >
            <Share2 size={22} className="text-[var(--premium-gold)]" />
          </motion.button>
        </div>

        {/* Deity Selection Portals - Circular Fluidity */}
        <div className="absolute top-48 inset-x-10 z-30 flex justify-center gap-6">
          {['shiva', 'vishnu', 'devi', 'hanuman', 'ganesha'].map((deity) => (
            <motion.button
              key={deity}
              whileHover={{ y: -6, scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setActiveDeity(deity);
                playHaptic('medium');
              }}
              className={`w-18 h-18 px-5 py-5 rounded-[2rem] flex flex-col items-center justify-center transition-all duration-700 border ${
                activeDeity === deity 
                  ? 'border-[var(--premium-gold)] bg-[var(--premium-gold)]/10 shadow-[0_0_30px_rgba(192,151,89,0.2)]' 
                  : 'border-white/5 bg-white/[0.02] backdrop-blur-md grayscale opacity-30 hover:opacity-60'
              }`}
            >
              <span className="text-3xl">{(DEITY_META as any)[deity]?.emoji || '🕉️'}</span>
              <motion.div 
                layoutId="deityIndicator"
                className={`w-1.5 h-1.5 rounded-full bg-[var(--premium-gold)] mt-2 transition-opacity ${activeDeity === deity ? 'opacity-100' : 'opacity-0'}`} 
              />
            </motion.button>
          ))}
        </div>

        {/* Hero Title - Kinetic Typography */}
        <div className="absolute bottom-24 inset-x-12 z-30">
          <motion.div 
            key={activeDeity}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            <h1 className="text-8xl font-bold font-serif tracking-tighter leading-[0.9] text-white">
              {activeDeity.charAt(0).toUpperCase() + activeDeity.slice(1)} <br/>
              <span className="text-[var(--premium-gold)] italic opacity-90">{t('auspiciousBeginnings')}</span>
            </h1>
            <div className="flex items-center gap-4 pt-4">
              <Sparkles size={18} className="text-[var(--premium-gold)] opacity-40 animate-pulse" />
              <p className="text-white/30 text-[12px] font-black uppercase tracking-[0.4em]">
                {t('todayIs')} · {new Date().toLocaleDateString(lang === 'en' ? 'en-IN' : lang === 'hi' ? 'hi-IN' : 'pa-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Celestial Ring */}
        <motion.div 
          className="absolute -bottom-1/2 -left-1/4 w-[150%] h-[150%] pointer-events-none opacity-[0.05]"
          animate={{ rotate: 360 }}
          transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
          style={{ 
            background: `conic-gradient(from 0deg, transparent, var(--premium-gold), transparent)`,
          }}
        />
      </section>

      {/* ── 2. Recommendation Ribbon - Full Edge Flow ─────────────────────────────────────── */}
      <section className="px-10 -mt-16 relative z-40">
        <Link href={`/bhakti/stotram/${dailyStotramId}`}>
          <motion.div 
            whileHover={{ y: -8 }}
            whileTap={{ scale: 0.99 }}
            className="rounded-[6rem] p-[1.5px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden"
            style={{ background: `linear-gradient(135deg, rgba(192, 151, 89, 0.4), transparent)` }}
          >
            <div className="flex items-center gap-8 p-10 bg-[#0d0d0f] rounded-[6rem] backdrop-blur-3xl">
              <div className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-5xl shadow-inner bg-[var(--premium-gold)]/10 border border-[var(--premium-gold)]/20">
                {dailyStotramDeityEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-black text-[var(--premium-gold)] uppercase tracking-[0.3em] block mb-2">{t('recommendedForYou')}</span>
                <h4 className="text-white font-bold text-3xl tracking-tight truncate">{dailyStotramTitle}</h4>
              </div>
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-black shadow-[0_20px_40px_rgba(192,151,89,0.3)] hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--premium-gold)' }}>
                <Play size={32} fill="currentColor" strokeWidth={1.5} />
              </div>
            </div>
          </motion.div>
        </Link>
      </section>

      {/* ── 3. Path Explorer Grid ─────────────────────────────── */}
      <section className="px-10 mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link href="/bhakti/katha" className="contents">
          <motion.div
            whileHover={{ y: -10, backgroundColor: 'rgba(255,255,255,0.06)' }}
            whileTap={{ scale: 0.98 }}
            className="rounded-[5rem] p-10 border border-white/[0.04] bg-white/[0.03] backdrop-blur-2xl flex items-center gap-8 group"
          >
            <div className="w-24 h-24 rounded-[3rem] bg-[var(--premium-gold)]/10 border border-[var(--premium-gold)]/20 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
              📖
            </div>
            <div className="flex-1">
              <span className="text-[11px] font-black text-[var(--premium-gold)] uppercase tracking-[0.3em] block mb-2">Sacred Library</span>
              <h4 className="text-white font-bold text-2xl tracking-tight italic">Sacred Kathas</h4>
              <p className="text-white/20 text-sm mt-1 font-medium">Ancient narratives preserved for the modern seeker.</p>
            </div>
            <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-[var(--premium-gold)] opacity-0 group-hover:opacity-100 transition-all">
              <ChevronRight size={24} />
            </div>
          </motion.div>
        </Link>

        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-[4rem] p-10 border border-white/[0.04] bg-white/[0.02] flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4 opacity-40">
              <Clock size={16} className="text-[var(--premium-gold)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('amritKaal')}</span>
            </div>
            <span className="text-3xl font-bold tracking-tighter text-white">09:12 — 10:45</span>
          </div>
          <div className="rounded-[4rem] p-10 border border-white/[0.04] bg-white/[0.02] flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4 opacity-40">
              <Sun size={16} className="text-[var(--premium-gold)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('brahmaMuhurta')}</span>
            </div>
            <span className="text-3xl font-bold tracking-tighter text-white">04:22 AM</span>
          </div>
        </div>
      </section>

      {/* ── 4. Ritual Progression ─────────────────────────────────────────── */}
      <section className="px-10 mt-24 space-y-12">
        <div className="flex items-end justify-between px-6">
          <div className="space-y-2">
            <span className="text-[11px] font-black text-[var(--premium-gold)] uppercase tracking-[0.3em]">{t('sadhanaTracker')}</span>
            <h3 className="text-5xl font-serif font-bold text-white tracking-tighter">{t('dailyRituals')}</h3>
          </div>
          <div className="text-right">
            <span className="text-6xl font-bold text-[var(--premium-gold)] tabular-nums">{Math.round((checklist.filter(c => c.done).length / checklist.length) * 100)}%</span>
            <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em] mt-2">{t('ritualProgress')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {checklist.map((item, idx) => (
            <motion.button 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => toggleCheck(item.id)}
              className={`w-full flex items-center gap-8 p-10 rounded-[5rem] border transition-all duration-700 relative overflow-hidden ${
                item.done 
                  ? 'border-[var(--premium-gold)]/40 bg-[var(--premium-gold)]/5' 
                  : 'border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05]'
              }`}
            >
              <div className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-700 ${
                item.done ? 'bg-[var(--premium-gold)] border-[var(--premium-gold)] text-black' : 'border-white/10 text-transparent'
              }`}>
                {item.done && <CheckCircle2 size={28} strokeWidth={2.5} />}
              </div>
              <div className="flex-1 text-left">
                <span className={`text-3xl font-serif font-bold tracking-tight transition-colors ${item.done ? 'text-white' : 'text-white/30'}`}>
                  {item.label}
                </span>
              </div>
              {item.done && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="px-6 py-2 rounded-full bg-[var(--premium-gold)]/20 text-[10px] font-black text-[var(--premium-gold)] uppercase tracking-[0.2em]"
                >
                  Completed
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </section>

      {/* ── 5. The Living Word ─────────────────────────────── */}
      <section className="px-10 mt-32">
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="rounded-[6rem] p-24 text-center space-y-12 relative overflow-hidden border border-white/[0.03] bg-gradient-to-br from-white/[0.02] to-transparent shadow-[0_60px_120px_rgba(0,0,0,0.6)]"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[var(--premium-gold)]/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative space-y-10">
            <div className="flex items-center justify-center gap-4">
               <div className="w-12 h-px bg-[var(--premium-gold)]/20" />
               <span className="text-[12px] font-black text-[var(--premium-gold)] uppercase tracking-[0.6em]">{t('sacredReflection')}</span>
               <div className="w-12 h-px bg-[var(--premium-gold)]/20" />
            </div>
            <p className="text-5xl md:text-6xl font-serif text-white leading-[1.3] italic tracking-tight font-medium">
              &ldquo;{shloka.sanskrit}&rdquo;
            </p>
            <div className="pt-8">
              <div className="w-24 h-[2px] bg-[var(--premium-gold)]/20 mx-auto mb-8 rounded-full" />
              <p className="text-[13px] text-[var(--premium-gold)] font-black uppercase tracking-[0.5em] opacity-80">— {shloka.source}</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── 6. Infinite Divine Portals ────────────────────────── */}
      <section className="mt-32">
        <div className="px-16 flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <h3 className="text-4xl font-serif font-bold text-white tracking-tighter italic">Divine <span className="text-white/10 not-italic">Portals</span></h3>
            <div className="w-32 h-[1px] bg-white/10" />
          </div>
          <Link href="/bhakti/browse" className="text-[11px] font-black text-[var(--premium-gold)] uppercase tracking-[0.4em] hover:tracking-[0.5em] transition-all shrink-0">
            {t('exploreAll')} →
          </Link>
        </div>
        
        <div className="flex gap-8 overflow-x-auto px-16 pb-20 scrollbar-none snap-x">
          {['shiva', 'vishnu', 'devi', 'hanuman', 'ganesha', 'surya'].map((deity) => (
            <Link 
              key={deity}
              href={`/bhakti/browse?deity=${deity}`}
              className="flex-shrink-0 w-44 h-64 rounded-[4rem] border border-white/[0.04] bg-white/[0.02] flex flex-col items-center justify-center gap-6 active:scale-95 transition-all snap-center group hover:bg-white/[0.06]"
            >
              <div className="w-24 h-24 rounded-full bg-white/[0.03] flex items-center justify-center text-5xl group-hover:bg-[var(--premium-gold)] group-hover:text-black transition-all duration-500 shadow-2xl">
                {(DEITY_META as any)[deity]?.emoji || '🕉️'}
              </div>
              <span className="text-[12px] font-black uppercase tracking-[0.3em] text-white/20 group-hover:text-[var(--premium-gold)] transition-colors">
                {(DEITY_META as any)[deity]?.label}
              </span>
            </Link>
          ))}
          <div className="flex-shrink-0 w-16" />
        </div>
      </section>

    </div>
  );
}
