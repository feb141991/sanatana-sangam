'use client';

import { useEffect, useMemo, useRef, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Bell, CalendarDays, X, ChevronRight, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { buildShoonayaShareCardData, shareShoonayaShareCard } from '@/lib/share/shoonaya-card-data';
import { format as fmtDate } from 'date-fns';
import { type Shloka, getShlokaByLanguage } from '@/lib/shlokas';
import type { Festival, FestivalCalendarMeta } from '@/lib/festivals';
import type { DailySacredText } from '@/lib/sacred-texts';
import { calculatePanchang, getTodaySpiritualPulses } from '@/lib/panchang';
import { getFestivalStory } from '@/lib/festival-stories';
import { TRADITION_META, selectDharmVeer, type DharmVeer } from '@/lib/dharm-veer';
import { getPitruPakshaDay, getPitruPakshaBannerCopy } from '@/lib/pitru-paksha';
import { getMoodSpiritualDate } from '@/lib/mood/registry';
import { resolveVratSlug } from '@/lib/vrat-data';
import { getGreeting, isGreetingCompatibleWithTradition } from '@/lib/traditions';
import { getUnlockedRelics } from '@/lib/relics';
import type { GuidedPathProgressRow } from '@/lib/guided-paths';
import { useLocation } from '@/lib/LocationContext';
import { createClient } from '@/lib/supabase';
import { usePremium } from '@/hooks/usePremium';
import { localSpiritualDate } from '@/lib/sacred-time';
import { APP } from '@/lib/config';
import { getTraditionMeta } from '@/lib/tradition-config';
import PerfectDayCeremony from '@/components/home/PerfectDayCeremony';
import SankalpaBanner from '@/components/home/SankalpaBanner';
import SetSankalpSheet from '@/components/home/SetSankalpSheet';
import { getTransliteration } from '@/lib/transliteration';
import { resolveEffectiveMeaningLanguage } from '@/lib/language-runtime';
import { useLocalizedMeaning } from '@/hooks/useLocalizedMeaning';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import {
  useNotificationsQuery,
  useNotificationsRealtime,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '@/hooks/useNotifications';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getRelicAccent } from '@/lib/relic-accents';
import { useZenithSensory } from '@/contexts/ZenithSensoryContext';
import { withOneSignal } from '@/lib/onesignal';
import MoodPulse from '@/components/mood/MoodPulse';
import { MOODS_CONFIG } from '@/lib/mood/registry';
import { DAILY_FALLBACK_QUIZ } from '@/lib/quiz-fallback';
import { useUpcomingObservances } from '@/hooks/useUpcomingObservances';
import dynamic from 'next/dynamic';

// ── Refactored Section Components ──
import FirstWeekGuide from '@/components/home/FirstWeekGuide';
import VratCarousel from '@/components/home/VratCarousel';
import { HeroSection } from './sections/HeroSection';
import { CalendarSection } from './sections/CalendarSection';

// Heavy modals — defer JS until user interaction, not needed on first paint
const BelowFoldSections = dynamic(() => import('./BelowFoldSections'), { ssr: false });
const MoodJourneySheet = dynamic(() => import('@/components/mood/MoodJourneySheet'), { ssr: false });
const ConfettiOverlay = dynamic(() => import('@/components/ui/ConfettiOverlay'), { ssr: false });

// ── Refactored Modals & Sheets ──
import { DatePickerModal } from './sections/DatePickerModal';
import { GreetingEditSheet } from './sections/GreetingEditSheet';
import { CalendarModal } from './sections/CalendarModal';
import { InviteModal } from './sections/InviteModal';

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

type DailySparkQuiz = {
  type: 'fact' | 'quiz';
  question: string;
  options?: string[];
  answerIndex?: number;
  explanation?: string;
  fact: string;
  source: string;
  daily_quiz_id?: string;
  fallbackLanguage?: string;
  degraded?: boolean;
};

function getFallbackDailySpark(tradition: string, language: string, dateStr: string): DailySparkQuiz {
  const languagePool = DAILY_FALLBACK_QUIZ[language] ?? DAILY_FALLBACK_QUIZ.en;
  const traditionPool = languagePool[tradition] ?? languagePool.all ?? DAILY_FALLBACK_QUIZ.en.all;
  const dayMs = new Date(`${dateStr}T00:00:00Z`).getTime();
  const dayIndex = Number.isFinite(dayMs) ? Math.floor(dayMs / 86_400_000) : 0;
  const fallback = traditionPool[Math.abs(dayIndex) % traditionPool.length] ?? DAILY_FALLBACK_QUIZ.en.all[0];

  return {
    ...fallback,
    type: 'quiz',
    fallbackLanguage: DAILY_FALLBACK_QUIZ[language] ? undefined : 'en',
    degraded: true,
  };
}

interface SacredTextMeta {
  label:        string;
  icon:         string;
  shareLabel:   string;
  accentColour: string;
  accentLight:  string;
}

interface Props {
  userId:            string;
  userName:          string;
  avatarUrl:         string | null;
  city:              string;
  savedLat:          number | null;
  savedLon:          number | null;
  shloka:            Shloka;
  sacredText:        DailySacredText | null;
  sacredTextMeta:    SacredTextMeta;
  festivals:         Festival[];
  festivalCalendar:  Festival[];
  festivalCalendarMeta: FestivalCalendarMeta;
  heroThemes:        any[];
  daysUntilFestival: number | null;
  initialPanchang:   Panchang;
  shlokaStreak:      number;
  lastShlokaDate:    string | null;
  tradition:         string | null;
  sampradaya:        string | null;
  ishtaDevata:       string | null;
  appLanguage?:      string;
  timezone:          string;
  meaningLanguage?:  string;
  transliterationLanguage?: string;
  showTransliteration?: boolean;
  spiritualLevel:    string | null;
  seeking:           string[];
  lifeStage:         string | null;
  customGreeting:    string | null;
  coverUrl?:         string | null;
  guidedPathProgress: GuidedPathProgressRow[];
  showFirstTimeGuidance: boolean;
  japaStreak?:          number;
  japaAlreadyDoneToday?: boolean;
  nityaDoneToday:      boolean;
  practiceHistory:     { date: string; japa: boolean; nitya: boolean }[];
  liveStreams:         any[];
  isAdmin?:            boolean;
  sevaScore?:          number;
  pathshalaDoneToday?: boolean;
  pathshalaLabel?:     string;
  pathshalaHref?:      string;
  quizDoneToday?:      boolean;
  dharmVeerDoneToday?: boolean;
  dharmVeer:           DharmVeer;
  activeSymbolId?:     string | null;
  activeSankalpa?:     { id: string; text: string; start_date: string; end_date: string; tradition: string; related_practice?: string | null } | null;
  karmaPoints?:        number;
  rhythmMode?:         string | null;
  displayStreak?:      number;
}

type DailyDharmaStackState = {
  japaBeads: number;
  japaRounds: number;
  quizDone: boolean;
  dharmVeerDone: boolean;
  stotramDone: boolean;
  kathaDone: boolean;
  pathshalaProgress: number;
};

const EMPTY_DAILY_DHARMA_STACK_STATE: DailyDharmaStackState = {
  japaBeads: 0,
  japaRounds: 0,
  quizDone: false,
  dharmVeerDone: false,
  stotramDone: false,
  kathaDone: false,
  pathshalaProgress: 0,
};

const EVENING_NUDGE_KEY = 'shoonaya-dinacharya-evening-nudge-v1';
const HOME_OBSERVANCE_WINDOW_DAYS = 3;

function clampDailyProgress(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function deriveHomePathshalaProgress(raw: unknown): number {
  if (!raw || typeof raw !== 'object') return 0;
  if (Array.isArray(raw)) {
    return raw.reduce((max, item) => Math.max(max, deriveHomePathshalaProgress(item)), 0);
  }

  const record = raw as Record<string, unknown>;
  const keys = ['progress', 'percentage', 'percent', 'completion', 'completionRate'];
  let max = 0;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number') {
      max = Math.max(max, clampDailyProgress(value <= 1 ? value * 100 : value));
    }
  }

  for (const value of Object.values(record)) {
    max = Math.max(max, deriveHomePathshalaProgress(value));
  }

  return max;
}

