'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, BarChart2, Play, Music, Heart, 
  Settings, CheckCircle2, Circle, Clock, Sun, 
  Moon, Volume2, VolumeX, Share2, Info, Sparkles
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
    <div className="relative min-h-screen pb-32 overflow-x-hidden selection:bg-[#C09759]/30" style={{ backgroundColor: THEME.bg, color: 'white' }}>
      
      {/* ── 1. Immersive Hero Section ────────────────────────────────────────── */}
      <section className="relative h-[65vh] w-full overflow-hidden">
        {/* Dynamic Background Image */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDeity}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.5, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <Image 
              src={`/images/deities/${activeDeity}-bg.png`}
              alt={activeDeity}
              fill
              className="object-cover grayscale contrast-125 brightness-50"
              priority
              onError={(e) => {
                (e.target as any).src = '/images/bhakti-hero.png';
              }}
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Gradients for depth and readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#010101]/80 via-transparent to-[#1A1918]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#010101]/40 via-transparent to-transparent" />
        
        {/* Navigation Overlays */}
        <div className="absolute top-12 inset-x-6 flex items-center justify-between z-20">
          <button 
            onClick={() => router.back()}
            className="w-11 h-11 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-md bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={22} color={THEME.gold} />
          </button>
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-[#C09759] opacity-80">
              {t('sacredSanctuary')}
            </span>
          </div>
          <button className="w-11 h-11 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-md bg-white/5 hover:bg-white/10 transition-colors">
            <Share2 size={18} color={THEME.gold} />
          </button>
        </div>

        {/* Deity Selection Portals */}
        <div className="absolute top-36 inset-x-6 z-20 flex justify-center gap-4">
          {['shiva', 'vishnu', 'devi', 'hanuman', 'ganesha'].map((deity) => (
            <motion.button
              key={deity}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setActiveDeity(deity);
                playHaptic('medium');
              }}
              className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-500 border ${
                activeDeity === deity 
                  ? 'border-[#C09759] bg-[#C09759]/10 shadow-[0_0_20px_rgba(192,151,89,0.15)]' 
                  : 'border-white/5 bg-white/5 backdrop-blur-sm grayscale opacity-40'
              }`}
            >
              <span className="text-2xl">{(DEITY_META as any)[deity]?.emoji || '🕉️'}</span>
              <div className={`w-1 h-1 rounded-full bg-[#C09759] mt-1 transition-opacity ${activeDeity === deity ? 'opacity-100' : 'opacity-0'}`} />
            </motion.button>
          ))}
        </div>

        {/* Hero Title & Atmosphere */}
        <div className="absolute bottom-16 inset-x-8 z-20">
          <motion.div 
            key={activeDeity}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-1"
          >
            <h1 className="text-6xl font-bold premium-serif tracking-tight leading-[1.1] text-white">
              {activeDeity.charAt(0).toUpperCase() + activeDeity.slice(1)} <br/>
              <span style={{ color: THEME.gold }}>{t('auspiciousBeginnings')}</span>
            </h1>
            <div className="flex items-center gap-3 pt-3">
              <Sparkles size={14} color={THEME.gold} className="opacity-50" />
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
                {t('todayIs')} · {new Date().toLocaleDateString(lang === 'en' ? 'en-IN' : lang === 'hi' ? 'hi-IN' : 'pa-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Ambient Ring */}
        <motion.div 
          className="absolute -bottom-1/2 -left-1/4 w-[150%] h-[150%] pointer-events-none opacity-[0.03]"
          animate={{ rotate: 360 }}
          transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
          style={{ 
            background: `conic-gradient(from 0deg, transparent, ${THEME.gold}, transparent)`,
          }}
        />
      </section>

      {/* ── 2. Recommendation Ribbon ─────────────────────────────────────── */}
      <section className="px-6 -mt-10 relative z-40">
        <Link href={`/bhakti/stotram/${dailyStotramId}`}>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-[2.5rem] p-1 border border-[#C09759]/20 shadow-2xl backdrop-blur-3xl"
            style={{ background: `linear-gradient(135deg, ${THEME.charcoal}, ${THEME.void})` }}
          >
            <div className="flex items-center gap-5 p-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-inner bg-[#C09759]/10 border border-[#C09759]/20">
                {dailyStotramDeityEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-[#C09759] uppercase tracking-[0.25em] block mb-1">{t('recommendedForYou')}</span>
                <h4 className="text-white font-bold text-xl truncate">{dailyStotramTitle}</h4>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-[#010101]" style={{ backgroundColor: THEME.gold }}>
                <Play size={20} fill="currentColor" />
              </div>
            </div>
          </motion.div>
        </Link>
      </section>

      {/* ── 3. Time-Aware Rituals (The Pulse) ────────────────────────────── */}
      <section className="px-6 mt-14 grid grid-cols-2 gap-4">
        <div className="rounded-[2rem] p-6 border border-white/5 bg-[#2C2C2F]/30 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2 opacity-50">
            <Clock size={12} color={THEME.gold} />
            <span className="text-[9px] font-bold uppercase tracking-widest">{t('amritKaal')}</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">09:12 — 10:45</span>
        </div>
        <div className="rounded-[2rem] p-6 border border-white/5 bg-[#2C2C2F]/30 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2 opacity-50">
            <Sun size={12} color={THEME.gold} />
            <span className="text-[9px] font-bold uppercase tracking-widest">{t('brahmaMuhurta')}</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">04:22 AM</span>
        </div>
      </section>

      {/* ── 4. Sadhana Progress ─────────────────────────────────────────── */}
      <section className="px-6 mt-12 space-y-6">
        <div className="flex items-end justify-between px-2">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#C09759] uppercase tracking-widest">{t('sadhanaTracker')}</span>
            <h3 className="text-3xl font-serif text-white">{t('dailyRituals')}</h3>
          </div>
          <div className="text-right">
            <span className="text-4xl font-bold text-[#C09759]">{Math.round((checklist.filter(c => c.done).length / checklist.length) * 100)}%</span>
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">{t('ritualProgress')}</p>
          </div>
        </div>

        <div className="space-y-3">
          {checklist.map((item, idx) => (
            <motion.button 
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => toggleCheck(item.id)}
              className={`w-full flex items-center gap-5 p-6 rounded-[2.5rem] border transition-all duration-500 relative overflow-hidden ${
                item.done 
                  ? 'border-[#C09759]/30 bg-[#C09759]/5' 
                  : 'border-white/5 bg-[#2C2C2F]/20 hover:border-white/10'
              }`}
            >
              <div className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-500 ${
                item.done ? 'bg-[#C09759] border-[#C09759] text-[#010101]' : 'border-white/10 text-transparent'
              }`}>
                {item.done && <CheckCircle2 size={18} strokeWidth={3} />}
              </div>
              <div className="flex-1 text-left">
                <span className={`text-lg font-medium transition-colors ${item.done ? 'text-white' : 'text-white/50'}`}>
                  {item.label}
                </span>
              </div>
              {item.done && (
                <div className="text-[10px] font-bold text-[#C09759] uppercase tracking-widest opacity-60">
                  Done
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </section>

      {/* ── 5. The Sacred Verse (Redesigned) ─────────────────────────────── */}
      <section className="px-6 mt-16">
        <div 
          className="rounded-[3.5rem] p-12 text-center space-y-8 relative overflow-hidden border border-white/5"
          style={{ background: `linear-gradient(165deg, ${THEME.charcoal}, ${THEME.bg})` }}
        >
          {/* Decorative Glyph */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#C09759]/5 blur-3xl rounded-full" />
          
          <div className="relative space-y-6">
            <span className="text-[11px] font-bold text-[#C09759] uppercase tracking-[0.4em]">{t('sacredReflection')}</span>
            <p className="text-3xl font-serif text-white leading-[1.4] italic tracking-tight">
              &ldquo;{shloka.sanskrit}&rdquo;
            </p>
            <div className="pt-6">
              <div className="w-16 h-[1.5px] bg-[#C09759]/30 mx-auto mb-5" />
              <p className="text-[10px] text-[#C09759]/80 font-bold uppercase tracking-[0.3em]">— {shloka.source}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Deity Portals (Horizontal Explorer) ────────────────────────── */}
      <section className="mt-16">
        <div className="px-8 flex items-center justify-between mb-8">
          <h3 className="text-2xl font-serif text-white">{t('divinePortals')}</h3>
          <Link href="/bhakti/browse" className="text-[10px] font-bold text-[#C09759] uppercase tracking-widest hover:underline transition whitespace-nowrap shrink-0">
            {t('exploreAll')} →
          </Link>
        </div>
        <div className="flex gap-5 overflow-x-auto px-8 pb-8 scrollbar-none snap-x">
          {['shiva', 'vishnu', 'devi', 'hanuman', 'ganesha', 'surya'].map((deity) => (
            <Link 
              key={deity}
              href={`/bhakti/browse?deity=${deity}`}
              className="flex-shrink-0 w-32 h-44 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center gap-4 active:scale-95 transition-all snap-center group"
              style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.03), transparent)` }}
            >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-4xl group-hover:bg-[#C09759]/10 transition-colors">
                {(DEITY_META as any)[deity]?.emoji || '🕉️'}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-white/40 group-hover:text-[#C09759] transition-colors">
                {(DEITY_META as any)[deity]?.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Custom Zenith Background Elements */}
      <div className="fixed bottom-0 inset-x-0 h-96 bg-gradient-to-t from-[#010101] to-transparent pointer-events-none -z-10" />
      <div className="fixed top-0 right-0 w-96 h-96 bg-[#C09759]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 -z-10" />
    </div>
  );
}
