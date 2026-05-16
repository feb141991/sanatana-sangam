'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, CheckCircle2, BookOpen, Music, Loader2 } from 'lucide-react';
import { useSacredSync, SyncToken } from '@/hooks/useSacredSync';
import { useState, useEffect } from 'react';

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
 * Dynamically resolves both Standard TTS and high-fidelity Pandit AI voice.
 */
export default function SacredReader({ 
  shlokaId, sanskrit, translation, audioUrl, tokens, source 
}: SacredReaderProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [mastery, setMastery] = useState(0.65); 
  const [voiceQuality, setVoiceQuality] = useState<'standard' | 'pandit'>('standard');
  const [standardAudio, setStandardAudio] = useState<string | null>(audioUrl || null);
  const [panditAudio, setPanditAudio] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentAudioUrl = (voiceQuality === 'pandit' ? panditAudio : (standardAudio || audioUrl)) || '';

  // Synchronized Recitation Engine
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

  // Dynamic Audio Fetcher (pre-fetch Standard on mount, lazy-fetch Pandit AI)
  useEffect(() => {
    setStandardAudio(audioUrl || null);
    setPanditAudio(null);
    setVoiceQuality('standard');

    if (!audioUrl && sanskrit) {
      const fetchStandardTTS = async () => {
        setIsGenerating(true);
        try {
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: sanskrit, quality: 'standard' })
          });
          const data = await res.json();
          if (data.audioContent) {
            setStandardAudio(`data:audio/mp3;base64,${data.audioContent}`);
          } else {
            throw new Error('Google Cloud TTS returned no audio content');
          }
        } catch (err) {
          console.warn('[SacredReader] Standard TTS pre-fetch failed. Falling back to native client-side voice:', err);
          setStandardAudio(`fallback-tts://${encodeURIComponent(sanskrit)}`);
        } finally {
          setIsGenerating(false);
        }
      };
      fetchStandardTTS();
    }
  }, [sanskrit, audioUrl]);

  // Voice quality toggler
  const togglePanditVoice = async () => {
    if (voiceQuality === 'pandit') {
      setVoiceQuality('standard');
      return;
    }

    if (panditAudio) {
      setVoiceQuality('pandit');
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
        setPanditAudio(`data:audio/mp3;base64,${data.audioContent}`);
        setVoiceQuality('pandit');
      } else {
        throw new Error('Google Cloud TTS returned no audio content');
      }
    } catch (err) {
      console.warn('[SacredReader] Pandit TTS generation failed. Falling back to native client-side voice:', err);
      setPanditAudio(`fallback-tts://${encodeURIComponent(sanskrit)}?quality=pandit`);
      setVoiceQuality('pandit');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative min-h-[60vh] rounded-[3rem] overflow-hidden border border-[var(--brand-primary-soft)] bg-[var(--surface-base)] shadow-2xl">
      
      {/* ─── 1. Akasha Backdrop (Dynamic) ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: isPlaying ? 1.4 : 1, opacity: isPlaying ? 0.5 : 0.15 }}
          className="absolute top-[-25%] left-[-10%] w-[120%] h-[120%] bg-[var(--brand-primary-soft)] blur-[140px] rounded-full transition-all duration-1000" 
        />
        {/* Atmospheric Dimming Overlay */}
        <motion.div 
          animate={{ opacity: isPlaying ? 0.12 : 0 }}
          className="absolute inset-0 bg-black pointer-events-none z-0"
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.04]" />
      </div>

      <div className="relative z-10 p-8 sm:p-12 flex flex-col h-full space-y-8">
        
        {/* ─── 2. Header & Progress Tracker ─── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary-soft)] flex items-center justify-center text-[var(--brand-primary)]">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--brand-primary)] opacity-70">Guided Study</p>
              <h4 className="text-base font-bold premium-serif theme-ink leading-tight">{source}</h4>
            </div>
          </div>

          <div className="flex-1 max-w-xs w-full sm:px-4">
            <div className="relative h-1 w-full bg-[var(--brand-primary-soft)] rounded-full overflow-hidden">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--brand-primary)] to-[#FFCC33] shadow-[0_0_8px_rgba(200,146,74,0.4)]"
                style={{ width: `${progress}%` }}
                transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
              />
            </div>
          </div>
        </div>

        {/* ─── 3. The Synchronized Text Canvas ─── */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-6">
          {/* Sanskrit Layer */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-6 max-w-4xl px-2">
            {tokens.map((token, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  color: activeIndex === idx ? 'var(--brand-primary)' : (isPlaying ? 'rgba(var(--text-ink-rgb), 0.35)' : 'var(--theme-ink)'),
                  scale: activeIndex === idx ? 1.12 : 1,
                  filter: activeIndex === idx ? 'drop-shadow(0 0 12px var(--brand-primary-soft))' : 'none',
                  z: activeIndex === idx ? 10 : 0
                }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 280, 
                  damping: 28,
                  opacity: { duration: 0.18 }
                }}
                className="text-2xl md:text-5xl font-bold premium-serif cursor-pointer relative"
                onClick={() => seek(token.start)}
              >
                {token.word}
                {activeIndex === idx && (
                  <motion.div 
                    layoutId="divine-underline"
                    className="absolute -bottom-1.5 left-0 right-0 h-[3px] bg-[var(--brand-primary)] rounded-full blur-[1px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                  />
                )}
              </motion.span>
            ))}
          </div>

          {/* Translation Layer */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-center px-4"
            >
              <p className="text-sm md:text-lg italic theme-muted max-w-lg font-medium leading-relaxed opacity-85">
                &ldquo;{translation}&rdquo;
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ─── 4. Controls ─── */}
        <div className="pt-4 flex flex-col items-center space-y-4">
          <div className="flex items-center gap-8">
            {/* Reset Seek */}
            <button 
              onClick={() => seek(0)} 
              className="w-10 h-10 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              title="Reset Recitation"
            >
              <RotateCcw size={16} className="text-[var(--text-dim)]" />
            </button>

            {/* Play/Pause Trigger */}
            <button 
              onClick={toggle}
              disabled={isGenerating || !currentAudioUrl}
              className={`w-16 h-16 rounded-full bg-[var(--brand-primary)] text-white shadow-xl flex items-center justify-center transform transition-all hover:scale-105 active:scale-95 ${
                isGenerating || !currentAudioUrl ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {isGenerating ? (
                <Loader2 size={24} className="animate-spin text-[#1c1c1a]" />
              ) : (
                isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />
              )}
            </button>
            
            {/* Pandit AI (HD) Toggle */}
            <button 
              onClick={togglePanditVoice}
              disabled={isGenerating}
              className={`group relative flex flex-col items-center gap-1 transition-all ${
                voiceQuality === 'pandit' ? 'scale-105' : 'opacity-65 hover:opacity-100'
              }`}
            >
              <div className={`relative p-3.5 rounded-xl border transition-all duration-300 ${
                voiceQuality === 'pandit' 
                  ? 'bg-gradient-to-br from-[#FF9933] to-[#FFCC33] border-[#FFCC33] shadow-[0_0_20px_rgba(255,153,51,0.3)]' 
                  : 'bg-white/5 border-white/10'
              }`}>
                <Music size={18} className={voiceQuality === 'pandit' ? 'text-[#1c1c1a]' : 'theme-muted'} />
                
                {voiceQuality === 'pandit' && (
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ['-200%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <span className={`text-[8px] font-black uppercase tracking-widest ${
                  voiceQuality === 'pandit' ? 'text-[#FF9933]' : 'theme-muted'
                }`}>
                  {voiceQuality === 'pandit' ? 'Pandit AI' : 'Standard'}
                </span>
                {voiceQuality === 'pandit' && (
                  <span className="bg-[#FF9933] text-[7px] font-black text-white px-1 py-0.2 rounded-sm leading-none">HD</span>
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
            className="absolute inset-0 z-50 bg-[var(--surface-base)]/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-6"
            >
              <CheckCircle2 size={32} />
            </motion.div>
            <h2 className="text-2xl font-bold premium-serif theme-ink mb-2">Recitation Complete</h2>
            <p className="theme-muted mb-8 max-w-xs text-xs leading-relaxed">Your recitation practice has been successfully registered. You have earned sadhana points. Keep moving forward!</p>
            <button 
              onClick={() => setIsCompleted(false)}
              className="px-8 py-3 rounded-full bg-[var(--brand-primary)] text-white font-bold tracking-widest uppercase text-[10px]"
            >
              Continue Practice
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
