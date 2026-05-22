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
  const [recommendations, setRecommendations] = useState<MoodRecommendation[]>([]);
  const [checkinId, setCheckinId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();

  useEffect(() => {
    async function initCheckin() {
      try {
        // 1. Record checkin
        const checkinRes = await fetch('/api/mood/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            before_mood: mood,
            source_surface: 'home_dashboard'
          }),
        });
        
        let newCheckinId = null;
        if (checkinRes.ok) {
          const { checkin_id } = await checkinRes.json();
          newCheckinId = checkin_id;
          setCheckinId(checkin_id);
        }

        // 2. Fetch recommendations (pass checkin_id so backend can persist top rec)
        const recRes = await fetch(`/api/mood/recommendations?mood=${mood}${newCheckinId ? `&checkin_id=${newCheckinId}` : ''}`);
        if (recRes.ok) {
          const data = await recRes.json();
          setRecommendations(data.recommendations || []);
        }
      } catch (error) {
        console.error('Failed to init mood checkin', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    initCheckin();
  }, [mood]);

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
            For your {mood} mood
          </h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center motion-press"
            style={{ background: 'rgba(200, 146, 74, 0.10)' }}>
            <X size={15} style={{ color: 'var(--text-muted-warm)' }} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--brand-primary)' }} />
          </div>
        ) : (
          <div className="space-y-3 pb-6">
            {recommendations.map(rec => (
              <button
                key={rec.id}
                onClick={() => handleActionClick(rec)}
                className="w-full flex items-center justify-between p-4 rounded-2xl border motion-lift text-left"
                style={{ 
                  background: 'rgba(44, 38, 28, 0.88)', 
                  borderColor: 'rgba(200, 146, 74, 0.20)'
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
