'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, BarChart2, Play, Music, Heart, 
  Settings, CheckCircle2, Circle, Clock, Sun, 
  Moon, Volume2, VolumeX, Share2, Info
} from 'lucide-react';
import { useZenithSensory } from '@/contexts/ZenithSensoryContext';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { Shloka } from '@/lib/shlokas';
import { DEITY_META } from '@/lib/stotrams';
import { CURATED_SOUNDS } from '@/lib/curated-bhakti';
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

export default function BhaktiClient({
  shloka, tradition, userName, japaStreak, sessionCountToday,
  dailyStotramId, dailyStotramTitle, dailyStotramDeityEmoji
}: Props) {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const { isMuted, setIsMuted, playHaptic } = useZenithSensory();
  const { t, lang } = useLanguage();
  const isDark = resolvedTheme === 'dark';

  const [activeDeity, setActiveDeity] = useState('shiva');
  const [activeSound, setActiveSound] = useState(CURATED_SOUNDS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
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
    <div className="relative min-h-screen pb-32 overflow-x-hidden bg-[#0C0A07]">
      {/* ── 1. Cosmic Hero Section ────────────────────────────────────────── */}
      <section className="relative h-[70vh] w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDeity}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <Image 
              src={`/images/deities/${activeDeity}-bg.png`}
              alt={activeDeity}
              fill
              className="object-cover opacity-60"
              priority
              onError={(e) => {
                // Fallback if image doesn't exist
                (e.target as any).src = '/images/bhakti-hero.png';
              }}
            />
          </motion.div>
        </AnimatePresence>
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0C0A07]" />
        
        {/* Navigation Overlays */}
        <div className="absolute top-12 inset-x-6 flex items-center justify-between z-20">
          <button 
            onClick={() => router.back()}
            className="w-11 h-11 rounded-full flex items-center justify-center glass-panel border-white/10"
          >
            <ChevronLeft size={22} className="text-white" />
          </button>
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-amber-400/80">
              Sacred Sanctuary
            </span>
          </div>
          <button className="w-11 h-11 rounded-full flex items-center justify-center glass-panel border-white/10">
            <Share2 size={18} className="text-white" />
          </button>
        </div>

        {/* Deity Selector (The "1 to 5" Divine Portals in Hero) */}
        <div className="absolute top-32 inset-x-6 z-20 flex justify-center gap-4">
          {['shiva', 'vishnu', 'devi', 'hanuman', 'ganesha'].map((deity) => (
            <motion.button
              key={deity}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setActiveDeity(deity);
                playHaptic('medium');
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                activeDeity === deity 
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-110' 
                  : 'glass-panel text-white/40 border-white/5'
              }`}
            >
              <span className="text-xl">{(DEITY_META as any)[deity]?.emoji || '🕉️'}</span>
            </motion.button>
          ))}
        </div>

        {/* Hero Content: The Auspicious Pulse */}
        <div className="absolute bottom-12 inset-x-6 z-20 space-y-6">
          <motion.div 
            key={activeDeity}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1"
          >
            <h1 className="text-5xl font-bold premium-serif text-white tracking-tight leading-tight">
              {activeDeity.charAt(0).toUpperCase() + activeDeity.slice(1)} <br/>
              <span className="text-amber-400/90 text-4xl">{t('auspiciousBeginnings')}</span>
            </h1>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest pt-2">
              {t('todayIs')} · {new Date().toLocaleDateString(lang === 'en' ? 'en-IN' : lang === 'hi' ? 'hi-IN' : 'pa-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </motion.div>

          <div className="flex gap-3">
            <div className="flex-1 glass-panel border-white/5 p-5 rounded-[2rem] backdrop-blur-3xl bg-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400/60">{t('amritKaal')}</span>
                <Clock size={10} className="text-amber-400/60" />
              </div>
              <span className="text-xl font-bold text-white">09:12 — 10:45</span>
            </div>
            <div className="flex-1 glass-panel border-white/5 p-5 rounded-[2rem] backdrop-blur-3xl bg-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">{t('brahmaMuhurta')}</span>
                <Sun size={10} className="text-white/40" />
              </div>
              <span className="text-xl font-bold text-white">04:22 AM</span>
            </div>
          </div>
        </div>

        {/* Animated Background Pulse */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] pointer-events-none opacity-20"
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          style={{ 
            background: 'conic-gradient(from 0deg, transparent, rgba(197,160,89,0.1), transparent)',
          }}
        />
      </section>

      {/* ── Daily Stotram Highlight ─────────────────────────────────────── */}
      <section className="px-6 -mt-10 relative z-40">
        <Link href={`/bhakti/stotram/${dailyStotramId}`}>
          <div className="glass-panel border-white/10 rounded-[2.5rem] p-6 flex items-center gap-5 bg-amber-500/10 shadow-2xl backdrop-blur-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-3xl shadow-inner">
              {dailyStotramDeityEmoji}
            </div>
            <div className="flex-1">
              <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block mb-1">{t('recommendedForYou')}</span>
              <h4 className="text-white font-bold text-lg">{dailyStotramTitle}</h4>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-black">
              <Play size={20} fill="currentColor" />
            </div>
          </div>
        </Link>
      </section>

      {/* ── 2. Sound Sanctuary (Refined Player) ───────────────────────────── */}
      <section className="px-6 mt-10 relative z-30">
        <div className="clay-card rounded-[3rem] bg-[#14120F] border border-white/5 p-8 shadow-2xl overflow-hidden relative">
          {/* Subtle Ambient Background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              <Image 
                src={activeSound.cover || '/images/sound-placeholder.png'} 
                alt={activeSound.title}
                fill
                className="object-cover"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="flex gap-1 items-end h-6">
                    {[1, 2, 3, 4].map(i => (
                      <motion.div 
                        key={i}
                        className="w-1 bg-amber-500 rounded-full"
                        animate={{ height: ['20%', '100%', '40%', '80%', '20%'] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1 block">{t('soundSanctuary')}</span>
              <h3 className="text-xl font-bold text-white truncate">{activeSound.title}</h3>
              <p className="text-sm text-white/40 truncate">{activeSound.artist}</p>
            </div>
            <button 
              onClick={() => {
                playHaptic('medium');
                setIsPlaying(!isPlaying);
              }}
              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-xl active:scale-95 transition"
            >
              {isPlaying ? <VolumeX size={28} /> : <Play size={28} className="ml-1" fill="currentColor" />}
            </button>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
            <div className="flex gap-8">
              <button className="flex flex-col items-center gap-2 group transition">
                <Music size={20} className="text-white/40 group-hover:text-amber-500 transition" />
                <span className="text-[9px] font-bold uppercase text-white/30 group-hover:text-white transition">Library</span>
              </button>
              <button className="flex flex-col items-center gap-2 group transition">
                <Clock size={20} className="text-white/40 group-hover:text-amber-500 transition" />
                <span className="text-[9px] font-bold uppercase text-white/30 group-hover:text-white transition">Timer</span>
              </button>
              <button className="flex flex-col items-center gap-2 group transition">
                <Volume2 size={20} className="text-white/40 group-hover:text-amber-500 transition" />
                <span className="text-[9px] font-bold uppercase text-white/30 group-hover:text-white transition">Mixer</span>
              </button>
            </div>
            <Link href="/bhakti/browse" className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full text-[10px] font-bold text-amber-500 uppercase tracking-widest transition">
              {t('explore')} →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. Daily Sadhana Checklist ────────────────────────────────────── */}
      <section className="px-6 mt-14 space-y-8">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{t('sadhanaTracker')}</span>
            <h3 className="text-2xl font-serif text-white">{t('dailyRituals')}</h3>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-3xl font-bold text-white">{Math.round((checklist.filter(c => c.done).length / checklist.length) * 100)}%</span>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{t('ritualProgress')}</span>
          </div>
        </div>
        <div className="space-y-4">
          {checklist.map(item => (
            <button 
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`w-full flex items-center gap-5 p-6 rounded-[2.5rem] border transition-all duration-500 relative overflow-hidden group ${
                item.done ? 'bg-amber-500/10 border-amber-500/20 shadow-lg shadow-amber-500/5' : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}
            >
              {item.done && (
                <motion.div 
                  layoutId={`check-bg-${item.id}`}
                  className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" 
                />
              )}
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                item.done ? 'bg-amber-500 border-amber-500 text-black' : 'border-white/10 text-transparent group-hover:border-white/30'
              }`}>
                {item.done && <CheckCircle2 size={16} strokeWidth={4} />}
              </div>
              <div className="flex flex-col items-start gap-0.5 text-left">
                <span className={`font-bold transition-all duration-500 ${item.done ? 'text-white' : 'text-white/60'}`}>
                  {item.label}
                </span>
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{t('ritualComplete')}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── 4. Sacred Verse ──────────────────────────────────────────────── */}
      <section className="px-6 mt-12">
        <div className="rounded-[3rem] p-10 bg-gradient-to-br from-[#1A1814] to-[#0C0A07] border border-white/5 text-center space-y-6">
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.3em]">{t('sacredReflection')}</span>
          <p className="text-2xl font-serif text-white leading-relaxed italic">
            &ldquo;{shloka.sanskrit}&rdquo;
          </p>
          <div className="pt-4 opacity-40">
            <div className="w-12 h-[1px] bg-white mx-auto mb-4" />
            <p className="text-xs text-white uppercase tracking-widest">— {shloka.source}</p>
          </div>
        </div>
      </section>

      {/* ── 5. Deity Portals (Horizontal Scroll) ─────────────────────────── */}
      <section className="mt-12">
        <div className="px-6 flex items-center justify-between mb-6">
          <h3 className="text-lg font-serif text-white">{t('divinePortals')}</h3>
          <Link href="/bhakti/browse" className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{t('explore')}</Link>
        </div>
        <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-none">
          {['shiva', 'vishnu', 'devi', 'hanuman', 'ganesha', 'surya'].map((deity) => (
            <Link 
              key={deity}
              href={`/bhakti/browse?deity=${deity}`}
              className="flex-shrink-0 w-24 h-32 rounded-[2rem] bg-white/5 border border-white/5 flex flex-col items-center justify-center gap-3 active:scale-95 transition"
            >
              <span className="text-3xl">{(DEITY_META as any)[deity]?.emoji || '🕉️'}</span>
              <span className="text-[10px] font-bold uppercase text-white/60">{(DEITY_META as any)[deity]?.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Ambient Lighting Bottom */}
      <div className="fixed bottom-0 inset-x-0 h-64 bg-gradient-to-t from-amber-500/5 to-transparent pointer-events-none" />
    </div>
  );
}
