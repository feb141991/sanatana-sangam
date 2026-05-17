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
import { t as translateFn, type AppLang } from '@/lib/i18n/translations';
import { useLocalizedMeaning } from '@/hooks/useLocalizedMeaning';
import toast from 'react-hot-toast';
import { ReaderIntro } from '@/components/ui/ReaderIntro';

type ReadingTheme = 'light' | 'dark' | 'sepia';
type FontSize = 'sm' | 'md' | 'lg' | 'xl';

export default function VratClient({ vrat, originalSlug }: { vrat: VratData, originalSlug: string }) {
  const router = useRouter();
  const [theme, setTheme] = useState<ReadingTheme>('light');
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [showSettings, setShowSettings] = useState(false);
  
  const { t, lang: appLang } = useLanguage();
  const [lang, setLang] = useState<'en' | 'local'>(appLang === 'en' ? 'en' : 'local');

  const effectiveLang: AppLang = lang === 'en' ? 'en' : (appLang === 'en' ? 'hi' : appLang);

  // ── Localization ──
  const localizedSignificance = useLocalizedMeaning({
    entryId: `vrat:${vrat.id}:significance`,
    sourceMeaning: vrat.significance,
    providedMeaning: vrat.significanceLocal,
    targetLanguage: effectiveLang,
    enabled: lang === 'local'
  });

  const localizedPractice = useLocalizedMeaning({
    entryId: `vrat:${vrat.id}:practice`,
    sourceMeaning: vrat.practice,
    providedMeaning: vrat.practiceLocal,
    targetLanguage: effectiveLang,
    enabled: lang === 'local'
  });

  const localizedMantra = useLocalizedMeaning({
    entryId: `vrat:${vrat.id}:mantra`,
    sourceMeaning: vrat.mantra,
    providedMeaning: vrat.mantraLocal,
    targetLanguage: effectiveLang,
    enabled: lang === 'local'
  });

  const localizedTagline = useLocalizedMeaning({
    entryId: `vrat:${vrat.id}:tagline`,
    sourceMeaning: vrat.tagline,
    providedMeaning: vrat.taglineLocal,
    targetLanguage: effectiveLang,
    enabled: lang === 'local'
  });

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
    const link = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Read & check this sacred Vrat observance following this link to open those features: ${link}\n\nToday's Sacred Observance: ${vrat.name}\n${vrat.tagline}\nRead more on Shoonaya.`;
    if (navigator.share) {
      navigator.share({ title: vrat.name, text, url: link }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
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
      <header className="fixed top-0 inset-x-0 z-50 px-4 py-3 flex items-center gap-3 backdrop-blur-xl" style={{ borderBottom: `1px solid ${activeTheme.border}`, backgroundColor: `${activeTheme.bg}cc` }}>
        <button 
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition"
          style={{ backgroundColor: activeTheme.border, color: activeTheme.text }}
        >
          <ChevronLeft size={18} />
        </button>
        
        <div className="flex-1 min-w-0 flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
            {translateFn(effectiveLang, 'vrat') || 'Vrat'}
          </span>
          <span className="text-xs font-bold truncate" style={{ color: 'var(--brand-primary-strong)' }}>
            {originalSlug.toUpperCase()}
          </span>
        </div>

        {/* ── Reading Options ── */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button 
            onClick={() => setTheme(t => t === 'light' ? 'dark' : t === 'dark' ? 'sepia' : 'light')}
            className="theme-toggle w-9 h-9 rounded-full flex items-center justify-center transition"
            style={{ backgroundColor: activeTheme.border, color: activeTheme.text }}
          >
            {theme === 'light' ? <Moon size={16} /> : theme === 'dark' ? <div className="w-4 h-4 bg-[#F4ECD8] rounded-full border border-black/10" /> : <Sun size={16} />}
          </button>

          {/* Font Size Toggle */}
          <button 
            onClick={() => setFontSize(s => s === 'sm' ? 'md' : s === 'md' ? 'lg' : s === 'lg' ? 'xl' : 'sm')}
            className="font-toggle w-9 h-9 rounded-full flex items-center justify-center transition text-[11px] font-bold"
            style={{ backgroundColor: activeTheme.border, color: activeTheme.text }}
          >
            Aa
          </button>

          {/* Language Toggle */}
          {vrat.nameLocal && (
            <button 
              onClick={() => setLang(l => l === 'en' ? 'local' : 'en')}
              className="lang-toggle w-9 h-9 rounded-full flex items-center justify-center transition font-[family:var(--font-deva)] text-sm font-bold"
              style={{ backgroundColor: activeTheme.border, color: activeTheme.text }}
            >
              {lang === 'en' ? 'अ' : 'A'}
            </button>
          )}
        </div>
      </header>

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

          <p className={`italic font-medium opacity-80 px-4 ${fontStyles[fontSize]} ${localizedTagline.isLoading ? 'opacity-50 blur-[2px]' : ''}`}>
            &ldquo;{lang === 'local' ? localizedTagline.meaning : vrat.tagline}&rdquo;
          </p>
        </section>

        {/* Narrative Section */}
        <section className="space-y-8">
          {/* Significance */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              <Book size={14} /> {translateFn(effectiveLang, 'significance')}
            </div>
            <p className={`${fontStyles[fontSize]} whitespace-pre-wrap ${localizedSignificance.isLoading ? 'opacity-50 blur-[2px]' : ''}`}>
              {lang === 'local' ? localizedSignificance.meaning : vrat.significance}
            </p>
          </div>

          {/* Practice */}
          <div className="rounded-[2rem] p-6 space-y-4" style={{ backgroundColor: 'rgba(200,146,74,0.05)', border: '1px solid rgba(200,146,74,0.1)' }}>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--brand-primary-strong)]">
              <Flame size={14} /> {translateFn(effectiveLang, 'howToObserve')}
            </div>
            <p className={`${fontStyles[fontSize]} font-medium italic ${localizedPractice.isLoading ? 'opacity-50 blur-[2px]' : ''}`}>
              {lang === 'local' ? localizedPractice.meaning : vrat.practice}
            </p>
          </div>

          {/* Mantra */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              <Info size={14} /> {translateFn(effectiveLang, 'sacredMantra')}
            </div>
            <p className={`${fontStyles[fontSize]} text-center premium-serif text-xl font-bold mt-4 ${localizedMantra.isLoading ? 'opacity-50 blur-[2px]' : ''}`}>
              {lang === 'local' ? localizedMantra.meaning : vrat.mantra}
            </p>
          </div>

        </section>

        {/* Share Button */}
        <div className="flex justify-center pt-12">
          <button 
            onClick={handleShare}
            className="share-button flex items-center gap-2 px-8 py-4 rounded-full text-black font-bold shadow-xl hover:scale-105 transition active:scale-95"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            <Share2 size={18} />
            {translateFn(effectiveLang, 'shareObservance')}
          </button>
        </div>
      </main>

      {/* ── Motif (Bottom) ────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 h-32 pointer-events-none opacity-[0.03] flex items-center justify-center text-[10rem]">
        {vrat.emoji}
      </div>

      <ReaderIntro />
    </div>
  );
}
