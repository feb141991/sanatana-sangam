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
  const isDark = resolvedTheme === 'dark';

  const [activeSound, setActiveSound] = useState(CURATED_SOUNDS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [checklist, setChecklist] = useState([
    { id: 'morning-prayer', label: 'Morning Prayer', done: false },
    { id: 'japa-session', label: '108 Japa Counts', done: false },
    { id: 'daily-shloka', label: 'Daily Shloka Reflection', done: false },
  ]);

  const toggleCheck = (id: string) => {
    playHaptic('light');
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  return (
    <div className="relative min-h-screen pb-32 overflow-x-hidden bg-[#0C0A07]">
      {/* ── 1. Cosmic Hero Section ────────────────────────────────────────── */}
      <section className="relative h-[65vh] w-full overflow-hidden">
        <Image 
          src="/images/bhakti-hero.png"
          alt="Cosmic Temple"
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#0C0A07]" />
        
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
              Devotional Sanctuary
            </span>
          </div>
          <button className="w-11 h-11 rounded-full flex items-center justify-center glass-panel border-white/10">
            <Share2 size={18} className="text-white" />
          </button>
        </div>

        {/* Hero Content: The Auspicious Pulse */}
        <div className="absolute bottom-12 inset-x-6 z-20 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="text-4xl font-bold premium-serif text-white tracking-tight leading-tight">
              Auspicious <br/>Beginnings
            </h1>
            <p className="text-white/60 text-sm font-medium">
              Today is Ekadashi · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </motion.div>

          <div className="flex gap-3">
            <div className="flex-1 glass-panel border-white/5 p-4 rounded-3xl backdrop-blur-2xl">
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400/60 block mb-1">Amrit Kaal</span>
              <span className="text-lg font-bold text-white">09:12 — 10:45</span>
            </div>
            <div className="flex-1 glass-panel border-white/5 p-4 rounded-3xl backdrop-blur-2xl">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 block mb-1">Brahma Muhurta</span>
              <span className="text-lg font-bold text-white">04:22 AM</span>
            </div>
          </div>
        </div>

        {/* Animated Background Pulse */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          style={{ 
            background: 'radial-gradient(circle, rgba(197,160,89,0.03) 0%, transparent 70%)',
          }}
        />
      </section>

      {/* ── Daily Stotram Highlight ─────────────────────────────────────── */}
      <section className="px-6 mt-8">
        <Link href={`/bhakti/stotram/${dailyStotramId}`}>
          <div className="glass-panel border-white/10 rounded-[2.5rem] p-6 flex items-center gap-5 bg-amber-500/5">
            <span className="text-4xl">{dailyStotramDeityEmoji}</span>
            <div className="flex-1">
              <span className="text-[9px] font-bold text-amber-500/80 uppercase tracking-widest block mb-1">Today&apos;s Sacred Stotram</span>
              <h4 className="text-white font-bold">{dailyStotramTitle}</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
              <Play size={16} className="text-white" />
            </div>
          </div>
        </Link>
      </section>

      {/* ── 2. Sound Sanctuary (Refined Player) ───────────────────────────── */}
      <section className="px-6 -mt-8 relative z-30">
        <div className="clay-card rounded-[2.5rem] bg-[#1A1814] border border-amber-900/20 p-8 shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-white/5">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-purple-500/20" />
              <div className="absolute inset-0 flex items-center justify-center text-3xl">🕉️</div>
              {isPlaying && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-500 flex gap-0.5 px-1 items-end py-0.5">
                  {[1, 2, 3, 4].map(i => (
                    <motion.div 
                      key={i}
                      className="flex-1 bg-white"
                      animate={{ height: ['20%', '100%', '40%', '80%', '20%'] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1 block">Now Playing</span>
              <h3 className="text-lg font-bold text-white truncate">{activeSound.title}</h3>
              <p className="text-xs text-white/40 truncate">{activeSound.artist}</p>
            </div>
            <button 
              onClick={() => {
                playHaptic('medium');
                setIsPlaying(!isPlaying);
              }}
              className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center text-black shadow-lg shadow-amber-500/20 active:scale-95 transition"
            >
              {isPlaying ? <VolumeX size={24} /> : <Play size={24} className="ml-1" />}
            </button>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
            <div className="flex gap-6">
              <button className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition">
                <Music size={18} className="text-white" />
                <span className="text-[8px] font-bold uppercase text-white">Radio</span>
              </button>
              <button className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition">
                <Clock size={18} className="text-white" />
                <span className="text-[8px] font-bold uppercase text-white">Timer</span>
              </button>
            </div>
            <Link href="/bhakti/browse" className="text-[10px] font-bold text-amber-500 uppercase tracking-widest border-b border-amber-500/30 pb-0.5">
              Browse All →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. Daily Sadhana Checklist ────────────────────────────────────── */}
      <section className="px-6 mt-12 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-serif text-white">Daily Sadhana</h3>
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{checklist.filter(c => c.done).length}/{checklist.length} Complete</span>
        </div>
        <div className="space-y-3">
          {checklist.map(item => (
            <button 
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`w-full flex items-center gap-4 p-5 rounded-[2rem] border transition-all ${item.done ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/5'}`}
            >
              {item.done ? (
                <CheckCircle2 size={22} className="text-amber-500" />
              ) : (
                <Circle size={22} className="text-white/20" />
              )}
              <span className={`text-sm font-medium ${item.done ? 'text-white' : 'text-white/60'}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── 4. Sacred Verse ──────────────────────────────────────────────── */}
      <section className="px-6 mt-12">
        <div className="rounded-[3rem] p-10 bg-gradient-to-br from-[#1A1814] to-[#0C0A07] border border-white/5 text-center space-y-6">
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.3em]">Sacred Reflection</span>
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
          <h3 className="text-lg font-serif text-white">Divine Portals</h3>
          <Link href="/bhakti/browse" className="text-[10px] font-bold text-white/40 uppercase tracking-widest">See All</Link>
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
