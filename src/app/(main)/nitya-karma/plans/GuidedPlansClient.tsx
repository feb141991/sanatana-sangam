'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle2, Play, X, Flame, ArrowRight, Clock, Target, BarChart2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import type { GuidedPlan, GuidedPathStatus, GuidedPlanDay } from '@/lib/guided-paths';
import ConfettiOverlay from '@/components/ui/ConfettiOverlay';

interface Props {
  userId:    string;
  tradition: string;
  plans:     GuidedPlan[];
  statusMap: Record<string, GuidedPathStatus>;
  dayMap:    Record<string, number>;          // planId → day_reached (1-indexed)
}

// ── Day Content View (focused practice for today) ─────────────────────────────
function DayView({
  plan,
  day,
  totalDays,
  onBack,
  onComplete,
  completing,
}: {
  plan:       GuidedPlan;
  day:        GuidedPlanDay;
  totalDays:  number;
  onBack:     () => void;
  onComplete: () => void;
  completing: boolean;
}) {
  return (
    <motion.div
      key="day-view"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      {/* Day header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'var(--surface-raised)', border: '1px solid rgba(200,146,74,0.15)' }}
        >
          <ChevronLeft size={14} style={{ color: 'var(--brand-muted)' }} />
        </button>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: plan.accentColor }}>
          Day {day.day} of {totalDays}
        </p>
      </div>

      {/* Day content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4 space-y-4">

        {/* Focus tag */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
          style={{ background: `${plan.accentColor}18`, border: `1px solid ${plan.accentColor}33`, color: plan.accentColor }}
        >
          <Target size={11} />
          {day.focus}
        </div>

        {/* Day title */}
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.65rem', fontWeight: 600, color: 'var(--brand-ink)', lineHeight: 1.18, letterSpacing: '-0.02em' }}>
          {day.title}
        </h3>

        {/* Duration */}
        <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--brand-muted)' }}>
          <Clock size={14} />
          <span>{day.duration} minutes</span>
        </div>

        {/* Practice description */}
        <div
          className="rounded-[1.3rem] px-5 py-4"
          style={{ background: `${plan.accentColor}0d`, border: `1px solid ${plan.accentColor}1a` }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2.5" style={{ color: plan.accentColor }}>
            Today&apos;s Practice
          </p>
          <p className="text-[14px] leading-relaxed" style={{ color: 'var(--brand-ink)' }}>
            {day.practice}
          </p>
        </div>

        {/* Encouragement */}
        <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
          🙏 Approach today&apos;s practice with sincerity. Even a few minutes with full attention is more powerful than hours of distraction.
        </p>
      </div>

      {/* Mark complete footer */}
      <div
        className="flex-shrink-0 px-5 pt-4 pb-3"
        style={{ borderTop: '1px solid rgba(200,146,74,0.1)', background: 'var(--surface-base)' }}
      >
        <motion.button
          onClick={onComplete}
          disabled={completing}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-[1.1rem] font-semibold text-sm flex items-center justify-center gap-2"
          style={{
            background: `linear-gradient(135deg, ${plan.accentColor}ee, ${plan.accentColor}aa)`,
            color: '#1a0c04',
            boxShadow: `0 8px 28px ${plan.accentColor}33`,
            opacity: completing ? 0.7 : 1,
          }}
        >
          <CheckCircle2 size={15} />
          {completing ? 'Saving…' : `Mark Day ${day.day} Complete`}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Plan Detail Sheet ─────────────────────────────────────────────────────────
function PlanDetailSheet({
  plan,
  status,
  currentDay,
  userId,
  onClose,
  onStart,
  onAbandon,
  onRestart,
  onLeave,
  onDayComplete,
  starting,
}: {
  plan:          GuidedPlan;
  status:        GuidedPathStatus | undefined;
  currentDay:    number;
  userId:        string;
  onClose:       () => void;
  onStart:       () => void;
  onAbandon:     () => void;
  onRestart:     () => void;
  onLeave:       () => void;
  onDayComplete: (newDay: number) => void;
  starting:      boolean;
}) {
  const isActive    = status === 'active';
  const isCompleted = status === 'completed';
  const [view, setView]           = useState<'overview' | 'day'>('overview');
  const [completing, setCompleting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const supabase = createClient();

  // Which day are we currently on (0-indexed for array access, 1-indexed for display)
  const todayIndex = Math.min(currentDay - 1, plan.days.length - 1);
  const todayData  = plan.days[todayIndex];

  async function markDayComplete() {
    setCompleting(true);
    try {
      const newDay = currentDay + 1;
      const isLastDay = newDay > plan.duration;

      await supabase
        .from('guided_path_progress')
        .upsert({
          user_id:      userId,
          path_id:      plan.id,
          status:       isLastDay ? 'completed' : 'active',
          day_reached:  isLastDay ? plan.duration : newDay,
          updated_at:   new Date().toISOString(),
          ...(isLastDay ? { completed_at: new Date().toISOString() } : {}),
        }, { onConflict: 'user_id,path_id' });

      onDayComplete(isLastDay ? plan.duration : newDay);
      setShowConfetti(true);

      if (isLastDay) {
        toast.success(`🎉 ${plan.title} complete! Incredible dedication.`, {
          style: { background: '#1c1c1a', color: '#f0ede4', border: `1px solid ${plan.accentColor}40`, borderRadius: '14px' },
          duration: 4000,
        });
        onClose();
      } else {
        toast.success(`Day ${currentDay} complete 🙏 See you tomorrow!`, {
          style: { background: '#1c1c1a', color: '#f0ede4', border: `1px solid ${plan.accentColor}40`, borderRadius: '14px' },
        });
        setView('overview');
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not save progress. Please try again.');
    } finally {
      setCompleting(false);
    }
  }

  return (
    <>
      <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[60]"
        style={{ background: 'rgba(8,5,2,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Sheet */}
      <motion.div
        className="fixed inset-x-0 bottom-0 z-[61] rounded-t-[2rem] flex flex-col overflow-hidden"
        style={{
          background: 'var(--surface-raised)',
          border: `1px solid ${plan.borderColor}`,
          borderBottom: 'none',
          maxHeight: '92dvh',
          paddingBottom: 'env(safe-area-inset-bottom, 20px)',
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 34 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3.5 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(200,146,74,0.2)' }} />
        </div>

        {/* Close */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--surface-raised)', border: '1px solid rgba(200,146,74,0.15)' }}
          >
            <X size={14} style={{ color: 'var(--brand-muted)' }} />
          </button>
        </div>

        {/* Content — overview or day view */}
        <AnimatePresence mode="wait">
          {view === 'day' && isActive && todayData ? (
            <DayView
              key="day"
              plan={plan}
              day={todayData}
              totalDays={plan.duration}
              onBack={() => setView('overview')}
              onComplete={markDayComplete}
              completing={completing}
            />
          ) : (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              {/* Scrollable overview */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {/* Hero */}
                <div className="px-6 pt-5 pb-4 text-center">
                  <div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-[1.2rem] text-3xl mb-4"
                    style={{
                      background: `radial-gradient(circle at 40% 40%, ${plan.accentColor}22, rgba(0,0,0,0.3))`,
                      boxShadow: `0 8px 24px ${plan.accentColor}22`,
                    }}
                  >
                    {plan.emoji}
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: plan.accentColor }}>
                    {plan.duration}-Day Plan · {plan.difficulty}
                  </p>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 600, color: 'var(--brand-ink)', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                    {plan.title}
                  </h2>
                  <p className="text-sm mt-2.5 leading-relaxed max-w-[280px] mx-auto" style={{ color: 'var(--brand-muted)' }}>
                    {plan.description}
                  </p>

                  {/* Active status + progress */}
                  {isActive && (
                    <div className="mt-4 space-y-2">
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{ background: `${plan.accentColor}1a`, border: `1px solid ${plan.accentColor}44`, color: plan.accentColor }}
                      >
                        <Flame size={12} />
                        Day {currentDay} of {plan.duration}
                      </div>
                      {/* Progress bar */}
                      <div className="mx-auto max-w-[200px]">
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${plan.accentColor}20` }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.round(((currentDay - 1) / plan.duration) * 100)}%`, background: plan.accentColor }}
                          />
                        </div>
                        <p className="text-[10px] mt-1 text-center" style={{ color: 'var(--text-dim)' }}>
                          {currentDay - 1} of {plan.duration} days done
                        </p>
                      </div>
                    </div>
                  )}

                  {isCompleted && (
                    <div
                      className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{ background: 'rgba(80,200,80,0.12)', border: '1px solid rgba(80,200,80,0.25)', color: '#6ad87a' }}
                    >
                      <CheckCircle2 size={12} />
                      Completed ✓
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="mx-5 h-px" style={{ background: `linear-gradient(90deg, transparent, ${plan.borderColor}, transparent)` }} />

                {/* Day-by-day list */}
                <div className="px-5 py-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--brand-muted)' }}>
                    {isActive ? 'Your journey so far' : 'What you\'ll practise'}
                  </p>
                  {plan.days.map(day => {
                    const isDone    = isActive && day.day < currentDay;
                    const isToday   = isActive && day.day === currentDay;
                    const isFuture  = isActive && day.day > currentDay;

                    return (
                      <div
                        key={day.day}
                        className="flex items-start gap-3 rounded-[1.1rem] px-3 py-3"
                        style={{
                          background: isToday
                            ? `${plan.accentColor}12`
                            : isDone
                              ? 'rgba(80,200,80,0.05)'
                              : 'rgba(200,146,74,0.04)',
                          border: isToday
                            ? `1px solid ${plan.accentColor}33`
                            : isDone
                              ? '1px solid rgba(80,200,80,0.15)'
                              : '1px solid rgba(200,146,74,0.08)',
                          opacity: isFuture ? 0.55 : 1,
                        }}
                      >
                        <div
                          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                          style={
                            isDone
                              ? { background: 'rgba(80,200,80,0.15)', color: '#6ad87a' }
                              : { background: `${plan.accentColor}1a`, color: plan.accentColor }
                          }
                        >
                          {isDone ? '✓' : day.day}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[12.5px] font-semibold leading-tight"
                            style={{ color: isDone ? 'var(--text-dim)' : 'var(--brand-ink)', textDecoration: isDone ? 'line-through' : 'none' }}
                          >
                            {day.title}
                          </p>
                          <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                            {day.focus} · {day.duration} min
                          </p>
                        </div>
                        {isToday && (
                          <div className="flex-shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${plan.accentColor}22`, color: plan.accentColor }}>
                            TODAY
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div
                className="flex-shrink-0 px-5 pt-4 pb-3 space-y-3"
                style={{ borderTop: '1px solid rgba(200,146,74,0.1)', background: 'var(--surface-base)' }}
              >
                {!isActive && !isCompleted && (
                  <motion.button
                    onClick={onStart}
                    disabled={starting}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 rounded-[1.1rem] font-semibold text-sm flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${plan.accentColor}ee, ${plan.accentColor}aa)`,
                      color: '#1a0c04',
                      boxShadow: `0 8px 28px ${plan.accentColor}33`,
                    }}
                  >
                    <Play size={14} />
                    {starting ? 'Starting…' : `Begin ${plan.duration}-Day Journey`}
                  </motion.button>
                )}

                {isActive && (
                  <div className="space-y-2">
                    {/* Primary CTA */}
                    <motion.button
                      onClick={() => setView('day')}
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-4 rounded-[1.1rem] font-semibold text-sm flex items-center justify-center gap-2"
                      style={{
                        background: `linear-gradient(135deg, ${plan.accentColor}ee, ${plan.accentColor}aa)`,
                        color: '#1a0c04',
                        boxShadow: `0 6px 20px ${plan.accentColor}2a`,
                      }}
                    >
                      <ArrowRight size={14} />
                      Continue Day {currentDay}
                    </motion.button>
                    {/* Secondary actions row */}
                    <div className="flex gap-2">
                      <button
                        onClick={onRestart}
                        className="flex-1 py-2.5 rounded-[0.9rem] text-xs font-semibold"
                        style={{ background: 'var(--surface-raised)', color: 'var(--brand-muted)', border: '1px solid rgba(200,146,74,0.12)' }}
                      >
                        🔄 Start Over
                      </button>
                      <button
                        onClick={onAbandon}
                        className="flex-1 py-2.5 rounded-[0.9rem] text-xs font-semibold"
                        style={{ background: 'var(--surface-raised)', color: 'var(--brand-muted)', border: '1px solid rgba(200,146,74,0.12)' }}
                      >
                        ⏸ Pause
                      </button>
                      <button
                        onClick={onLeave}
                        className="flex-1 py-2.5 rounded-[0.9rem] text-xs font-semibold"
                        style={{ background: 'rgba(220,60,60,0.07)', color: 'rgba(220,80,80,0.8)', border: '1px solid rgba(220,60,60,0.15)' }}
                      >
                        ✕ Leave
                      </button>
                    </div>
                  </div>
                )}

                {isCompleted && (
                  <motion.button
                    onClick={onStart}
                    disabled={starting}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 rounded-[1.1rem] font-semibold text-sm"
                    style={{ background: `${plan.accentColor}18`, color: plan.accentColor, border: `1px solid ${plan.accentColor}33` }}
                  >
                    Begin Again
                  </motion.button>
                )}

                <p className="text-center text-[10px]" style={{ color: 'var(--text-dim)' }}>
                  {isActive
                    ? 'Mark each day complete after your practice to advance to the next'
                    : 'Your progress is saved automatically each day'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

// ── Main Client ───────────────────────────────────────────────────────────────
export default function GuidedPlansClient({ userId, tradition, plans, statusMap, dayMap }: Props) {
  const router                    = useRouter();
  const supabase                  = createClient();
  const [selected, setSelected]   = useState<GuidedPlan | null>(null);
  const [starting, setStarting]   = useState(false);
  const [localStatus, setLocalStatus] = useState<Record<string, GuidedPathStatus>>(statusMap);
  const [localDayMap, setLocalDayMap] = useState<Record<string, number>>(dayMap);
  const [filter, setFilter]       = useState<'all' | '7' | '21'>('all');

  const filteredPlans = filter === 'all'
    ? plans
    : plans.filter(p => p.duration === Number(filter));

  // Find active plan for the hero CTA
  const activePlan = plans.find(p => localStatus[p.id] === 'active');

  async function startPlan(plan: GuidedPlan) {
    setStarting(true);
    try {
      const { error } = await supabase
        .from('guided_path_progress')
        .upsert({
          user_id:    userId,
          path_id:    plan.id,
          status:     'active',
          started_at: new Date().toISOString(),
          completed_at: null,
          day_reached: 1,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,path_id' });

      if (error) throw error;

      setLocalStatus(prev => ({ ...prev, [plan.id]: 'active' }));
      setLocalDayMap(prev => ({ ...prev, [plan.id]: 1 }));
      toast.success(`${plan.title} started! Day 1 awaits 🙏`, {
        style: { background: '#1c1c1a', color: '#f0ede4', border: `1px solid ${plan.accentColor}40`, borderRadius: '14px' },
      });
      setSelected(null);
    } catch (err) {
      console.error(err);
      toast.error('Could not start plan. Try again.');
    } finally {
      setStarting(false);
    }
  }

  async function abandonPlan(plan: GuidedPlan) {
    // Pause — keeps progress, sets status to dismissed
    try {
      const { error } = await supabase
        .from('guided_path_progress')
        .upsert({
          user_id:    userId,
          path_id:    plan.id,
          status:     'dismissed',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,path_id' });
      if (error) throw error;
      setLocalStatus(prev => ({ ...prev, [plan.id]: 'dismissed' }));
      setSelected(null);
      toast('Plan paused. Your progress is saved — resume anytime.', { icon: '⏸️' });
    } catch (err) {
      console.error(err);
      toast.error('Could not pause. Try again.');
    }
  }

  async function restartPlan(plan: GuidedPlan) {
    // Start Over — resets to Day 1, status active
    try {
      const { error } = await supabase
        .from('guided_path_progress')
        .upsert({
          user_id:      userId,
          path_id:      plan.id,
          status:       'active',
          started_at:   new Date().toISOString(),
          completed_at: null,
          day_reached:  1,
          updated_at:   new Date().toISOString(),
        }, { onConflict: 'user_id,path_id' });
      if (error) throw error;
      setLocalStatus(prev => ({ ...prev, [plan.id]: 'active' }));
      setLocalDayMap(prev => ({ ...prev, [plan.id]: 1 }));
      setSelected(null);
      toast.success('Starting fresh from Day 1 🙏', {
        style: { background: '#1c1c1a', color: '#f0ede4', border: `1px solid ${plan.accentColor}40`, borderRadius: '14px' },
      });
    } catch (err) {
      console.error(err);
      toast.error('Could not restart. Try again.');
    }
  }

  async function leavePlan(plan: GuidedPlan) {
    // Leave — removes the record entirely (or marks abandoned permanently)
    const confirmed = window.confirm(`Leave "${plan.title}"? All progress will be lost.`);
    if (!confirmed) return;
    try {
      const { error } = await supabase
        .from('guided_path_progress')
        .delete()
        .eq('user_id', userId)
        .eq('path_id', plan.id);
      if (error) throw error;
      setLocalStatus(prev => { const n = { ...prev }; delete n[plan.id]; return n; });
      setLocalDayMap(prev =>  { const n = { ...prev }; delete n[plan.id]; return n; });
      setSelected(null);
      toast('Plan removed. You can start again anytime.', { icon: '✕' });
    } catch (err) {
      console.error(err);
      toast.error('Could not remove. Try again.');
    }
  }

  function handleDayComplete(plan: GuidedPlan, newDay: number) {
    const isLast = newDay >= plan.duration;
    setLocalDayMap(prev => ({ ...prev, [plan.id]: newDay }));
    if (isLast) {
      setLocalStatus(prev => ({ ...prev, [plan.id]: 'completed' }));
    }
  }

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
          <h1 className="font-bold text-lg" style={{ color: 'var(--brand-ink)' }}>Sadhana Patha</h1>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>7-day and 21-day structured practices</p>
        </div>
        <button
          onClick={() => router.push('/nitya-karma/plans/insights')}
          className="w-9 h-9 rounded-full glass-panel border border-white/10 flex items-center justify-center"
          title="View insights"
        >
          <BarChart2 size={17} style={{ color: '#C8924A' }} />
        </button>
      </div>

      {/* Active plan banner — shown when a plan is in progress */}
      {activePlan && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4 rounded-[1.4rem] px-5 py-4 flex items-center gap-4"
          style={{
            background: `linear-gradient(135deg, ${activePlan.accentColor}18, ${activePlan.accentColor}08)`,
            border: `1px solid ${activePlan.accentColor}33`,
          }}
        >
          <div className="text-2xl">{activePlan.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Flame size={12} style={{ color: activePlan.accentColor }} />
              <p className="text-[11px] font-bold" style={{ color: activePlan.accentColor }}>
                Day {localDayMap[activePlan.id] ?? 1} of {activePlan.duration}
              </p>
            </div>
            <p className="text-[13px] font-semibold mt-0.5" style={{ color: 'var(--brand-ink)' }}>
              {activePlan.title}
            </p>
            {/* Mini progress bar */}
            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: `${activePlan.accentColor}20` }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round((((localDayMap[activePlan.id] ?? 1) - 1) / activePlan.duration) * 100)}%`,
                  background: activePlan.accentColor,
                }}
              />
            </div>
          </div>
          <button
            onClick={() => setSelected(activePlan)}
            className="flex-shrink-0 flex items-center gap-1 text-[12px] font-semibold px-3 py-2 rounded-full"
            style={{ background: `${activePlan.accentColor}22`, color: activePlan.accentColor }}
          >
            Continue <ArrowRight size={12} />
          </button>
        </motion.div>
      )}

      {/* Hero — shown when no active plan */}
      {!activePlan && (
        <div
          className="mx-4 mb-5 rounded-[1.75rem] px-5 pt-5 pb-6 relative overflow-hidden"
          style={{ background: 'var(--surface-raised)', border: '1px solid rgba(200,146,74,0.16)' }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(200,146,74,0.10) 0%, transparent 70%)', transform: 'translate(25%, -25%)' }} />

          <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: 'rgba(200,146,74,0.65)' }}>
            Structured Practice
          </p>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 600, color: 'var(--brand-ink)', lineHeight: 1.22 }}>
            The Vedic tradition says:<br />21 days forms a samskara.
          </p>
          <p className="text-[13px] mt-3 leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
            Choose a path that calls to you. Show up each day. Let the repetition do its quiet work.
          </p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 mb-4">
        {(['all', '7', '21'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all"
            style={filter === f
              ? { background: 'rgba(200,146,74,0.18)', color: 'var(--brand-ink)', border: '1px solid rgba(200,146,74,0.35)' }
              : { background: 'var(--surface-raised)', color: 'var(--text-dim)', border: '1px solid rgba(200,146,74,0.12)' }
            }
          >
            {f === 'all' ? 'All Plans' : `${f}-Day`}
          </button>
        ))}
      </div>

      {/* Plan cards */}
      <div className="px-4 space-y-3">
        {filteredPlans.map((plan, idx) => {
          const status    = localStatus[plan.id];
          const dayNum    = localDayMap[plan.id] ?? 1;
          const isActive    = status === 'active';
          const isCompleted = status === 'completed';

          // Build filled dot count
          const filledDots = isActive ? Math.max(0, dayNum - 1) : isCompleted ? plan.duration : 0;
          const dotSlots   = plan.days.slice(0, 7);

          return (
            <motion.button
              key={plan.id}
              onClick={() => setSelected(plan)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.35 }}
              whileTap={{ scale: 0.98 }}
              className="w-full text-left rounded-[1.75rem] overflow-hidden border relative"
              style={{
                background: `linear-gradient(160deg, ${plan.accentColor}14 0%, var(--surface-raised) 100%)`,
                borderColor: isActive ? plan.borderColor : 'rgba(200,146,74,0.1)',
                boxShadow: isActive ? `0 4px 20px ${plan.accentColor}18` : 'none',
              }}
            >
              {/* Status badges */}
              {isActive && (
                <div
                  className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                  style={{ background: `${plan.accentColor}22`, border: `1px solid ${plan.accentColor}44`, color: plan.accentColor }}
                >
                  <Flame size={10} /> Day {dayNum}/{plan.duration}
                </div>
              )}
              {isCompleted && (
                <div
                  className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                  style={{ background: 'rgba(80,200,80,0.1)', border: '1px solid rgba(80,200,80,0.2)', color: '#6ad87a' }}
                >
                  <CheckCircle2 size={10} /> Done
                </div>
              )}

              <div className="p-5 flex items-start gap-4">
                {/* Emoji */}
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-[1rem] flex items-center justify-center text-2xl"
                  style={{
                    background: `radial-gradient(circle at 40% 40%, ${plan.accentColor}22, rgba(0,0,0,0.3))`,
                    border: `1px solid ${plan.borderColor}`,
                  }}
                >
                  {plan.emoji}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 pr-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: plan.accentColor }}>
                    {plan.duration} Days · {plan.difficulty}
                  </p>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--brand-ink)', lineHeight: 1.25, marginTop: '2px' }}>
                    {plan.title}
                  </p>
                  <p className="text-[11.5px] mt-1.5 leading-snug" style={{ color: 'var(--brand-muted)' }}>
                    {plan.tagline}
                  </p>
                </div>
              </div>

              {/* Bottom row — progress dots */}
              <div
                className="flex items-center justify-between px-5 py-2.5 border-t"
                style={{ borderColor: `${plan.accentColor}18` }}
              >
                <div className="flex gap-1.5 items-center">
                  {dotSlots.map(d => (
                    <div
                      key={d.day}
                      className="w-3 h-3 rounded-full transition-all"
                      style={{
                        background: d.day <= filledDots
                          ? (isCompleted ? '#6ad87a' : plan.accentColor)
                          : `${plan.accentColor}28`,
                        boxShadow: d.day <= filledDots && d.day === filledDots && !isCompleted
                          ? `0 0 5px ${plan.accentColor}88` : 'none',
                      }}
                    />
                  ))}
                  {plan.days.length > 7 && (
                    <span className="text-[9px] ml-0.5" style={{ color: `${plan.accentColor}66` }}>
                      +{plan.days.length - 7}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px]" style={{ color: `${plan.accentColor}80` }}>
                  {isActive ? `Day ${dayNum} →` : 'View plan'} <ChevronRight size={12} />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Plan detail sheet */}
      <AnimatePresence>
        {selected && (
          <PlanDetailSheet
            plan={selected}
            status={localStatus[selected.id]}
            currentDay={localDayMap[selected.id] ?? 1}
            userId={userId}
            onClose={() => setSelected(null)}
            onStart={() => startPlan(selected)}
            onAbandon={() => abandonPlan(selected)}
            onRestart={() => restartPlan(selected)}
            onLeave={() => leavePlan(selected)}
            onDayComplete={(newDay) => handleDayComplete(selected, newDay)}
            starting={starting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
