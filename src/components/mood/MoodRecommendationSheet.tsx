'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { MoodRecommendation } from '@/lib/mood/engine';

interface MoodRecommendationSheetProps {
  mood: string;
  onClose: () => void;
}

const PENDING_FOLLOWUP_KEY = 'shoonaya_mood_pending_followup';

export default function MoodRecommendationSheet({ mood, onClose }: MoodRecommendationSheetProps) {
  const [step, setStep] = useState<'need' | 'time' | 'type' | 'loading' | 'recommendations'>('need');
  const [need, setNeed] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  
  const [recommendations, setRecommendations] = useState<MoodRecommendation[]>([]);
  const [checkinId, setCheckinId] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();

  useEffect(() => {
    if (step !== 'loading') return;

    async function submitAndFetch() {
      try {
        // 1. Record checkin with context
        const checkinRes = await fetch('/api/mood/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            before_mood: mood,
            source_surface: 'home_dashboard',
            context_need: need,
            context_time: time,
            context_type: type,
          }),
        });
        
        let newCheckinId = null;
        if (checkinRes.ok) {
          const { checkin_id } = await checkinRes.json();
          newCheckinId = checkin_id;
          setCheckinId(checkin_id);
        }

        // 2. Fetch recommendations (pass context and checkin_id)
        const params = new URLSearchParams({ mood });
        if (need) params.append('need', need);
        if (time) params.append('time', time);
        if (type) params.append('type', type);
        if (newCheckinId) params.append('checkin_id', newCheckinId);

        const recRes = await fetch(`/api/mood/recommendations?${params.toString()}`);
        if (recRes.ok) {
          const data = await recRes.json();
          setRecommendations(data.recommendations || []);
        }
      } catch (error) {
        console.error('Failed to init mood checkin', error);
      } finally {
        setStep('recommendations');
      }
    }
    
    submitAndFetch();
  }, [step, mood, need, time, type]);

  const handleActionClick = async (rec: MoodRecommendation) => {
    if (checkinId) {
      const pendingFollowup = {
        checkinId,
        mood,
        actionId: rec.id,
        actionTitle: rec.title,
        actionHref: rec.href,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(PENDING_FOLLOWUP_KEY, JSON.stringify(pendingFollowup));

      // Record the user's chosen direction immediately, but do not mark it complete yet.
      fetch('/api/mood/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkin_id: checkinId,
          clicked_action: rec.id,
        }),
      }).catch(console.error);
    }
    
    onClose();
    router.push(rec.href);
  };

  const handleNeedSelect = (value: string) => { setNeed(value); setStep('time'); };
  const handleTimeSelect = (value: string) => { setTime(value); setStep('type'); };
  const handleTypeSelect = (value: string) => { setType(value); setStep('loading'); };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
      initial={prefersReducedMotion ? undefined : { opacity: 0 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      <motion.div
        className="w-full max-w-sm rounded-3xl p-6 space-y-5 relative z-10 overflow-y-auto"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card-bg)',
          border: '1px solid rgba(197, 160, 89, 0.22)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          maxHeight: '90dvh',
        }}
        initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95, y: 10 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >

        <div className="flex items-center justify-between">
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-cream)' }}>
            {step === 'need' && 'What do you need right now?'}
            {step === 'time' && 'How much time do you have?'}
            {step === 'type' && 'What are you drawn to?'}
            {(step === 'loading' || step === 'recommendations') && `For your ${mood} mood`}
          </h3>
          <button onClick={onClose}
            className="w-11 h-11 rounded-full flex items-center justify-center motion-press"
            style={{ background: 'rgba(197, 160, 89, 0.10)' }}>
            <X size={15} style={{ color: 'var(--text-muted-warm)' }} />
          </button>
        </div>

        {step === 'need' && (
          <>
            <div className="grid grid-cols-2 gap-3 pb-6">
              {['calm', 'clarity', 'devotion', 'focus', 'comfort'].map(option => (
                <button
                  key={option}
                  onClick={() => handleNeedSelect(option)}
                  className="p-4 rounded-2xl border text-sm font-medium motion-press capitalize"
                  style={{ 
                    background: 'var(--card-bg-soft, rgba(255, 255, 255, 0.03))', 
                    borderColor: 'var(--card-border, rgba(255, 255, 255, 0.08))',
                    color: 'var(--text-cream)'
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              onClick={async () => {
                fetch('/api/mood/checkin', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    before_mood: mood,
                    source_surface: 'home_dashboard',
                  }),
                }).catch(console.error);
                onClose();
                router.push('/home');
              }}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: '0.75rem',
                fontSize: '0.82rem',
                color: 'var(--text-muted-warm)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Just set my mood · go home →
            </button>
          </>
        )}

        {step === 'time' && (
          <div className="flex flex-col gap-3 pb-6">
            {['2 min', '5 min', '10+ min'].map(option => (
              <button
                key={option}
                onClick={() => handleTimeSelect(option)}
                className="p-4 rounded-2xl border text-sm font-medium motion-press text-left"
                style={{ 
                  background: 'var(--card-bg-soft, rgba(255, 255, 255, 0.03))', 
                  borderColor: 'var(--card-border, rgba(255, 255, 255, 0.08))',
                  color: 'var(--text-cream)'
                }}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {step === 'type' && (
          <div className="grid grid-cols-2 gap-3 pb-6">
            {['read', 'chant', 'listen', 'reflect'].map(option => (
              <button
                key={option}
                onClick={() => handleTypeSelect(option)}
                className="p-4 rounded-2xl border text-sm font-medium motion-press capitalize"
                style={{ 
                  background: 'var(--card-bg-soft, rgba(255, 255, 255, 0.03))', 
                  borderColor: 'var(--card-border, rgba(255, 255, 255, 0.08))',
                  color: 'var(--text-cream)'
                }}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {step === 'loading' && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--brand-primary)' }} />
          </div>
        )}

        {step === 'recommendations' && (
          <div className="space-y-3 pb-6">
            {recommendations.map(rec => (
              <button
                key={rec.id}
                onClick={() => handleActionClick(rec)}
                className="w-full flex items-center justify-between p-4 rounded-2xl border motion-lift text-left"
                style={{ 
                  background: 'var(--card-bg, rgba(44, 38, 28, 0.88))', 
                  borderColor: 'var(--card-border, rgba(197, 160, 89, 0.20))'
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{rec.icon}</div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-cream)' }}>{rec.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{rec.description}</div>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: 'var(--brand-primary)' }} />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
