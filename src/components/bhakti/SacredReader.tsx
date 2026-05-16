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
  const [mastery, setMastery] = useState(0.65); 
  const [voiceQuality, setVoiceQuality] = useState<'standard' | 'pandit'>('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [dynamicAudio, setDynamicAudio] = useState<string | null>(null);

  const currentAudioUrl = dynamicAudio || audioUrl;

  const { isPlaying, activeIndex, toggle, seek, progress } = useSacredSync({
    audioUrl: currentAudioUrl,
    tokens,
    onComplete: async () => {
      setIsCompleted(true);
      try {
        const { createClient } = await import('@/lib/supabase');
        const supabase = createClient();
        const { error } = await supabase.rpc('increment_sadhana_mastery', { p_shloka_id: shlokaId });
        if (!error) setMastery(prev => Math.min(1, prev + 0.05));
      } catch (err) {
        console.error('Mastery update failed:', err);
      }
    }
  });

  const togglePanditVoice = async () => {
    if (voiceQuality === 'pandit') {
      setVoiceQuality('standard');
      setDynamicAudio(null);
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sanskrit, quality: 'pandit' })
      });
      const data = await res.json();
      if (data.audioContent) {
        setDynamicAudio(`data:audio/mp3;base64,${data.audioContent}`);
        setVoiceQuality('pandit');
      }
    } catch (err) {
      console.error('Failed to generate Pandit voice:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative min-h-[60vh] rounded-[4rem] overflow-hidden border border-[var(--brand-primary-soft)] bg-[var(--surface-base)] shadow-2xl">
      {/* ─── 1. Akasha Backdrop (Dynamic) ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: isPlaying ? 1.5 : 1, opacity: isPlaying ? 0.6 : 0.2 }}
          className="absolute top-[-20%] left-[-10%] w-[100%] h-[100%] bg-[var(--brand-primary-soft)] blur-[160px] rounded-full transition-all duration-1000" 
        />
        {/* Atmospheric Dimming Overlay */}
        <motion.div 
          animate={{ opacity: isPlaying ? 0.15 : 0 }}
          className="absolute inset-0 bg-black pointer-events-none z-0"
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

          <div className="flex-1 max-w-md w-full px-6">
            <div className="relative h-1.5 w-full bg-[var(--brand-primary-soft)] rounded-full overflow-hidden">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--brand-primary)] to-[#FFCC33] shadow-[0_0_10px_rgba(200,146,74,0.5)]"
                style={{ width: `${progress}%` }}
                transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
              />
            </div>
          </div>
        </div>

        {/* ─── 3. The Synchronized Text Canvas ─── */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-12 py-12">
          {/* Sanskrit Layer */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-10 max-w-5xl px-4">
            {tokens.map((token, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  color: activeIndex === idx ? 'var(--brand-primary)' : (isPlaying ? 'rgba(var(--text-ink-rgb), 0.3)' : 'var(--theme-ink)'),
                  scale: activeIndex === idx ? 1.15 : 1,
                  filter: activeIndex === idx ? 'drop-shadow(0 0 15px var(--brand-primary-soft))' : 'none',
                  z: activeIndex === idx ? 10 : 0
                }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 300, 
                  damping: 30,
                  opacity: { duration: 0.2 }
                }}
                className="text-4xl md:text-7xl font-bold premium-serif cursor-pointer relative"
                onClick={() => seek(token.start)}
              >
                {token.word}
                {activeIndex === idx && (
                  <motion.div 
                    layoutId="divine-underline"
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-[var(--brand-primary)] rounded-full blur-[2px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                  />
                )}
              </motion.span>
            ))}
          </div>

          {/* Translation Layer (Faded unless active or paused) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center px-8"
            >
              <p className="text-lg md:text-2xl italic theme-muted max-w-2xl font-medium leading-relaxed opacity-80">
                &ldquo;{translation}&rdquo;
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ─── 4. Controls ─── */}
        <div className="pt-8 flex flex-col items-center space-y-6">
          <div className="flex items-center gap-10">
            <button onClick={() => seek(0)} className="theme-muted hover:theme-ink transition-colors">
              <RotateCcw size={24} />
            </button>
            <button 
              onClick={toggle}
              disabled={isGenerating}
              className={`w-20 h-20 rounded-full bg-[var(--brand-primary)] text-white shadow-2xl flex items-center justify-center transform transition-all hover:scale-110 active:scale-95 ${isGenerating ? 'opacity-50 grayscale' : ''}`}
            >
              {isGenerating ? (
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />
              )}
            </button>
            
            <button 
              onClick={togglePanditVoice}
              className={`group relative flex flex-col items-center gap-2 transition-all ${voiceQuality === 'pandit' ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
            >
              <div className={`relative p-4 rounded-2xl border-2 overflow-hidden transition-all duration-500 ${
                voiceQuality === 'pandit' 
                  ? 'bg-gradient-to-br from-[#FF9933] to-[#FFCC33] border-[#FFCC33] shadow-[0_0_30px_rgba(255,153,51,0.4)]' 
                  : 'bg-white/5 border-white/10'
              }`}>
                <Music size={22} className={voiceQuality === 'pandit' ? 'text-white' : 'theme-muted'} />
                
                {voiceQuality === 'pandit' && (
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{ x: ['-200%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </div>
              
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-black uppercase tracking-widest ${voiceQuality === 'pandit' ? 'text-[#FF9933]' : 'theme-muted'}`}>
                  Pandit AI
                </span>
                {voiceQuality === 'pandit' && (
                  <span className="bg-[#FF9933] text-[8px] font-black text-white px-1.5 py-0.5 rounded-sm">HD</span>
                )}
              </div>
            </button>
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
