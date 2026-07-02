'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  Bell, MapPin, X, Images, Pencil, ChevronRight, Share2, Sparkles, ChevronLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import { type Shloka, getShlokaByLanguage } from '@/lib/shlokas';
import type { DailySacredText } from '@/lib/sacred-texts';
import type { Festival } from '@/lib/festivals';
import type { DharmVeer } from '@/lib/dharm-veer';
import { format as fmtDate } from 'date-fns';
import { getTransliteration } from '@/lib/transliteration';
import { resolveEffectiveMeaningLanguage } from '@/lib/language-runtime';
import { useLocalizedMeaning } from '@/hooks/useLocalizedMeaning';
import { getUnlockedRelics } from '@/lib/relics';
import { getRelicAccent } from '@/lib/relic-accents';
import { getGreeting, getGreetingPool, isGreetingCompatibleWithTradition } from '@/lib/traditions';
import { getTraditionMeta } from '@/lib/tradition-config';
import { resolveHomeHeroTheme, HOME_HERO_THEMES, type HomeHeroTheme } from '@/config/festivalThemes';
import { localSpiritualDate } from '@/lib/sacred-time';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { resolveVratSlug } from '@/lib/vrat-data';
import MoodGlyph from '@/components/ui/MoodGlyph';
import SacredGlowIcon from '@/components/ui/SacredGlowIcon';
import NextPracticeCard from '@/components/home/NextPracticeCard';
import BrahmaMuhurtaCard from '@/components/home/BrahmaMuhurtaCard';
import MantraPlayer from '@/components/ui/MantraPlayer';
import ScriptureCorrectionModal from '@/components/ScriptureCorrectionModal';

const RELIC_BADGE_EMOJI: Record<string, string> = {
  'diya-bronze':         '🪔',
  'clay-kalash':         '🏺',
  'incense-sandalwood':  '🪷',
  'camphor-flame':       '🕯️',
  'mindful-bell':        '🔔',
  'sacred-mala':         '📿',
  'shankha-conch':       '🐚',
  'the-sage-halo':       '✨',
  'trishula-gold':       '🔱',
  'krishna-flute':       '🎶',
  'rama-bow':            '🏹',
  'peacock-feather':     '🦚',
  'steel-kara':          '⭕',
  'sacred-kirpan':       '⚔️',
  'khanda-gold':         '☬',
  'lotus-bloom':         '🌸',
  'dharma-wheel-gold':   '☸️',
  'bodhi-leaf':          '🍃',
  'jain-swastika':       '🔯',
};

interface Panchang {
  tithi:           string;
  nakshatra:       string;
  yoga:            string;
  sunrise:         string;
  sunset:          string;
  rahuKaal:        string;
  brahmaMuhurta?:  string;
  abhijitMuhurat?: string;
  tithiIndex:      number;
}

interface SacredTextMeta {
  label:        string;
  icon:         string;
  shareLabel:   string;
  accentColour: string;
  accentLight:  string;
}

interface DailyDharmaStackState {
  japaBeads: number;
  japaRounds: number;
  quizDone: boolean;
  dharmVeerDone: boolean;
  stotramDone: boolean;
  kathaDone: boolean;
  pathshalaProgress: number;
}

interface HeroSectionProps {
  panchang: Panchang;
  selectedDate: Date;
  tradition: string | null;
  sampradaya: string | null;
  ishtaDevata: string | null;
  userName: string;
  userId: string;
  avatarUrl: string | null;
  isPro: boolean;
  activeSymbolId: string | null;
  karmaPoints: number;
  japaAlreadyDoneToday: boolean;
  japaStreak: number;
  showFirstTimeGuidance: boolean;
  nityaDoneToday: boolean;
  pathshalaDoneToday: boolean;
  dailyDharmaStackState: DailyDharmaStackState;
  dharmVeer: DharmVeer;
  isDark: boolean;
  unreadCount: number;
  onNotifBellClick: () => void;
  moodToday: { key: string; label: string; colour: string } | null | undefined;
  coverUrl: string | null;
  heroThemes: HomeHeroTheme[];
  daysUntilFestival: number | null;
  festivals: Festival[];
  appLanguage: string;
  meaningLanguage: string;
  transliterationLanguage: string;
  showTransliteration: boolean;
  shloka: Shloka;
  sacredText: DailySacredText | null;
  sacredTextMeta: SacredTextMeta;
  onGreetingClick: () => void;
  readToday: boolean;
  setReadToday: (val: boolean) => void;
  streak: number;
  setStreak: (val: number) => void;
  sevaScore: number;
  onShowConfetti: () => void;
  upcomingSacredObservance: { festival: Festival; daysLeft: number } | null;
  upcomingSacredObservanceLabel: string | null;
  showRashiphalNudge: boolean;
  onDismissRashiphalNudge: () => void;
  /** Dharma Mitra mantra nudge — dismissible, stored in localStorage */
  showDharmaMitraNudge: boolean;
  onDismissDharmaMitraNudge: () => void;
  city: string;
  timezone: string;
}

type DailySadhanaCta = {
  id: 'japa' | 'nitya' | 'pathshala' | 'quiz' | 'dharmveer' | 'complete';
  title: string;
  subtitle: string;
  buttonLabel: string;
  href: string;
  ariaLabel: string;
  icon: string;
};

