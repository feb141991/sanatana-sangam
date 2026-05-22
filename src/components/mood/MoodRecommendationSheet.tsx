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
    
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('shoonaya_mood_dismissed', today);
    localStorage.setItem('home_mood_date', today);
    localStorage.setItem('home_mood_key', mood);
    
    onClose();
    router.push(rec.href);
  };

  const handleNeedSelect = (value: string) => { setNeed(value); setStep('time'); };
  const handleTimeSelect = (value: string) => { setTime(value); setStep('type'); };
  const handleTypeSelect = (value: string) => { setType(value); setStep('loading'); };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-end"
      onClick={onClose}
      initial={prefersReducedMotion ? undefined : { opacity: 0 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      <motion.div
        className="w-full rounded-t-[2rem] p-6 space-y-5 relative z-10"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, var(--surface-raised), var(--card-bg))',
          borderTop: '1px solid rgba(200, 146, 74, 0.20)',
          boxShadow: '0 -20px 48px rgba(0, 0, 0, 0.4)',
        }}
        initial={prefersReducedMotion ? undefined : { y: 32, opacity: 0 }}
        animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1 }}
        exit={prefersReducedMotion ? undefined : { y: 20, opacity: 0 }}
        transition={{ duration: 0.32, ease: [0.34, 1.26, 0.64, 1] }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ background: 'rgba(200, 146, 74, 0.28)' }} />

        <div className="flex items-center justify-between">
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-cream)' }}>
            {step === 'need' && 'What do you need right now?'}
            {step === 'time' && 'How much time do you have?'}
            {step === 'type' && 'What are you drawn to?'}
            {(step === 'loading' || step === 'recommendations') && `For your ${mood} mood`}
          </h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center motion-press"
            style={{ background: 'rgba(200, 146, 74, 0.10)' }}>
            <X size={15} style={{ color: 'var(--text-muted-warm)' }} />
          </button>
        </div>

        {step === 'need' && (
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
                  borderColor: 'var(--card-border, rgba(200, 146, 74, 0.20))'
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
