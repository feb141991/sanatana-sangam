'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Settings, Type, Sun, Moon, 
  Book, Quote, Shield, Lightbulb, Share2
} from 'lucide-react';
import type { DharmVeer } from '@/lib/dharm-veer';
import { TRADITION_META } from '@/lib/dharm-veer';
import toast from 'react-hot-toast';

type ReadingTheme = 'light' | 'dark' | 'sepia';
type FontSize = 'sm' | 'md' | 'lg' | 'xl';

export default function DharmVeerClient({ hero }: { hero: DharmVeer }) {
  const router = useRouter();
  const [theme, setTheme] = useState<ReadingTheme>('dark');
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [showSettings, setShowSettings] = useState(false);
  const [lang, setLang] = useState<'en' | 'local'>('en');

  const meta = TRADITION_META[hero.tradition];

  // Map font sizes to tailwind/css classes or styles
  const fontStyles: Record<FontSize, string> = {
    sm: 'text-sm leading-relaxed',
    md: 'text-base leading-relaxed',
    lg: 'text-lg leading-relaxed',
    xl: 'text-xl leading-relaxed',
  };

  const themeColors: Record<ReadingTheme, { bg: string; text: string; card: string; border: string }> = {
    light: { bg: '#FAF6EF', text: '#2A1B0A', card: '#FFFFFF', border: 'rgba(42,27,10,0.1)' },
    dark: { bg: '#0C0A07', text: '#F2EAD6', card: '#1E1C18', border: 'rgba(242,234,214,0.15)' },
    sepia: { bg: '#F4ECD8', text: '#5B4636', card: '#FFF9EB', border: 'rgba(91,70,54,0.1)' },
  };

  const activeTheme = themeColors[theme];

  const handleShare = () => {
    const text = `Today's Dharm Veer: ${hero.name}\n${hero.tagline}\nRead more on Shoonaya.`;
    if (navigator.share) {
      navigator.share({ title: hero.name, text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div 
      className="min-h-screen transition-colors duration-500 pb-24"
      style={{ 
        backgroundColor: activeTheme.bg,
        color: activeTheme.text,
        fontFamily: 'var(--font-inter)'
      }}
    >
      {/* ── Fixed Header ─────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 px-4 py-4 flex items-center justify-between glass-panel border-b border-white/5 backdrop-blur-xl">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
            {meta.dharmVeerLocal || 'Dharm Veer'}
          </span>
          <span className="text-xs font-bold" style={{ color: 'var(--brand-primary)' }}>
            {hero.tradition.toUpperCase()}
          </span>
        </div>

        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition"
        >
          <Settings size={20} />
        </button>
      </header>

      {/* ── Settings Drawer ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 w-72 rounded-[2.5rem] shadow-2xl p-6 space-y-8 backdrop-blur-2xl"
            style={{ 
              backgroundColor: activeTheme.card, 
              border: `1px solid ${activeTheme.border}`,
              color: activeTheme.text 
            }}
          >
            {/* Theme Toggle */}
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-3">Theme</p>
              <div className="flex gap-2">
                {(['light', 'dark', 'sepia'] as const).map(t => (
                  <button 
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex-1 py-2 rounded-xl border transition-all ${theme === t ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10' : 'border-white/10'}`}
                  >
                    {t === 'light' && <Sun size={16} className="mx-auto" />}
                    {t === 'dark' && <Moon size={16} className="mx-auto" />}
                    {t === 'sepia' && <div className="w-4 h-4 bg-[#F4ECD8] rounded-full mx-auto border border-black/10" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-3">Font Size</p>
              <div className="flex gap-2">
                {(['sm', 'md', 'lg', 'xl'] as const).map(sz => (
                  <button 
                    key={sz}
                    onClick={() => setFontSize(sz)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${fontSize === sz ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10' : 'border-white/10'}`}
                  >
                    {sz.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Toggle */}
            {hero.nameLocal && (
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-3">Language</p>
                <div className="flex glass-panel rounded-xl p-1">
                  <button 
                    onClick={() => setLang('en')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${lang === 'en' ? 'bg-[var(--brand-primary)] text-black' : 'opacity-60'}`}
                  >
                    English
                  </button>
                  <button 
                    onClick={() => setLang('local')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${lang === 'local' ? 'bg-[var(--brand-primary)] text-black' : 'opacity-60'}`}
                  >
                    Local
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <main className="pt-28 px-6 max-w-2xl mx-auto space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center text-5xl shadow-2xl"
            style={{ 
              background: `linear-gradient(135deg, ${meta.color.replace('0.12', '0.2')}, ${meta.color.replace('0.12', '0.05')})`,
              border: `1px solid ${meta.color.replace('0.12', '0.4')}`
            }}
          >
            {hero.emoji}
          </motion.div>
          
          <div className="space-y-1">
            <h1 className="text-3xl font-bold premium-serif tracking-tight">
              {lang === 'local' && hero.nameLocal ? hero.nameLocal : hero.name}
            </h1>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--brand-primary)]">
              {hero.era} · {hero.region}
            </p>
          </div>

          <p className={`italic font-medium opacity-80 px-4 ${fontStyles[fontSize]}`}>
            &ldquo;{lang === 'local' && hero.taglineLocal ? hero.taglineLocal : hero.tagline}&rdquo;
          </p>
        </section>

        {/* Narrative Section */}
        <section className="space-y-8">
          {/* The Journey */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              <Book size={14} /> The Journey
            </div>
            <p className={`${fontStyles[fontSize]} whitespace-pre-wrap`}>
              {hero.journey}
            </p>
          </div>

          {/* The Trial */}
          <div className="clay-card rounded-[2rem] p-6 space-y-4" style={{ backgroundColor: 'rgba(200,146,74,0.05)', border: '1px solid rgba(200,146,74,0.1)' }}>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
              <Shield size={14} /> The Test of Dharma
            </div>
            <p className={`${fontStyles[fontSize]} font-medium italic`}>
              {hero.trial}
            </p>
          </div>

          {/* The Teaching */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              <Lightbulb size={14} /> Wisdom
            </div>
            <p className={`${fontStyles[fontSize]}`}>
              {hero.teaching}
            </p>
          </div>

          {/* Quote */}
          {hero.quote && (
            <div className="py-8 border-y border-white/5 text-center space-y-4">
              <Quote size={32} className="mx-auto opacity-20 text-[var(--brand-primary)]" />
              <p className="text-xl font-bold premium-serif italic px-6">
                {hero.quote.text}
              </p>
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                — {hero.quote.attribution}
              </p>
            </div>
          )}

          {/* Moral */}
          <div className="text-center pt-8">
            <p className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40 mb-4">Essence</p>
            <p className="text-lg font-bold leading-relaxed max-w-sm mx-auto">
              {hero.moral}
            </p>
          </div>
        </section>

        {/* Share Button */}
        <div className="flex justify-center pt-12">
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-8 py-4 rounded-full bg-[var(--brand-primary)] text-black font-bold shadow-xl hover:scale-105 transition active:scale-95"
          >
            <Share2 size={18} />
            Share this Reflection
          </button>
        </div>
      </main>

      {/* ── Tradition Motif (Bottom) ────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 h-32 pointer-events-none opacity-[0.03] flex items-center justify-center text-[10rem]">
        {meta.emoji}
      </div>
    </div>
  );
}