function getVratHref(festival: Festival): string | null {
  if (festival.route_kind === 'vrat') {
    return festival.route_slug || resolveVratSlug(festival.name);
  }
  if (festival.route_kind === null || festival.route_kind === undefined) {
    return resolveVratSlug(festival.name);
  }
  return null;
}

function formatFestDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
}

function daysFromNow(dateStr: string) {
  const fest  = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const d     = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((fest.getTime() - d.getTime()) / 86400000);
}

export default function HomeDashboard({
  userId,
  userName,
  avatarUrl,
  city: savedCity,
  savedLat,
  savedLon,
  shloka,
  sacredText,
  sacredTextMeta,
  festivals,
  festivalCalendar,
  festivalCalendarMeta,
  heroThemes,
  daysUntilFestival,
  initialPanchang,
  shlokaStreak:   initialStreak,
  lastShlokaDate,
  tradition,
  sampradaya,
  ishtaDevata,
  appLanguage,
  timezone,
  meaningLanguage,
  customGreeting,
  coverUrl,
  showFirstTimeGuidance,
  japaStreak = 0,
  japaAlreadyDoneToday = false,
  nityaDoneToday,
  liveStreams,
  transliterationLanguage,
  showTransliteration = true,
  isAdmin = false,
  sevaScore = 0,
  pathshalaDoneToday = false,
  pathshalaLabel = 'Pathshala',
  pathshalaHref = '/pathshala',
  quizDoneToday = false,
  dharmVeerDoneToday = false,
  dharmVeer,
  activeSymbolId = null,
  activeSankalpa: initialActiveSankalpa = null,
  karmaPoints = 0,
  rhythmMode = 'morning',
  displayStreak = 0,
}: Props) {
  const supabase = useRef(createClient()).current;
  const queryClient = useQueryClient();
  const router      = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const isPro = usePremium();
  const { playHaptic } = useZenithSensory();

  // ── Notification panel ──
  const [notifOpen, setNotifOpen] = useState(false);
  const [liveDharmVeer, setLiveDharmVeer] = useState<DharmVeer>(dharmVeer);
  const [notifPortalTarget, setNotifPortalTarget] = useState<Element | null>(null);
  const notifQuery      = useNotificationsQuery(userId);
  const notifs          = notifQuery.data ?? [];
  useNotificationsRealtime(userId);
  const markOneRead     = useMarkNotificationReadMutation(userId);
  const markAllRead     = useMarkAllNotificationsReadMutation(userId);
  const unreadCount     = notifs.filter((n) => !n.read).length;

  useEffect(() => { setNotifPortalTarget(document.body); }, []);

  const [panchang,          setPanchang]          = useState<Panchang>(initialPanchang);
  const [calendarOpen,      setCalendarOpen]      = useState(false);
  const [datePickerOpen,    setDatePickerOpen]    = useState(false);
  const [greetingSheetOpen, setGreetingSheetOpen] = useState(false);
  const [inviteOpen,        setInviteOpen]        = useState(false);
  const [localGreeting,     setLocalGreeting]     = useState<string | null>(() => (
    isGreetingCompatibleWithTradition(customGreeting, tradition, sampradaya) ? customGreeting : null
  ));
  const [streak,           setStreak]           = useState(initialStreak);
  const [eveningNudgeDismissed, setEveningNudgeDismissed] = useState(false);
  const [dailyDharmaStackState, setDailyDharmaStackState] = useState<DailyDharmaStackState>(EMPTY_DAILY_DHARMA_STACK_STATE);
  const [selectedDate,     setSelectedDate]     = useState<Date>(new Date());
  const [readToday,        setReadToday]        = useState(() => {
    const tz    = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
    const today = localSpiritualDate(tz, 4);
    return lastShlokaDate === today;
  });

  useEffect(() => {
    try {
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const todayStr = localSpiritualDate(browserTz, 4);
      let nextState: DailyDharmaStackState = {
        ...EMPTY_DAILY_DHARMA_STACK_STATE,
        quizDone: quizDoneToday,
        dharmVeerDone: dharmVeerDoneToday,
      };

      const japaRaw = localStorage.getItem('shoonaya-japa-session-today');
      if (japaRaw) {
        const parsed = JSON.parse(japaRaw) as { beads?: number; rounds?: number; date?: string };
        if (parsed.date === todayStr) {
          nextState.japaBeads = parsed.beads ?? 0;
          nextState.japaRounds = parsed.rounds ?? 0;
        }
      }

      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('shoonaya-quiz-daily-answered-') && key.endsWith(todayStr)) {
          const value = localStorage.getItem(key);
          if (value === 'true' || value === '0' || value === '1' || value === '2' || value === '3') {
            nextState.quizDone = true;
            break;
          }
        }
      }

      // OR with server value — server is source of truth across devices
      nextState.dharmVeerDone = dharmVeerDoneToday || localStorage.getItem(`shoonaya-dharmveer-done-${todayStr}`) === 'true';
      nextState.stotramDone = localStorage.getItem(`shoonaya-stotram-done-${todayStr}`) === 'true';
      nextState.kathaDone = localStorage.getItem(`shoonaya-katha-done-${todayStr}`) === 'true';

      const pathshalaRaw = localStorage.getItem('shoonaya-pathshala-progress');
      if (pathshalaRaw) {
        nextState.pathshalaProgress = deriveHomePathshalaProgress(JSON.parse(pathshalaRaw));
      }

      setDailyDharmaStackState(nextState);
    } catch {
      setDailyDharmaStackState({
        ...EMPTY_DAILY_DHARMA_STACK_STATE,
        quizDone: quizDoneToday,
        dharmVeerDone: dharmVeerDoneToday,
      });
    }

    try {
      // ── Client-side per-user Dharm Veer rotation memory ──
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const todayStr = localSpiritualDate(browserTz, 4);
      const historyKey = 'shoonaya-dharmveer-history';
      const historyRaw = localStorage.getItem(historyKey);

      let historyIds: string[] = [];
      if (historyRaw) {
        try { historyIds = JSON.parse(historyRaw); } catch {}
      }

      // We only consider the history up to YESTERDAY for today's selection,
      // or if it's already generated for today, we keep the one for today.
      const lastSelectedKey = 'shoonaya-dharmveer-last-selected-date';
      const lastSelectedIdKey = 'shoonaya-dharmveer-last-selected-id';

      const lastSelectedDate = localStorage.getItem(lastSelectedKey);
      const lastSelectedId = localStorage.getItem(lastSelectedIdKey);

      let selected: DharmVeer;

      if (lastSelectedDate === todayStr && lastSelectedId) {
        // We already picked one for today on this device
        // We should just re-select it by using the history.
        // Actually, we can just use selectDharmVeer and if history is unmodified, it'll pick it.
        // Wait, if it's already in history, we should temporarily remove it from history to run selection?
        // Let's just run selectDharmVeer on history EXCLUDING today's id if we want it to be deterministic,
        // or just let it pick. But since selectDharmVeer filters out recent history, if we already added today's to history, it might pick something else if we re-run!

        // So we should NOT pass today's id as part of the blocking history.
        const effectiveHistory = lastSelectedDate === todayStr
          ? historyIds.filter(id => id !== lastSelectedId)
          : historyIds;

        selected = selectDharmVeer({
          userTradition: tradition,
          historyIds: effectiveHistory,
        });
      } else {
        selected = selectDharmVeer({
          userTradition: tradition,
          historyIds,
        });

        // It's a new day, save today's selection
        const newHistory = [...historyIds, selected.id].slice(-14);
        localStorage.setItem(historyKey, JSON.stringify(newHistory));
        localStorage.setItem(lastSelectedKey, todayStr);
        localStorage.setItem(lastSelectedIdKey, selected.id);
      }

      setLiveDharmVeer(selected);
    } catch {
      // Keep SSR fallback on error
    }
  }, [dharmVeerDoneToday, quizDoneToday, tradition]);

  const [activeStoryFestival, setActiveStoryFestival] = useState<Festival | null>(null);
  const [isQuizModalOpen,  setQuizModalOpen]    = useState(false);
  const [journeyMoodKey, setJourneyMoodKey] = useState<string | null>(null);

  // ── Daily Quiz state ──
  const [quizDailyId, setQuizDailyId] = useState<string | null>(null);
  const [activeSankalpa, setActiveSankalpa] = useState<Props['activeSankalpa']>(initialActiveSankalpa);
  const [sankalpaCheckedToday, setSankalpaCheckedToday] = useState(false);

  const handleSankalpaCheckin = async () => {
    if (!activeSankalpa || sankalpaCheckedToday) return;
    setSankalpaCheckedToday(true);
    try {
      const res = await fetch('/api/sankalpa/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sankalpa_id: activeSankalpa.id }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setSankalpaCheckedToday(false);
    }
  };

  const [showSankalpSheet, setShowSankalpSheet] = useState(false);
  const [showRashiphalNudge, setShowRashiphalNudge] = useState(false);
  const [showDharmaMitraNudge, setShowDharmaMitraNudge] = useState(false);
  const [quizStreak, setQuizStreak] = useState<number>(0);
  const [quizMilestone, setQuizMilestone] = useState<string | null>(null);

  const [quiz, setQuiz]               = useState<DailySparkQuiz | null | 'loading' | 'error'>(null);
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);

  const [customCover, setCustomCover] = useState<string | null>(coverUrl || null);

  useEffect(() => {
    if (coverUrl) setCustomCover(coverUrl);
    else {
      const saved = localStorage.getItem('user_cover_photo');
      if (saved) setCustomCover(saved);
    }
  }, [coverUrl]);

  const [showProfileNudge, setShowProfileNudge] = useState(false);

  useEffect(() => {
    if (avatarUrl && savedCity) return;
    try {
      const visits = parseInt(localStorage.getItem('shoonaya-home-visits') ?? '0');
      if (visits < 3) {
        setShowProfileNudge(true);
        localStorage.setItem('shoonaya-home-visits', String(visits + 1));
      }
    } catch {}
  }, [avatarUrl, savedCity]);

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    try {
      const shown = localStorage.getItem('shoonaya-welcome-shown-zeroists');
      if (!shown && showFirstTimeGuidance) {
        setShowWelcomeModal(true);
        localStorage.setItem('shoonaya-welcome-shown-zeroists', 'true');
      }
    } catch {}
  }, [showFirstTimeGuidance]);

  // Daily Quiz — load from localStorage cache or fetch fresh
  const _quizTrad           = tradition ?? 'hindu';
  const todayStr            = localSpiritualDate(timezone, 4);
  const effectiveLang       = appLanguage ?? 'en';
  const QUIZ_CACHE_KEY      = `shoonaya-quiz-daily-${_quizTrad}-${effectiveLang}-${todayStr}`;
  const QUIZ_ANSWERED_KEY   = `shoonaya-quiz-daily-answered-${_quizTrad}-${effectiveLang}-${todayStr}`;

  const fetchSankalpa = useCallback(async () => {
    try {
      const res = await fetch('/api/sankalpa');
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.sankalpa) {
        const targetDays = data.sankalpa.target_days ?? 30;
        const startMs = new Date(data.sankalpa.start_date + 'T00:00:00Z').getTime();
        const endDate = new Date(startMs + targetDays * 86_400_000).toISOString().slice(0, 10);
        const sankalpaObj = {
          id: data.sankalpa.id,
          text: data.sankalpa.text,
          start_date: data.sankalpa.start_date,
          end_date: endDate,
          tradition: data.sankalpa.tradition ?? tradition ?? 'hindu',
          related_practice: data.sankalpa.related_practice ?? null,
        };
        setActiveSankalpa(sankalpaObj);

        const { data: existingCheckin } = await supabase
          .from('sankalpa_checkins')
          .select('id')
          .eq('user_id', userId)
          .eq('sankalpa_id', sankalpaObj.id)
          .eq('checked_date', todayStr)
          .maybeSingle();
        setSankalpaCheckedToday(!!existingCheckin);
      } else {
        setActiveSankalpa(null);
        setSankalpaCheckedToday(false);
      }
    } catch {
      setActiveSankalpa(null);
      setSankalpaCheckedToday(false);
    }
  }, [tradition, userId, todayStr, supabase]);

  useEffect(() => {
    fetchSankalpa();
  }, [fetchSankalpa]);

  useEffect(() => {
    try {
      const key = 'shoonaya-rashiphal-nudge-v1';
      const val = localStorage.getItem(key);
      if (!val) {
        const timer = setTimeout(() => setShowRashiphalNudge(true), 3000);
        return () => clearTimeout(timer);
      }
    } catch { /* ignore */ }
  }, []);

  // Dharma Mitra mantra nudge — show once, permanent dismiss via localStorage
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('shoonaya-dharma-mitra-mantra-nudge-v1');
      if (!dismissed) {
        // Delay slightly so it doesn't fight with page load animations
        const timer = setTimeout(() => setShowDharmaMitraNudge(true), 1800);
        return () => clearTimeout(timer);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      const cachedRaw  = localStorage.getItem(QUIZ_CACHE_KEY);
      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw);
        setQuiz(parsed);
        setQuizDailyId(parsed.daily_quiz_id ?? null);
        const answered = localStorage.getItem(QUIZ_ANSWERED_KEY);
        if (answered !== null) setQuizAnswered(Number(answered));

        fetch('/api/quiz/stats')
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data?.streak) setQuizStreak(data.streak); })
          .catch(() => {});
        return;
      }
    } catch { /* ignore */ }

    const trad = tradition ?? 'hindu';
    const fallbackQuiz = getFallbackDailySpark(trad, effectiveLang, todayStr);
    setQuiz(fallbackQuiz);
    setQuizDailyId(null);

    const langParam = appLanguage ? `&language=${appLanguage}` : '';
    fetch(`/api/quiz/daily?tradition=${trad}&date=${todayStr}${langParam}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        const quizData = { ...data, type: 'quiz' as const };
        setQuiz(quizData);
        setQuizDailyId(data.daily_quiz_id ?? null);
        localStorage.setItem(QUIZ_CACHE_KEY,      JSON.stringify(quizData));

        fetch('/api/quiz/stats')
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data?.streak) setQuizStreak(data.streak); })
          .catch(() => {});
      })
      .catch(() => {
        setQuiz(fallbackQuiz);
      });
  }, [tradition, appLanguage, effectiveLang, todayStr, QUIZ_ANSWERED_KEY, QUIZ_CACHE_KEY]);

  async function handleQuizAnswer(idx: number) {
    if (!quiz || typeof quiz === 'string' || quizAnswered !== null) return;

    setQuizAnswered(idx);
    localStorage.setItem(QUIZ_ANSWERED_KEY, String(idx));

    if (idx === quiz.answerIndex) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }

    try {
      const resp = await fetch('/api/quiz/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question:      quiz.question,
          chosen_index:  idx,
          correct_index: quiz.answerIndex,
          is_correct:    idx === quiz.answerIndex,
          tradition:     tradition ?? 'hindu',
          explanation:   quiz.explanation ?? null,
          daily_quiz_id: quizDailyId,
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        setQuizStreak(data.streak ?? 0);
        setQuizMilestone(data.streak_milestone ?? null);
        if (data.streak_milestone) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 4000);
        }
      }
    } catch (err) {
      console.error('Failed to persist quiz answer:', err);
    }
  }

  const [showConfetti, setShowConfetti] = useState(false);

  // Light/dark theme detection
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const check = () => {
      const theme = document.documentElement.dataset.theme;
      if (theme) {
        setIsDark(theme === 'dark');
      } else {
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
    };
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  const [moodToday, setMoodToday] = useState<{ key: string; label: string; colour: string } | null | undefined>(undefined);

  const resolvedTheme = isDark ? 'dark' : 'light';
  const MOODS = MOODS_CONFIG[resolvedTheme] || MOODS_CONFIG.dark;
  const moodsRef = useRef(MOODS);
  moodsRef.current = MOODS;

  const [backendMoodState, setBackendMoodState] = useState<{
    hasCompletedToday: boolean;
    hasDismissedToday: boolean;
    isLoaded: boolean;
    lastCompletedMood: string | null;
  }>({ hasCompletedToday: false, hasDismissedToday: false, isLoaded: false, lastCompletedMood: null });

  useEffect(() => {
    let cancelled = false;
    async function fetchMoodState() {
      try {
        const res = await fetch('/api/mood/checkin');
        if (!res.ok) throw new Error('Failed to fetch mood status');
        const data = await res.json();
        if (!cancelled) {
          setBackendMoodState({
            hasCompletedToday: data.hasCompletedToday || false,
            hasDismissedToday: data.hasDismissedToday || false,
            isLoaded: true,
            lastCompletedMood: data.lastCompletedMood || null
          });

          if (data.lastCompletedMood) {
            const moodConf = moodsRef.current.find(m => m.key === data.lastCompletedMood);
            if (moodConf) {
              setMoodToday({ key: moodConf.key, label: moodConf.label, colour: moodConf.colour });
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch backend mood state:', err);
      }
    }
    fetchMoodState();
    return () => { cancelled = true; };
  }, []);

  const { coords, city: liveCity } = useLocation();

  const lat = coords?.lat ?? savedLat ?? undefined;
  const lon = coords?.lon ?? savedLon ?? undefined;

  useEffect(() => {
    const p = calculatePanchang(selectedDate, lat, lon);
    setPanchang({
      tithi:      p.tithi,
      nakshatra:  p.nakshatra,
      yoga:       p.yoga,
      sunrise:    p.sunrise,
      sunset:     p.sunset,
      rahuKaal:   p.rahuKaal,
      tithiIndex: p.tithiIndex,
    });
  }, [selectedDate, lat, lon]);

  useEffect(() => {
    const focus = searchParams.get('focus');
    if (!focus) return;

    const timer = window.setTimeout(() => {
      if (focus === 'festivals') {
        setCalendarOpen(true);
      }
    }, 150);

    return () => window.clearTimeout(timer);
  }, [searchParams]);

  const selDateStr = selectedDate.toISOString().split('T')[0];
  const isToday    = selDateStr === todayStr;

  const displayCity = liveCity || savedCity;

  const compatibleLocalGreeting = isGreetingCompatibleWithTradition(localGreeting, tradition, sampradaya)
    ? localGreeting
    : null;

  useEffect(() => {
    setLocalGreeting(isGreetingCompatibleWithTradition(customGreeting, tradition, sampradaya) ? customGreeting : null);
  }, [customGreeting, tradition, sampradaya]);

  async function saveGreeting(newGreeting: string | null) {
    setLocalGreeting(newGreeting);
    const { error } = await supabase.from('profiles').update({ custom_greeting: newGreeting }).eq('id', userId);
    if (error) {
      setLocalGreeting(isGreetingCompatibleWithTradition(customGreeting, tradition, sampradaya) ? customGreeting : null);
      toast.error(error.message);
      return;
    }
    toast.success(newGreeting ? 'Greeting updated 🙏' : 'Greeting reset to auto');
  }

  const meta = getTraditionMeta(tradition);
  const effectiveAppLanguage = appLanguage === 'hi' || appLanguage === 'pa' ? appLanguage : 'en';

  const { observances, loading: calendarLoading, error: calendarError } = useUpcomingObservances(
    tradition || 'all',
    HOME_OBSERVANCE_WINDOW_DAYS,
    { reviewedOnly: true },
  );

  const apiFestivals: (import('@/lib/festivals').Festival & { route_kind?: string, route_slug?: string | null })[] = calendarError
    ? []
    : observances.map(obs => ({
        name: obs.display_name,
        date: obs.date,
        emoji: obs.emoji,
        description: obs.description || '',
        type: obs.kind as import('@/lib/festivals').Festival['type'],
        tradition: (obs.tradition || 'all') as import('@/lib/festivals').Festival['tradition'],
        route_kind: obs.route_kind as string,
        route_slug: obs.route_slug
      }));

  const activeFestivalStories = apiFestivals
    .map(f => ({ festival: f, story: getFestivalStory(f.name), daysLeft: daysFromNow(f.date) }))
    .filter(x => x.story && x.daysLeft !== null && x.daysLeft >= 0 && x.daysLeft <= HOME_OBSERVANCE_WINDOW_DAYS);

  const activeVratFestivals = apiFestivals
    .filter(festival => getVratHref(festival))
    .filter((festival) => {
      const daysLeft = daysFromNow(festival.date);
      return daysLeft !== null && daysLeft >= 0 && daysLeft <= HOME_OBSERVANCE_WINDOW_DAYS;
    });

  const upcomingSacredObservance = apiFestivals
    .map(f => ({ festival: f, daysLeft: daysFromNow(f.date) }))
    .filter(x => x.daysLeft !== null && x.daysLeft >= 0 && x.daysLeft <= HOME_OBSERVANCE_WINDOW_DAYS)
    .sort((a, b) => a.daysLeft - b.daysLeft)[0] ?? null;

  const { t } = useLanguage();
  const upcomingSacredObservanceLabel = upcomingSacredObservance
    ? upcomingSacredObservance.daysLeft === 0
      ? t('today')
      : upcomingSacredObservance.daysLeft === 1
        ? t('tomorrow')
        : t('inNDays').replace('{n}', String(upcomingSacredObservance.daysLeft))
    : null;

  const handleMoodPulseDismiss = () => {
    const today = getMoodSpiritualDate();
    localStorage.setItem('shoonaya_mood_dismissed', today);
    fetch('/api/mood/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ before_mood: 'dismissed', source_surface: 'home_bhavana', dismissed: true })
    }).catch(console.error);
    setBackendMoodState(prev => prev ? { ...prev, hasDismissedToday: true } : prev);
  };

  const pitruPakshaDay = (() => {
    if (tradition && tradition !== 'hindu' && tradition !== 'all') return null;
    return getPitruPakshaDay(selectedDate);
  })();
  const pitruPakshaCopy = pitruPakshaDay ? getPitruPakshaBannerCopy(pitruPakshaDay) : null;

  const completedCount =
    (japaAlreadyDoneToday ? 1 : 0) +
    (nityaDoneToday ? 1 : 0) +
    (pathshalaDoneToday ? 1 : 0) +
    (dailyDharmaStackState.quizDone ? 1 : 0) +
    (dailyDharmaStackState.dharmVeerDone ? 1 : 0);

  const showEveningNudge = useMemo(() => {
    if (rhythmMode !== 'morning') return false;
    if (typeof window === 'undefined') return false;
    if (eveningNudgeDismissed) return false;
    try {
      if (localStorage.getItem(EVENING_NUDGE_KEY)) return false;
      const today = localSpiritualDate(Intl.DateTimeFormat().resolvedOptions().timeZone, 4);
      const locallyDone = localStorage.getItem(`shoonaya-nitya-done-${today}`) === 'true';
      if (!nityaDoneToday && !locallyDone) return false;
    } catch { return false; }
    return displayStreak >= 14;
  }, [rhythmMode, displayStreak, nityaDoneToday, eveningNudgeDismissed]);

  function dismissEveningNudge() {
    try { localStorage.setItem(EVENING_NUDGE_KEY, 'true'); } catch {}
    setEveningNudgeDismissed(true);
  }

  async function addEveningMomentsFromNudge() {
    dismissEveningNudge();
    try {
      const response = await fetch('/api/user/rhythm-mode', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'full_day' }),
      });
      if (!response.ok) throw new Error('Failed to update rhythm mode');
      toast.success('Evening Moments added to your rhythm 🪔');
      router.refresh();
    } catch (error) {
      console.error('[Home rhythm mode]', error);
      toast.error('Could not add Evening Moments right now.');
    }
  }

  const [perfectDayCeremonyOpen, setPerfectDayCeremonyOpen] = useState(false);
  const [perfectDayInsight, setPerfectDayInsight] = useState<string | null>(null);
  const prevCompletedCountRef = useRef(completedCount);

  useEffect(() => {
    if (prevCompletedCountRef.current === 4 && completedCount === 5) {
      const awardPerfectDay = async () => {
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const res = await fetch('/api/sadhana/perfect-day', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timeZone: tz }),
          });
          const data = await res.json();
          if (data.awarded) {
            setPerfectDayCeremonyOpen(true);
            const TRADITION_DAY_WORD: Record<string, string> = { hindu: 'Shuddha Din', sikh: 'Sacha Din', buddhist: 'Kusala Dina', jain: 'Shubha Din' };
            const dayWord = TRADITION_DAY_WORD[tradition ?? 'hindu'] ?? 'Shuddha Din';
            toast.success(`+30 karma · +15 seva — ${dayWord}`);
            const insightRes = await fetch('/api/sadhana/perfect-day-insight', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tradition: tradition,
                japaRounds: dailyDharmaStackState.japaRounds,
                pathshalaPct: dailyDharmaStackState.pathshalaProgress,
                quizCorrect: 4,
                streakDays: streak
              }),
            });
            const insightData = await insightRes.json();
            if (insightData.insight) {
              setPerfectDayInsight(insightData.insight);
            }
          }
        } catch (error) {
          console.error('Failed to process perfect day bonus', error);
        }
      };
      awardPerfectDay();
    }
    prevCompletedCountRef.current = completedCount;
  }, [completedCount, tradition, dailyDharmaStackState, streak]);

  const relicAccent = getRelicAccent(activeSymbolId);

  return (
    <div
      className="divine-home-shell bg-[var(--divine-bg)] -mx-3 sm:-mx-4 relative selection:bg-[#C5A059]/30"
      style={{
        '--relic-accent':      relicAccent.primary,
        '--relic-accent-soft': relicAccent.soft,
        '--relic-accent-glow': relicAccent.glow,
      } as React.CSSProperties}
    >
      <PerfectDayCeremony
        isOpen={perfectDayCeremonyOpen}
        onClose={() => setPerfectDayCeremonyOpen(false)}
        insight={perfectDayInsight}
        tradition={tradition ?? 'hindu'}
      />

      {/* ── Sacred confetti celebration ── */}
      <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* ── Section 1: Hero Section ── */}
      <HeroSection
        panchang={panchang}
        selectedDate={selectedDate}
        tradition={tradition}
        sampradaya={sampradaya}
        ishtaDevata={ishtaDevata}
        userName={userName}
        userId={userId}
        avatarUrl={avatarUrl}
        isPro={isPro}
        activeSymbolId={activeSymbolId}
        karmaPoints={karmaPoints}
        japaAlreadyDoneToday={japaAlreadyDoneToday}
        japaStreak={japaStreak}
        showFirstTimeGuidance={showFirstTimeGuidance}
        nityaDoneToday={nityaDoneToday}
        pathshalaDoneToday={pathshalaDoneToday}
        dailyDharmaStackState={dailyDharmaStackState}
        dharmVeer={liveDharmVeer}
        isDark={isDark}
        unreadCount={unreadCount}
        onNotifBellClick={() => { setNotifOpen((v) => !v); if (!notifOpen) notifQuery.refetch(); }}
        moodToday={moodToday}
        coverUrl={customCover}
        heroThemes={heroThemes}
        daysUntilFestival={daysUntilFestival}
        festivals={festivals}
        appLanguage={appLanguage ?? 'en'}
        meaningLanguage={meaningLanguage ?? 'en'}
        transliterationLanguage={transliterationLanguage ?? 'en'}
        showTransliteration={showTransliteration}
        shloka={shloka}
        sacredText={sacredText}
        sacredTextMeta={sacredTextMeta}
        onGreetingClick={() => setGreetingSheetOpen(true)}
        readToday={readToday}
        setReadToday={setReadToday}
        streak={streak}
        setStreak={setStreak}
        sevaScore={sevaScore}
        onShowConfetti={() => { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 4000); }}
        upcomingSacredObservance={upcomingSacredObservance}
        upcomingSacredObservanceLabel={upcomingSacredObservanceLabel}
        showRashiphalNudge={showRashiphalNudge}
        onDismissRashiphalNudge={() => {
          try { localStorage.setItem('shoonaya-rashiphal-nudge-v1', 'yes'); } catch {}
          setShowRashiphalNudge(false);
          withOneSignal(async (OS) => {
            if (typeof OS.User?.addTag === 'function') {
              await OS.User.addTag('wants_rashiphal', '1');
            }
          }).catch(() => {});
        }}
        showDharmaMitraNudge={showDharmaMitraNudge}
        onDismissDharmaMitraNudge={() => {
          try { localStorage.setItem('shoonaya-dharma-mitra-mantra-nudge-v1', 'yes'); } catch {}
          setShowDharmaMitraNudge(false);
        }}
        city={displayCity}
        timezone={timezone}
      />

      <div className="-mt-2 space-y-3">
        {showEveningNudge && (
          <div className="px-4 mb-2">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border px-4 py-4"
              style={{ background: isDark ? 'rgba(197,160,89,0.12)' : 'rgba(197,160,89,0.14)', borderColor: 'rgba(197,160,89,0.24)' }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ background: 'rgba(197,160,89,0.16)' }}>
                  🪔
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: isDark ? 'rgba(255,248,225,0.95)' : 'var(--brand-ink)' }}>
                    14 days of morning. Ready to close the day?
                  </p>
                  <p className="text-xs leading-relaxed mt-1" style={{ color: isDark ? 'rgba(255,248,225,0.66)' : 'var(--brand-muted)' }}>
                    Your morning sadhana is stable. Evening Moments — lighting the diya, a short prayer — take 5 minutes and complete the daily arc.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void addEveningMomentsFromNudge()}
                      className="rounded-full px-4 py-2 text-xs font-bold"
                      style={{ background: '#C5A059', color: '#1c1208' }}
                    >
                      Add Evening Moments
                    </button>
                    <button
                      type="button"
                      onClick={dismissEveningNudge}
                      className="rounded-full border px-4 py-2 text-xs font-semibold"
                      style={{ borderColor: 'rgba(197,160,89,0.28)', color: isDark ? 'rgba(255,248,225,0.68)' : 'var(--brand-muted)' }}
                    >
                      Not yet
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── First-week guide — shown only to new users with no practice history ── */}
        {showFirstTimeGuidance && (
          <FirstWeekGuide
            tradition={tradition}
            userName={userName}
          />
        )}

        <VratCarousel
          festivals={activeVratFestivals}
          isDark={isDark}
          effectiveAppLanguage={effectiveAppLanguage}
        />

        {/* ── Section 2: Calendar Section ── */}
        <CalendarSection
          pitruPakshaDay={pitruPakshaDay}
          pitruPakshaCopy={pitruPakshaCopy}
          activeFestivalStories={activeFestivalStories}
          calendarLoading={calendarLoading}
          transliterationLanguage={transliterationLanguage ?? 'en'}
          isDark={isDark}
        />

        {/* ── Below Fold Sections (Lazy-loaded) ── */}
        <Suspense fallback={null}>
          <BelowFoldSections
            userId={userId}
            userName={userName}
            tradition={tradition}
            sampradaya={sampradaya}
            isPro={isPro}
            japaAlreadyDoneToday={japaAlreadyDoneToday}
            nityaDoneToday={nityaDoneToday}
            activeSankalpa={activeSankalpa ?? null}
            sankalpaCheckedToday={sankalpaCheckedToday}
            onSankalpaCheckin={handleSankalpaCheckin}
            onSetSankalpa={() => setShowSankalpSheet(true)}
            onSankalpaComplete={() => {
              if (activeSankalpa) {
                fetch('/api/sankalpa', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: activeSankalpa.id, status: 'completed' })
                }).then(() => fetchSankalpa());
              }
            }}
            isDark={isDark}
            readToday={readToday}
            dailyDharmaStackState={dailyDharmaStackState}
            dharmVeer={liveDharmVeer}
            appLanguage={appLanguage ?? 'en'}
            onOpenMoodJourney={(moodKey) => setJourneyMoodKey(moodKey)}
            onDismissMood={handleMoodPulseDismiss}
            backendMoodState={backendMoodState}
            quiz={quiz}
            quizAnswered={quizAnswered}
            quizStreak={quizStreak}
            onOpenQuiz={() => setQuizModalOpen(true)}
            sevaScore={sevaScore}
            onInviteClick={() => setInviteOpen(true)}
            pathshalaProgress={dailyDharmaStackState.pathshalaProgress}
            pathshalaDoneToday={pathshalaDoneToday}
            pathshalaLabel={pathshalaLabel}
            pathshalaHref={pathshalaHref}
            isAdmin={!!isAdmin}
          />
        </Suspense>
      </div>

      {/* ── Full date picker (tap date label in Panchang) ── */}
      <AnimatePresence>
        {datePickerOpen && (
          <DatePickerModal
            selectedDate={selectedDate}
            onSelect={(date) => setSelectedDate(date)}
            onClose={() => setDatePickerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Greeting edit sheet (tap greeting text) ── */}
      <AnimatePresence>
        {greetingSheetOpen && (
          <GreetingEditSheet
            tradition={tradition}
            sampradaya={sampradaya}
            currentGreeting={compatibleLocalGreeting}
            onSave={saveGreeting}
            onClose={() => setGreetingSheetOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Invite modal ── */}
      <AnimatePresence>
        {inviteOpen && (
          <InviteModal userId={userId} onClose={() => setInviteOpen(false)} />
        )}
      </AnimatePresence>

      {/* ── Festival Story Sheet ── */}
      <AnimatePresence>
        {(() => {
          const _activeStory = activeStoryFestival ? getFestivalStory(activeStoryFestival.name) : null;
          const _activeDays  = activeStoryFestival ? daysFromNow(activeStoryFestival.date) : null;
          return activeStoryFestival && _activeStory ? (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col justify-end"
            onClick={() => setActiveStoryFestival(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          >
            <motion.div
              className="relative w-full overflow-y-auto rounded-t-[2rem] pb-10"
              style={{
                maxHeight: '88dvh',
                background: 'linear-gradient(180deg, var(--surface-raised) 0%, var(--card-bg) 100%)',
                borderTop: '1px solid rgba(197, 160, 89, 0.22)',
                boxShadow: '0 -24px 60px rgba(0,0,0,0.28)',
              }}
              onClick={e => e.stopPropagation()}
              initial={{ y: 56, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 32, opacity: 0 }}
              transition={{ duration: 0.34, ease: [0.34, 1.26, 0.64, 1] }}
            >
              {/* Drag handle */}
              <div className="sticky top-0 flex justify-center pt-3 pb-2 z-10"
                style={{ background: 'var(--surface-raised)' }}>
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(197, 160, 89,0.30)' }} />
              </div>

              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-1 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl" aria-hidden="true">{_activeStory.emoji}</span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                      style={{ color: 'var(--brand-primary)', marginBottom: '2px' }}>
                      {_activeDays === 0 ? 'Today' : `In ${_activeDays} day${_activeDays === 1 ? '' : 's'}`}
                    </p>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-cream)', lineHeight: 1.2 }}>
                      {activeStoryFestival.name}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setActiveStoryFestival(null)}
                  className="w-[44px] h-[44px] rounded-full flex items-center justify-center flex-shrink-0 mt-1 cursor-pointer border-0"
                  style={{ background: 'rgba(197, 160, 89,0.10)' }}
                  aria-label="Close"
                >
                  <X size={16} style={{ color: 'var(--text-muted-warm)' }} />
                </button>
              </div>

              <div className="px-6 space-y-6 pb-4">
                {/* Origin */}
                <section>
                  <h3 className="festival-story-section-label">Origin</h3>
                  <p className="festival-story-prose">{_activeStory.origin}</p>
                </section>

                {/* Significance */}
                <section>
                  <h3 className="festival-story-section-label">Spiritual Significance</h3>
                  <p className="festival-story-prose">{_activeStory.significance}</p>
                </section>

                {/* Shloka block */}
                <section
                  className="rounded-[1.4rem] p-5"
                  style={{ background: 'rgba(197, 160, 89,0.09)', border: '1px solid rgba(197, 160, 89,0.18)' }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-3"
                    style={{ color: 'var(--brand-primary)' }}>
                    Sacred Verse
                  </p>
                  <p className="festival-story-verse">{_activeStory.shloka.text}</p>
                  {getTransliteration(_activeStory.shloka.text, _activeStory.shloka.transliteration || '', transliterationLanguage ?? 'en') !== _activeStory.shloka.text && (
                    <p className="festival-story-transliteration">
                      {getTransliteration(_activeStory.shloka.text, _activeStory.shloka.transliteration || '', transliterationLanguage ?? 'en')}
                    </p>
                  )}
                  <p className="festival-story-prose mt-3 italic">&ldquo;{_activeStory.shloka.translation}&rdquo;</p>
                  <p className="text-[10px] mt-2" style={{ color: 'var(--text-dim)' }}>
                    — {_activeStory.shloka.source}
                  </p>
                </section>

                {/* Rituals */}
                <section>
                  <h3 className="festival-story-section-label">How to Observe</h3>
                  <ul className="space-y-2 mt-1">
                    {_activeStory.rituals.map((ritual, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span style={{ color: 'var(--brand-primary)', fontSize: '0.8rem', marginTop: '2px' }}>🪔</span>
                        <p className="festival-story-prose" style={{ margin: 0 }}>{ritual}</p>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Practice CTA */}
                <section
                  className="rounded-[1.4rem] p-5"
                  style={{ background: 'rgba(212,120,74,0.10)', border: '1px solid rgba(212,120,74,0.20)' }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-2"
                    style={{ color: 'var(--brand-primary-strong)' }}>
                    Your Practice Today
                  </p>
                  <p className="festival-story-prose">{_activeStory.practice}</p>
                </section>
              </div>
            </motion.div>
          </motion.div>
          ) : null;
        })()}
      </AnimatePresence>

      {/* ── Daily Quiz Modal ── */}
      <AnimatePresence>
        {isQuizModalOpen && quiz && quiz !== 'loading' && quiz !== 'error' && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
            onClick={() => setQuizModalOpen(false)}
          >
            <motion.div
              className="relative w-full max-h-[90dvh] rounded-t-[2.5rem] overflow-y-auto"
              style={{
                background: 'linear-gradient(180deg, var(--surface-raised) 0%, var(--card-bg) 100%)',
                borderTop: '1px solid rgba(197, 160, 89, 0.25)',
                boxShadow: '0 -24px 64px rgba(0,0,0,0.4)',
              }}
              onClick={e => e.stopPropagation()}
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Handle */}
              <div className="sticky top-0 z-20 flex justify-center pt-3 pb-2 bg-inherit">
                <div className="w-12 h-1.5 rounded-full bg-[rgba(197, 160, 89,0.2)]" />
              </div>

              <div className="px-7 pt-2 pb-12">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
                      {tradition ? `${tradition} ${effectiveAppLanguage === 'hi' ? 'स्पार्क' : effectiveAppLanguage === 'pa' ? 'ਸਪਾਰਕ' : 'Spark'}` : effectiveAppLanguage === 'hi' ? 'दैनिक स्पार्क' : effectiveAppLanguage === 'pa' ? 'ਰੋਜ਼ਾਨਾ ਸਪਾਰਕ' : 'Daily Spark'}
                    </span>
                    <h2 className="text-2xl font-bold theme-ink font-serif mt-1">{effectiveAppLanguage === 'hi' ? 'क्या आप जानते हैं?' : effectiveAppLanguage === 'pa' ? 'ਕੀ ਤੁਸੀਂ ਜਾਣਦੇ ਹੋ?' : 'Do You Know?'}</h2>
                  </div>
                  <button
                    onClick={() => setQuizModalOpen(false)}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5 border-0 cursor-pointer"
                  >
                    <X size={20} className="text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-8">
                  <p className="text-xl font-medium leading-tight theme-ink">{quiz.question}</p>

                  {quiz.fallbackLanguage === 'en' && appLanguage && appLanguage !== 'en' && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                      <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
                        Translation unavailable today. Showing English fallback.
                      </span>
                    </div>
                  )}

                  {/* Type: Fact */}
                  {quiz.type === 'fact' && (
                    <div className="space-y-6">
                      <div className="p-6 rounded-3xl bg-[rgba(197, 160, 89,0.06)] border border-[rgba(197, 160, 89,0.12)]">
                        <p className="text-base leading-relaxed theme-ink">{quiz.fact}</p>
                      </div>
                      <p className="text-[11px] uppercase tracking-widest text-center opacity-40">Source: {quiz.source}</p>
                    </div>
                  )}

                  {/* Type: Quiz */}
                  {quiz.type === 'quiz' && (
                    <div className="space-y-4">
                      {quiz.options?.map((opt, i) => {
                        const isAnswered = quizAnswered !== null;
                        const isChosen = quizAnswered === i;
                        const isCorrect = i === quiz.answerIndex;

                        return (
                          <button
                            key={i}
                            disabled={isAnswered}
                            onClick={() => handleQuizAnswer(i)}
                            className={`w-full flex items-center gap-4 p-5 rounded-2xl transition-all border text-left cursor-pointer
                              ${!isAnswered ? 'bg-[var(--surface-soft)] border-black/5 hover:border-[var(--brand-primary)]/30' : ''}
                              ${isAnswered && isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : ''}
                              ${isAnswered && isChosen && !isCorrect ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400' : ''}
                              ${isAnswered && !isChosen && !isCorrect ? 'opacity-40 grayscale-[0.5]' : ''}
                            `}
                          >
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border
                              ${!isAnswered ? 'bg-white/50 dark:bg-black/20 border-black/5' : ''}
                              ${isAnswered && isCorrect ? 'bg-emerald-500 text-white border-emerald-500' : ''}
                              ${isAnswered && isChosen && !isCorrect ? 'bg-rose-500 text-white border-rose-500' : ''}
                            `}>
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="flex-1 font-medium">{opt}</span>
                            {isAnswered && isCorrect && <span className="text-xl">✓</span>}
                            {isAnswered && isChosen && !isCorrect && <span className="text-xl">✗</span>}
                          </button>
                        );
                      })}

                      {quizAnswered !== null && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-8 p-6 rounded-3xl bg-[var(--surface-soft)] border border-black/5"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-primary)] block mb-3">
                            The Wisdom Behind
                          </span>
                          <p className="text-sm leading-relaxed theme-ink opacity-90">{quiz.explanation}</p>
                          <p className="text-[11px] opacity-40 mt-6 uppercase tracking-widest">Source: {quiz.source}</p>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>

                {quizAnswered !== null && (
                   <div className="mt-10 space-y-4">
                     {/* Streak + accuracy row */}
                     <div className="flex items-center justify-center gap-6">
                       {quizStreak > 0 && (
                          <div className="text-center">
                            <p className="text-2xl font-bold" style={{ color: 'var(--brand-primary)' }}>
                              🔥{quizStreak}
                            </p>
                            <p className="text-[10px] uppercase tracking-widest mt-1"
                               style={{ color: 'var(--text-dim)' }}>
                              {effectiveAppLanguage === 'hi' ? 'दिन की लकीर' : effectiveAppLanguage === 'pa' ? 'ਦਿਨਾਂ ਦੀ ਲੜੀ' : 'Day Streak'}
                            </p>
                          </div>
                       )}
                     </div>

                     {/* Milestone badge */}
                     {quizMilestone === 'three_days' && (
                        <p className="text-center text-sm font-semibold" style={{ color: 'var(--brand-primary)' }}>
                          🥉 {effectiveAppLanguage === 'hi' ? '३ दिन पूरे! धन्य है आपकी साधना।' : '3-day milestone reached!'}
                        </p>
                     )}
                     {quizMilestone === 'week' && (
                        <p className="text-center text-sm font-semibold" style={{ color: 'var(--brand-primary)' }}>
                          🥈 {effectiveAppLanguage === 'hi' ? 'सात दिन की साधना पूरी!' : '7-day Sadhana streak!'}
                        </p>
                     )}
                     {quizMilestone === 'month' && (
                        <p className="text-center text-sm font-semibold" style={{ color: 'var(--brand-primary)' }}>
                          🏆 {effectiveAppLanguage === 'hi' ? 'एक माह की ज्ञान-यात्रा पूरी!' : '30-day Gyani streak!'}
                        </p>
                     )}
                     {quizMilestone === 'century' && (
                        <p className="text-center text-sm font-semibold" style={{ color: 'var(--brand-primary)' }}>
                          💎 {effectiveAppLanguage === 'hi' ? 'शत-दिवस ऋषि! अद्भुत साधना!' : '100-day Rishi streak!'}
                        </p>
                     )}

                     {/* Come back tomorrow */}
                     <p className="text-xs text-center" style={{ color: 'var(--text-dim)' }}>
                       {effectiveAppLanguage === 'hi'
                         ? 'ज्ञान बांटने से बढ़ता है। कल एक नई स्पार्क के लिए आएं।'
                         : effectiveAppLanguage === 'pa'
                         ? 'ਗਿਆਨ ਵੰਡਣ ਨਾਲ ਵਧਦਾ ਹੈ। ਕੱਲ੍ਹ ਇੱਕ ਨਵੀਂ ਸਪਾਰਕ ਲਈ ਆਓ।'
                         : 'Wisdom grows when shared. Come back tomorrow for a new spark.'}
                     </p>

                     <div className="flex justify-center mt-6">
                       <button
                         onClick={async () => {
                           const correctCount = quizAnswered === quiz.answerIndex ? 1 : 0;
                           const totalCount = 1;
                           const data = buildShoonayaShareCardData({
                             tradition: _quizTrad || 'universal',
                             title: 'Quiz Complete',
                             score: Math.round(correctCount/totalCount*100),
                             caption: `${correctCount}/${totalCount} correct`,
                             userName: (userName || 'Seeker'),
                             date: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
                           });
                           const result = await shareShoonayaShareCard(data, {
                             fileName: 'shoonaya-quiz-result.png',
                             shareText: 'Practicing with Shoonaya 🙏',
                           });
                           if (result === 'failed') toast.error('Could not generate card');
                         }}
                         className="flex items-center gap-2 px-6 py-3 rounded-full border transition-transform active:scale-95 cursor-pointer"
                         style={{
                           borderColor: 'rgba(197, 160, 89, 0.25)',
                           background: 'rgba(197, 160, 89, 0.1)',
                           color: 'var(--brand-primary)',
                         }}
                       >
                         <Share2 size={16} />
                         <span className="text-sm font-semibold">Share Result</span>
                       </button>
                     </div>
                   </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSankalpSheet && (
          <SetSankalpSheet
            tradition={tradition ?? 'hindu'}
            onClose={() => setShowSankalpSheet(false)}
            onSuccess={() => {
              setShowSankalpSheet(false);
              fetchSankalpa();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {journeyMoodKey && (
          <MoodJourneySheet
            moodKey={journeyMoodKey}
            tradition={tradition}
            isOpen={Boolean(journeyMoodKey)}
            onClose={() => {
              setBackendMoodState(prev => prev ? { ...prev, hasCompletedToday: true, lastCompletedMood: journeyMoodKey } : prev);
              setJourneyMoodKey(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWelcomeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="clay-card rounded-[2.5rem] p-8 max-w-sm w-full text-center border-[#C5A059]/30 shadow-2xl relative overflow-hidden"
            >
              {/* Decorative ambient background */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#C5A059]/10 via-transparent to-transparent opacity-60 pointer-events-none" />

              {/* Symbol */}
              <div className="w-16 h-16 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/25 flex items-center justify-center text-3xl mx-auto mb-6">
                ✨
              </div>

              {/* Header */}
              <h2 className="text-2xl font-bold font-serif theme-ink mb-3">
                Welcome to the Zeroists{userName ? `, ${userName.split(' ')[0]}` : ''}!
              </h2>

              <p className="text-sm text-[var(--text-muted-warm)] leading-relaxed mb-8">
                You are now part of the global Shoonaya mandali. Let us walk the path of sadhana, mindfulness, and sacred consistency together.
              </p>

              {/* Button */}
              <button
                onClick={() => setShowWelcomeModal(false)}
                className="w-full rounded-full bg-[#C5A059] text-[#0E0E0F] font-bold py-3.5 text-sm transition-all active:scale-95 shadow-lg shadow-[#C5A059]/20"
              >
                Begin Journey 🙏
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Notification panel (portal → document.body to escape stacking contexts) ── */}
      {notifPortalTarget && createPortal(
        <AnimatePresence>
          {notifOpen && (
            <>
              {/* Click-away backdrop */}
              <div
                className="fixed inset-0 bg-transparent"
                style={{ zIndex: 9990 }}
                onClick={() => setNotifOpen(false)}
              />

              {/* Floating panel — fixed below the bell (top-left of screen) */}
              <motion.div
                className="fixed flex flex-col"
                style={{
                  zIndex: 9991,
                  top: 'calc(max(env(safe-area-inset-top), 8px) + 68px)',
                  left: 16,
                  width: 'min(340px, calc(100vw - 32px))',
                  maxHeight: 420,
                  borderRadius: 18,
                  overflow: 'hidden',
                  background: isDark
                    ? 'linear-gradient(160deg, rgba(30,27,22,0.98) 0%, rgba(22,20,16,0.99) 100%)'
                    : 'linear-gradient(160deg, rgba(252,248,240,0.98) 0%, rgba(245,240,228,0.99) 100%)',
                  border: `1px solid ${isDark ? 'rgba(197,160,89,0.20)' : 'rgba(197,160,89,0.32)'}`,
                  boxShadow: isDark
                    ? '0 20px 56px rgba(0,0,0,0.70), 0 4px 12px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)'
                    : '0 20px 56px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.85)',
                }}
                initial={{ opacity: 0, scale: 0.92, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -6 }}
                transition={{ type: 'spring', stiffness: 400, damping: 34, mass: 0.75 }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between px-4 pt-3.5 pb-2.5 flex-shrink-0"
                  style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}` }}
                >
                  <div className="flex items-center gap-2">
                    <Bell size={13} style={{ color: '#C5A059' }} />
                    <span className="text-[13px] font-semibold"
                      style={{ color: isDark ? 'rgba(242,234,214,0.95)' : 'rgba(30,20,5,0.90)' }}>
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(197,160,89,0.16)', color: '#C5A059' }}>
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllRead.mutate(notifs.filter(n => !n.read).map(n => n.id))}
                        className="text-[10px] font-semibold transition-opacity hover:opacity-70 bg-transparent border-0 cursor-pointer"
                        style={{ color: '#C5A059' }}
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-70 border-0 cursor-pointer"
                      style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}
                    >
                      <X size={11} style={{ color: isDark ? 'rgba(242,234,214,0.65)' : 'rgba(30,20,5,0.50)' }} />
                    </button>
                  </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto overscroll-contain flex-1">
                  {notifs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-8 px-4 text-center">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style={{ background: 'rgba(197,160,89,0.10)', border: '1px solid rgba(197,160,89,0.16)' }}>
                        <Bell size={18} style={{ color: 'rgba(197,160,89,0.55)' }} />
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold"
                          style={{ color: isDark ? 'rgba(242,234,214,0.78)' : 'rgba(30,20,5,0.72)' }}>
                          All quiet
                        </p>
                        <p className="text-[11px] mt-0.5 leading-relaxed"
                          style={{ color: isDark ? 'rgba(242,234,214,0.42)' : 'rgba(30,20,5,0.42)' }}>
                          Festival alerts & practice milestones show up here.
                        </p>
                      </div>
                      <button
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-opacity hover:opacity-75 cursor-pointer"
                        style={{ background: 'rgba(197,160,89,0.12)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.20)' }}
                        onClick={async () => {
                          await fetch('/api/notifications/test', { method: 'POST' });
                          notifQuery.refetch();
                        }}
                      >
                        Send test notification
                      </button>
                    </div>
                  ) : (
                    notifs.map((n) => (
                      <button
                        key={n.id}
                        className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-0 cursor-pointer"
                        style={{
                          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.05)'}`,
                          background: !n.read
                            ? (isDark ? 'rgba(197,160,89,0.05)' : 'rgba(197,160,89,0.07)')
                            : 'transparent',
                        }}
                        onClick={() => {
                          if (!n.read) markOneRead.mutate(n.id);
                          setNotifOpen(false);
                          if (n.action_url) {
                            if (/^https?:\/\//.test(n.action_url)) window.location.href = n.action_url;
                            else router.push(n.action_url);
                          }
                        }}
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 mt-0.5"
                          style={{ background: 'rgba(197,160,89,0.12)', border: '1px solid rgba(197,160,89,0.16)' }}>
                          {n.emoji ?? '🔔'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[12px] leading-snug ${!n.read ? 'font-semibold' : 'font-normal'}`}
                            style={{ color: isDark
                              ? (!n.read ? 'rgba(242,234,214,0.95)' : 'rgba(242,234,214,0.55)')
                              : (!n.read ? 'rgba(30,20,5,0.90)' : 'rgba(30,20,5,0.52)') }}>
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="text-[11px] mt-0.5 leading-relaxed line-clamp-2"
                              style={{ color: isDark ? 'rgba(242,234,214,0.45)' : 'rgba(30,20,5,0.48)' }}>
                              {n.body}
                            </p>
                          )}
                          <p className="text-[10px] mt-1"
                            style={{ color: isDark ? 'rgba(197,160,89,0.42)' : 'rgba(120,90,20,0.52)' }}>
                            {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!n.read && (
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#C5A059' }} />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        notifPortalTarget
      )}
    </div>
  );
}
