'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Lock, Flame, CheckCircle2, Trophy, TrendingUp, Calendar } from 'lucide-react';
import type { GuidedPlan, GuidedPathStatus } from '@/lib/guided-paths';

interface PlanEntry {
  plan:        GuidedPlan;
  status:      GuidedPathStatus | null;
  dayReached:  number;
  startedAt:   string | null;
  completedAt: string | null;
}

interface Props {
  isPro:               boolean;
  planData:            PlanEntry[];
  totalDaysCompleted:  number;
  plansCompleted:      number;
  currentStreak:       number;
}

// Tiny progress ring for plan cards
function Ring({ pct, color, size = 44 }: { pct: number; color: string; size?: number }) {
  const r   = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}22`} strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

// Paywall blur overlay
function ProBlur({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[1.4rem] z-10"
      style={{ background: 'rgba(10,7,3,0.70)', backdropFilter: 'blur(8px)' }}>
      <Lock size={22} className="text-amber-400 mb-2" />
      <p className="text-sm font-semibold text-amber-100 mb-1">Sangam Pro</p>
      <p className="text-[11px] text-amber-200/70 text-center max-w-[160px] mb-3">
        Unlock per-plan analytics, history & consistency score
      </p>
      <button
        onClick={onUpgrade}
        className="px-4 py-2 rounded-full text-xs font-bold"
        style={{ background: 'linear-gradient(135deg, #C8924A, #e0a85a)', color: '#1a0c04' }}
      >
        Upgrade to Pro
      </button>
    </div>
  );
}

export default function InsightsClient({ isPro, planData, totalDaysCompleted, plansCompleted, currentStreak }: Props) {
  const router = useRouter();

  const activePlan = planData.find(p => p.status === 'active');

  return (
    <div className="min-h-screen pb-28">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full glass-panel border border-white/10 flex items-center justify-center"
        >
          <ChevronLeft size={20} style={{ color: '#C8924A' }} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-lg" style={{ color: 'var(--brand-ink)' }}>Sadhana Insights</h1>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Your guided path progress</p>
        </div>
      </div>

      {/* ── FREE STATS — available to everyone ── */}
      <div className="px-4 mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--brand-muted)' }}>
          Overview
        </p>
        <div className="grid grid-cols-3 gap-3">

          {/* Current streak */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="glass-panel rounded-[1.2rem] border border-white/8 p-4 flex flex-col items-center text-center"
          >
            <Flame size={20} className="mb-1.5" style={{ color: '#C8924A' }} />
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.7rem', fontWeight: 700, color: 'var(--brand-ink)', lineHeight: 1 }}>
              {currentStreak}
            </p>
            <p className="text-[9px] mt-1" style={{ color: 'var(--text-dim)' }}>Day streak</p>
          </motion.div>

          {/* Total days */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
            className="glass-panel rounded-[1.2rem] border border-white/8 p-4 flex flex-col items-center text-center"
          >
            <Calendar size={20} className="mb-1.5" style={{ color: '#b07ad4' }} />
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.7rem', fontWeight: 700, color: 'var(--brand-ink)', lineHeight: 1 }}>
              {totalDaysCompleted}
            </p>
            <p className="text-[9px] mt-1" style={{ color: 'var(--text-dim)' }}>Days done</p>
          </motion.div>

          {/* Plans finished */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-panel rounded-[1.2rem] border border-white/8 p-4 flex flex-col items-center text-center"
          >
            <Trophy size={20} className="mb-1.5" style={{ color: '#d4643a' }} />
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.7rem', fontWeight: 700, color: 'var(--brand-ink)', lineHeight: 1 }}>
              {plansCompleted}
            </p>
            <p className="text-[9px] mt-1" style={{ color: 'var(--text-dim)' }}>Plans done</p>
          </motion.div>
        </div>
      </div>

      {/* Active plan spotlight */}
      {activePlan && (
        <div className="px-4 mb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--brand-muted)' }}>
            Current Plan
          </p>
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="rounded-[1.4rem] px-5 py-4 flex items-center gap-4"
            style={{
              background: `linear-gradient(135deg, ${activePlan.plan.accentColor}16, ${activePlan.plan.accentColor}06)`,
              border: `1px solid ${activePlan.plan.accentColor}30`,
            }}
          >
            <div className="relative flex-shrink-0">
              <Ring
                pct={Math.round(((activePlan.dayReached - 1) / activePlan.plan.duration) * 100)}
                color={activePlan.plan.accentColor}
              />
              <div className="absolute inset-0 flex items-center justify-center text-base">
                {activePlan.plan.emoji}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold" style={{ color: activePlan.plan.accentColor }}>
                Day {activePlan.dayReached} of {activePlan.plan.duration}
              </p>
              <p className="text-[13.5px] font-semibold mt-0.5 leading-tight" style={{ color: 'var(--brand-ink)' }}>
                {activePlan.plan.title}
              </p>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: `${activePlan.plan.accentColor}20` }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round(((activePlan.dayReached - 1) / activePlan.plan.duration) * 100)}%`,
                    background: activePlan.plan.accentColor,
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── PRO SECTION — per-plan cards with day-by-day calendar ── */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-muted)' }}>
            Per-Plan History
          </p>
          {!isPro && (
            <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: 'rgba(251,191,36,0.85)' }}>
              <Lock size={10} /> Pro only
            </div>
          )}
        </div>

        <div className="space-y-3">
          {planData.filter(p => p.status !== null).map((entry, idx) => {
            const { plan, status, dayReached, startedAt, completedAt } = entry;
            const pct = plan.duration > 0 ? Math.round(((dayReached - 1) / plan.duration) * 100) : 0;
            const startStr = startedAt ? new Date(startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—';
            const doneStr  = completedAt ? new Date(completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : null;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.20 + idx * 0.06 }}
                className="relative rounded-[1.4rem] overflow-hidden"
                style={{
                  background: 'var(--surface-raised)',
                  border: `1px solid ${status === 'active' ? plan.borderColor : 'rgba(200,146,74,0.10)'}`,
                }}
              >
                <div className="p-4">
                  {/* Card header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">{plan.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold leading-tight" style={{ color: 'var(--brand-ink)' }}>
                        {plan.title}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
                        Started {startStr}{doneStr ? ` · Completed ${doneStr}` : ''}
                      </p>
                    </div>
                    {status === 'completed' && (
                      <CheckCircle2 size={18} style={{ color: '#6ad87a', flexShrink: 0 }} />
                    )}
                    {status === 'active' && (
                      <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: `${plan.accentColor}1a`, color: plan.accentColor }}>
                        <Flame size={9} /> Active
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: `${plan.accentColor}18` }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: status === 'completed' ? '#6ad87a' : plan.accentColor }}
                      />
                    </div>
                    <p className="text-[10px] font-semibold flex-shrink-0" style={{ color: plan.accentColor }}>
                      {dayReached - 1}/{plan.duration}d
                    </p>
                  </div>

                  {/* Consistency score — Pro only */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-dim)' }}>
                      <TrendingUp size={12} />
                      Consistency
                    </div>
                    <p className="text-[11px] font-semibold" style={{ color: isPro ? plan.accentColor : 'var(--text-dim)' }}>
                      {isPro ? `${pct}%` : '—'}
                    </p>
                  </div>

                  {/* Day dot grid — Pro only */}
                  {isPro && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: `${plan.accentColor}10` }}>
                      <p className="text-[9px] mb-2" style={{ color: 'var(--text-dim)' }}>Days completed</p>
                      <div className="flex flex-wrap gap-1.5">
                        {plan.days.map(d => {
                          const done   = d.day < dayReached;
                          const active = d.day === dayReached && status === 'active';
                          return (
                            <div
                              key={d.day}
                              title={`Day ${d.day}: ${d.title}`}
                              className="w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold"
                              style={{
                                background: done
                                  ? (status === 'completed' ? 'rgba(80,200,80,0.25)' : `${plan.accentColor}30`)
                                  : 'rgba(255,255,255,0.04)',
                                color: done ? (status === 'completed' ? '#6ad87a' : plan.accentColor) : 'var(--text-dim)',
                                border: active ? `1.5px solid ${plan.accentColor}` : '1px solid transparent',
                              }}
                            >
                              {done ? '✓' : d.day}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pro paywall blur */}
                {!isPro && (
                  <ProBlur onUpgrade={() => router.push('/premium')} />
                )}
              </motion.div>
            );
          })}

          {/* If no plans started yet */}
          {planData.filter(p => p.status !== null).length === 0 && (
            <div className="text-center py-12 space-y-2">
              <p className="text-3xl">🗺️</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--brand-ink)' }}>No plans started yet</p>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Begin a guided plan to see your progress here</p>
              <button
                onClick={() => router.back()}
                className="mt-3 px-5 py-2.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(200,146,74,0.18)', color: 'var(--brand-ink)', border: '1px solid rgba(200,146,74,0.28)' }}
              >
                Browse Plans
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
