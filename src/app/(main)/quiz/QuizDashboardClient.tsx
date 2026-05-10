'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, CheckCircle2, XCircle,
  Flame, Target, Trophy, Calendar, History,
  Lock, Zap, BookOpen, Star,
} from 'lucide-react';
import { getTraditionMeta } from '@/lib/tradition-config';
import PremiumActivateModal from '@/components/premium/PremiumActivateModal';

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

interface Props {
  userId:           string;
  userName:         string;
  tradition:        string;
  isPro:            boolean;
  karmaPoints:      number;
  initialHistory:   QuizResponse[];
  practiceSessions: PracticeSession[];
}

// ── Rank system ───────────────────────────────────────────────────────────────

const RANK_META = {
  Seeker:  { emoji: '🌱', color: 'rgba(100,140,100,0.20)',  border: 'rgba(100,160,100,0.35)', text: '#7aab7a',  desc: 'Beginning the journey' },
  Jigyasu: { emoji: '📖', color: 'rgba(180,140,80,0.20)',   border: 'rgba(180,140,80,0.40)',  text: '#c8a050',  desc: 'Curious learner' },
  Shishya: { emoji: '🪔', color: 'rgba(200,146,74,0.22)',   border: 'rgba(200,146,74,0.44)',  text: '#c8924a',  desc: 'Devoted student' },
  Gyani:   { emoji: '🧿', color: 'rgba(100,140,220,0.20)',  border: 'rgba(100,140,220,0.40)', text: '#6a9cd4',  desc: 'Knowledgeable one' },
  Pandit:  { emoji: '🏵️', color: 'rgba(220,180,60,0.22)',  border: 'rgba(220,180,60,0.50)',  text: '#d4b840',  desc: 'Master of tradition' },
} as const;

type RankKey = keyof typeof RANK_META;

function computeRank(total: number, accuracy: number): RankKey {
  if (total >= 30 && accuracy >= 80) return 'Pandit';
  if (total >= 15 && accuracy >= 65) return 'Gyani';
  if (total >= 7  && accuracy >= 50) return 'Shishya';
  if (total >= 1)                    return 'Jigyasu';
  return 'Seeker';
}

function nextRankInfo(rank: RankKey, total: number, accuracy: number) {
  if (rank === 'Pandit') return null;
  const targets: Record<RankKey, { minTotal: number; minAcc: number; next: RankKey }> = {
    Seeker:  { minTotal: 1,  minAcc: 0,  next: 'Jigyasu' },
    Jigyasu: { minTotal: 7,  minAcc: 50, next: 'Shishya' },
    Shishya: { minTotal: 15, minAcc: 65, next: 'Gyani'   },
    Gyani:   { minTotal: 30, minAcc: 80, next: 'Pandit'  },
    Pandit:  { minTotal: 99, minAcc: 99, next: 'Pandit'  },
  };
  const t = targets[rank];
  const questionsNeeded = Math.max(0, t.minTotal - total);
  const accNeeded       = Math.max(0, t.minAcc - accuracy);
  return { next: t.next, questionsNeeded, accNeeded };
}

// ── Topic meta ────────────────────────────────────────────────────────────────

const TOPICS = [
  { key: 'deities',    emoji: '🙏', label: 'Deities & Stories',   color: '#c8924a' },
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
  background: 'rgba(200,146,74,0.07)',
  border: '1px solid rgba(200,146,74,0.18)',
} as const;

// ── Component ─────────────────────────────────────────────────────────────────

export default function QuizDashboardClient({
  userName, tradition, isPro, karmaPoints, initialHistory, practiceSessions,
}: Props) {
  const meta = getTraditionMeta(tradition);
  const [proModalOpen, setProModalOpen] = useState(false);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total    = initialHistory.length;
    const correct  = initialHistory.filter(h => h.is_correct).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Consecutive-day streak
    const uniqueDates = [...new Set(initialHistory.map(h => h.date))].sort((a, b) => b.localeCompare(a));
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let expected = today;
    for (const d of uniqueDates) {
      if (d === expected) {
        streak++;
        const prev = new Date(expected);
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
  }, [initialHistory, practiceSessions]);

  // 28-day activity grid
  const activityGrid = useMemo(() => {
    const dateSet = new Set(initialHistory.map(h => h.date));
    return Array.from({ length: 28 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (27 - i));
      return dateSet.has(d.toISOString().split('T')[0]);
    });
  }, [initialHistory]);

  return (
    <div className="min-h-screen pb-28" style={{ background: '#0a0a08', color: 'var(--text-cream)' }}>

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
                  style={{ background: 'rgba(200,146,74,0.20)', color: '#c8924a', border: '1px solid rgba(200,146,74,0.30)' }}>
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
      <div className="grid grid-cols-3 gap-3 px-5 mb-6">
        {[
          { label: 'Day Streak',     value: stats.streak,          icon: Flame,   color: '#ff7043', suffix: stats.streak > 0 ? '🔥' : '' },
          { label: 'Accuracy',       value: `${stats.accuracy}%`,  icon: Target,  color: meta.accentColour },
          { label: 'Total Answered', value: stats.total,           icon: Trophy,  color: '#ffca28' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="rounded-2xl p-4 text-center"
            style={glass}
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
                    style={{ background: 'rgba(200,146,74,0.18)', color: '#c8924a' }}>
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
              style={{ background: 'rgba(200,146,74,0.15)', color: '#c8924a' }}
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
                style={{ background: 'rgba(200,146,74,0.20)', color: '#c8924a', border: '1px solid rgba(200,146,74,0.30)' }}
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

      {/* ── Consistency calendar ──────────────────────────────────────────── */}
      <div className="px-5 mb-6">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] mb-3 flex items-center gap-2" style={{ color: 'var(--text-dim)' }}>
          <Calendar size={13} />
          28-Day Consistency
        </h2>
        <div className="rounded-[1.4rem] p-4" style={glass}>
          <div className="grid grid-cols-7 gap-1.5">
            {activityGrid.map((active, i) => (
              <div
                key={i}
                className="aspect-square rounded-[4px]"
                style={active
                  ? { background: `${meta.accentColour}30`, border: `1px solid ${meta.accentColour}50` }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }
                }
              />
            ))}
          </div>
          <p className="text-[10px] mt-3 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            Answer the daily question to keep your streak alive.
          </p>
        </div>
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
              style={{ background: 'rgba(200,146,74,0.15)', color: '#c8924a' }}
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
                style={{ background: 'rgba(200,146,74,0.15)', color: '#c8924a' }}
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
                  className="mb-3 rounded-[1.4rem] p-4"
                  style={glass}
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
                  style={{ border: '1px dashed rgba(200,146,74,0.28)', background: 'rgba(200,146,74,0.05)' }}
                >
                  <Lock size={14} className="mx-auto mb-1.5" style={{ color: 'var(--text-dim)' }} />
                  <p className="text-[12px] font-semibold" style={{ color: '#c8924a' }}>
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