function getTraditionJapaDetails(tradition: string | null) {
  switch (tradition) {
    case 'sikh': return { label: 'Naam Simran', detail: '108 jaaps · +5 seva' };
    case 'buddhist': return { label: 'Mantra Mala', detail: '108 recitations · +5 seva' };
    case 'jain': return { label: 'Navkar Mala', detail: '108 jaaps · +5 seva' };
    case 'hindu':
    default: return { label: 'Japa Mala', detail: '108 names · +5 seva' };
  }
}

function getDailySadhanaCta({
  tradition,
  completedPracticesCount,
  nextPracticeObj,
  meta,
}: {
  tradition: string | null;
  completedPracticesCount: number;
  nextPracticeObj: any;
  meta: any;
}): DailySadhanaCta {
  if (!nextPracticeObj) {
    return {
      id: 'complete',
      title: "Today's Sadhana Complete",
      subtitle: `Your ${meta.shortLabel || tradition || 'Dharma'} rhythm is steady today · +seva earned`,
      buttonLabel: "Today's Recap",
      href: '/my-progress',
      ariaLabel: "View today's sadhana progress",
      icon: '✨',
    };
  }

  if (completedPracticesCount === 0) {
    return {
      id: nextPracticeObj.id as any,
      title: "Begin Today's Sadhana",
      subtitle: `Start with ${nextPracticeObj.label} · ${5 - completedPracticesCount} practices today`,
      buttonLabel: 'Begin',
      href: nextPracticeObj.href,
      ariaLabel: `Begin today's sadhana with ${nextPracticeObj.label}`,
      icon: nextPracticeObj.icon,
    };
  }

  return {
    id: nextPracticeObj.id as any,
    title: "Continue Today's Sadhana",
    subtitle: `Next: ${nextPracticeObj.label} · ${nextPracticeObj.detail}`,
    buttonLabel: 'Continue',
    href: nextPracticeObj.href,
    ariaLabel: `Continue with ${nextPracticeObj.label}`,
    icon: nextPracticeObj.icon,
  };
}

// ── Time-aware greeting helper ─────────────────────────────────────────────
function getTimeGreeting(hour: number): string | null {
  if (hour >= 5  && hour < 12) return 'Suprabhat';
  if (hour >= 17 && hour < 20) return 'Shubh Sandhya';
  if (hour >= 20 || hour < 5)  return 'Shubh Ratri';
  return null;
}

function stripGreetingIcon(greeting: string) {
  return greeting
    .replace(/[🙏🕉️☬☸️🤲✨🌺🌸🦚🔱⚔️🪔🌟]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function shareContent(title: string, text: string) {
  if (navigator.share) {
    try { await navigator.share({ title, text }); return; } catch { /* cancelled */ }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  } catch {
    toast.error('Unable to share');
  }
}

// ── Rotating Panchang pill ────────────────────────────────────────────────────
interface PanchangPillProps {
  panchang: { tithi: string; nakshatra: string; yoga: string };
  selectedDate: Date;
}

const PILL_SLIDES = [
  {
    key: 'tithi',
    icon: '🌙',
    getLabel: (p: PanchangPillProps['panchang'], d: Date) => {
      const vs = d.getFullYear() + 57;
      return `${p.tithi} · VS ${vs}`;
    },
  },
  { key: 'nakshatra', icon: '✨', getLabel: (p: PanchangPillProps['panchang'], _d: Date) => `${p.nakshatra} · ${p.yoga}` },
  { key: 'date',      icon: '📅', getLabel: (_p: PanchangPillProps['panchang'], d: Date) => fmtDate(d, 'dd MMM yyyy') },
] as const;

function PanchangPill({ panchang, selectedDate }: PanchangPillProps) {
  const [idx, setIdx] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const total = PILL_SLIDES.length;

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % total), 3500);
    return () => clearInterval(t);
  }, [total]);

  const slide = PILL_SLIDES[idx];
  const label = slide.getLabel(panchang, selectedDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className="mt-1.5"
    >
      <button
        type="button"
        onClick={() => setIdx(i => (i + 1) % total)}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full active:scale-95 transition-transform overflow-hidden relative"
        style={{ background: 'rgba(197,160,89,0.16)', backdropFilter: 'blur(8px)', minWidth: 120 }}
        aria-label="Tap to cycle panchang info"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={slide.key}
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-1.5 w-full"
          >
            <span style={{ fontSize: 12, lineHeight: 1 }}>{slide.icon}</span>
            <span className="text-[12px] font-semibold whitespace-nowrap" style={{ color: 'rgba(255,240,200,0.92)' }}>
              {label}
            </span>
          </motion.span>
        </AnimatePresence>
        {/* Dot indicators */}
        <span className="flex items-center gap-[3px] ml-1 shrink-0">
          {PILL_SLIDES.map((s, i) => (
            <span
              key={s.key}
              style={{
                width: i === idx ? 10 : 4,
                height: 4,
                borderRadius: 99,
                background: i === idx ? 'rgba(255,240,200,0.80)' : 'rgba(255,240,200,0.25)',
                transition: 'all 0.3s ease',
                display: 'block',
              }}
            />
          ))}
        </span>
      </button>
    </motion.div>
  );
}

