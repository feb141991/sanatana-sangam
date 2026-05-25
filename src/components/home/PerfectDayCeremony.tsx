'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, X } from 'lucide-react';
import { createPortal } from 'react-dom';

const TRADITION_DAY_WORD: Record<string, string> = {
  hindu:    'Shuddha Din',
  sikh:     'Sacha Din',
  buddhist: 'Kusala Dina',
  jain:     'Shubha Din',
};

interface PerfectDayCeremonyProps {
  isOpen: boolean;
  onClose: () => void;
  insight: string | null;
  tradition?: string;
}

export default function PerfectDayCeremony({ isOpen, onClose, insight, tradition = 'hindu' }: PerfectDayCeremonyProps) {
  const dayWord = TRADITION_DAY_WORD[tradition] ?? TRADITION_DAY_WORD.hindu;
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-6 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-white/50 hover:text-white transition-colors"
        >
          <X className="h-8 w-8" />
        </button>

        {/* Confetti / Glow effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
            style={{ background: 'var(--relic-accent-soft, rgba(197,160,89,0.20))' }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3] 
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <motion.div 
          className="relative z-10 flex max-w-lg flex-col items-center text-center space-y-6"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full border"
            style={{ background: 'var(--relic-accent-soft, rgba(197,160,89,0.20))', borderColor: 'var(--relic-accent-soft, rgba(197,160,89,0.30))' }}>
            <Trophy className="h-12 w-12" style={{ color: 'var(--relic-accent, #C5A059)' }} />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-serif text-amber-50">{dayWord}</h2>
            <div className="flex items-center justify-center space-x-2" style={{ color: 'var(--relic-accent, #C5A059)' }}>
              <Sparkles className="h-4 w-4" />
              <span className="font-medium uppercase tracking-widest text-sm">+30 Karma · +15 Seva</span>
              <Sparkles className="h-4 w-4" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <p className="text-lg leading-relaxed text-amber-100/90 font-serif">
              {insight ? insight : (
                <span className="animate-pulse">Dharma Mitra is witnessing your sadhana...</span>
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="mt-8 rounded-full px-8 py-3 font-medium transition-colors border"
            style={{ background: 'var(--relic-accent-soft, rgba(197,160,89,0.20))', color: 'var(--relic-accent, #C5A059)', borderColor: 'var(--relic-accent-soft, rgba(197,160,89,0.30))' }}
          >
            Continue Journey
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
