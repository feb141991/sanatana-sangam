'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { animate, AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import {
  ChevronRight, CheckCircle2, XCircle,
  Flame, Target, Trophy, History,
  Lock, Zap, BookOpen, Star,
  Check, Sparkles,
} from 'lucide-react';
import { getTraditionMeta } from '@/lib/tradition-config';
import PremiumActivateModal from '@/components/premium/PremiumActivateModal';
import { localSpiritualDate, resolveTimeZone } from '@/lib/sacred-time';
import ConfettiOverlay from '@/components/ui/ConfettiOverlay';
import PageIntro from '@/components/ui/PageIntro';
import { RANK_META, computeRank, nextRankInfo } from '@/lib/rank-system';
import { generateActivityGrid } from '@/lib/activity-grid';

// ── Types ─────────────────────────────────────────────────────────────────────

interface QuizResponse {
  id:            string;
  date:          string;
  question:      string;
  chosen_index:  number;
  correct_index: number;
  is_correct:    boolean;
  tradition:     string;
  explanation?:  string | null;
}

interface PracticeSession {
  id:                string;
  topic:             string;
  difficulty:        string;
  questions_total:   number;
  questions_correct: number;
  karma_earned:      number;
  completed_at:      string;
}

interface DailyQuiz {
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string | null;
  fact?: string | null;
  source?: string | null;
  tradition: string;
  date: string;
  daily_quiz_id?: string | null;
  fallbackLanguage?: string;
}

interface Props {
  userId:           string;
  userName:         string;
  tradition:        string;
  timezone:         string;
  appLanguage:      string;
  isPro:            boolean;
  karmaPoints:      number;
  todayResponse:    QuizResponse | null;
  initialHistory:   QuizResponse[];
  activityDates:    string[];
  practiceSessions: PracticeSession[];
  hasGraceAvailable: boolean;
}



// ── Topic meta ────────────────────────────────────────────────────────────────

const TOPICS = [
  { key: 'deities',    emoji: '🙏', label: 'Deities & Stories',   color: '#C5A059' },
  { key: 'scriptures', emoji: '📖', label: 'Scriptures & Texts',   color: '#9898dd' },
  { key: 'philosophy', emoji: '🧘', label: 'Philosophy',           color: '#7aab7a' },
  { key: 'festivals',  emoji: '🪔', label: 'Festivals & Calendar', color: '#d4843a' },
  { key: 'geography',  emoji: '🗺️', label: 'Sacred Geography',    color: '#6aadad' },
  { key: 'sanskrit',   emoji: '🔤', label: 'Sanskrit & Language',  color: '#ad7ad4' },
] as const;

// ── Glass style ───────────────────────────────────────────────────────────────

const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
} as const;

const glassAmber = {
  background: 'rgba(197, 160, 89,0.07)',
  border: '1px solid rgba(197, 160, 89,0.18)',
} as const;

const quizCardGlass = 'bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm rounded-2xl';

function getNextDawnCountdown(timeZone: string) {
  const tz = resolveTimeZone(timeZone);
  const now = new Date();
  const currentHour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hour12: false }).format(now)
  );
  const localDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  const next = new Date(`${localDate}T04:00:00`);
  if (currentHour >= 4) {
    next.setDate(next.getDate() + 1);
  }
  const diff = Math.max(0, next.getTime() - now.getTime());
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { diff, label: `${hours}h ${minutes}m ${seconds}s` };
}

