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

export default function BhaktiClient({
  shloka, tradition, userName, japaStreak, sessionCountToday,
  dailyStotramId, dailyStotramTitle, dailyStotramDeityEmoji
}: Props) {
  const { t, lang } = useLanguage();
  const { playHaptic } = useZenithSensory();
  
  const [activeDeity, setActiveDeity] = useState('shiva');
  const [rituals, setRituals] = useState([
    { id: 'snana', label: t('sacredAblution') || 'Snana (Ablution)', done: false, icon: <Droplets size={20} /> },
    { id: 'sandhya', label: t('morningSandhya') || 'Morning Sandhya', done: false, icon: <Sun size={20} /> },
    { id: 'japa', label: t('mantraJapa') || 'Mantra Japa', done: false, icon: <Disc size={20} /> },
  ]);

  const toggleRitual = (id: string) => {
    playHaptic('medium');
    setRituals(prev => prev.map(r => r.id === id ? { ...r, done: !r.done } : r));
  };

  return (
    <div className="relative min-h-screen pb-40 theme-bg theme-ink selection:bg-[var(--brand-primary-soft)] overflow-x-hidden">
      
      {/* ─── Sacred Fractal Backdrop (Atmospheric) ─── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[var(--brand-primary-soft)] blur-[180px] rounded-full opacity-40" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-[var(--brand-primary-soft)] blur-[150px] rounded-full opacity-20" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] theme-invert" />
      </div>

      {/* ─── 1. The Sacred Sanctuary (Hero) ─── */}
      <section className="relative h-[80vh] flex flex-col justify-end px-8 sm:px-16 pb-20 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDeity}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.3, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 z-0"
          >
            <Image 
              src={`/images/deities/${activeDeity}-bg.png`}
              alt=""
              fill
              className="object-cover contrast-[1.1] brightness-[0.8] grayscale-[0.2]"
              onError={(e) => { (e.target as any).src = '/images/bhakti-hero.png'; }}
            />
          </motion.div>
        </AnimatePresence>
        
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-base)] via-transparent to-transparent z-1" />
        
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-4">
             <div className="px-5 py-1.5 rounded-full border border-[var(--brand-primary-soft)] bg-[var(--brand-primary-soft)] backdrop-blur-xl">
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--brand-primary)]">
                 {t('nityaSadhana')}
               </span>
             </div>
             <div className="h-px flex-1 bg-gradient-to-r from-[var(--brand-primary-soft)] to-transparent" />
          </div>

          <motion.div
            key={activeDeity}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h1 className="text-7xl md:text-9xl font-black premium-serif tracking-tighter leading-[0.85] theme-ink">
              {activeDeity.toUpperCase()}<br/>
              <span className="text-[var(--brand-primary)] italic opacity-80">{t('divinePresence')}</span>
            </h1>
            <p className="theme-muted text-sm max-w-lg leading-relaxed font-medium">
              {t('bhaktiIntro') || 'Awaken the sacred within through ancient vibrations and disciplined devotion.'}
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-4">
            {['shiva', 'vishnu', 'devi', 'hanuman', 'ganesha'].map((d) => (
              <button
                key={d}
                onClick={() => { setActiveDeity(d); playHaptic('light'); }}
                className={`px-8 py-3 rounded-2xl border transition-all duration-500 text-[10px] font-black uppercase tracking-widest ${
                  activeDeity === d 
                    ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white shadow-2xl shadow-[var(--brand-primary-soft)]' 
                    : 'bg-white/5 border-[var(--card-border)] theme-ink opacity-40 hover:opacity-100 hover:border-[var(--brand-primary)]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 2. Nitya Karma (The Daily Flow) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-8 sm:px-16 mt-[-4rem] relative z-20">
          <Link href={`/bhakti/stotram/${dailyStotramId}`} className="lg:col-span-2">
            <motion.div
              whileHover={{ y: -8, scale: 1.01 }}
              className="group relative rounded-[4rem] p-10 sm:p-12 overflow-hidden border border-[var(--brand-primary-soft)] bg-[var(--card-bg)] shadow-2xl backdrop-blur-3xl"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-primary)] opacity-[0.05] blur-[100px] rounded-full pointer-events-none" />
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-strong)] flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform">
                  <SacredIcon deity={activeDeity} size={48} />
                </div>
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <span className="text-[10px] font-black text-[var(--brand-primary)] uppercase tracking-[0.3em]">{t('dailyVani')}</span>
                  <h4 className="text-3xl font-bold premium-serif theme-ink">{dailyStotramTitle}</h4>
                  <p className="text-xs theme-muted font-medium">Chanted for protection and clarity.</p>
                </div>
                <div className="w-16 h-16 rounded-full border border-[var(--card-border)] flex items-center justify-center theme-ink group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-all">
                  <Play size={24} fill="currentColor" />
                </div>
              </div>
            </motion.div>
          </Link>
      </div>

      {/* ─── 3. Divine Portals (Deity Selection) ─── */}
      <section className="px-8 sm:px-16 mt-24">
        <div className="flex flex-col items-center text-center space-y-4 mb-16">
          <span className="text-[10px] font-black text-[var(--brand-primary)] uppercase tracking-[0.6em]">{t('exploreByDeity')}</span>
          <h3 className="text-4xl md:text-5xl font-bold premium-serif theme-ink">{t('divinePresence')}</h3>
          <p className="text-sm theme-muted max-w-lg mx-auto">{t('deityDesc')}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-12 sm:gap-20">
          {['shiva', 'vishnu', 'devi', 'ganesha', 'hanuman', 'surya'].map((deity) => (
            <button
              key={deity}
              onClick={() => setActiveDeity(deity)}
              className={`group flex flex-col items-center gap-6 transition-all duration-700 ${
                activeDeity === deity ? 'scale-110' : 'opacity-40 hover:opacity-100'
              }`}
            >
              <div className="w-24 h-24 rounded-full bg-[var(--brand-primary-soft)] flex items-center justify-center text-[var(--brand-primary)] group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-all duration-500 shadow-2xl">
                <SacredIcon deity={deity} size={48} />
              </div>
              <span className={`text-xs font-black uppercase tracking-[0.3em] transition-colors ${
                activeDeity === deity ? 'text-[var(--brand-primary)]' : 'theme-muted group-hover:theme-ink'
              }`}>
                {deity}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ─── 4. Wisdom Streams (Katha & Stotram) ─── */}
      <section className="px-8 sm:px-16 mt-24">
        <div className="flex items-end justify-between mb-12">
          <div className="space-y-3">
             <div className="flex items-center gap-3">
               <div className="w-8 h-px bg-[var(--brand-primary-soft)]" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--brand-primary)]">{t('wisdomStreams')}</span>
             </div>
             <h3 className="text-4xl md:text-5xl font-bold premium-serif theme-ink tracking-tight">{t('shrutiSmriti')}</h3>
          </div>
          <Link href="/bhakti/browse" className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-primary-soft)] hover:text-[var(--brand-primary)] transition-colors">
            {t('viewAll')} →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { id: 'katha', title: 'Puranic Kathas', desc: 'Narratives of the divine.', icon: <BookOpen />, href: '/bhakti/katha' },
            { id: 'stotram', title: 'Sacred Hymns', desc: 'Powerful Sanskrit chants.', icon: <Volume2 />, href: '/bhakti/stotram' },
            { id: 'mala', title: 'Japa Sadhana', desc: 'Digital mala for mantra.', icon: <Disc size={24} />, href: '/bhakti/mala' },
          ].map((item, idx) => (
            <Link key={idx} href={item.href}>
              <motion.div
                whileHover={{ y: -8, backgroundColor: 'var(--brand-primary-soft)' }}
                className="h-full p-10 rounded-[3.5rem] border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-md flex flex-col gap-6 group transition-all"
              >
                <div className="w-16 h-16 rounded-3xl bg-[var(--brand-primary-soft)] border border-[var(--brand-primary-soft)] flex items-center justify-center text-[var(--brand-primary)] group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-all duration-500">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-2xl font-bold premium-serif theme-ink">{item.title}</h4>
                  <p className="text-sm theme-muted font-medium mt-2 leading-relaxed">{item.desc}</p>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--brand-primary)] opacity-0 group-hover:opacity-100 transition-all">
                  {t('explore')} <ChevronRight size={12} />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── 5. The Akasha Verse (Daily Shloka) ─── */}
      <section className="px-8 sm:px-16 mt-32">
        <div className="relative rounded-[4.5rem] p-16 sm:p-24 text-center overflow-hidden border border-[var(--brand-primary-soft)] bg-gradient-to-br from-[var(--brand-primary-soft)] to-transparent shadow-2xl">
          <div className="absolute top-[-20%] left-[30%] w-96 h-96 bg-[var(--brand-primary)] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />
          <div className="relative space-y-12 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-6">
              <div className="w-12 h-px bg-[var(--brand-primary-soft)]" />
              <span className="text-[11px] font-black text-[var(--brand-primary)] uppercase tracking-[0.6em]">{t('sacredReflection')}</span>
              <div className="w-12 h-px bg-[var(--brand-primary-soft)]" />
            </div>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-4xl md:text-6xl font-bold premium-serif theme-ink leading-[1.3] tracking-tight italic"
            >
              &ldquo;{shloka.sanskrit}&rdquo;
            </motion.p>
            <div className="pt-8">
              <div className="w-20 h-0.5 bg-[var(--brand-primary-soft)] mx-auto mb-6 rounded-full" />
              <p className="text-sm text-[var(--brand-primary)] font-bold uppercase tracking-[0.4em]">— {shloka.source}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. Nitya Karma (Daily Ritual Checklist) ─── */}
      <section className="px-8 sm:px-16 mt-32 space-y-12">
        <div className="flex flex-col sm:flex-row items-end justify-between gap-6 px-4">
           <div className="space-y-3">
             <span className="text-[10px] font-black text-[var(--brand-primary)] uppercase tracking-[0.4em]">{t('ritualChecklist')}</span>
             <h3 className="text-4xl md:text-5xl font-bold premium-serif theme-ink">{t('dailyDisciplines')}</h3>
           </div>
           <div className="text-right">
             <span className="text-6xl font-black text-[var(--brand-primary)] tabular-nums">
               {Math.round((rituals.filter(r => r.done).length / rituals.length) * 100)}%
             </span>
             <p className="text-[10px] font-black theme-muted uppercase tracking-[0.3em] mt-2">{t('purityLevel')}</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rituals.map((item, idx) => (
            <motion.button
              key={item.id}
              whileHover={{ y: -5 }}
              onClick={() => toggleRitual(item.id)}
              className={`flex items-center gap-6 p-8 rounded-[3rem] border transition-all duration-700 ${
                item.done 
                  ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)]/40 shadow-xl' 
                  : 'bg-[var(--card-bg)] border-[var(--card-border)] hover:bg-[var(--brand-primary-soft)]'
              }`}
            >
              <div className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-700 ${
                item.done ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white shadow-lg' : 'border-[var(--card-border)] theme-muted opacity-30'
              }`}>
                {item.done ? <CheckCircle2 size={24} strokeWidth={3} /> : item.icon}
              </div>
              <div className="text-left">
                <p className={`text-lg font-bold premium-serif transition-colors ${item.done ? 'theme-ink' : 'theme-muted opacity-40'}`}>
                  {item.label}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Sacred Icons (Pandit's Choice) ──────────────────────────────────────────
function SacredIcon({ deity, size = 24, className = "" }: { deity: string, size?: number, className?: string }) {
  switch (deity.toLowerCase()) {
    case 'shiva':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}><path d="M12 2v20M7 7l10 10M17 7L7 17M12 7c2 0 3 2 3 5s-1 5-3 5-3-2-3-5 1-5 3-5z"/></svg>;
    case 'vishnu':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>;
    case 'devi':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}><path d="M12 3l3 4 5-1-2 5 4 3-5 1 1 5-5-3-5 3 1-5-5-1 4-3-2-5 5 1 3-4z"/></svg>;
    case 'ganesha':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}><path d="M8 3h8c1 0 2 1 2 2v14c0 1-1 2-2 2H8c-1 0-2-1-2-2V5c0-1 1-2 2-2z"/><path d="M6 8h12M12 3v18"/></svg>;
    case 'hanuman':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case 'surya':
      return <Sun size={size} className={className} />;
    default:
      return <Sparkles size={size} className={className} />;
  }
}

// ── Icons Needed ──────────────────────────────────────────────────────────
function Droplets({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>;
}
function Disc({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>;
}
function BookOpen() {
  return <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
}
