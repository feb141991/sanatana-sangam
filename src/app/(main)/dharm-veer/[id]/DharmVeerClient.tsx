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
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { t as translateFn, type AppLang } from '@/lib/i18n/translations';
import { useLocalizedMeaning } from '@/hooks/useLocalizedMeaning';
import toast from 'react-hot-toast';
import { ReaderIntro } from '@/components/ui/ReaderIntro';

type ReadingTheme = 'light' | 'dark' | 'sepia';
type FontSize = 'sm' | 'md' | 'lg' | 'xl';

export default function DharmVeerClient({ hero }: { hero: DharmVeer }) {
  const router = useRouter();
  const [theme, setTheme] = useState<ReadingTheme>('light');
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [showSettings, setShowSettings] = useState(false);
  const { lang: appLang } = useLanguage();
  const [lang, setLang] = useState<'en' | 'local'>(appLang === 'en' ? 'en' : 'local');

  const effectiveLang: AppLang = lang === 'en' ? 'en' : (appLang === 'en' ? 'hi' : appLang);
  const meta = TRADITION_META[hero.tradition];

  // ── Localization ──
  const localizedJourney = useLocalizedMeaning({
    entryId: `dharm-veer:${hero.id}:journey`,
    sourceMeaning: hero.journey,
    providedMeaning: hero.journeyLocal,
    targetLanguage: effectiveLang,
    enabled: lang === 'local'
  });

  const localizedTrial = useLocalizedMeaning({
    entryId: `dharm-veer:${hero.id}:trial`,
    sourceMeaning: hero.trial,
    providedMeaning: hero.trialLocal,
    targetLanguage: effectiveLang,
    enabled: lang === 'local'
  });

  const localizedTeaching = useLocalizedMeaning({
    entryId: `dharm-veer:${hero.id}:teaching`,
    sourceMeaning: hero.teaching,
    providedMeaning: hero.teachingLocal,
    targetLanguage: effectiveLang,
    enabled: lang === 'local'
  });

  const localizedMoral = useLocalizedMeaning({
    entryId: `dharm-veer:${hero.id}:moral`,
    sourceMeaning: hero.moral,
    providedMeaning: hero.moralLocal,
    targetLanguage: effectiveLang,
    enabled: lang === 'local'
  });

  const localizedQuote = useLocalizedMeaning({
    entryId: `dharm-veer:${hero.id}:quote`,
    sourceMeaning: hero.quote?.text,
    providedMeaning: hero.quoteLocal?.text,
    targetLanguage: effectiveLang,
    enabled: lang === 'local'
  });

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
    const link = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Read & check this Dharm Veer story following this link to open those features: ${link}\n\nToday's Dharm Veer: ${hero.name}\n${hero.tagline}\nRead more on Shoonaya.`;
    if (navigator.share) {
      navigator.share({ title: hero.name, text, url: link }).catch(() => {});
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
            {meta.dharmVeerLocal || 'Dharm Veer'}
          </span>
          <span className="text-xs font-bold truncate" style={{ color: 'var(--brand-primary)' }}>
            {hero.tradition.toUpperCase()}
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
          {hero.nameLocal && (
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
              {lang === 'local' && hero.eraLocal ? hero.eraLocal : hero.era} · {lang === 'local' && hero.regionLocal ? hero.regionLocal : hero.region}
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
              <Book size={14} /> {translateFn(effectiveLang, 'journeyLabel')}
            </div>
            <p className={`${fontStyles[fontSize]} whitespace-pre-wrap ${localizedJourney.isLoading ? 'opacity-50 blur-[2px]' : ''}`}>
              {lang === 'local' ? localizedJourney.meaning : hero.journey}
            </p>
          </div>

          {/* The Trial */}
          <div className="clay-card rounded-[2rem] p-6 space-y-4" style={{ backgroundColor: 'rgba(200,146,74,0.05)', border: '1px solid rgba(200,146,74,0.1)' }}>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
              <Shield size={14} /> {translateFn(effectiveLang, 'testOfDharma')}
            </div>
            <p className={`${fontStyles[fontSize]} font-medium italic ${localizedTrial.isLoading ? 'opacity-50 blur-[2px]' : ''}`}>
              {lang === 'local' ? localizedTrial.meaning : hero.trial}
            </p>
          </div>

          {/* The Teaching */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              <Lightbulb size={14} /> {translateFn(effectiveLang, 'wisdom')}
            </div>
            <p className={`${fontStyles[fontSize]} ${localizedTeaching.isLoading ? 'opacity-50 blur-[2px]' : ''}`}>
              {lang === 'local' ? localizedTeaching.meaning : hero.teaching}
            </p>
          </div>

          {/* Quote */}
          {hero.quote && (
            <div className="py-8 border-y border-white/5 text-center space-y-4">
              <Quote size={32} className="mx-auto opacity-20 text-[var(--brand-primary)]" />
              <p className={`text-xl font-bold premium-serif italic px-6 ${localizedQuote.isLoading ? 'opacity-50 blur-[2px]' : ''}`}>
                {lang === 'local' ? localizedQuote.meaning : hero.quote.text}
              </p>
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                — {lang === 'local' && hero.quoteLocal ? hero.quoteLocal.attribution : hero.quote.attribution}
              </p>
            </div>
          )}

          {/* Moral */}
          <div className="text-center pt-8">
            <p className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40 mb-4">{translateFn(effectiveLang, 'essence')}</p>
            <p className={`text-lg font-bold leading-relaxed max-w-sm mx-auto ${localizedMoral.isLoading ? 'opacity-50 blur-[2px]' : ''}`}>
              {lang === 'local' ? localizedMoral.meaning : hero.moral}
            </p>
          </div>
        </section>

        {/* Share Button */}
        <div className="flex justify-center pt-12">
          <button 
            onClick={handleShare}
            className="share-button flex items-center gap-2 px-8 py-4 rounded-full bg-[var(--brand-primary)] text-black font-bold shadow-xl hover:scale-105 transition active:scale-95"
          >
            <Share2 size={18} />
            {translateFn(effectiveLang, 'shareReflection')}
          </button>
        </div>
      </main>

      {/* ── Tradition Motif (Bottom) ────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 h-32 pointer-events-none opacity-[0.03] flex items-center justify-center text-[10rem]">
        {meta.emoji}
      </div>

      <ReaderIntro />
    </div>
  );
}
