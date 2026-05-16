import { useState, useEffect, useRef, useCallback } from 'react';

export interface SyncToken {
  start: number; // ms
  end: number;   // ms
  word: string;
}

interface UseSacredSyncProps {
  audioUrl: string;
  tokens: SyncToken[];
  onComplete?: () => void;
}

export function useSacredSync({ audioUrl, tokens, onComplete }: UseSacredSyncProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<number>();
  
  // Speech synthesis variables
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const startTimeRef = useRef(0);
  const pausedTimeRef = useRef(0);
  const totalDuration = tokens.length > 0 ? tokens[tokens.length - 1].end : 5000;

  const isFallbackUrl = audioUrl.startsWith('fallback-tts://');
  const actualFallbackMode = isFallbackMode || isFallbackUrl;

  // Extract sanskrit text from fallback URL if needed
  const getFallbackText = useCallback(() => {
    if (audioUrl.startsWith('fallback-tts://')) {
      const clean = audioUrl.replace('fallback-tts://', '');
      const questionIdx = clean.indexOf('?');
      const encoded = questionIdx !== -1 ? clean.slice(0, questionIdx) : clean;
      return decodeURIComponent(encoded);
    }
    // As a backup, reconstruct from tokens
    return tokens.map(t => t.word).join(' ');
  }, [audioUrl, tokens]);

  // High-precision animation loop for fallback mode (60fps)
  const animateFallback = useCallback(() => {
    const elapsed = performance.now() - startTimeRef.current;
    setCurrentTime(elapsed);

    // Find the active token
    const index = tokens.findIndex(t => elapsed >= t.start && elapsed <= t.end);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }

    if (elapsed >= totalDuration) {
      setIsPlaying(false);
      setActiveIndex(-1);
      pausedTimeRef.current = 0;
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
      if (onComplete) onComplete();
    } else {
      requestRef.current = requestAnimationFrame(animateFallback);
    }
  }, [tokens, activeIndex, totalDuration, onComplete]);

  // High-precision animation loop for audio element (60fps)
  const animateAudio = useCallback(() => {
    if (!audioRef.current) return;
    
    const currentMs = audioRef.current.currentTime * 1000;
    setCurrentTime(currentMs);

    // Find the active token
    const index = tokens.findIndex(t => currentMs >= t.start && currentMs <= t.end);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }

    requestRef.current = requestAnimationFrame(animateAudio);
  }, [tokens, activeIndex]);

  // Setup audio player or fallback mode
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setActiveIndex(-1);
    setIsFallbackMode(false);
    pausedTimeRef.current = 0;

    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }

    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
    }

    if (isFallbackUrl) {
      setIsFallbackMode(true);
      return;
    }

    // Initialize regular Audio element
    audioRef.current = new Audio(audioUrl);
    const audio = audioRef.current;

    const handleEnded = () => {
      setIsPlaying(false);
      setActiveIndex(-1);
      if (onComplete) onComplete();
    };

    const handleError = () => {
      console.warn('[useSacredSync] Audio failed to load. Activating native speech synthesis fallback.');
      setIsFallbackMode(true);
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    };
  }, [audioUrl, isFallbackUrl, onComplete]);

  const toggle = () => {
    if (actualFallbackMode) {
      if (typeof window === 'undefined') return;

      if (isPlaying) {
        window.speechSynthesis.pause();
        pausedTimeRef.current = performance.now() - startTimeRef.current;
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        setIsPlaying(false);
      } else {
        // Resume or play new
        if (window.speechSynthesis.paused && utteranceRef.current) {
          window.speechSynthesis.resume();
          startTimeRef.current = performance.now() - pausedTimeRef.current;
          requestRef.current = requestAnimationFrame(animateFallback);
          setIsPlaying(true);
        } else {
          window.speechSynthesis.cancel();
          const text = getFallbackText();
          const utter = new SpeechSynthesisUtterance(text);
          utteranceRef.current = utter;

          // Configure voice quality settings based on URL parameter or defaults
          const isPandit = audioUrl.includes('quality=pandit');
          utter.rate = isPandit ? 0.74 : 0.82; // Pandit is slow, meditative
          utter.pitch = isPandit ? 0.92 : 1.0;

          // Pick the best Hindi/Indian voice
          const voices = window.speechSynthesis.getVoices();
          const bestVoice = voices.find(v => v.lang.startsWith('hi')) || 
                            voices.find(v => v.lang.startsWith('en-IN')) ||
                            voices.find(v => v.lang.startsWith('en')) || 
                            voices[0];
          if (bestVoice) utter.voice = bestVoice;

          utter.onend = () => {
            // Safe fallback if frame loop misses
            setIsPlaying(false);
            setActiveIndex(-1);
            pausedTimeRef.current = 0;
          };

          startTimeRef.current = performance.now() - pausedTimeRef.current;
          window.speechSynthesis.speak(utter);
          requestRef.current = requestAnimationFrame(animateFallback);
          setIsPlaying(true);
        }
      }
    } else {
      if (!audioRef.current) return;
      
      if (isPlaying) {
        audioRef.current.pause();
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
      } else {
        audioRef.current.play().catch((err) => {
          console.warn('[useSacredSync] Play failed. Falling back to native SpeechSynthesis.', err);
          setIsFallbackMode(true);
          // Manually trigger the synthesis play
          setTimeout(() => {
            const text = getFallbackText();
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(text);
            utteranceRef.current = utter;
            utter.rate = 0.82;
            const voices = window.speechSynthesis.getVoices();
            const bestVoice = voices.find(v => v.lang.startsWith('hi')) || voices[0];
            if (bestVoice) utter.voice = bestVoice;
            startTimeRef.current = performance.now();
            window.speechSynthesis.speak(utter);
            requestRef.current = requestAnimationFrame(animateFallback);
            setIsPlaying(true);
          }, 50);
        });
        if (!isFallbackMode) {
          requestRef.current = requestAnimationFrame(animateAudio);
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seek = (ms: number) => {
    if (actualFallbackMode) {
      pausedTimeRef.current = ms;
      setCurrentTime(ms);
      if (isPlaying && typeof window !== 'undefined') {
        // To seek in speech synthesis, we must restart it from the offset,
        // or just let it speak and update the visual timestamp
        window.speechSynthesis.cancel();
        const text = getFallbackText();
        const utter = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utter;
        const isPandit = audioUrl.includes('quality=pandit');
        utter.rate = isPandit ? 0.74 : 0.82;
        const voices = window.speechSynthesis.getVoices();
        const bestVoice = voices.find(v => v.lang.startsWith('hi')) || voices[0];
        if (bestVoice) utter.voice = bestVoice;
        startTimeRef.current = performance.now() - ms;
        window.speechSynthesis.speak(utter);
      }
    } else {
      if (!audioRef.current) return;
      audioRef.current.currentTime = ms / 1000;
      setCurrentTime(ms);
    }
  };

  // Safe percentage calculation
  const getProgress = () => {
    if (actualFallbackMode) {
      return (currentTime / totalDuration) * 100;
    }
    if (audioRef.current && audioRef.current.duration) {
      return (currentTime / (audioRef.current.duration * 1000)) * 100;
    }
    return 0;
  };

  return {
    isPlaying,
    currentTime,
    activeIndex,
    toggle,
    seek,
    progress: getProgress()
  };
}
