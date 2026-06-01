'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MOODS_CONFIG } from '@/lib/mood/registry';
import { type MoodRecommendation } from '@/lib/mood/engine';
import { type MoodInsightMetrics } from '@/lib/mood/insights';
import MoodMirror from './MoodMirror';
import MoodPath from './MoodPath';
import MoodReturn from './MoodReturn';

export interface MoodJourneySheetProps {
  moodKey: string;
  tradition: string | null;
  isOpen: boolean;
  onClose: () => void;
}

type SheetStep = 'context' | 'mirror' | 'path';

type ContextNeed = 'calm' | 'clarity' | 'devotion' | 'focus' | 'comfort';
type ContextTime = '2 min' | '5 min' | '10+ min';
type ContextType = 'read' | 'chant' | 'listen' | 'reflect';

const TIME_LABELS: Record<ContextTime, string> = {
  '2 min': '2 minutes · A quick breath or mantra',
  '5 min': '5 minutes · A short practice',
  '10+ min': '10 minutes or more · Deep dive',
};

export default function MoodJourneySheet({
  moodKey,
  tradition,
  isOpen,
  onClose,
}: MoodJourneySheetProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const [step, setStep] = useState<SheetStep>('context');
  const [need, setNeed] = useState<ContextNeed | null>(null);
  const [time, setTime] = useState<ContextTime | null>(null);
  const [type, setType] = useState<ContextType | null>(null);
  const [checkinId, setCheckinId] = useState<string | null>(null);
  const [clickedAction, setClickedAction] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<MoodRecommendation[]>([]);
  const [recentMoods, setRecentMoods] = useState<Array<{ date: string; mood: string }>>([]);
  const [weekInsights, setWeekInsights] = useState<MoodInsightMetrics | null>(null);
  const [reflectionSummary, setReflectionSummary] = useState<string | null>(null);
  const [reflectionLoading, setReflectionLoading] = useState(false);

  const activeMood = MOODS_CONFIG.dark.find((m) => m.key === moodKey) || MOODS_CONFIG.dark[0];

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    // 1. Check existing open session & create checkin
    fetch('/api/mood/checkin')
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        // The prompt says "if openSession with same moodKey exists, reuse checkinId, skip to 'mirror'".
        // Assuming API returns open_session
        if (data.open_session && data.open_session.before_mood === moodKey) {
          setCheckinId(data.open_session.id);
          setStep('mirror');
        }
      })
      .catch((err) => console.error(err));

    // 2. Weekly Insights
    fetch('/api/mood/insights/weekly')
      .then((res) => res.json())
      .then((data) => mounted && setWeekInsights(data))
      .catch((err) => console.error(err));

    // 3. Reflection Summary
    setReflectionLoading(true);
    fetch('/api/mood/reflection-summary')
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        setReflectionSummary(data.summary);
      })
      .catch((err) => console.error(err))
      .finally(() => mounted && setReflectionLoading(false));

    // 4. Recent Moods
    fetch('/api/mood/checkin?history=7')
      .then((res) => res.json())
      .then((data) => mounted && setRecentMoods(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));

    return () => {
      mounted = false;
    };
  }, [isOpen, moodKey]);

  const handleContextSubmit = async (finalType: ContextType) => {
    setType(finalType);
    try {
      const res = await fetch('/api/mood/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          before_mood: moodKey,
          source_surface: 'home_dashboard',
          context_need: need,
          context_time: time,
          context_type: finalType,
        }),
      });
      const data = await res.json();
      setCheckinId(data.checkin_id);

      // GET recommendations
      const recsRes = await fetch(
        `/api/mood/recommendations?mood=${moodKey}&need=${need}&time=${time}&type=${finalType}`
      );
      const recsData = await recsRes.json();
      setRecommendations(recsData.recommendations || []);
    } catch (err) {
      console.error(err);
    }
    setStep('mirror');
  };

  const handleSkipContext = () => {
    setStep('mirror');
  };

  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { y: number } }
  ) => {
    if (info.offset.y > 80) {
      handleClose();
    }
  };

  const handleClose = async () => {
    if (checkinId && !clickedAction) {
      await fetch('/api/mood/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkin_id: checkinId,
          session_status: 'abandoned',
        }),
      }).catch(console.error);
    }
    
    setStep('context');
    setNeed(null);
    setTime(null);
    setType(null);
    setCheckinId(null);
    setClickedAction(null);
    setRecommendations([]);
    setReflectionSummary(null);
    setRecentMoods([]);
    setWeekInsights(null);
    setReflectionLoading(false);
    onClose();
  };

  const handleActionClick = (rec: MoodRecommendation) => {
    setClickedAction(rec.id);
    if (checkinId) {
      fetch('/api/mood/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkin_id: checkinId,
          clicked_action: rec.id,
        }),
      }).catch(console.error);
      
      localStorage.setItem('shoonaya_mood_pending_followup', JSON.stringify({
        checkinId,
        mood: moodKey,
        actionId: rec.id,
        actionTitle: rec.title,
        actionHref: rec.href,
        createdAt: new Date().toISOString()
      }));
    }
    router.push(rec.href);
    handleClose();
  };

  if (!isOpen) return null;

  const transitionConfig: any = prefersReducedMotion 
    ? { duration: 0 } 
    : { type: 'spring', stiffness: 260, damping: 28 };

  const stepSlideConfig = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

  return (
    <div className="fixed inset-0 z-[100] flex items-end">
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <motion.div
        className="relative w-full h-[92dvh] rounded-t-[2rem] flex flex-col bg-[var(--divine-bg)] z-[100] border-t border-[var(--card-border)] overflow-hidden"
        initial={prefersReducedMotion ? undefined : { y: '100%' }}
        animate={prefersReducedMotion ? undefined : { y: 0 }}
        exit={prefersReducedMotion ? undefined : { y: '100%' }}
        transition={transitionConfig}
        drag="y"
        dragConstraints={{ top: 0 }}
        onDragEnd={handleDragEnd}
      >
        {/* Drag Handle & Dots */}
        <div className="flex flex-col items-center mt-3 mb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[var(--card-border)] mb-3" />
          <div className="flex gap-2">
            {['context', 'mirror', 'path'].map((s) => (
              <div key={s} className="relative w-2 h-2 rounded-full bg-[var(--card-border)]">
                {step === s && (
                  <motion.div
                    layoutId="sheet-step-dot"
                    className="absolute inset-0 rounded-full"
                    style={{ background: activeMood.colour }}
                    transition={(prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }) as any}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 relative">
          <AnimatePresence mode="wait">
            {step === 'context' && (
              <motion.div
                key="context"
                initial={prefersReducedMotion ? undefined : { opacity: 0, x: 20 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, x: -20 }}
                transition={stepSlideConfig}
                className="flex flex-col h-full py-4"
              >
                <div className="flex-1">
                  {!need && (
                    <motion.div key="need-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h3 className="text-xl font-serif text-[var(--text-cream)] mb-6">What do you need most right now?</h3>
                      <div className="flex flex-wrap gap-3">
                        {['calm', 'clarity', 'devotion', 'focus', 'comfort'].map(n => (
                          <button key={n} onClick={() => setNeed(n as ContextNeed)} className="px-5 py-3 rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] text-[var(--text-cream)] capitalize font-medium active:scale-[0.98] transition-transform">
                            {n}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {need && !time && (
                    <motion.div key="time-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h3 className="text-xl font-serif text-[var(--text-cream)] mb-6">How much time do you have?</h3>
                      <div className="flex flex-col gap-3">
                        {(Object.entries(TIME_LABELS) as [ContextTime, string][]).map(([val, label]) => (
                          <button key={val} onClick={() => setTime(val)} className="p-4 rounded-xl text-left border border-[var(--card-border)] bg-[var(--surface-soft)] text-[var(--text-cream)] font-medium active:scale-[0.98] transition-transform">
                            {label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {need && time && !type && (
                    <motion.div key="type-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h3 className="text-xl font-serif text-[var(--text-cream)] mb-6">How would you like to practice?</h3>
                      <div className="flex flex-wrap gap-3">
                        {['read', 'chant', 'listen', 'reflect'].map(t => (
                          <button key={t} onClick={() => handleContextSubmit(t as ContextType)} className="px-5 py-3 rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] text-[var(--text-cream)] capitalize font-medium active:scale-[0.98] transition-transform">
                            {t}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
                <div className="mt-8 text-center shrink-0">
                  <button onClick={handleSkipContext} className="text-[13px] text-[var(--text-dim)] hover:text-[var(--text-cream)] transition-colors">
                    Skip context &rarr;
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'mirror' && (
              <motion.div
                key="mirror"
                initial={prefersReducedMotion ? undefined : { opacity: 0, x: 20 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, x: -20 }}
                transition={stepSlideConfig}
                className="flex flex-col min-h-full py-4"
              >
                <div className="flex-1">
                  <MoodMirror 
                    activeMood={activeMood}
                    weekInsights={weekInsights}
                    reflectionSummary={reflectionSummary}
                    reflectionLoading={reflectionLoading}
                    recentMoods={recentMoods}
                  />
                </div>
                <button
                  onClick={() => setStep('path')}
                  className="w-full h-12 rounded-xl mt-6 font-bold transition-transform active:scale-[0.98] shrink-0"
                  style={{ background: activeMood.colour, color: 'var(--divine-bg)' }}
                >
                  See your path &rarr;
                </button>
              </motion.div>
            )}

            {step === 'path' && (
              <motion.div
                key="path"
                initial={prefersReducedMotion ? undefined : { opacity: 0, x: 20 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, x: -20 }}
                transition={stepSlideConfig}
                className="flex flex-col min-h-full py-4"
              >
                <div className="flex-1">
                  <MoodPath 
                    activeMood={activeMood}
                    tradition={tradition}
                    recommendations={recommendations}
                    checkinId={checkinId}
                    onActionClick={handleActionClick}
                  />
                </div>
                {clickedAction && checkinId && (
                  <div className="shrink-0">
                    <MoodReturn 
                      checkinId={checkinId}
                      onComplete={handleClose}
                      onSkip={handleClose}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