function CountUpScore({ value, color }: { value: number; color: string }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(mv, value, {
      type: 'spring',
      stiffness: 120,
      damping: 18,
      mass: 0.8,
    });
    return () => controls.stop();
  }, [mv, value]);

  return (
    <motion.span
      className="text-5xl font-bold"
      style={{ fontFamily: 'var(--font-serif)', color }}
    >
      {rounded}
    </motion.span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function QuizDashboardClient({
  userName, tradition, timezone, appLanguage, isPro, karmaPoints, todayResponse, initialHistory, activityDates, practiceSessions, hasGraceAvailable
}: Props) {
  const meta = getTraditionMeta(tradition);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [dailyQuiz, setDailyQuiz] = useState<DailyQuiz | null>(null);
  const [dailyQuizState, setDailyQuizState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(todayResponse?.chosen_index ?? null);
  const [dailyAnswered, setDailyAnswered] = useState(Boolean(todayResponse));
  const [completedThisSession, setCompletedThisSession] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [countdownLabel, setCountdownLabel] = useState('');
  const [quizSaveData, setQuizSaveData] = useState<{ streak?: number; streak_milestone?: string | null } | null>(null);
  const [transitionDirection, setTransitionDirection] = useState(1);
  const answerLockedRef = useRef(false);
  const spiritualToday = localSpiritualDate(timezone, 4);
  const quizAnsweredKey = `shoonaya-quiz-daily-answered-${tradition}-${appLanguage}-${spiritualToday}`;

  useEffect(() => {
    let alive = true;

    async function loadDailyQuiz() {
      try {
        const response = await fetch(`/api/quiz/daily?tradition=${tradition}&date=${spiritualToday}&language=${appLanguage}`);
        if (!response.ok) throw new Error('Failed to load daily quiz');
        const data = await response.json();
        if (!alive) return;
        setDailyQuiz(data);
        setDailyQuizState('ready');
      } catch (error) {
        console.error('[quiz] failed to load daily quiz', error);
        if (alive) setDailyQuizState('error');
      }
    }

    loadDailyQuiz();
    return () => {
      alive = false;
    };
  }, [appLanguage, tradition, spiritualToday]);

  const [communityRank, setCommunityRank] = useState<number | null>(null);
  useEffect(() => {
    fetch('/api/quiz/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const match = data?.by_tradition?.find((t: any) => t.tradition === tradition);
        if (match) setCommunityRank(match.rank ?? null);
      })
      .catch(() => {});
  }, [tradition]);

  useEffect(() => {
    try {
      const answeredRaw = localStorage.getItem(quizAnsweredKey);
      if (answeredRaw !== null && answeredRaw !== '') {
        setSelectedAnswer(Number(answeredRaw));
        setDailyAnswered(true);
      }
    } catch {
      // fail open
    }
  }, [quizAnsweredKey]);

  useEffect(() => {
    const updateCountdown = () => {
      setCountdownLabel(getNextDawnCountdown(timezone).label);
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [timezone]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total    = initialHistory.length;
    const correct  = initialHistory.filter(h => h.is_correct).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Consecutive-day streak
    const uniqueDates = [...new Set(initialHistory.map(h => h.date))].sort((a, b) => b.localeCompare(a));
    let streak = 0;
    const today = spiritualToday;
    let expected = today;
    for (const d of uniqueDates) {
      if (d === expected) {
        streak++;
        const prev = new Date(expected + 'T12:00:00Z');
        prev.setDate(prev.getDate() - 1);
        expected = prev.toISOString().split('T')[0];
      } else break;
    }

    const rank      = computeRank(total, accuracy);
    const rankMeta  = RANK_META[rank];
    const nextRank  = nextRankInfo(rank, total, accuracy);

    // Practice sessions total
    const practiceTotal   = practiceSessions.reduce((s, p) => s + p.questions_total, 0);
    const practiceCorrect = practiceSessions.reduce((s, p) => s + p.questions_correct, 0);

    return { total, correct, accuracy, streak, rank, rankMeta, nextRank, practiceTotal, practiceCorrect };
  }, [initialHistory, practiceSessions, spiritualToday]);

  const displayStreak = quizSaveData?.streak ?? stats.streak;
  const effectiveAnswered = dailyAnswered || Boolean(todayResponse);
  const dailyScorePct = selectedAnswer === null || !dailyQuiz
    ? (todayResponse?.is_correct ? 100 : 0)
    : (selectedAnswer === dailyQuiz.answerIndex ? 100 : 0);
  const resultTone = dailyScorePct >= 80
    ? { border: 'rgba(197,160,89,0.45)', bg: 'rgba(197,160,89,0.12)', text: '#C5A059' }
    : dailyScorePct >= 50
      ? { border: 'rgba(122,171,122,0.40)', bg: 'rgba(122,171,122,0.10)', text: '#7aab7a' }
      : { border: 'rgba(255,255,255,0.10)', bg: 'rgba(255,255,255,0.04)', text: 'rgba(255,255,255,0.88)' };

  // 28-day activity grid — uses full activityDates (never gated)
  const activityGrid = useMemo(() => {
    return generateActivityGrid(activityDates, spiritualToday);
  }, [activityDates, spiritualToday]);

  // Build 4-week calendar grid: array of 28 {dateStr, active, isToday, isFuture}
  const calendarWeeks = useMemo(() => {
    const dateSet = new Set(activityDates);
    const todayMs = Date.UTC(
      parseInt(spiritualToday.slice(0, 4)),
      parseInt(spiritualToday.slice(5, 7)) - 1,
      parseInt(spiritualToday.slice(8, 10)),
      12, 0, 0,
    );
    const days = Array.from({ length: 28 }, (_, i) => {
      const ms = todayMs - (27 - i) * 86_400_000;
      const d = new Date(ms);
      const dateStr = d.toISOString().slice(0, 10);
      return {
        dateStr,
        active: dateSet.has(dateStr),
        isToday: dateStr === spiritualToday,
        dayOfWeek: d.getUTCDay(), // 0=Sun
      };
    });
    // chunk into 4 weeks of 7
    return [days.slice(0, 7), days.slice(7, 14), days.slice(14, 21), days.slice(21, 28)];
  }, [activityDates, spiritualToday]);

  async function handleDailyAnswer(idx: number) {
    if (!dailyQuiz || effectiveAnswered || answerLockedRef.current) return;
    answerLockedRef.current = true;
    setSelectedAnswer(idx);
    try {
      localStorage.setItem(quizAnsweredKey, String(idx));
    } catch {
      // fail open
    }

    if (idx === dailyQuiz.answerIndex) {
      setShowConfetti(true);
    }

    try {
      const resp = await fetch('/api/quiz/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: dailyQuiz.question,
          chosen_index: idx,
          correct_index: dailyQuiz.answerIndex,
          is_correct: idx === dailyQuiz.answerIndex,
          tradition,
          explanation: dailyQuiz.explanation ?? null,
          daily_quiz_id: dailyQuiz.daily_quiz_id ?? null,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setQuizSaveData(data);
      }
    } catch (error) {
      console.error('[quiz] failed to save daily answer', error);
    }

    window.setTimeout(() => {
      setTransitionDirection(1);
      setDailyAnswered(true);
      setCompletedThisSession(true);
      answerLockedRef.current = false;
    }, 800);
  }

  return (
    <div className="min-h-screen pb-28 bg-[var(--divine-bg)] theme-ink">
      <PageIntro
        pageKey="quiz"
        steps={[
          { emoji: '🧠', title: 'Daily Quiz', body: 'One set of questions per day. Test your knowledge of dharmic wisdom.' },
          { emoji: '⏰', title: 'Comes back tomorrow', body: 'Once answered, the quiz resets at dawn (4 AM). Come back daily.' },
        ]}
      />
      <ConfettiOverlay show={showConfetti && dailyScorePct >= 80} onComplete={() => setShowConfetti(false)} />

      {/* ── Back nav ─────────────────────────────────────────────────────── */}
      <div className="px-5 pt-safe pt-4">
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest mb-6 transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-dim)' }}
        >
          <ChevronRight size={12} className="rotate-180" />
          Home
        </Link>
      </div>

      <div className="px-5 mb-6">
        {hasGraceAvailable && !effectiveAnswered && (
          <div className="mb-4 rounded-xl p-3 flex items-center gap-3" style={{ background: 'var(--surface-soft)', borderLeft: '2px solid var(--brand-primary)' }}>
            <span aria-hidden="true">🛡️</span>
            <span className="text-[12px]" style={{ color: 'var(--text-muted-warm)' }}>
              Grace day active — your streak is protected until you answer today
            </span>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{
                color: displayStreak >= 7 ? '#C5A059' : 'rgba(255,255,255,0.72)',
                border: `1px solid ${displayStreak >= 7 ? 'rgba(197,160,89,0.35)' : 'rgba(255,255,255,0.08)'}`,
                background: displayStreak >= 7 ? 'rgba(197,160,89,0.10)' : 'rgba(255,255,255,0.03)',
                boxShadow: displayStreak >= 7 ? '0 0 18px rgba(197,160,89,0.12)' : 'none',
              }}
            >
              <Flame size={12} />
              <span>Day {displayStreak} streak 🔥</span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.14em] font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Daily Quiz
            </span>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {dailyQuizState === 'loading' ? (
              <motion.div
                key="quiz-loading"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="px-5 pb-5 space-y-3"
              >
                <div className="h-5 w-28 rounded-full" style={{ background: 'var(--surface-soft, rgba(0,0,0,0.07))' }} />
                <div className="h-16 rounded-2xl" style={{ background: 'var(--surface-soft, rgba(0,0,0,0.05))' }} />
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-12 rounded-2xl" style={{ background: 'var(--surface-soft, rgba(0,0,0,0.04))', opacity: 1 - i * 0.1 }} />
                ))}
              </motion.div>
            ) : dailyQuizState === 'error' ? (
              <motion.div
                key="quiz-error"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="text-center py-10"
              >
                <p className="text-sm font-semibold text-[var(--brand-ink)]">Unable to load today&apos;s quiz</p>
                <p className="text-xs mt-2 text-[var(--brand-muted)]">Try again in a moment.</p>
              </motion.div>
            ) : completedThisSession && dailyQuiz ? (
              <motion.div
                key="quiz-complete"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="text-center py-4"
              >
                <div
                  className="rounded-[1.6rem] p-6"
                  style={{
                    background: resultTone.bg,
                    border: `1px solid ${resultTone.border}`,
                    boxShadow: dailyScorePct >= 80 ? '0 0 32px rgba(197,160,89,0.14)' : 'none',
                  }}
                >
                  <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[var(--brand-muted)] mb-2">Today&apos;s Result</p>
                  <CountUpScore value={dailyScorePct} color={resultTone.text} />
                  <p className="text-sm font-semibold mt-2 text-[var(--brand-ink)]">
                    {dailyScorePct >= 80 ? 'Well held.' : dailyScorePct >= 50 ? 'Good grasp.' : 'One true correction matters.'}
                  </p>
                </div>
                <React.Fragment>
                  {dailyQuiz.fact && (
                    <div className="mt-4 rounded-2xl p-4 text-left" style={{ background: 'rgba(197,160,89,0.07)', border: '1px solid rgba(197,160,89,0.20)' }}>
                      <p className="text-[10px] uppercase tracking-[0.18em] font-bold mb-2" style={{ color: 'var(--brand-primary)' }}>Did You Know?</p>
                      <p className="text-[14px] italic leading-relaxed premium-serif" style={{ color: 'var(--brand-ink)' }}>{dailyQuiz.fact}</p>
                    </div>
                  )}
                  {dailyQuiz.explanation && (
                    <div className="mt-4 rounded-2xl p-4 text-left bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[var(--brand-muted)] mb-2">Explanation</p>
                      <p className="text-xs leading-relaxed text-[var(--brand-muted)]">{dailyQuiz.explanation}</p>
                    </div>
                  )}
                </React.Fragment>
              </motion.div>
            ) : effectiveAnswered && dailyQuiz ? (
              <motion.div
                key="quiz-locked"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ border: '1.5px solid rgba(197,160,89,0.45)', background: 'rgba(197,160,89,0.10)' }}>
                  <Check size={26} style={{ color: '#C5A059' }} />
                </div>
                <h2 className="text-xl font-bold text-[var(--brand-ink)]">Quiz complete for today</h2>
                <p className="mt-2 text-sm" style={{ color: '#C5A059' }}>
                  {todayResponse ? `${todayResponse.is_correct ? '100' : '0'}%` : 'Sadhana recorded'}
                </p>
                <p className="mt-2 text-xs text-[var(--brand-muted)]">Next quiz unlocks at dawn 🌅</p>
                <p className="mt-1 text-sm font-semibold text-[var(--brand-ink)]">{countdownLabel}</p>
                <div className="mt-5 rounded-2xl p-4 text-left bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[var(--brand-muted)] mb-2">Today&apos;s Insight</p>
                  <p className="text-sm text-[var(--brand-ink)]/85">{dailyQuiz.fact || dailyQuiz.explanation || dailyQuiz.question}</p>
                </div>
              </motion.div>
            ) : dailyQuiz ? (
              <motion.div
                key={`quiz-question-${dailyQuiz.daily_quiz_id ?? dailyQuiz.date}`}
                initial={{ opacity: 0, x: transitionDirection > 0 ? 28 : -28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: transitionDirection > 0 ? -28 : 28 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="px-5 pb-5"
              >
                <div className="mb-4">
                  <span className="text-[10px] uppercase tracking-widest font-bold mb-2 block" style={{ color: 'var(--brand-primary)', opacity: 0.7 }}>
                    🧠 {tradition} · Daily Shastra
                  </span>
                  <p className="text-[1.25rem] font-semibold leading-snug premium-serif min-h-[4rem]" style={{ color: 'var(--text-cream)' }}>
                    {dailyQuiz.question}
                  </p>
                </div>
                <div className="space-y-3">
                  {dailyQuiz.options.map((opt, idx) => {
                    const isChosen = selectedAnswer === idx;
                    const isCorrect = idx === dailyQuiz.answerIndex;
                    const showAnsweredState = selectedAnswer !== null;
                    let bg = 'rgba(255,255,255,0.03)';
                    let border = 'rgba(255,255,255,0.06)';
                    let text = 'rgba(255,255,255,0.90)';
                    if (showAnsweredState && isCorrect) {
                      bg = 'rgba(60,180,110,0.14)';
                      border = 'rgba(60,180,110,0.35)';
                      text = '#8ce4a8';
                    } else if (showAnsweredState && isChosen && !isCorrect) {
                      bg = 'rgba(220,90,90,0.14)';
                      border = 'rgba(220,90,90,0.35)';
                      text = '#f0a0a0';
                    }

                    return (
                      <motion.button
                        key={idx}
                        disabled={selectedAnswer !== null}
                        onClick={() => handleDailyAnswer(idx)}
                        className="w-full text-left rounded-2xl px-4 py-4 border"
                        style={{ background: bg, borderColor: border, color: text }}
                        whileTap={{ scale: selectedAnswer === null ? 0.985 : 1 }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold border border-[var(--card-border)] bg-black/10">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="flex-1 text-[14px] font-medium">{opt}</span>
                          {showAnsweredState && isCorrect ? <CheckCircle2 size={16} /> : null}
                          {showAnsweredState && isChosen && !isCorrect ? <XCircle size={16} /> : null}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
                {selectedAnswer !== null && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                    {dailyQuiz.fact && (
                      <div className="rounded-2xl p-4 text-left mb-4" style={{ background: 'rgba(197,160,89,0.07)', border: '1px solid rgba(197,160,89,0.20)' }}>
                        <p className="text-[10px] uppercase tracking-[0.18em] font-bold mb-2" style={{ color: 'var(--brand-primary)' }}>Did You Know?</p>
                        <p className="text-[14px] italic leading-relaxed premium-serif" style={{ color: 'var(--text-cream)' }}>{dailyQuiz.fact}</p>
                      </div>
                    )}
                    {dailyQuiz.explanation && (
                      <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.06]">
                        <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-[var(--brand-muted)] mb-2">Explanation</p>
                        <p className="text-[12px] leading-relaxed text-[var(--text-dim)]">{dailyQuiz.explanation}</p>
                      </div>
                    )}
                    {dailyQuiz.source && (
                      <p className="text-[10px] italic mt-4 text-right" style={{ color: 'var(--text-dim)' }}>
                        — {dailyQuiz.source}
                      </p>
                    )}
                  </motion.div>
                )}
                {!effectiveAnswered && initialHistory.length > 0 && initialHistory[0]?.explanation && (
                  <div className="mt-6 rounded-xl overflow-hidden" style={{ background: 'var(--surface-soft)', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                    <details className="group">
                      <summary className="cursor-pointer px-4 py-3 text-[12px] font-bold uppercase tracking-widest flex items-center justify-between outline-none" style={{ color: 'var(--text-dim)' }}>
                        Yesterday&apos;s insight
                        <ChevronRight size={14} className="group-open:rotate-90 transition-transform" />
                      </summary>
                      <div className="px-4 pb-4 pt-1">
                        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-cream)' }}>
                          {initialHistory[0].explanation}
                        </p>
                      </div>
                    </details>
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Hero — Rank card ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mx-5 rounded-[2rem] p-6 mb-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${stats.rankMeta.color}, rgba(0,0,0,0.40))`,
          border: `1px solid ${stats.rankMeta.border}`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.28)`,
        }}
      >
        {/* Ambient glow */}
        <div
          className="absolute -top-8 -right-8 w-36 h-36 blur-[64px] opacity-25 rounded-full"
          style={{ background: stats.rankMeta.text }}
        />

        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-dim)' }}
              >
                Quiz Mastery
              </span>
              {isPro && (
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] px-2 py-1 rounded-full flex items-center gap-1"
                  style={{ background: 'rgba(197, 160, 89,0.20)', color: '#C5A059', border: '1px solid rgba(197, 160, 89,0.30)' }}>
                  <Star size={9} className="fill-current" /> Pro
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mb-1">
              <span className="text-4xl" aria-hidden="true">{stats.rankMeta.emoji}</span>
              <div>
                <h1
                  className="text-3xl font-bold leading-none mb-0.5"
                  style={{ fontFamily: 'var(--font-serif)', color: stats.rankMeta.text }}
                >
                  {stats.rank}
                </h1>
                <p className="text-[12px]" style={{ color: 'var(--text-dim)' }}>{stats.rankMeta.desc}</p>
              </div>
            </div>

            {/* Next rank progress */}
            {stats.nextRank && (
              <p className="text-[11px] mt-3 leading-relaxed" style={{ color: 'var(--text-muted-warm)' }}>
                {stats.nextRank.questionsNeeded > 0
                  ? `${stats.nextRank.questionsNeeded} more question${stats.nextRank.questionsNeeded !== 1 ? 's' : ''}`
                  : `${stats.nextRank.accNeeded}% more accuracy`
                } to reach{' '}
                <span style={{ color: stats.rankMeta.text }}>{stats.nextRank.next}</span>
              </p>
            )}
          </div>

          {/* Karma badge */}
          <div className="text-right">
            <div
              className="px-3 py-2 rounded-2xl text-center min-w-[70px]"
              style={glassAmber}
            >
              <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--brand-primary)' }}>
                {karmaPoints.toLocaleString()}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-dim)' }}>
                Karma
              </p>
            </div>
          </div>
        </div>

        {/* Tradition badge */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Tradition:</span>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
            style={{ background: `${meta.accentColour}22`, color: meta.accentColour, border: `1px solid ${meta.accentColour}44` }}
          >
            {tradition}
          </span>
        </div>
      </motion.div>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 px-5 mb-4">
        {[
          { label: 'Day Streak',     value: displayStreak,         icon: Flame,   color: '#ff7043', suffix: displayStreak > 0 ? '🔥' : '' },
          { label: 'Accuracy',       value: `${stats.accuracy}%`,  icon: Target,  color: meta.accentColour },
          { label: 'Total Answered', value: stats.total,           icon: Trophy,  color: '#ffca28' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="rounded-2xl p-4 text-center"
            style={{ background: 'transparent' }}
          >
            <s.icon size={18} className="mx-auto mb-2" style={{ color: s.color }} />
            <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>
              {s.value}{s.suffix ?? ''}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-dim)' }}>
              {s.label}
            </p>
          </motion.div>
        ))}
      </div>
      
      {/* ── Community Rank Chip ────────────────────────────────────────── */}
      {communityRank !== null && communityRank <= 500 && (
        <div className="px-5 mb-6">
          <Link href="/scoreboard" className="block text-center rounded-xl p-3 transition-transform active:scale-[0.98]" style={glassAmber}>
            <p className="text-[11px] font-bold" style={{ color: 'var(--brand-primary)' }}>
              🏆 You rank #{communityRank} among {tradition} seekers this week
            </p>
          </Link>
        </div>
      )}

      {/* ── Practice Mode CTA ────────────────────────────────────────────── */}
      <div className="px-5 mb-6">
        {isPro ? (
          <Link
            href="/quiz/practice"
            className="flex items-center justify-between w-full rounded-[1.6rem] p-5 group transition-all"
            style={{
              background: `linear-gradient(135deg, ${meta.accentColour}18 0%, rgba(0,0,0,0.30) 100%)`,
              border: `1px solid ${meta.accentColour}30`,
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: `${meta.accentColour}22` }}>
                <Zap size={20} style={{ color: meta.accentColour }} />
              </div>
              <div className="text-left">
                <p className="font-bold text-[15px]" style={{ color: 'var(--text-cream)' }}>Practice Mode</p>
                <p className="text-[12px]" style={{ color: 'var(--text-muted-warm)' }}>
                  Choose topic · Choose difficulty · 5 questions
                </p>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: meta.accentColour }} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ) : (
          <button
            onClick={() => setProModalOpen(true)}
            className="flex items-center justify-between w-full rounded-[1.6rem] p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <Lock size={18} style={{ color: 'var(--text-dim)' }} />
              </div>
              <div className="text-left">
                <p className="font-bold text-[15px] flex items-center gap-2" style={{ color: 'var(--text-cream)' }}>
                  Practice Mode
                  <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(197, 160, 89,0.18)', color: '#C5A059' }}>
                    Pro
                  </span>
                </p>
                <p className="text-[12px]" style={{ color: 'var(--text-dim)' }}>
                  Unlimited on-demand sessions by topic
                </p>
              </div>
            </div>
            <div
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(197, 160, 89,0.15)', color: '#C5A059' }}
            >
              Unlock
            </div>
          </button>
        )}
      </div>

      {/* ── Topic Mastery ────────────────────────────────────────────────── */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--text-dim)' }}>
            Topic Mastery
          </h2>
          {!isPro && (
            <span className="text-[10px] font-semibold" style={{ color: 'var(--text-dim)' }}>Pro only</span>
          )}
        </div>

        <div className={`relative grid grid-cols-2 gap-3 ${!isPro ? 'pointer-events-none' : ''}`}>
          {TOPICS.map((topic, i) => (
            isPro ? (
              <Link
                key={topic.key}
                href={`/quiz/practice?topic=${topic.key}`}
                className="rounded-[1.4rem] p-4 flex items-center gap-3 transition-all hover:scale-[1.01]"
                style={{ background: `${topic.color}14`, border: `1px solid ${topic.color}28` }}
              >
                <span className="text-2xl" aria-hidden="true">{topic.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold leading-tight truncate" style={{ color: 'var(--text-cream)' }}>
                    {topic.label}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div
                        className="h-1 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, stats.accuracy + (i * 5 - 10))}%`,
                          background: topic.color,
                        }}
                      />
                    </div>
                    <span className="text-[9px] font-bold" style={{ color: topic.color }}>
                      {Math.max(0, Math.min(100, stats.accuracy + (i * 5 - 10)))}%
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
              <div
                key={topic.key}
                className="rounded-[1.4rem] p-4 flex items-center gap-3"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', opacity: 0.4 }}
              >
                <span className="text-2xl grayscale" aria-hidden="true">{topic.emoji}</span>
                <div>
                  <p className="text-[12px] font-semibold" style={{ color: 'var(--text-dim)' }}>{topic.label}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Practice to unlock</p>
                </div>
              </div>
            )
          ))}

          {/* Pro blur overlay for non-Pro users */}
          {!isPro && (
            <motion.div
              className="absolute inset-0 rounded-[1.6rem] flex flex-col items-center justify-center gap-3"
              style={{ background: 'rgba(10,10,8,0.75)', backdropFilter: 'blur(6px)' }}
            >
              <Lock size={22} style={{ color: 'var(--text-dim)' }} />
              <p className="text-[13px] font-semibold" style={{ color: 'var(--text-cream)' }}>Topic Mastery</p>
              <p className="text-[11px] text-center px-6" style={{ color: 'var(--text-dim)' }}>
                Unlock Practice Mode to track your mastery per topic
              </p>
              <button
                onClick={() => setProModalOpen(true)}
                className="mt-1 px-4 py-2 rounded-full text-[11px] font-bold"
                style={{ background: 'rgba(197, 160, 89,0.20)', color: '#C5A059', border: '1px solid rgba(197, 160, 89,0.30)' }}
              >
                Go Pro
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Practice sessions (Pro) ──────────────────────────────────────── */}
      {isPro && practiceSessions.length > 0 && (
        <div className="px-5 mb-6">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] mb-3" style={{ color: 'var(--text-dim)' }}>
            Recent Practice
          </h2>
          <div className="space-y-2.5">
            {practiceSessions.slice(0, 5).map((s) => {
              const topic = TOPICS.find(t => t.key === s.topic);
              const pct   = s.questions_total > 0 ? Math.round((s.questions_correct / s.questions_total) * 100) : 0;
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-4 rounded-2xl px-4 py-3"
                  style={glass}
                >
                  <span className="text-xl" aria-hidden="true">{topic?.emoji ?? '📖'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-cream)' }}>
                      {topic?.label ?? s.topic}
                    </p>
                    <p className="text-[10px] capitalize" style={{ color: 'var(--text-dim)' }}>
                      {s.difficulty} · {s.questions_correct}/{s.questions_total} correct
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold" style={{ color: pct >= 80 ? '#7aab7a' : pct >= 60 ? meta.accentColour : '#d47a6a' }}>
                      {pct}%
                    </p>
                    <p className="text-[9px]" style={{ color: 'var(--text-dim)' }}>
                      +{s.karma_earned}✨
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 28-Day Calendar ──────────────────────────────────────────────── */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--text-dim)' }}>
            28-Day Practice
          </h2>
          <span className="text-[11px] font-semibold tabular-nums" style={{ color: meta.accentColour }}>
            {activityGrid.filter(Boolean).length} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>/ 28 days</span>
          </span>
        </div>

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 mb-1.5">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="text-center text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>
              {d}
            </div>
          ))}
        </div>

        {/* 4 weeks × 7 days */}
        <div className="space-y-1.5">
          {calendarWeeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1.5">
              {week.map((day, di) => (
                <motion.div
                  key={day.dateStr}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: (wi * 7 + di) * 0.012, duration: 0.2, ease: 'backOut' }}
                  className="aspect-square rounded-lg flex items-center justify-center"
                  style={
                    day.isToday
                      ? {
                          background: day.active ? meta.accentColour : 'transparent',
                          border: `2px solid ${meta.accentColour}`,
                          boxShadow: day.active ? `0 0 10px ${meta.accentColour}60` : undefined,
                        }
                      : day.active
                      ? {
                          background: `${meta.accentColour}28`,
                          border: `1px solid ${meta.accentColour}55`,
                          boxShadow: `0 0 6px ${meta.accentColour}30`,
                        }
                      : {
                          background: 'var(--surface-soft, rgba(0,0,0,0.05))',
                          border: '1px solid transparent',
                        }
                  }
                >
                  {day.active && (
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: day.isToday ? (day.active ? '#fff' : meta.accentColour) : meta.accentColour,
                        opacity: day.isToday && day.active ? 0.9 : 0.7,
                      }}
                    />
                  )}
                  {day.isToday && !day.active && (
                    <div className="w-1 h-1 rounded-full" style={{ background: meta.accentColour, opacity: 0.6 }} />
                  )}
                </motion.div>
              ))}
            </div>
          ))}
        </div>

        <p className="text-[10px] mt-3" style={{ color: 'var(--text-dim)' }}>
          Each column is a day of the week · Today is highlighted
        </p>
      </div>

      {/* ── History ──────────────────────────────────────────────────────── */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] flex items-center gap-2" style={{ color: 'var(--text-dim)' }}>
            <History size={13} />
            Learning History
          </h2>
          {!isPro && (
            <button
              onClick={() => setProModalOpen(true)}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(197, 160, 89,0.15)', color: '#C5A059' }}
            >
              Full history (Pro)
            </button>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          {initialHistory.length === 0 ? (
            <div
              className="text-center py-16 rounded-[1.4rem]"
              style={{ border: '1px dashed rgba(255,255,255,0.10)' }}
            >
              <BookOpen size={28} className="mx-auto mb-3" style={{ color: 'var(--text-dim)' }} />
              <p className="text-[13px] font-semibold" style={{ color: 'var(--text-dim)' }}>No history yet</p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-dim)', opacity: 0.7 }}>
                Answer the daily spark on the home screen to start
              </p>
              <Link
                href="/home"
                className="inline-block mt-4 px-4 py-2 rounded-full text-[11px] font-bold"
                style={{ background: 'rgba(197, 160, 89,0.15)', color: '#C5A059' }}
              >
                Go to Home
              </Link>
            </div>
          ) : (
            <>
              {initialHistory.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.28 }}
                  className="mb-3 px-0 py-3 border-b"
                  style={{ borderColor: 'var(--card-border, rgba(0,0,0,0.06))' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {item.is_correct
                        ? <CheckCircle2 size={18} className="text-green-400" />
                        : <XCircle      size={18} className="text-red-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
                          {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span
                          className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                          style={{ background: item.is_correct ? 'rgba(100,200,100,0.12)' : 'rgba(200,80,80,0.12)',
                            color: item.is_correct ? '#7acd7a' : '#cd7a7a' }}
                        >
                          {item.is_correct ? `+10 Karma` : `+2 Karma`}
                        </span>
                      </div>
                      <p className="text-[13px] leading-relaxed mb-2" style={{ color: 'var(--text-cream)' }}>
                        {item.question}
                      </p>
                      {!item.is_correct && item.explanation && (
                        <div
                          className="rounded-xl px-3 py-2 mt-2"
                          style={{ background: 'rgba(100,140,220,0.10)', border: '1px solid rgba(100,140,220,0.18)' }}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8888cc' }}>
                            Why?
                          </p>
                          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted-warm)' }}>
                            {item.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Gate notice for free users */}
              {!isPro && (
                <button
                  onClick={() => setProModalOpen(true)}
                  className="w-full rounded-[1.4rem] py-4 text-center mt-2"
                  style={{ border: '1px dashed rgba(197, 160, 89,0.28)', background: 'rgba(197, 160, 89,0.05)' }}
                >
                  <Lock size={14} className="mx-auto mb-1.5" style={{ color: 'var(--text-dim)' }} />
                  <p className="text-[12px] font-semibold" style={{ color: '#C5A059' }}>
                    See your full history with Pro
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
                    Showing last 7 days only
                  </p>
                </button>
              )}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ── Premium Modal ──────────────────────────────────────────────────── */}
      <PremiumActivateModal open={proModalOpen} onClose={() => setProModalOpen(false)} />
    </div>
  );
}