export function HeroSection({
  panchang,
  selectedDate,
  tradition,
  sampradaya,
  ishtaDevata,
  userName,
  userId,
  avatarUrl,
  isPro,
  activeSymbolId,
  karmaPoints,
  japaAlreadyDoneToday,
  japaStreak,
  showFirstTimeGuidance,
  nityaDoneToday,
  pathshalaDoneToday,
  dailyDharmaStackState,
  dharmVeer,
  isDark,
  unreadCount,
  onNotifBellClick,
  moodToday,
  coverUrl,
  heroThemes,
  daysUntilFestival,
  festivals,
  appLanguage,
  meaningLanguage,
  transliterationLanguage,
  showTransliteration,
  shloka,
  sacredText,
  sacredTextMeta,
  onGreetingClick,
  readToday,
  setReadToday,
  streak,
  setStreak,
  sevaScore,
  onShowConfetti,
  upcomingSacredObservance,
  upcomingSacredObservanceLabel,
  showRashiphalNudge,
  onDismissRashiphalNudge,
  showDharmaMitraNudge,
  onDismissDharmaMitraNudge,
  city,
  timezone,
}: HeroSectionProps) {
  const supabase = useRef(createClient()).current;
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();

  const [shlokaExpanded, setShlokaExpanded] = useState(false);
  const [shlokaModalOpen, setShlokaModalOpen] = useState(false);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [heroImageFailed, setHeroImageFailed] = useState(false);
  const [heroPicker, setHeroPicker] = useState(false);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('shoonaya_hero_pick');
  });

  const [customCover, setCustomCover] = useState<string | null>(coverUrl || null);

  useEffect(() => {
    if (coverUrl) setCustomCover(coverUrl);
    else {
      const saved = localStorage.getItem('user_cover_photo');
      if (saved) setCustomCover(saved);
    }
  }, [coverUrl]);

  // Sync shloka parameters with deep link focus check
  useEffect(() => {
    const focus = searchParams.get('focus');
    if (focus === 'shloka') {
      setShlokaExpanded(true);
      setShlokaModalOpen(true);
    }
  }, [searchParams]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return; }

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `profiles/${userId}/home_cover_${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: pubData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = pubData.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setCustomCover(publicUrl);
      localStorage.setItem('user_cover_photo', publicUrl);
      toast.success('Home sanctuary updated! 🙏');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const hour = new Date().getHours();
  const timeGreeting = getTimeGreeting(hour);
  const autoGreeting = getGreeting(tradition, sampradaya, new Date().getDate());
  
  const greeting = timeGreeting ?? autoGreeting;

  const meta = getTraditionMeta(tradition);
  const sacredTextTheme = meta.homeSacredTextTheme === 'pathshala'
    ? { iconWell: 'rgba(197, 160, 89, 0.12)' }
    : { iconWell: 'rgba(212, 120, 74, 0.13)' };
  const effectiveMeaningLanguage = resolveEffectiveMeaningLanguage(appLanguage, meaningLanguage);

  const dailyTextBase = {
    label: sacredTextMeta.label,
    icon: sacredTextMeta.icon,
    shareLabel: sacredTextMeta.shareLabel,
    source: sacredText ? sacredText.source : shloka.source,
    original: sacredText ? sacredText.original : shloka.sanskrit,
    transliteration: getTransliteration(
      sacredText ? sacredText.original : shloka.sanskrit,
      sacredText ? sacredText.transliteration : shloka.transliteration,
      transliterationLanguage ?? 'en'
    ),
    meaning: sacredText ? sacredText.meaning : getShlokaByLanguage(shloka, appLanguage ?? 'en'),
    actionLabel: sacredTextMeta.label,
    streakLabel: sacredText ? 'sacred text streak' : 'shloka streak',
  };

  const festival = festivals[0] ?? null;
  const localizedDailyMeaning = useLocalizedMeaning({
    entryId: `home:${tradition ?? 'other'}:${dailyTextBase.source}:${dailyTextBase.original.slice(0, 48)}`,
    sourceMeaning: dailyTextBase.meaning,
    sourceLabel: dailyTextBase.source,
    targetLanguage: effectiveMeaningLanguage,
  });

  const dailyText = {
    ...dailyTextBase,
    transliteration: showTransliteration ? dailyTextBase.transliteration : '',
    meaning: localizedDailyMeaning.meaning,
    meaningLabel: localizedDailyMeaning.label,
  };

  const heroTheme = resolveHomeHeroTheme({
    tradition,
    sampradaya,
    ishtaDevata,
    festival,
    dbThemes: heroThemes,
    selectedHeroId: selectedHeroId ?? undefined,
    lockSelectedHero: Boolean(selectedHeroId),
  });

  const pickerThemes = (() => {
    const trad = tradition ?? 'hindu';
    const all  = [...heroThemes, ...HOME_HERO_THEMES];
    const seen = new Set<string>();
    return all.filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      if (!t.traditions?.length) return true;
      return t.traditions.includes(trad);
    });
  })();

  const handleHeroSelect = (id: string | null) => {
    setSelectedHeroId(id);
    if (id) localStorage.setItem('shoonaya_hero_pick', id);
    else     localStorage.removeItem('shoonaya_hero_pick');
    setHeroPicker(false);
    setHeroImageFailed(false);
  };

  const isFestivalTheme = Boolean(heroTheme.festivalSlugs && heroTheme.festivalSlugs.length > 0 && daysUntilFestival === 0);
  const activeCoverUrl = isFestivalTheme ? heroTheme.heroImage : (customCover || heroTheme.heroImage);
  const heroFallback = meta.heroFallback;

  useEffect(() => {
    setHeroImageFailed(false);
  }, [activeCoverUrl]);

  async function markShlokaRead() {
    if (readToday || !userId) return;
    const tz        = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
    const today     = localSpiritualDate(tz, 4);
    const yestObj   = new Date(today + 'T12:00:00Z');
    yestObj.setUTCDate(yestObj.getUTCDate() - 1);
    const yesterday = yestObj.toISOString().slice(0, 10);

    const newStreak = lastShlokaDate === yesterday ? streak + 1 : 1;

    setReadToday(true);
    setStreak(newStreak);

    await supabase
      .from('profiles')
      .update({
        shloka_streak:    newStreak,
        last_shloka_date: today,
      })
      .eq('id', userId);

    try {
      const { error: rpcError } = await supabase.rpc('increment_period_seva', { p_user_id: userId, p_points: 5 });
      if (rpcError) throw rpcError;
    } catch {
      const { data } = await supabase.from('profiles').select('seva_score, weekly_seva, monthly_seva').eq('id', userId).single();
      if (data) {
        await supabase.from('profiles')
          .update({ 
            seva_score: (data.seva_score ?? 0) + 5,
            weekly_seva: (data.weekly_seva ?? 0) + 5,
            monthly_seva: (data.monthly_seva ?? 0) + 5
          })
          .eq('id', userId);
      }
    }

    onShowConfetti();
    setShlokaModalOpen(false);
    const milestoneMsg = newStreak % 7 === 0
      ? ` 🏅 ${newStreak}-day milestone!`
      : newStreak === 1 ? ` First ${dailyText.actionLabel} of your streak! 🌱` : '';
    toast.success(`🔥 ${newStreak}-day streak! +5 seva points${milestoneMsg}`);
    
    router.refresh();
  }

  function shareShloka() {
    shareContent(dailyText.shareLabel,
      `${dailyText.icon} ${dailyText.label} — ${dailyText.source}\n\n${dailyText.original}\n\n${dailyText.transliteration ? `${dailyText.transliteration}\n\n` : ''}${dailyText.meaningLabel}: ${dailyText.meaning}\n\n— Shared via Shoonaya`
    );
  }

  const japaDetails = getTraditionJapaDetails(tradition);
  const practices = [
    { id: 'japa', done: japaAlreadyDoneToday || dailyDharmaStackState.japaRounds >= 1, label: japaDetails.label, detail: japaDetails.detail, icon: '📿', href: '/japa' },
    { id: 'nitya', done: nityaDoneToday, label: meta.nityaKarmaTitle, detail: 'morning rhythm', icon: '🌅', href: '/nitya-karma' },
    { id: 'pathshala', done: pathshalaDoneToday, label: meta.pathshalaVocabulary, detail: sacredTextMeta.label, icon: sacredTextMeta.icon || '📖', href: '/pathshala' },
    { id: 'quiz', done: dailyDharmaStackState.quizDone, label: 'Daily Quiz', detail: 'test your dharmic memory', icon: '🧠', href: '/quiz' },
    { id: 'dharmveer', done: dailyDharmaStackState.dharmVeerDone, label: dharmVeer.name || 'Dharm Veer', detail: 'remember a life of courage', icon: '⚔️', href: dharmVeer.id ? `/dharm-veer/${dharmVeer.id}` : '/dharm-veer' }
  ];

  const completedPracticesCount = practices.filter(p => p.done).length;
  const nextPracticeObj = practices.find(p => !p.done);

  const dailySadhanaCta = getDailySadhanaCta({
    tradition,
    completedPracticesCount,
    nextPracticeObj,
    meta,
  });  function handleDailySadhanaCta() {
    router.push(dailySadhanaCta.href);
  }

  const nextPracticeOverrides = {
    japaDone: japaAlreadyDoneToday || dailySadhanaCta.id === 'japa',
    nityaDone: nityaDoneToday || dailySadhanaCta.id === 'nitya',
    pathshalaDone: pathshalaDoneToday || dailySadhanaCta.id === 'pathshala',
    quizDone: dailyDharmaStackState.quizDone || dailySadhanaCta.id === 'quiz',
    dharmVeerDone: dailyDharmaStackState.dharmVeerDone || dailySadhanaCta.id === 'dharmveer',
  };

  const heroPrimaryText = isDark ? 'var(--text-cream)' : '#211B14';
  const heroSecondaryText = isDark ? 'var(--text-muted-warm)' : '#4D4035';
  const { t } = useLanguage();
  const dailyTextLine = dailyText.original.split('\n')[0];

  const lastShlokaDate = localSpiritualDate(timezone, 4);

  return (
    <>
      <div className="relative">
        <motion.div
          className="divine-hero cursor-pointer"
          style={{ perspective: 1000, minHeight: '420px', margin: 0 }}
          whileHover={prefersReducedMotion ? {} : {
            scale: 1.005,
            transition: { duration: 0.4, ease: "easeOut" }
          }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.995 }}
        >
          {!heroImageFailed ? (
            <Image
              src={activeCoverUrl}
              alt={(!isFestivalTheme && customCover) ? "Your custom cover" : heroTheme.heroAlt}
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 640px, 672px"
              quality={80}
              className="object-cover object-center divine-hero-image"
              style={{ objectPosition: (!isFestivalTheme && customCover) ? 'center' : heroTheme.objectPosition }}
              onError={() => setHeroImageFailed(true)}
            />
          ) : (
            <div className="divine-hero-fallback" aria-hidden="true">
              <span>{heroFallback.mark}</span>
              <strong>{heroFallback.title}</strong>
              <small>{heroFallback.subtitle}</small>
            </div>
          )}
          <div className="divine-hero-overlay" aria-hidden="true" />
          <div className="divine-hero-readability" aria-hidden="true" />

          <div className="divine-poster-motif divine-poster-motif-om" aria-hidden="true">{heroFallback.mark}</div>

          {/* Hero image controls */}
          <div className="absolute bottom-6 right-6 z-40 flex gap-2">
            {customCover && (
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  setCustomCover(null);
                  localStorage.removeItem('user_cover_photo');
                  await supabase.from('profiles').update({ cover_url: null }).eq('id', userId);
                  toast.success('Restored default cover 🙏');
                }}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors shadow-lg"
                aria-label="Remove Custom Cover"
              >
                <X size={16} className="text-white/90" />
              </button>
            )}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setHeroPicker(true); }}
              className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer hover:bg-black/40 transition-colors shadow-lg"
              aria-label="Choose sacred backdrop"
            >
              <Images size={16} className="text-white/90" />
            </button>
            <label
              className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer hover:bg-black/40 transition-colors shadow-lg"
              aria-label="Upload custom cover"
              onClick={e => e.stopPropagation()}
            >
              <Pencil size={16} className="text-white/90" />
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </label>
          </div>
        </motion.div>

        {/* Transparent Header Overlay */}
        <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none pt-safe-top">
          <div className="px-5 flex items-center justify-between">
            <motion.div
              className="pointer-events-auto relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
            >
              <button
                onClick={onNotifBellClick}
                className="relative w-10 h-10 rounded-full flex items-center justify-center bg-black/10 dark:bg-black/22 border border-black/5 dark:border-white/18 backdrop-blur-md transition-transform active:scale-95"
                style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}
                aria-label="Notifications"
              >
                <Bell size={17} strokeWidth={1.8} className="text-[#F2EAD6] opacity-90" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold px-1"
                    style={{ background: '#C5A059', color: '#1c1a14', lineHeight: 1 }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </motion.div>

            <motion.div
              className="pointer-events-auto"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
            >
              <Link
                href="/discover/mood"
                className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md shadow-lg"
                style={{
                  background: isDark ? 'rgba(0,0,0,0.40)' : 'rgba(255,255,255,0.72)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
                }}
                aria-label="Open mood discovery"
              >
                {moodToday ? (
                  <>
                    <SacredGlowIcon color={moodToday.colour} size={24} variant="active" animated>
                      <MoodGlyph mood={moodToday.key} color={moodToday.colour} size={14} />
                    </SacredGlowIcon>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(30,20,5,0.80)' }}
                    >
                      {t('feelingPrefix')} {t((`mood${moodToday.key.charAt(0).toUpperCase()}${moodToday.key.slice(1)}`) as any)}
                    </span>
                  </>
                ) : (
                  <>
                    <SacredGlowIcon color="var(--brand-primary)" size={24} variant="soft">
                      <Sparkles size={12} style={{ color: 'var(--brand-primary)' }} />
                    </SacredGlowIcon>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: isDark ? 'rgba(245,220,160,0.80)' : 'rgba(100,60,10,0.70)' }}
                    >
                      {t('moodChip')}
                    </span>
                  </>
                )}
              </Link>
            </motion.div>

            <motion.div
              className="pointer-events-auto flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              {karmaPoints > 0 && (
                <Link
                  href="/my-progress"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full backdrop-blur-md transition-transform active:scale-95"
                  style={{
                    background:   'rgba(197,160,89,0.18)',
                    border:       '1px solid rgba(197,160,89,0.32)',
                    boxShadow:    '0 2px 10px rgba(0,0,0,0.15)',
                  }}
                  aria-label={`${karmaPoints} karma points`}
                >
                  <span style={{ fontSize: 11, lineHeight: 1 }}>⭐</span>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: '#F5E0A0', letterSpacing: '0.04em' }}
                  >
                    {karmaPoints >= 1000 ? `${Math.floor(karmaPoints / 1000)}k` : karmaPoints}
                  </span>
                </Link>
              )}

              <Link href="/profile" className="relative group">
                <div className="w-11 h-11 rounded-full border-2 border-white/25 p-0.5 transition-all duration-500 group-hover:border-white/45"
                  style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.35)' }}>
                  <div className="w-full h-full rounded-full overflow-hidden relative bg-white/10 backdrop-blur-sm">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt={userName} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-serif text-lg text-[#F2EAD6]">
                        {userName.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                {isPro && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#C5A059] rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
                    <Sparkles size={10} className="text-white" />
                  </div>
                )}
                {activeSymbolId && (
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border border-black/20 flex items-center justify-center backdrop-blur-md"
                    style={{ background: 'rgba(197,160,89,0.22)', fontSize: '10px' }}
                  >
                    {RELIC_BADGE_EMOJI[activeSymbolId] ?? '🔱'}
                  </div>
                )}
              </Link>
            </motion.div>
          </div>

          <div className="px-5 mt-3 pointer-events-auto">
            {city && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.20em] text-[var(--divine-text)] dark:text-white mb-1 opacity-60 dark:opacity-100"
                style={{ textShadow: isDark ? '0 1px 6px rgba(0,0,0,0.55)' : 'none' }}
              >
                <MapPin size={10} strokeWidth={2.5} />
                {city}
              </motion.p>
            )}
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-serif text-[var(--divine-text)] dark:text-white leading-tight cursor-pointer"
              style={{ textShadow: isDark ? '0 2px 12px rgba(0,0,0,0.55)' : 'none' }}
              onClick={onGreetingClick}
            >
              {stripGreetingIcon(greeting)},&nbsp;<span style={{ color: 'rgba(255,240,200,0.92)' }}>{userName.split(' ')[0] || 'Seeker'}</span>
            </motion.h1>

            {panchang?.tithi && (
              <PanchangPill panchang={panchang} selectedDate={selectedDate} />
            )}

            <AnimatePresence>
              {upcomingSacredObservance && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: 0.26, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-1"
                >
                  <Link
                    href={
                      upcomingSacredObservance.festival.route_kind === 'vrat'
                        ? `/vrat/${upcomingSacredObservance.festival.route_slug ?? resolveVratSlug(upcomingSacredObservance.festival.name)}`
                        : `/festivals/${upcomingSacredObservance.festival.route_slug ?? ''}`
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full active:scale-95 transition-transform"
                    style={{ background: 'rgba(234,112,48,0.22)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,180,100,0.18)' }}
                  >
                    <span className="text-[11px]">{upcomingSacredObservance.festival.emoji || '🌙'}</span>
                    <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,200,140,0.95)' }}>
                      {upcomingSacredObservance.daysLeft === 0
                        ? `Today is ${upcomingSacredObservance.festival.name}`
                        : upcomingSacredObservance.daysLeft === 1
                          ? `Tomorrow is ${upcomingSacredObservance.festival.name}`
                          : `${upcomingSacredObservance.festival.name} in ${upcomingSacredObservance.daysLeft} days`}
                    </span>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showRashiphalNudge && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: 0.30, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-1"
                >
                  <Link
                    href="/panchang?tab=rashiphal"
                    onClick={onDismissRashiphalNudge}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full active:scale-95 transition-transform"
                    style={{ background: 'rgba(139,92,246,0.20)', backdropFilter: 'blur(8px)' }}
                  >
                    <span className="text-[10px]">🔮</span>
                    <span className="text-[10px] font-semibold" style={{ color: '#c4b5fd' }}>
                      See your Rashiphal
                    </span>
                    <span className="text-[9px]" style={{ color: 'rgba(196,181,253,0.55)' }}>→</span>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Transitional Shloka ── */}
      <div className="px-4 relative z-20 mb-0 mt-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCorrectionModalOpen(true);
          }}
          className="absolute top-2 right-6 p-1 z-30 text-[var(--brand-muted)] opacity-60 hover:opacity-100 transition-opacity"
          style={{ fontSize: '16px' }}
          title="Report translation issue"
        >
          🚩
        </button>
        <motion.button
          type="button"
          onClick={() => setShlokaModalOpen(true)}
          className="w-full text-center pt-3 pb-0 cursor-pointer bg-transparent border-0 outline-none"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059] opacity-80 mb-2 block">
            {dailyText.label}
          </span>
          <p className="font-serif text-lg md:text-xl text-[var(--divine-text)] leading-relaxed italic px-4">
            “{dailyTextLine}”
          </p>
          <p className="text-xs text-[var(--divine-text)] opacity-60 mt-2 px-8 line-clamp-1">
            {dailyText.meaning}
          </p>
        </motion.button>
      </div>

      {/* ── Smart daily Sadhana CTA — progresses through today's next practice ── */}
      <motion.div
        className="px-4 mt-4 mb-3 relative z-20"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="flex items-center justify-between gap-3.5 rounded-[26px] px-[18px] py-4"
          style={{
            background: 'linear-gradient(135deg, rgba(255,248,234,0.96), rgba(250,236,211,0.88))',
            border: '1px solid rgba(205, 166, 92, 0.28)',
            boxShadow: '0 12px 28px rgba(105, 75, 35, 0.10), inset 0 1px 0 rgba(255,255,255,0.75)',
          }}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[18px]"
              style={{
                background: 'rgba(217, 178, 105, 0.18)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
              }}
            >
              <span className="text-[26px] leading-none" aria-hidden="true">{dailySadhanaCta.icon}</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-[18px] font-bold leading-tight" style={{ color: '#3f2b1f', letterSpacing: '-0.2px' }}>
                {dailySadhanaCta.title}
              </h3>
              <p className="text-[13.5px] mt-1 truncate" style={{ color: 'rgba(63, 43, 31, 0.66)' }}>
                {dailySadhanaCta.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDailySadhanaCta}
            aria-label={dailySadhanaCta.ariaLabel}
            className="flex items-center gap-1 shrink-0 rounded-full pl-4 pr-3 py-[11px] text-[15px] font-bold transition-transform active:scale-[0.98]"
            style={{
              color: '#fff8e8',
              background: 'linear-gradient(135deg, #c89b43, #a97725)',
              boxShadow: '0 8px 18px rgba(160, 112, 39, 0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
              whiteSpace: 'nowrap',
            }}
          >
            <Sparkles size={15} strokeWidth={2.5} aria-hidden="true" />
            {dailySadhanaCta.buttonLabel}
            <ChevronRight size={15} strokeWidth={2.5} aria-hidden="true" style={{ opacity: 0.65, marginLeft: '-2px' }} />
          </button>
        </div>
      </motion.div>

      {/* ── Dharma Mitra mantra nudge — small pop-card, dismiss-to-kill ── */}
      <AnimatePresence>
        {showDharmaMitraNudge && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94, y: -4 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mx-4 mt-2 mb-1"
          >
            <div
              className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5"
              style={{
                background: 'rgba(197,160,89,0.10)',
                border: '1px solid rgba(197,160,89,0.22)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span className="text-base leading-none flex-shrink-0">🪔</span>
              <Link
                href="/ai-chat?prompt=Tell+me+about+today%27s+mantra+and+how+to+chant+it"
                onClick={onDismissDharmaMitraNudge}
                className="flex-1 min-w-0"
              >
                <p className="text-[11px] font-semibold leading-snug" style={{ color: 'var(--brand-primary-strong)' }}>
                  Ask Dharma Mitra
                </p>
                <p className="text-[10px] leading-snug mt-0.5" style={{ color: 'rgba(197,160,89,0.65)' }}>
                  About today&apos;s mantra &amp; how to chant it
                </p>
              </Link>
              <button
                onClick={(e) => { e.stopPropagation(); onDismissDharmaMitraNudge(); }}
                aria-label="Dismiss"
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full transition-opacity opacity-50 hover:opacity-100"
                style={{ color: 'var(--brand-primary)' }}
              >
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="currentColor">
                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Next Practice — hidden once the day is complete; the smart Sadhana
           card above owns the all-complete state, so there is no duplicate
           completion UI ("Daily practice complete" / "View all practices"). ── */}
      {dailySadhanaCta.id !== 'complete' && (
        <NextPracticeCard
          japaDone={nextPracticeOverrides.japaDone}
          nityaDone={nextPracticeOverrides.nityaDone}
          pathshalaDone={nextPracticeOverrides.pathshalaDone}
          japaBeads={dailyDharmaStackState.japaBeads}
          japaRounds={dailyDharmaStackState.japaRounds}
          quizDone={nextPracticeOverrides.quizDone}
          dharmVeerDone={nextPracticeOverrides.dharmVeerDone}
          dharmVeerId={dharmVeer.id}
          pathshalaProgress={dailyDharmaStackState.pathshalaProgress}
        />
      )}

      {/* ── Brahma Muhurta card ── */}
      {panchang?.brahmaMuhurta && panchang?.sunrise && (
        <BrahmaMuhurtaCard
          brahmaMuhurta={panchang.brahmaMuhurta}
          sunrise={panchang.sunrise}
          japaAlreadyDoneToday={japaAlreadyDoneToday}
          tradition={tradition}
        />
      )}

      {/* ── Hero Picker Bottom Sheet ── */}
      <AnimatePresence>
        {heroPicker && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end bg-black/60"
            onClick={() => setHeroPicker(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full rounded-t-[2rem] p-6 space-y-4 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
              style={{
                background: 'linear-gradient(180deg, var(--surface-raised), var(--card-bg))',
                borderTop: '1px solid rgba(197, 160, 89, 0.20)',
                boxShadow: '0 -20px 48px rgba(0, 0, 0, 0.24)',
              }}
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-serif font-bold text-white">Choose Sanctuary Backdrop</h3>
                <button
                  onClick={() => setHeroPicker(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleHeroSelect(null)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl border bg-white/5 border-white/10"
                >
                  <div className="w-full h-24 rounded-xl bg-gradient-to-br from-amber-600 to-amber-950 flex items-center justify-center font-bold text-xs text-white">
                    Auto-Rotate 🔄
                  </div>
                  <span className="text-xs font-semibold text-white">Default Auto</span>
                </button>

                {pickerThemes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleHeroSelect(theme.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-colors ${
                      selectedHeroId === theme.id ? 'border-[var(--brand-primary)] bg-[rgba(197,160,89,0.1)]' : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="w-full h-24 rounded-xl overflow-hidden relative">
                      <Image
                        src={theme.heroImage}
                        alt={theme.heroAlt}
                        fill
                        sizes="100px"
                        className="object-cover"
                      />
                    </div>
                    <span className="text-xs font-semibold text-white truncate max-w-full">
                      {theme.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Shloka fullscreen modal ── */}
      <AnimatePresence>
        {shlokaModalOpen && (
          <motion.div
            className="fixed inset-0 z-[200] grid grid-rows-[auto,1fr,auto]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              background: isDark
                ? 'radial-gradient(circle at 50% 18%, rgba(250,199,117,0.13), transparent 34%), radial-gradient(circle at 18% 78%, rgba(250,238,218,0.08), transparent 28%), linear-gradient(160deg,#171714 0%,#0d0d0b 100%)'
                : 'radial-gradient(circle at 50% 18%, rgba(239,159,39,0.16), transparent 34%), radial-gradient(circle at 18% 78%, rgba(133,79,11,0.08), transparent 28%), linear-gradient(160deg,#fdfbf7 0%,#f7ead6 100%)',
            }}
          >
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={prefersReducedMotion ? undefined : { opacity: [0.52, 0.9, 0.52], scale: [1, 1.03, 1] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background: `radial-gradient(ellipse at 50% 30%, ${sacredTextTheme.iconWell}, transparent 62%)`,
              }}
            />
            {!prefersReducedMotion && (
              <>
                <motion.div
                  className="absolute left-[14%] top-[18%] h-1.5 w-1.5 rounded-full"
                  animate={{ opacity: [0.25, 1, 0.25], y: [0, -10, 0] }}
                  transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ background: 'rgba(250,238,218,0.72)' }}
                />
                <motion.div
                  className="absolute right-[18%] top-[34%] h-1 w-1 rounded-full"
                  animate={{ opacity: [0.15, 0.9, 0.15], y: [0, -14, 0] }}
                  transition={{ duration: 5.6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                  style={{ background: 'rgba(250,199,117,0.72)' }}
                />
                <motion.div
                  className="absolute left-[24%] bottom-[24%] h-1 w-1 rounded-full"
                  animate={{ opacity: [0.18, 0.85, 0.18], y: [0, -12, 0] }}
                  transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
                  style={{ background: 'rgba(250,238,218,0.66)' }}
                />
              </>
            )}

            {/* Header bar */}
            <div className="relative flex items-center justify-between px-5 pt-safe-top pb-2"
              style={{
                background: isDark ? 'rgba(20,20,18,0.38)' : 'rgba(255,253,248,0.52)',
                backdropFilter: 'blur(14px) saturate(120%)',
                WebkitBackdropFilter: 'blur(14px) saturate(120%)',
              }}>
              <div className="flex items-center gap-2">
                <SacredGlowIcon
                  color="var(--brand-primary)"
                  size={34}
                  variant="active"
                  animated
                  className="rounded-xl"
                  style={{ background: sacredTextTheme.iconWell }}
                >
                  <span className="text-base">{dailyText.icon}</span>
                </SacredGlowIcon>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 500, color: 'var(--text-cream)' }}>
                  {dailyText.label}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {dailyTextBase.transliteration && (
                  <MantraPlayer
                    text={dailyTextBase.transliteration}
                    label={`Listen to ${dailyText.label} pronunciation`}
                    size={15}
                    accentColor="rgba(197,160,89,0.90)"
                  />
                )}
                <button onClick={shareShloka}
                  className="w-11 h-11 rounded-full flex items-center justify-center bg-transparent border-0 outline-none"
                  style={{ background: sacredTextTheme.iconWell }} aria-label="Share">
                  <SacredGlowIcon color="var(--brand-primary)" size={28} variant="active" animated>
                    <Share2 size={15} style={{ color: 'var(--text-cream)' }} />
                  </SacredGlowIcon>
                </button>
                <button onClick={() => setShlokaModalOpen(false)}
                  className="w-[44px] h-[44px] rounded-full flex items-center justify-center bg-transparent border-0 outline-none"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <X size={16} style={{ color: 'var(--text-muted-warm)' }} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="relative min-h-0 overflow-y-auto px-5 py-2 flex w-full max-w-2xl mx-auto flex-col justify-start gap-2">
              <div className="flex items-center justify-between">
                <span className="self-start text-[10px] font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(197, 160, 89,0.14)', color: 'var(--brand-primary)' }}>
                  {dailyText.source}
                </span>
                <button
                  type="button"
                  onClick={() => setCorrectionModalOpen(true)}
                  className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  title="Report translation issue"
                >
                  <span className="text-xs">🚩</span>
                </button>
              </div>

              <motion.div
                className="rounded-[1.4rem] px-4 py-3"
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 18, scale: 0.98 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: isDark ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.58)',
                  border: `1px solid ${isDark ? 'rgba(250,238,218,0.12)' : 'rgba(65,36,2,0.10)'}`,
                  backdropFilter: 'blur(18px) saturate(125%)',
                  WebkitBackdropFilter: 'blur(18px) saturate(125%)',
                }}
              >
                <p style={{
                  fontFamily: 'Georgia, "Noto Serif Devanagari", serif',
                  fontSize: 'clamp(0.95rem, 3.5vw, 1.25rem)',
                  lineHeight: 1.55,
                  color: heroPrimaryText,
                  whiteSpace: 'pre-line',
                }}>
                  {dailyText.original}
                </p>
              </motion.div>

              {dailyTextBase.transliteration && dailyTextBase.transliteration !== dailyTextBase.original && (
                <div className="flex items-start gap-2">
                  <p className="italic leading-snug flex-1" style={{ color: heroSecondaryText, fontSize: '0.78rem', whiteSpace: 'pre-line' }}>
                    {dailyTextBase.transliteration}
                  </p>
                </div>
              )}

              <div className="rounded-[1.2rem] px-3 py-2.5" style={{
                background: isDark ? sacredTextTheme.iconWell : 'rgba(255,255,255,0.58)',
                border: `1px solid ${isDark ? 'rgba(250,238,218,0.10)' : 'rgba(65,36,2,0.09)'}`,
                backdropFilter: 'blur(14px) saturate(120%)',
                WebkitBackdropFilter: 'blur(14px) saturate(120%)',
              }}>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] mb-1" style={{ color: 'rgba(197, 160, 89,0.65)' }}>
                  {dailyText.meaningLabel}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: heroSecondaryText }}>
                  {dailyText.meaning}
                </p>
              </div>

              <motion.button
                onClick={markShlokaRead}
                disabled={readToday}
                className="w-full rounded-full py-3 text-sm font-semibold flex items-center justify-center gap-2 border-0 outline-none"
                style={readToday
                  ? { background: 'rgba(197, 160, 89,0.12)', color: 'var(--brand-primary)', border: '1px solid rgba(197, 160, 89,0.22)' }
                  : { background: 'rgba(250,199,117,0.90)', color: '#1c1208', boxShadow: '0 14px 30px rgba(239,159,39,0.20)' }}
                whileTap={readToday ? undefined : { scale: 0.97 }}
              >
                {readToday ? `✓ Marked read today` : `${dailyText.icon} Mark as read — earn 5 seva points`}
              </motion.button>

              {streak > 0 && (
                <p className="text-center text-xs font-semibold" style={{ color: 'var(--brand-primary)' }}>
                  🔥 {streak}-day {dailyText.streakLabel}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ScriptureCorrectionModal
        isOpen={correctionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        scriptureSource={dailyText.source}
        verseText={dailyText.original}
      />
    </>
  );
}
