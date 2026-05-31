'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ChevronLeft, Sun, Moon,
  Book, Flame, Share2, Info, Copy, Check,
  Volume2, VolumeX, Loader2, CheckCircle2,
  Users, CalendarDays, Utensils, ShoppingBag, Radio,
  CheckCheck, XCircle, Clock,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { VratData, FastingType } from '@/lib/vrat-data';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { t as translateFn, type AppLang } from '@/lib/i18n/translations';
import { ReaderIntro } from '@/components/ui/ReaderIntro';
import { buildReadableCapabilities, type ReadableContent } from '@/lib/readable-content';
import { useReaderControls } from '@/hooks/useReaderControls';
import { getInitialReaderDisplayMode, resolveReadablePreferences } from '@/lib/readable-preferences';

type ReadingTheme = 'light' | 'dark' | 'sepia';
type FontSize = 'sm' | 'md' | 'lg' | 'xl';

const FASTING_LABELS: Record<FastingType, string> = {
  nirjala:   '💧 Nirjala — No food or water',
  phalahar:  '🍎 Phalahar — Fruits & milk only',
  sattvic:   '🥬 Sattvic — Pure vegetarian food',
  ekbhukta:  '🌙 Ekbhukta — One meal only',
  partial:   '🌓 Partial fast — Light eating',
  none:      '🙏 No fasting — Devotion only',
};

function fastingLabel(type: FastingType): string {
  return FASTING_LABELS[type] ?? type;
}

interface VratClientProps {
  vrat: VratData;
  originalSlug: string;
  isAuthenticated?: boolean;
  appLanguage?: string;
  meaningLanguage?: string;
  transliterationLanguage?: string;
  showTransliteration?: boolean;
  scriptureScript?: string;
}

