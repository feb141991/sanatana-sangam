'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle2, Play, X, Flame } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import type { GuidedPlan, GuidedPathStatus } from '@/lib/guided-paths';

interface Props {
  userId: string;
  tradition: string;
  plans: GuidedPlan[];
  statusMap: Record<string, GuidedPathStatus>;
}

// ── Plan Detail Sheet ─────────────────────────────────────────────────────────
function PlanDetailSheet({
  plan,
  status,
  onClose,
  onStart,
  onAbandon,
  starting,
}: {
  plan: GuidedPlan;
  status: GuidedPathStatus | undefined;
  onClose: () => void;
  onStart: () => void;
  onAbandon: () => void;
  starting: boolean;
}) {
  const isActive    = status === 'active';
  const isCompleted = status === 'completed';

  return (
    <>
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
          background: 'linear-gradient(170deg, rgba(24,16,8,0.99) 0%, rgba(14,10,4,0.99) 100%)',
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
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <X size={14} style={{ color: 'rgba(200,170,120,0.65)' }} />
          </button>
        </div>

        {/* Scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Hero */}
          <div className="px-6 pt-5 pb-5 text-center">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-[1.2rem] text-3xl mb-4"
              style={{
                background: `radial-gradient(circle at 40% 40%, ${plan.accentColor}22, rgba(0,0,0,0.3))`,
                border: plan.borderColor,
                boxShadow: `0 8px 24px ${plan.accentColor}22`,
              }}
            >
              {plan.emoji}
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: plan.accentColor }}>
              {plan.duration}-Day Plan · {plan.difficulty}
            </p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 600, color: '#f0e2c0', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              {plan.title}
            </h2>
            <p className="text-sm mt-3 leading-relaxed max-w-[280px] mx-auto" style={{ color: 'rgba(220,190,130,0.5)' }}>
              {plan.description}
            </p>

            {isActive && (
              <div
                className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: `${plan.accentColor}1a`, border: `1px solid ${plan.accentColor}44`, color: plan.accentColor }}
              >
                <Flame size={12} />
                Currently active
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

          {/* Day-by-day overview */}
          <div className="px-5 py-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: 'rgba(200,146,74,0.5)' }}>
              What you&apos;ll practise
            </p>
            {plan.days.slice(0, 7).map(day => (
              <div
                key={day.day}
                className="flex items-start gap-3 rounded-[1.1rem] px-3 py-3"
                style={{ background: 'rgba(200,146,74,0.04)', border: '1px solid rgba(200,146,74,0.08)' }}
              >
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{ background: `${plan.accentColor}1a`, color: plan.accentColor }}
                >
                  {day.day}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold leading-tight" style={{ color: '#ede0c4' }}>{day.title}</p>
                  <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'rgba(210,185,135,0.48)' }}>
                    {day.focus} · {day.duration} min
                  </p>
                </div>
              </div>
            ))}
            {plan.days.length > 7 && (
              <p className="text-[11px] text-center mt-2" style={{ color: 'rgba(200,170,120,0.35)' }}>
                + {plan.days.length - 7} more days
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 px-5 pt-4 pb-3 space-y-3"
          style={{ borderTop: '1px solid rgba(200,146,74,0.1)', background: 'rgba(14,10,8,0.92)', backdropFilter: 'blur(12px)' }}
        >
          {!isActive && !isCompleted && (
            <motion.button
              onClick={onStart}
              disabled={starting}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-[1.1rem] font-semibold text-sm relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${plan.accentColor}ee, ${plan.accentColor}aa)`,
                color: '#1a0c04',
                boxShadow: `0 8px 28px ${plan.accentColor}33`,
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <Play size={14} />
                {starting ? 'Starting…' : `Begin ${plan.duration}-Day Journey`}
              </span>
            </motion.button>
          )}

          {isActive && (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-[1.1rem] font-semibold text-sm"
                style={{ background: `${plan.accentColor}18`, color: plan.accentColor, border: `1px solid ${plan.accentColor}33` }}
              >
                Continue Practice
              </button>
              <button
                onClick={onAbandon}
                className="py-3.5 px-4 rounded-[1.1rem] text-sm"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(200,170,120,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Abandon
              </button>
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

          <p className="text-center text-[10px]" style={{ color: 'rgba(180,150,90,0.35)' }}>
            Your progress is saved automatically each day
          </p>
        </div>
      </motion.div>
    </>
  );
}

// ── Main Client ───────────────────────────────────────────────────────────────
export default function GuidedPlansClient({ userId, tradition, plans, statusMap }: Props) {
  const router                    = useRouter();
  const supabase                  = createClient();
  const [selected, setSelected]   = useState<GuidedPlan | null>(null);
  const [starting, setStarting]   = useState(false);
  const [localStatus, setLocalStatus] = useState<Record<string, GuidedPathStatus>>(statusMap);
  const [filter, setFilter]       = useState<'all' | '7' | '21'>('all');

  const filteredPlans = filter === 'all'
    ? plans
    : plans.filter(p => p.duration === Number(filter));

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
      toast.success(`${plan.title} started! 🙏`, {
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
    try {
      await supabase
        .from('guided_path_progress')
        .upsert({
          user_id:    userId,
          path_id:    plan.id,
          status:     'dismissed',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,path_id' });

      setLocalStatus(prev => ({ ...prev, [plan.id]: 'dismissed' }));
      setSelected(null);
      toast('Plan paused. You can restart anytime.', { icon: '⏸️' });
    } catch (err) {
      console.error(err);
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
          <h1 className="font-bold text-lg" style={{ color: 'var(--text-cream)' }}>Guided Sadhana Plans</h1>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>7-day and 21-day structured practices</p>
        </div>
      </div>

      {/* Hero */}
      <div
        className="mx-4 mb-4 rounded-[1.75rem] px-5 py-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, rgba(28,18,10,0.98) 0%, rgba(16,10,4,0.99) 100%)', border: '1px solid rgba(200,146,74,0.16)' }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(200,146,74,0.12) 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'rgba(200,146,74,0.6)' }}>
          Structured Practice
        </p>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 600, color: '#f0e2c0', lineHeight: 1.25 }}>
          The Vedic tradition says:<br />21 days forms a samskara.
        </p>
        <p className="text-[12px] mt-2 leading-relaxed" style={{ color: 'rgba(220,190,130,0.48)' }}>
          Choose a path, commit to the sequence, let the practice shape you from the inside.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 mb-4">
        {(['all', '7', '21'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all"
            style={filter === f
              ? { background: 'rgba(200,146,74,0.18)', color: '#f5dfa0', border: '1px solid rgba(200,146,74,0.35)' }
              : { background: 'rgba(28,18,10,0.7)', color: 'rgba(245,210,130,0.45)', border: '1px solid rgba(200,146,74,0.12)' }
            }
          >
            {f === 'all' ? 'All Plans' : `${f}-Day`}
          </button>
        ))}
      </div>

      {/* Plan cards */}
      <div className="px-4 space-y-3">
        {filteredPlans.map((plan, idx) => {
          const status = localStatus[plan.id];
          const isActive    = status === 'active';
          const isCompleted = status === 'completed';

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
                background: `linear-gradient(160deg, ${plan.accentColor}0e 0%, rgba(14,10,4,0.9) 100%)`,
                borderColor: isActive ? plan.borderColor : 'rgba(200,146,74,0.1)',
                boxShadow: isActive ? `0 4px 20px ${plan.accentColor}18` : 'none',
              }}
            >
              {/* Status badge */}
              {isActive && (
                <div
                  className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                  style={{ background: `${plan.accentColor}22`, border: `1px solid ${plan.accentColor}44`, color: plan.accentColor }}
                >
                  <Flame size={10} /> Active
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
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 600, color: '#ede0c4', lineHeight: 1.25, marginTop: '2px' }}>
                    {plan.title}
                  </p>
                  <p className="text-[11.5px] mt-1.5 leading-snug" style={{ color: 'rgba(210,185,135,0.5)' }}>
                    {plan.tagline}
                  </p>
                </div>
              </div>

              {/* Bottom row */}
              <div
                className="flex items-center justify-between px-5 py-2.5 border-t"
                style={{ borderColor: `${plan.accentColor}18` }}
              >
                <div className="flex gap-1.5">
                  {plan.days.slice(0, 7).map(d => (
                    <div
                      key={d.day}
                      className="w-3 h-3 rounded-full"
                      style={{ background: `${plan.accentColor}33` }}
                    />
                  ))}
                  {plan.days.length > 7 && (
                    <span className="text-[9px]" style={{ color: `${plan.accentColor}55` }}>+{plan.days.length - 7}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px]" style={{ color: `${plan.accentColor}80` }}>
                  View plan <ChevronRight size={12} />
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
            onClose={() => setSelected(null)}
            onStart={() => startPlan(selected)}
            onAbandon={() => abandonPlan(selected)}
            starting={starting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
