'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Settings, Type, Sun, Moon, 
  Book, Quote, Shield, Lightbulb, Share2, Copy, Check 
} from 'lucide-react';
import type { DharmVeer } from '@/lib/dharm-veer';
import { TRADITION_META } from '@/lib/dharm-veer';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { t as translateFn, type AppLang } from '@/lib/i18n/translations';
import { ReaderIntro } from '@/components/ui/ReaderIntro';
import { getInitialReaderDisplayMode, resolveReadablePreferences } from '@/lib/readable-preferences';
import { buildReadableCapabilities } from '@/lib/readable-content';
import { useReaderControls } from '@/hooks/useReaderControls';
import { createClient } from '@/lib/supabase';
import { localSpiritualDate } from '@/lib/sacred-time';
import PageIntro from '@/components/ui/PageIntro';
import toast from 'react-hot-toast';

type ReadingTheme = 'light' | 'dark' | 'sepia';
type FontSize = 'sm' | 'md' | 'lg' | 'xl';

interface DharmVeerClientProps {
  hero: DharmVeer;
  appLanguage?: string;
  meaningLanguage?: string;
  transliterationLanguage?: string;
  showTransliteration?: boolean;
  scriptureScript?: string;
}

export default function DharmVeerClient({
  hero,
  appLanguage,
  meaningLanguage,
}: DharmVeerClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [theme, setTheme] = useState<ReadingTheme>('light');
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const { lang: contextLang } = useLanguage();
  const localContentLanguage: AppLang = hero.tradition === 'sikh' ? 'pa' : 'hi';
  const hasCompleteLocalContent =
    !!hero.nameLocal &&
    !!hero.taglineLocal &&
    !!hero.journeyLocal &&
    !!hero.trialLocal &&
    !!hero.teachingLocal &&
    !!hero.moralLocal &&
    (!hero.quote || !!hero.quoteLocal?.text);
  const preferences = resolveReadablePreferences({
    appLanguage: appLanguage ?? contextLang,
    meaningLanguage,
  });
  const [lang, setLang] = useState<'en' | 'local'>(
    getInitialReaderDisplayMode(preferences, hasCompleteLocalContent)
  );

  const displayLang: AppLang = lang === 'local' ? localContentLanguage : 'en';
  const meta = TRADITION_META[hero.tradition];
  const title = lang === 'local' && hero.nameLocal ? hero.nameLocal : hero.name;
  const era = lang === 'local' && hero.eraLocal ? hero.eraLocal : hero.era;
  const region = lang === 'local' && hero.regionLocal ? hero.regionLocal : hero.region;
  const tagline = lang === 'local' && hero.taglineLocal ? hero.taglineLocal : hero.tagline;
  const journeyText = lang === 'local' && hero.journeyLocal ? hero.journeyLocal : hero.journey;
  const trialText = lang === 'local' && hero.trialLocal ? hero.trialLocal : hero.trial;
  const teachingText = lang === 'local' && hero.teachingLocal ? hero.teachingLocal : hero.teaching;
  const moralText = lang === 'local' && hero.moralLocal ? hero.moralLocal : hero.moral;
  const quoteText = lang === 'local' && hero.quoteLocal?.text ? hero.quoteLocal.text : hero.quote?.text;
  const quoteAttribution =
    lang === 'local' && hero.quoteLocal?.attribution
      ? hero.quoteLocal.attribution
      : hero.quote?.attribution;

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
  const readerControls = useReaderControls(
    buildReadableCapabilities({
      original: hero.journey,
      meaning: hero.journeyLocal,
      script: 'latin',
      pipelineTags: {
        content_type: 'instruction',
        audio_mode: 'none',
      },
    })
  );

  const handleCopy = () => {
    const textToCopy = `${title}\n${tagline}\n\n[Journey]\n${journeyText}\n\n[Trial]\n${trialText}\n\n[Teaching]\n${teachingText}\n\n[Moral]\n${moralText}`;
    
    void readerControls.handlers.copyText(textToCopy, 'Story');
  };

  const handleShare = () => {
    const link = typeof window !== 'undefined' ? window.location.href : '';
    const text = `🙏 Jai Shri Hari! Read this inspiring Dharm Veer story of '${title}' and check your daily rashiphal following the link to open those features: ${link} to grow your Sadhana.`;
    
    void readerControls.handlers.share(text, hero.name, link);
  };

  // Mark Dharm Veer done after 30 seconds of active reading — not on page entry.
  // Timer clears if the user navigates away before 30s elapses.
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
        const today = localSpiritualDate(tz, 4);
        localStorage.setItem(`shoonaya-dharmveer-done-${today}`, 'true');
        void (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await supabase
              .from('daily_sadhana')
              .upsert(
                { user_id: user.id, date: today, dharmveer_done: true },
                { onConflict: 'user_id,date' }
              );
          } catch {
            // Non-fatal: keep local completion even if cross-device sync fails.
          }

          // Award seva points for reading — fire and forget
          try {
            const res = await fetch('/api/karma/award', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount: 5, reason: 'dharm_veer' }),
            });
            const data = await res.json();
            if (res.ok) {
              toast.success('⚔️ +5 seva points — Dharm Veer complete!');
            } else if (data?.already_awarded) {
              // Already earned today — no toast, silently ok
            }
          } catch {
            // Non-fatal
          }
        })();
      } catch {
        // Non-fatal: Dharm Veer progress remains local.
      }
    }, 30_000); // 30 s of reading = meaningful engagement

    return () => clearTimeout(timer);
  }, [supabase]);

  return (
    <div 
      className="min-h-screen transition-colors duration-500 pb-24"
      style={{ 
        backgroundColor: activeTheme.bg,
        color: activeTheme.text,
        fontFamily: 'var(--font-inter)'
      }}
    >
      <PageIntro
        pageKey="dharm-veer"
        steps={[
          { emoji: '⚔️', title: 'Dharm Veer', body: 'A daily story of dharmic courage. Read for 30 seconds to earn your mark.' },
          { emoji: '⏱️', title: 'The 30-second rule', body: 'Stay on the page for 30 seconds. The strip will tick automatically.' },
        ]}
      />
      {/* ── Fixed Header ─────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 px-4 pt-12 pb-4 flex flex-col gap-3 backdrop-blur-xl border-b" style={{ borderColor: activeTheme.border, backgroundColor: `${activeTheme.bg}d9` }}>
        <div className="flex items-center justify-between gap-3">
          <button 
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition hover:bg-[var(--surface-base)]/20 active:scale-90"
            style={{ backgroundColor: activeTheme.border, color: activeTheme.text }}
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="flex-1 min-w-0 flex flex-col text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
              {meta.dharmVeerLocal || 'Dharm Veer'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button 
              onClick={() => setTheme(t => t === 'light' ? 'dark' : t === 'dark' ? 'sepia' : 'light')}
              className="theme-toggle w-9 h-9 rounded-full flex items-center justify-center transition hover:bg-[var(--surface-base)]/20 active:scale-90"
              style={{ backgroundColor: activeTheme.border, color: activeTheme.text }}
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={15} /> : theme === 'dark' ? <div className="w-4 h-4 bg-[#F4ECD8] rounded-full border border-black/10" /> : <Sun size={15} />}
            </button>
            <button
              onClick={handleCopy}
              className="w-11 h-11 rounded-full flex items-center justify-center transition hover:bg-[var(--surface-base)]/20 active:scale-90"
              style={{ backgroundColor: activeTheme.border, color: activeTheme.text }}
              title="Copy Story"
            >
              {readerControls.state.isCopied ? <Check size={14} color="#2D9E4A" /> : <Copy size={14} />}
            </button>
            <button
              onClick={handleShare}
              className="w-11 h-11 rounded-full flex items-center justify-center transition hover:bg-[var(--surface-base)]/20 active:scale-90"
              style={{ backgroundColor: activeTheme.border, color: activeTheme.text }}
              title="Share Story"
             aria-label="Share">
              <Share2 size={14} />
            </button>
          </div>
        </div>

        {/* ── Dynamic Controls Bar (Zoom & Language toggles) ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t" style={{ borderColor: `${activeTheme.border}30` }}>
          {/* Zoom Control */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: activeTheme.border }}>
            <span className="text-[9px] uppercase font-bold tracking-wider px-1 opacity-70">Zoom:</span>
            {(['sm', 'md', 'lg', 'xl'] as const).map(sz => (
              <button
                key={sz}
                onClick={() => setFontSize(sz)}
                className={`w-6 h-6 rounded-full text-[10px] font-semibold flex items-center justify-center transition-all ${
                  fontSize === sz
                    ? 'bg-[var(--brand-primary)] text-black font-bold shadow-sm'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                {sz === 'sm' ? 'A-' : sz === 'md' ? 'A' : sz === 'lg' ? 'A+' : 'A++'}
              </button>
            ))}
          </div>

          {/* Language Toggle */}
          {hasCompleteLocalContent && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: activeTheme.border }}>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1 opacity-70">Lang:</span>
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all ${
                  lang === 'en'
                    ? 'bg-[var(--brand-primary)] text-black shadow-sm'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('local')}
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all ${
                  lang === 'local'
                    ? 'bg-[var(--brand-primary)] text-black shadow-sm'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                हिं/Local
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <main className="pt-36 px-6 max-w-2xl mx-auto space-y-12">
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
              {title}
            </h1>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--brand-primary)]">
              {era} · {region}
            </p>
          </div>

          <p className={`italic font-medium opacity-80 px-4 ${fontStyles[fontSize]}`}>
            &ldquo;{tagline}&rdquo;
          </p>
        </section>

        {/* Narrative Section */}
        <section className="space-y-8">
          {/* The Journey */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              <Book size={14} /> {translateFn(displayLang, 'journeyLabel')}
            </div>
            <p className={`${fontStyles[fontSize]} whitespace-pre-wrap`}>
              {journeyText}
            </p>
          </div>

          {/* The Trial */}
          <div className="clay-card rounded-[2rem] p-6 space-y-4" style={{ backgroundColor: 'rgba(197, 160, 89,0.05)', border: '1px solid rgba(197, 160, 89,0.1)' }}>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
              <Shield size={14} /> {translateFn(displayLang, 'testOfDharma')}
            </div>
            <p className={`${fontStyles[fontSize]} font-medium italic`}>
              {trialText}
            </p>
          </div>

          {/* The Teaching */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              <Lightbulb size={14} /> {translateFn(displayLang, 'wisdom')}
            </div>
            <p className={fontStyles[fontSize]}>
              {teachingText}
            </p>
          </div>

          {/* Quote */}
          {hero.quote && (
            <div className="py-8 border-y border-white/5 text-center space-y-4">
              <Quote size={32} className="mx-auto opacity-20 text-[var(--brand-primary)]" />
              <p className="text-xl font-bold premium-serif italic px-6">
                {quoteText}
              </p>
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                — {quoteAttribution}
              </p>
            </div>
          )}

          {/* Moral */}
          <div className="text-center pt-8">
            <p className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40 mb-4">{translateFn(displayLang, 'essence')}</p>
            <p className="text-lg font-bold leading-relaxed max-w-sm mx-auto">
              {moralText}
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
            {translateFn(displayLang, 'shareReflection')}
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
