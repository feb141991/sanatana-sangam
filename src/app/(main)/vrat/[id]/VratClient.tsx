'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Settings, Sun, Moon, 
  Book, Flame, Share2, Info
} from 'lucide-react';
import type { VratData } from '@/lib/vrat-data';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import toast from 'react-hot-toast';

type ReadingTheme = 'light' | 'dark' | 'sepia';
type FontSize = 'sm' | 'md' | 'lg' | 'xl';

export default function VratClient({ vrat, originalSlug }: { vrat: VratData, originalSlug: string }) {
  const router = useRouter();
  const [theme, setTheme] = useState<ReadingTheme>('dark');
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [showSettings, setShowSettings] = useState(false);
  
  const { t, lang: appLang } = useLanguage();
  const [lang, setLang] = useState<'en' | 'local'>(appLang === 'en' ? 'en' : 'local');

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
    const text = `Today's Sacred Observance: ${vrat.name}\\n${vrat.tagline}\\nRead more on Shoonaya.`;
    if (navigator.share) {
      navigator.share({ title: vrat.name, text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\\n${window.location.href}`);
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
      <header className="fixed top-0 inset-x-0 z-50 px-4 py-4 flex items-center justify-between backdrop-blur-xl" style={{ borderBottom: `1px solid ${activeTheme.border}`, backgroundColor: `${activeTheme.bg}cc` }}>
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center transition"
          style={{ backgroundColor: activeTheme.border, color: activeTheme.text }}
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
            {t('vrat') || 'Vrat'}
          </span>
          <span className="text-xs font-bold" style={{ color: 'var(--brand-primary-strong)' }}>
            {originalSlug.toUpperCase()}
          </span>
        </div>

        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="w-10 h-10 rounded-full flex items-center justify-center transition"
          style={{ backgroundColor: activeTheme.border, color: activeTheme.text }}
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
            {vrat.nameLocal && (
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-3">Language</p>
                <div className="flex rounded-xl p-1" style={{ backgroundColor: activeTheme.border }}>
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
              background: `linear-gradient(135deg, rgba(200,146,74,0.2), rgba(200,146,74,0.05))`,
              border: `1px solid rgba(200,146,74,0.4)`
            }}
          >
            {vrat.emoji}
          </motion.div>
          
          <div className="space-y-1">
            <h1 className="text-3xl font-bold premium-serif tracking-tight">
              {lang === 'local' && vrat.nameLocal ? vrat.nameLocal : vrat.name}
            </h1>
          </div>

          <p className={`italic font-medium opacity-80 px-4 ${fontStyles[fontSize]}`}>
            &ldquo;{lang === 'local' && vrat.taglineLocal ? vrat.taglineLocal : vrat.tagline}&rdquo;
          </p>
        </section>

        {/* Narrative Section */}
        <section className="space-y-8">
          {/* Significance */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              <Book size={14} /> Significance
            </div>
            <p className={`${fontStyles[fontSize]} whitespace-pre-wrap`}>
              {lang === 'local' && vrat.significanceLocal ? vrat.significanceLocal : vrat.significance}
            </p>
          </div>

          {/* Practice */}
          <div className="rounded-[2rem] p-6 space-y-4" style={{ backgroundColor: 'rgba(200,146,74,0.05)', border: '1px solid rgba(200,146,74,0.1)' }}>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--brand-primary-strong)]">
              <Flame size={14} /> How to Observe
            </div>
            <p className={`${fontStyles[fontSize]} font-medium italic`}>
              {lang === 'local' && vrat.practiceLocal ? vrat.practiceLocal : vrat.practice}
            </p>
          </div>

          {/* Mantra */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              <Info size={14} /> Sacred Mantra
            </div>
            <p className={`${fontStyles[fontSize]} text-center premium-serif text-xl font-bold mt-4`}>
              {lang === 'local' && vrat.mantraLocal ? vrat.mantraLocal : vrat.mantra}
            </p>
          </div>

        </section>

        {/* Share Button */}
        <div className="flex justify-center pt-12">
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-8 py-4 rounded-full text-black font-bold shadow-xl hover:scale-105 transition active:scale-95"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            <Share2 size={18} />
            Share Observance
          </button>
        </div>
      </main>

      {/* ── Motif (Bottom) ────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 h-32 pointer-events-none opacity-[0.03] flex items-center justify-center text-[10rem]">
        {vrat.emoji}
      </div>
    </div>
  );
}