export default function VratClient({
  vrat,
  originalSlug,
  isAuthenticated = false,
  appLanguage,
  meaningLanguage,
  transliterationLanguage,
  showTransliteration,
  scriptureScript,
}: VratClientProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<ReadingTheme>('light');
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [showSettings, setShowSettings] = useState(false);
  
  const { t, lang: contextLang } = useLanguage();
  const localContentLanguage: AppLang = vrat.mantraLocal?.match(/[੦-ੵ]/) ? 'pa' : 'hi';
  const canToggleLocalLanguage =
    !!vrat.nameLocal &&
    !!vrat.taglineLocal &&
    !!vrat.significanceLocal &&
    !!vrat.practiceLocal &&
    !!vrat.mantraLocal;
  const preferences = resolveReadablePreferences({
    appLanguage: appLanguage ?? contextLang,
    meaningLanguage,
    transliterationLanguage,
    showTransliteration,
    scriptureScript,
  });
  const [lang, setLang] = useState<'en' | 'local'>(
    getInitialReaderDisplayMode(preferences, canToggleLocalLanguage)
  );

  const displayLang: AppLang = lang === 'local' ? localContentLanguage : 'en';
  const title = lang === 'local' && vrat.nameLocal ? vrat.nameLocal : vrat.name;
  const tagline = lang === 'local' && vrat.taglineLocal ? vrat.taglineLocal : vrat.tagline;
  const significanceText =
    lang === 'local' && vrat.significanceLocal ? vrat.significanceLocal : vrat.significance;
  const practiceText =
    lang === 'local' && vrat.practiceLocal ? vrat.practiceLocal : vrat.practice;
  const mantraText =
    lang === 'local' && vrat.mantraLocal ? vrat.mantraLocal : vrat.mantra;

  const significanceContent: ReadableContent = {
    original: vrat.significance,
    meaning: vrat.significanceLocal,
    sourceLabel: vrat.name,
    tradition: 'hindu',
    language: 'en',
    script: 'latin',
    pipelineTags: {
      content_type: 'instruction',
      response_mode: 'extractive',
      audio_mode: 'none',
      tradition: 'hindu',
      script: 'latin',
      delivery_intent: 'live_user',
    },
    capabilities: buildReadableCapabilities(
      {
        original: vrat.significance,
        meaning: vrat.significanceLocal,
        script: 'latin',
        pipelineTags: {
          content_type: 'instruction',
          audio_mode: 'none',
        },
      },
      {
        canToggleLocalLanguage: canToggleLocalLanguage,
      }
    ),
  };

  const practiceContent: ReadableContent = {
    original: vrat.practice,
    meaning: vrat.practiceLocal,
    sourceLabel: vrat.name,
    tradition: 'hindu',
    language: 'en',
    script: 'latin',
    pipelineTags: {
      content_type: 'instruction',
      response_mode: 'extractive',
      audio_mode: 'none',
      tradition: 'hindu',
      script: 'latin',
      delivery_intent: 'live_user',
    },
    capabilities: buildReadableCapabilities(
      {
        original: vrat.practice,
        meaning: vrat.practiceLocal,
        script: 'latin',
        pipelineTags: {
          content_type: 'instruction',
          audio_mode: 'none',
        },
      },
      {
        canToggleLocalLanguage: canToggleLocalLanguage,
      }
    ),
  };

  const mantraContent: ReadableContent = {
    original: vrat.mantra,
    meaning: vrat.mantraLocal,
    sourceLabel: vrat.name,
    tradition: 'hindu',
    language: 'sa',
    script: vrat.mantraLocal?.match(/[ऀ-ॿ]/) ? 'devanagari' : 'latin',
    pipelineTags: {
      content_type: 'sacred_verse',
      response_mode: 'extractive',
      audio_mode: 'meditative',
      tradition: 'hindu',
      script: vrat.mantraLocal?.match(/[ऀ-ॿ]/) ? 'devanagari' : 'latin',
      delivery_intent: 'live_user',
    },
    capabilities: buildReadableCapabilities(
      {
        original: vrat.mantra,
        meaning: vrat.mantraLocal,
        script: vrat.mantraLocal?.match(/[ऀ-ॿ]/) ? 'devanagari' : 'latin',
        pipelineTags: {
          content_type: 'sacred_verse',
          audio_mode: 'meditative',
        },
      },
      {
        canToggleLocalLanguage: canToggleLocalLanguage,
      }
    ),
  };

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

  const readerControls = useReaderControls(mantraContent.capabilities);

  // ── Vrat observation tracker ──────────────────────────────────────────────
  const [observedToday,    setObservedToday]    = useState(false);
  const [observeCount,     setObserveCount]     = useState(0);
  const [observeLoading,   setObserveLoading]   = useState(false);
  const [observeStatusLoaded, setObserveStatusLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(`/api/vrat/observe?vrat_id=${encodeURIComponent(vrat.id)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setObservedToday(data.observed_today);
          setObserveCount(data.total_count);
        }
      })
      .catch(() => { /* silently ignore — tracker is non-critical */ })
      .finally(() => setObserveStatusLoaded(true));
  }, [isAuthenticated, vrat.id]);

  async function handleObserve() {
    if (observedToday || observeLoading) return;
    setObserveLoading(true);
    try {
      const res = await fetch('/api/vrat/observe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vrat_id: vrat.id, vrat_name: vrat.name }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setObservedToday(true);
        setObserveCount(c => c + (data.already_observed ? 0 : 1));
        if (!data.already_observed && data.karma_earned > 0) {
          toast.success(`🙏 Vrat observed! +${data.karma_earned} karma`, { duration: 3000 });
        } else {
          toast.success('🙏 Vrat marked as observed', { duration: 2000 });
        }
      } else {
        toast.error(data?.error ?? 'Could not record observation');
      }
    } catch {
      toast.error('Could not record observation');
    } finally {
      setObserveLoading(false);
    }
  }

  // ── Global stats (public — works for unauthenticated readers too) ────────────
  const [globalStats, setGlobalStats] = useState<{
    today_count: number;
    total_count: number;
    next_date: string | null;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/vrat/stats?vrat_id=${encodeURIComponent(vrat.id)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setGlobalStats(data); })
      .catch(() => {});
  }, [vrat.id]);

  // ── TTS playback ──
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopTTS = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setSpeaking(false);
  }, []);

  useEffect(() => {
    return () => stopTTS();
  }, [stopTTS]);

  const speakMantra = async () => {
    const textToSpeak = mantraText;

    if (speaking || readerControls.state.isGeneratingTTS) {
      stopTTS();
      return;
    }

    try {
      const audioUrl = await readerControls.handlers.requestTTS(textToSpeak, {
        quality: 'standard',
        pipelineTags: mantraContent.pipelineTags,
      });

      if (!audioUrl) return;

      const audio = new Audio(audioUrl);
      audio.playbackRate = 0.78; // Slower, meditative pace for Sanskrit mantras
      audioRef.current = audio;
      audio.onended = () => setSpeaking(false);
      audio.onerror = () => setSpeaking(false);
      await audio.play();
      setSpeaking(true);
    } catch {
      toast.error('Audio unavailable right now');
      setSpeaking(false);
    }
  };

  const handleShare = () => {
    const link = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Read & check this sacred Vrat observance following this link to open those features: ${link}\n\nToday's Sacred Observance: ${title}\n${tagline}\nRead more on Shoonaya.`;
    readerControls.handlers.share(text, title, link);
  };

  const handleCopy = () => {
    const link = typeof window !== 'undefined' ? window.location.href : '';
    const textToCopy = `🙏 Today's Sacred Observance: ${title}\n"${tagline}"\n\nSignificance:\n${significanceText}\n\nHow to observe:\n${practiceText}\n\nMantra:\n${mantraText}\n\nRead more on Shoonaya: ${link}`;
    readerControls.handlers.copyText(textToCopy, 'Sacred Vrat details');
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
            {translateFn(displayLang, 'vrat') || 'Vrat'}
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
          {significanceContent.capabilities.canToggleLocalLanguage && (
            <button 
              onClick={() => setLang(l => l === 'en' ? 'local' : 'en')}
              className="lang-toggle w-9 h-9 rounded-full flex items-center justify-center transition font-[family:var(--font-deva)] text-sm font-bold"
              style={{ backgroundColor: activeTheme.border, color: activeTheme.text }}
            >
              {lang === 'en' ? 'अ' : 'A'}
            </button>
          )}

          {/* Copy Button */}
          <button 
            onClick={handleCopy}
            className="w-11 h-11 rounded-full flex items-center justify-center transition"
            style={{ backgroundColor: activeTheme.border, color: activeTheme.text }}
            title="Copy Vrat Details"
          >
            {readerControls.state.isCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>

          {/* Share Button */}
          <button 
            onClick={handleShare}
            className="w-11 h-11 rounded-full flex items-center justify-center transition"
            style={{ backgroundColor: activeTheme.border, color: activeTheme.text }}
            title="Share Vrat"
           aria-label="Share">
            <Share2 size={16} />
          </button>
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
              background: `linear-gradient(135deg, rgba(197, 160, 89,0.2), rgba(197, 160, 89,0.05))`,
              border: `1px solid rgba(197, 160, 89,0.4)`
            }}
          >
            {vrat.emoji}
          </motion.div>
          
          <div className="space-y-1">
            <h1 className="text-3xl font-bold premium-serif tracking-tight">
              {title}
            </h1>
          </div>

          <p className={`italic font-medium opacity-80 px-4 ${fontStyles[fontSize]}`}>
            &ldquo;{tagline}&rdquo;
          </p>
        </section>

        {/* Narrative Section */}
        <section className="space-y-8">
          {/* Significance */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              <Book size={14} /> {translateFn(displayLang, 'significance')}
            </div>
            <p className={`${fontStyles[fontSize]} whitespace-pre-wrap`}>
              {significanceText}
            </p>
          </div>

          {/* Practice */}
          <div className="rounded-[2rem] p-6 space-y-4" style={{ backgroundColor: 'rgba(197, 160, 89,0.05)', border: '1px solid rgba(197, 160, 89,0.1)' }}>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--brand-primary-strong)]">
              <Flame size={14} /> {translateFn(displayLang, 'howToObserve')}
            </div>
            <p className={`${fontStyles[fontSize]} font-medium italic`}>
              {practiceText}
            </p>
          </div>

          {/* Mantra */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              <span className="flex items-center gap-2">
                <Info size={14} /> {translateFn(displayLang, 'sacredMantra')}
              </span>
              {mantraContent.capabilities.canGenerateTTS && (
                <button
                  onClick={speakMantra}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full border transition active:scale-95 font-semibold tracking-wider text-[9px]"
                  style={{
                    backgroundColor: speaking ? 'rgba(197, 160, 89,0.15)' : 'transparent',
                    borderColor: 'rgba(197, 160, 89,0.3)',
                    color: activeTheme.text,
                  }}
                >
                  {readerControls.state.isGeneratingTTS ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : speaking ? (
                    <VolumeX size={12} />
                  ) : (
                    <Volume2 size={12} />
                  )}
                  <span>{speaking ? 'STOP' : 'LISTEN'}</span>
                </button>
              )}
            </div>
            <p className={`${fontStyles[fontSize]} text-center premium-serif text-xl font-bold mt-4`}>
              {mantraText}
            </p>
          </div>

        </section>

        {/* ── Global Reader Cards ─────────────────────────────────────── */}

        {/* 1 — Fasting Guide */}
        {(vrat.fastingType || vrat.dos?.length || vrat.donts?.length || vrat.pujaItems?.length) && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              <Utensils size={14} /> Fasting Guide
            </div>

            {/* Fast type pill */}
            {vrat.fastingType && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(197,160,89,0.12)', color: 'var(--brand-primary)', border: '1px solid rgba(197,160,89,0.25)' }}>
                  {fastingLabel(vrat.fastingType)}
                </span>
                {vrat.breakFastTime && (
                  <span className="flex items-center gap-1 text-xs opacity-60">
                    <Clock size={11} /> Break fast: {vrat.breakFastTime}
                  </span>
                )}
              </div>
            )}

            {/* Dos & Don'ts side by side */}
            {(vrat.dos?.length || vrat.donts?.length) && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {vrat.dos?.length ? (
                  <div className="rounded-2xl p-4 space-y-2.5"
                    style={{ background: 'rgba(90,170,56,0.06)', border: '1px solid rgba(90,170,56,0.15)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-green-600 dark:text-green-400">
                      <CheckCheck size={12} /> Do
                    </p>
                    <ul className="space-y-2">
                      {vrat.dos.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs opacity-80 leading-snug">
                          <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {vrat.donts?.length ? (
                  <div className="rounded-2xl p-4 space-y-2.5"
                    style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.12)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-red-500 dark:text-red-400">
                      <XCircle size={12} /> Avoid
                    </p>
                    <ul className="space-y-2">
                      {vrat.donts.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs opacity-80 leading-snug">
                          <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}

            {/* Puja items */}
            {vrat.pujaItems?.length ? (
              <div className="rounded-2xl p-4 space-y-3"
                style={{ background: activeTheme.card, border: `1px solid ${activeTheme.border}` }}>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 flex items-center gap-1.5">
                  <ShoppingBag size={12} /> What you'll need
                </p>
                <div className="flex flex-wrap gap-2">
                  {vrat.pujaItems.map((item, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: activeTheme.border }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        )}

        {/* 2 — Next Occurrence + Global Count */}
        {globalStats && (globalStats.next_date || globalStats.total_count > 0) && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              <CalendarDays size={14} /> Around the World
            </div>
            <div className="grid grid-cols-2 gap-3">
              {globalStats.next_date && (
                <div className="rounded-2xl p-4 text-center"
                  style={{ background: 'rgba(197,160,89,0.07)', border: '1px solid rgba(197,160,89,0.15)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1">Next date</p>
                  <p className="text-base font-bold premium-serif" style={{ color: 'var(--brand-primary)' }}>
                    {new Date(globalStats.next_date + 'T00:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-[10px] opacity-40 mt-0.5">
                    {new Date(globalStats.next_date + 'T00:00:00').toLocaleDateString('en', { weekday: 'long' })}
                  </p>
                </div>
              )}
              {globalStats.today_count > 0 && (
                <div className="rounded-2xl p-4 text-center"
                  style={{ background: 'rgba(197,160,89,0.07)', border: '1px solid rgba(197,160,89,0.15)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1">Observing today</p>
                  <p className="text-base font-bold premium-serif" style={{ color: 'var(--brand-primary)' }}>
                    {globalStats.today_count.toLocaleString()}
                  </p>
                  <p className="text-[10px] opacity-40 mt-0.5">seekers on Shoonaya</p>
                </div>
              )}
              {globalStats.total_count > 0 && !globalStats.today_count && (
                <div className="rounded-2xl p-4 text-center"
                  style={{ background: 'rgba(197,160,89,0.07)', border: '1px solid rgba(197,160,89,0.15)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1">All-time</p>
                  <p className="text-base font-bold premium-serif" style={{ color: 'var(--brand-primary)' }}>
                    {globalStats.total_count.toLocaleString()}
                  </p>
                  <p className="text-[10px] opacity-40 mt-0.5">observances recorded</p>
                </div>
              )}
            </div>
            {globalStats.today_count > 0 && (
              <div className="flex items-center justify-center gap-2 py-2">
                <div className="flex -space-x-1.5">
                  {['🕉️','☸️','☬','🙏','✨'].slice(0, Math.min(5, globalStats.today_count)).map((e, i) => (
                    <span key={i} className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px]"
                      style={{ borderColor: activeTheme.bg, background: activeTheme.card }}>
                      {e}
                    </span>
                  ))}
                </div>
                <span className="text-xs opacity-50">
                  {globalStats.today_count === 1 ? '1 seeker is' : `${globalStats.today_count} seekers are`} observing with you today
                </span>
              </div>
            )}
          </section>
        )}

        {/* 3 — Live Darshan suggestion */}
        <section>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-3">
            <Radio size={14} /> Watch Live
          </div>
          <Link href="/live-darshan"
            className="flex items-center gap-4 rounded-2xl p-4 transition active:scale-[0.98]"
            style={{ background: activeTheme.card, border: `1px solid ${activeTheme.border}` }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'rgba(220,38,38,0.10)' }}>
              🪔
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-snug" style={{ color: activeTheme.text }}>
                Join the Live Aarti
              </p>
              <p className="text-xs opacity-50 mt-0.5">
                Watch temples streaming live darshan right now
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.20)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Live</span>
            </div>
          </Link>
        </section>

        {/* 4 — Global reader explainer (non-auth only — authenticated users already know this) */}
        {!isAuthenticated && (
          <section className="rounded-2xl p-5 space-y-3"
            style={{ background: activeTheme.card, border: `1px solid ${activeTheme.border}` }}>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              <Info size={14} /> New to this practice?
            </div>
            <p className="text-sm opacity-70 leading-relaxed">
              Vratas are intentional fasting days tied to the Hindu lunar calendar. They are not about deprivation — they're about clearing space: in your body, your mind, your week. Most vratas follow a rhythm (every 11 days, every full moon) so the practice becomes second nature over time.
            </p>
            <p className="text-sm opacity-70 leading-relaxed">
              You don't need to be Hindu to observe. Millions of global seekers use these lunar rhythms to reset, meditate more deeply, and connect with a tradition older than most religions.
            </p>
            <Link href="/home"
              className="inline-flex items-center gap-1.5 text-xs font-semibold mt-1"
              style={{ color: 'var(--brand-primary)' }}>
              Start your practice on Shoonaya →
            </Link>
          </section>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col items-center gap-4 pt-12">

          {/* ── Mark as Observed (authenticated users only) ── */}
          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="w-full max-w-sm"
            >
              {observedToday ? (
                <div
                  className="flex items-center justify-center gap-2.5 w-full rounded-full py-4 font-bold text-sm"
                  style={{ background: 'rgba(134,187,110,0.15)', border: '1.5px solid rgba(134,187,110,0.45)', color: '#5aaa38' }}
                >
                  <CheckCircle2 size={18} />
                  Observed today ✓
                  {observeCount > 1 && (
                    <span className="ml-1 text-xs font-normal opacity-70">({observeCount}× total)</span>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleObserve}
                  disabled={observeLoading || !observeStatusLoaded}
                  className="w-full flex items-center justify-center gap-2.5 rounded-full py-4 font-bold text-sm transition active:scale-95 disabled:opacity-60"
                  style={{ background: 'rgba(197,160,89,0.92)', color: '#1c1208', boxShadow: '0 4px 20px rgba(197,160,89,0.25)' }}
                >
                  {observeLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      🙏 Mark as Observed
                      {observeCount > 0 && (
                        <span className="ml-1 text-xs font-semibold opacity-70">({observeCount}× before)</span>
                      )}
                    </>
                  )}
                </button>
              )}
              <p className="text-center text-[11px] mt-2 opacity-40">
                {observedToday ? 'Your practice is recorded' : `Earn ${25} karma for completing this vrat`}
              </p>
            </motion.div>
          )}

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="share-button flex items-center gap-2 px-8 py-4 rounded-full font-bold shadow-xl hover:scale-105 transition active:scale-95"
            style={{
              backgroundColor: isAuthenticated ? activeTheme.border : 'var(--brand-primary)',
              color: isAuthenticated ? activeTheme.text : '#1c1208',
            }}
          >
            <Share2 size={18} />
            {translateFn(displayLang, 'shareObservance')}
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
