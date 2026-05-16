'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Award, CheckCircle2, BookOpen, Music } from 'lucide-react';
import { useSacredSync, SyncToken } from '@/hooks/useSacredSync';
import { useState } from 'react';

interface SacredReaderProps {
  shlokaId: string;
  sanskrit: string;
  translation: string;
  audioUrl: string;
  tokens: SyncToken[];
  source: string;
}

/**
 * ─── SacredReader (The Zenith Immersive Sync Engine) ─────────────────────────
 * 
 * High-fidelity recitation engine with time-synchronized word highlighting.
 * Follows the "Deep Akasha" design language.
 */
export default function SacredReader({ 
  shlokaId, sanskrit, translation, audioUrl, tokens, source 
}: SacredReaderProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [mastery, setMastery] = useState(0.65); // Mock mastery level for UI

  const { isPlaying, activeIndex, toggle, seek, progress } = useSacredSync({
    audioUrl,
    tokens,
    onComplete: () => {
      setIsCompleted(true);
      setMastery(prev => Math.min(1, prev + 0.05));
    }
  });

  return (
    <div className="relative min-h-[60vh] rounded-[4rem] overflow-hidden border border-[var(--brand-primary-soft)] bg-[var(--surface-base)] shadow-2xl">
      {/* ─── 1. Akasha Backdrop (Dynamic) ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: isPlaying ? 1.2 : 1, opacity: isPlaying ? 0.4 : 0.2 }}
          className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-[var(--brand-primary-soft)] blur-[120px] rounded-full transition-all duration-1000" 
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.05]" />
      </div>

      <div className="relative z-10 p-12 sm:p-20 flex flex-col h-full space-y-12">
        
        {/* ─── 2. Header & Progress Tracker ─── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--brand-primary-soft)] flex items-center justify-center text-[var(--brand-primary)]">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--brand-primary)] opacity-60">Pathshala Mastery</p>
              <h4 className="text-xl font-bold premium-serif theme-ink">{source}</h4>
            </div>
          </div>

          <div className="flex items-center gap-6 px-6 py-3 rounded-full bg-[var(--brand-primary-soft)]/20 border border-[var(--brand-primary-soft)]">
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest theme-muted">Mastery Level</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${mastery * 100}%` }}
                    className="h-full bg-[var(--brand-primary)]"
                  />
                </div>
                <span className="text-xs font-bold theme-ink">{Math.round(mastery * 100)}%</span>
              </div>
            </div>
            <Award className={mastery === 1 ? "text-yellow-500" : "theme-muted opacity-40"} size={20} />
          </div>
        </div>

        {/* ─── 3. The Synchronized Text Canvas ─── */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-12 py-12">
          {/* Sanskrit Layer */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-6 max-w-4xl">
            {tokens.map((token, idx) => (
              <motion.span
                key={idx}
                animate={{ 
                  color: activeIndex === idx ? 'var(--brand-primary)' : 'var(--theme-ink)',
                  scale: activeIndex === idx ? 1.08 : 1,
                  opacity: activeIndex === idx ? 1 : (isPlaying ? 0.4 : 1),
                  textShadow: activeIndex === idx ? '0 0 20px var(--brand-primary-soft)' : 'none'
                }}
                className="text-4xl md:text-6xl font-bold premium-serif transition-all cursor-pointer"
                onClick={() => seek(token.start)}
              >
                {token.word}
              </motion.span>
            ))}
          </div>

          {/* Translation Layer (Faded unless active or paused) */}
          <motion.p 
            animate={{ opacity: isPlaying ? 0.3 : 0.8 }}
            className="text-lg md:text-xl italic theme-muted max-w-2xl text-center leading-relaxed"
          >
            &ldquo;{translation}&rdquo;
          </motion.p>
        </div>

        {/* ─── 4. Controls ─── */}
        <div className="pt-8 flex flex-col items-center space-y-6">
          <div className="w-full max-w-md h-1 bg-white/5 rounded-full overflow-hidden relative">
            <motion.div 
              className="absolute inset-y-0 left-0 bg-[var(--brand-primary)]"
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear", duration: 0.1 }}
            />
          </div>

          <div className="flex items-center gap-10">
            <button onClick={() => seek(0)} className="theme-muted hover:theme-ink transition-colors">
              <RotateCcw size={24} />
            </button>
            <button 
              onClick={toggle}
              className="w-20 h-20 rounded-full bg-[var(--brand-primary)] text-white shadow-2xl flex items-center justify-center transform transition-all hover:scale-110 active:scale-95"
            >
              {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>
            <div className="w-6" /> {/* Spacer */}
          </div>
        </div>
      </div>

      {/* ─── Completion Overlay ─── */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-[var(--surface-base)]/90 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-8"
            >
              <CheckCircle2 size={48} />
            </motion.div>
            <h2 className="text-4xl font-bold premium-serif theme-ink mb-4">Mastery Increased</h2>
            <p className="theme-muted mb-12 max-w-sm">You have successfully completed a guided recitation. Your spiritual momentum is growing.</p>
            <button 
              onClick={() => setIsCompleted(false)}
              className="px-10 py-4 rounded-full bg-[var(--brand-primary)] text-white font-bold tracking-widest uppercase text-xs"
            >
              Return to Sanctuary
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
